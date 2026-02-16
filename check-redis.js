const {Redis}=require('@upstash/redis');
require('dotenv').config();
const r=new Redis({url:process.env.UPSTASH_REDIS_URL,token:process.env.UPSTASH_REDIS_TOKEN});
r.hgetall('job:58e80a8a-db83-4cb9-aa6b-d99fa18f6c2b').then(d=>console.log(JSON.stringify(d,null,2)));
