const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPlaylistTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking playlist table structure...\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'playlists' 
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('📋 Playlists table structure:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('❌ Playlists table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPlaylistTableStructure();