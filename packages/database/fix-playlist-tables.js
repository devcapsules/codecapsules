const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixPlaylistTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing playlist tables...\n');

    // Drop the incorrect playlists table
    await client.query(`DROP TABLE IF EXISTS playlists CASCADE;`);
    console.log('🗑️ Dropped incorrect playlists table');

    // Create playlists table with correct TEXT id
    await client.query(`
      CREATE TABLE playlists (
        id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tags TEXT[],
        total_duration INTEGER DEFAULT 0,
        capsule_count INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Created playlists table with TEXT id');

    // Create playlist_items table
    await client.query(`
      CREATE TABLE playlist_items (
        id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
        playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        capsule_id TEXT NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(playlist_id, capsule_id),
        UNIQUE(playlist_id, position)
      );
    `);
    console.log('✅ Created playlist_items table');

    // Create playlist_progress table
    await client.query(`
      CREATE TABLE playlist_progress (
        id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        current_capsule_id TEXT REFERENCES capsules(id) ON DELETE SET NULL,
        completed_capsules TEXT[],
        progress_percentage DECIMAL(5,2) DEFAULT 0,
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, playlist_id)
      );
    `);
    console.log('✅ Created playlist_progress table');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX idx_playlists_created_by ON playlists(created_by);
      CREATE INDEX idx_playlists_visibility ON playlists(visibility);
      CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
      CREATE INDEX idx_playlist_items_position ON playlist_items(playlist_id, position);
      CREATE INDEX idx_playlist_progress_user_id ON playlist_progress(user_id);
      CREATE INDEX idx_playlist_progress_playlist_id ON playlist_progress(playlist_id);
    `);
    console.log('✅ Created indexes for playlist tables');

    // Update playlists table with triggers for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      CREATE TRIGGER update_playlists_updated_at
        BEFORE UPDATE ON playlists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Created updated_at trigger for playlists');

    console.log('\n🎉 All playlist tables created successfully with correct data types!');
    
  } catch (error) {
    console.error('❌ Error fixing playlist tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPlaylistTables();