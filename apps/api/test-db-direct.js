// Test the database connection directly
const { Client } = require('pg');

async function testDatabaseConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:Myashwanth@14@db.dinerkhhhoibcrznysen.supabase.co:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  });

  try {
    console.log('🔌 Attempting to connect to Supabase...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');

    console.log('📊 Querying capsules...');
    const result = await client.query('SELECT COUNT(*) as count FROM capsules');
    console.log(`📦 Found ${result.rows[0].count} capsules in database`);

    // Get actual capsules
    const capsulesResult = await client.query(`
      SELECT id, title, "createdAt", "creatorId" 
      FROM capsules 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log('🎯 Your real capsules:');
    capsulesResult.rows.forEach((capsule, index) => {
      console.log(`  ${index + 1}. ${capsule.title} (ID: ${capsule.id})`);
    });

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

testDatabaseConnection();