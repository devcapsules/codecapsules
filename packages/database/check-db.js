const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('=== Database Structure Check ===');
    
    // Check sample capsules
    const capsules = await prisma.capsule.findMany({ 
      take: 3,
      include: {
        creator: true
      }
    });
    console.log('Sample capsules:');
    capsules.forEach(capsule => {
      console.log(`- ID: ${capsule.id}`);
      console.log(`  Title: ${capsule.title}`);
      console.log(`  Creator: ${capsule.creator?.name || 'No creator'}`);
      console.log(`  CreatorId: ${capsule.creatorId}`);
      console.log(`  Visibility: ${capsule.visibility}`);
      console.log(`  Content keys: ${Object.keys(capsule.content || {})}`);
      console.log(`  Runtime config: ${JSON.stringify(capsule.runtime_config)}`);
      console.log('');
    });
    
    // Check users
    const users = await prisma.user.findMany({ take: 3 });
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    console.log(`\nTotal capsules: ${await prisma.capsule.count()}`);
    console.log(`Total users: ${await prisma.user.count()}`);
    
    // Check capsules by creator
    const capsulesWithCreators = await prisma.capsule.groupBy({
      by: ['creatorId'],
      _count: {
        id: true
      }
    });
    
    console.log('\nCapsules by creator:');
    for (const group of capsulesWithCreators) {
      console.log(`CreatorId ${group.creatorId}: ${group._count.id} capsules`);
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();