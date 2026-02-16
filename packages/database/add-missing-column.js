const { prisma } = require('./dist/index');

async function addMissingColumn() {
  try {
    await prisma.$executeRaw`ALTER TABLE capsules ADD COLUMN capsule_type_new VARCHAR(20)`;
    console.log('✅ Added capsule_type_new column');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  capsule_type_new column already exists');
    } else {
      console.error('❌ Error adding column:', error.message);
    }
  }
  
  try {
    await prisma.$executeRaw`CREATE INDEX idx_capsules_type_new ON capsules(capsule_type_new)`;
    console.log('✅ Added index on capsule_type_new');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Index already exists');
    } else {
      console.error('❌ Error creating index:', error.message);
    }
  }

  await prisma.$disconnect();
}

addMissingColumn();