const { prisma } = require('./dist/index');

async function checkSchema() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'capsules' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Capsule table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🔍 Checking if BaseCapsule columns exist:');
    const baseCapsuleColumns = ['capsule_type_new', 'problem_statement_md', 'runtime_config', 'config_data'];
    
    for (const colName of baseCapsuleColumns) {
      const exists = columns.some(col => col.column_name === colName);
      console.log(`  - ${colName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();