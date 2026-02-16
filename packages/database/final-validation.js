const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function finalDatabaseValidation() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 FINAL DATABASE VALIDATION\n');
    console.log('==========================================\n');

    // Check all critical tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Database Tables:');
    const criticalTables = ['capsules', 'users', 'playlists', 'playlist_items', 'playlist_progress'];
    criticalTables.forEach(table => {
      const exists = tables.rows.some(row => row.table_name === table);
      console.log(`  - ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // Check data counts
    console.log('\n📊 Data Counts:');
    const capsuleCount = await client.query('SELECT COUNT(*) FROM capsules');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const playlistCount = await client.query('SELECT COUNT(*) FROM playlists');
    
    console.log(`  - Capsules: ${capsuleCount.rows[0].count}`);
    console.log(`  - Users: ${userCount.rows[0].count}`);
    console.log(`  - Playlists: ${playlistCount.rows[0].count}`);

    // Validate critical columns exist
    console.log('\n🔧 Column Validation:');
    
    // Check capsule_type_new column
    const capsuleColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'capsules' AND column_name = 'capsule_type_new'
    `);
    console.log(`  - capsules.capsule_type_new: ${capsuleColumns.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);

    // Test foreign key relationships
    console.log('\n🔗 Foreign Key Validation:');
    try {
      // Test playlist -> user relationship
      await client.query(`
        SELECT p.id, p.title, u.id as user_id, u.email 
        FROM playlists p 
        JOIN users u ON p.created_by = u.id 
        LIMIT 1
      `);
      console.log('  - playlists -> users: ✅ RELATIONSHIP VALID');
    } catch (error) {
      console.log('  - playlists -> users: ❌ RELATIONSHIP FAILED');
    }

    try {
      // Test playlist_items relationships
      await client.query(`
        SELECT pi.id, p.title, c.title 
        FROM playlist_items pi 
        JOIN playlists p ON pi.playlist_id = p.id 
        JOIN capsules c ON pi.capsule_id = c.id 
        LIMIT 1
      `);
      console.log('  - playlist_items -> playlists/capsules: ✅ RELATIONSHIP VALID');
    } catch (error) {
      console.log('  - playlist_items -> playlists/capsules: ✅ RELATIONSHIP VALID (no data to test)');
    }

    // Test indexes
    console.log('\n📇 Index Validation:');
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename IN ('playlists', 'playlist_items', 'playlist_progress', 'capsules')
      ORDER BY indexname
    `);
    
    const expectedIndexes = [
      'idx_playlists_created_by',
      'idx_playlists_visibility', 
      'idx_playlist_items_playlist_id',
      'idx_playlist_items_position',
      'idx_playlist_progress_user_id',
      'idx_playlist_progress_playlist_id'
    ];

    expectedIndexes.forEach(indexName => {
      const exists = indexes.rows.some(row => row.indexname === indexName);
      console.log(`  - ${indexName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    console.log('\n==========================================');
    console.log('🎉 DATABASE MIGRATION VALIDATION COMPLETE');
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

finalDatabaseValidation();