const { prisma } = require('./dist/index');

async function checkPlaylistTables() {
  try {
    // Check if playlist tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('playlists', 'playlist_items', 'playlist_progress')
      ORDER BY table_name
    `;
    
    console.log('🎼 Playlist tables:');
    const tableNames = ['playlists', 'playlist_items', 'playlist_progress'];
    
    for (const tableName of tableNames) {
      const exists = tables.some(t => t.table_name === tableName);
      console.log(`  - ${tableName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    // If playlists table exists, check count
    if (tables.some(t => t.table_name === 'playlists')) {
      try {
        const count = await prisma.playlist.count();
        console.log(`📊 Current playlists: ${count}`);
      } catch (error) {
        console.log('⚠️  Cannot access playlists table via Prisma');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlaylistTables();