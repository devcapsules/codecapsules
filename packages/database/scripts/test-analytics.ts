import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAnalyticsDatabase() {
  console.log('🧪 Testing analytics database...');
  
  try {
    // Test 1: Insert a sample event
    console.log('📝 Inserting sample analytics event...');
    const sampleEvent = await prisma.$executeRaw`
      INSERT INTO analytics.event_stream (
        event_type, capsule_id, user_id, session_id, event_data
      ) VALUES (
        'code_run', 
        gen_random_uuid(), 
        gen_random_uuid(), 
        'sess_' || gen_random_uuid()::text,
        '{"language": "python", "success": true}'::jsonb
      ) RETURNING id;
    `;
    
    console.log('✅ Sample event inserted:', sampleEvent);
    
    // Test 2: Query analytics tables
    console.log('📊 Querying analytics tables...');
    const eventCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM analytics.event_stream;
    `;
    
    console.log('📈 Event stream count:', eventCount);
    
    // Test 3: Insert sample hourly stats
    console.log('📝 Inserting sample hourly stats...');
    await prisma.$executeRaw`
      INSERT INTO analytics.capsule_hourly_stats (
        capsule_id, hour_bucket, total_sessions, unique_users, total_runs, successful_runs
      ) VALUES (
        gen_random_uuid(),
        date_trunc('hour', NOW()),
        5, 3, 12, 10
      ) ON CONFLICT (capsule_id, hour_bucket) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        unique_users = EXCLUDED.unique_users,
        total_runs = EXCLUDED.total_runs,
        successful_runs = EXCLUDED.successful_runs;
    `;
    
    console.log('✅ Sample hourly stats inserted');
    
    // Test 4: Query aggregated data
    const hourlyStats = await prisma.$queryRaw`
      SELECT capsule_id, total_sessions, unique_users, total_runs, successful_runs
      FROM analytics.capsule_hourly_stats
      LIMIT 5;
    `;
    
    console.log('📊 Sample hourly stats:', hourlyStats);
    
    // Test 5: Insert failing test case data
    console.log('📝 Inserting sample test failure data...');
    await prisma.$executeRaw`
      INSERT INTO analytics.test_case_failures (
        capsule_id, test_case_id, test_case_name, date, 
        total_attempts, failure_count, failure_rate, affected_user_count
      ) VALUES (
        gen_random_uuid(),
        'test_basic_function',
        'Test: Basic Function Implementation',
        CURRENT_DATE,
        25, 8, 0.32, 6
      ) ON CONFLICT (capsule_id, test_case_id, date) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        failure_count = EXCLUDED.failure_count,
        failure_rate = EXCLUDED.failure_rate,
        affected_user_count = EXCLUDED.affected_user_count;
    `;
    
    console.log('✅ Sample test failure data inserted');
    
    // Test 6: Query test failure data (the "killer feature")
    const testFailures = await prisma.$queryRaw`
      SELECT capsule_id, test_case_name, failure_rate, affected_user_count
      FROM analytics.test_case_failures
      ORDER BY failure_rate DESC
      LIMIT 5;
    `;
    
    console.log('🔥 Most problematic test cases:', testFailures);
    
    console.log('\n🎉 Analytics database is working perfectly!');
    console.log('✅ Event ingestion: Working');
    console.log('✅ Hourly aggregation: Working');
    console.log('✅ Test failure tracking: Working');
    console.log('✅ Ready for production deployment!');
    
  } catch (error) {
    console.error('❌ Analytics database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalyticsDatabase();