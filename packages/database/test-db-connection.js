/**
 * Test Database Connection
 * Verify that Prisma client can connect to PostgreSQL
 */

const { prisma } = require('./dist/index')

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test schema (check if tables exist)
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    const capsuleCount = await prisma.capsule.count()
    console.log(`📝 Capsules in database: ${capsuleCount}`)
    
    // Test creating a sample user (for testing)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@codecapsule.com' },
      update: {},
      create: {
        email: 'test@codecapsule.com',
        name: 'Test User',
        authId: 'test-auth-id',
        tier: 'FREE'
      }
    })
    console.log(`👤 Test user created/found: ${testUser.id}`)
    
    console.log('🎉 Database connection test completed!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    if (error.code === 'P1001') {
      console.log('💡 Database server is not running. Start PostgreSQL and try again.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()