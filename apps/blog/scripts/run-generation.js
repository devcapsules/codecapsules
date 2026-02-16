#!/usr/bin/env node

/**
 * Generate Hero Blog Capsules Script
 * Run this to create the actual capsules for the hero blog post
 */

const { generateHeroBlogCapsules } = require('./generate-hero-capsules.js');

async function main() {
  console.log('🚀 Generating Hero Blog Capsules...\n');
  
  try {
    const capsules = await generateHeroBlogCapsules();
    
    console.log('\n✅ Successfully generated capsules:');
    console.log('=====================================');
    
    capsules.forEach((capsule, index) => {
      console.log(`${index + 1}. ${capsule.language.toUpperCase()} - ${capsule.title}`);
      console.log(`   ID: ${capsule.id}`);
      console.log(`   Embed URL: ${capsule.embedUrl}`);
      console.log(`   Description: ${capsule.description}`);
      console.log('');
    });
    
    console.log('🎯 Next Steps:');
    console.log('1. Copy these embed URLs');
    console.log('2. Update the blog post with the actual capsule IDs');
    console.log('3. Test the embeds in the blog post');
    console.log('\n📝 Use these in your blog post:');
    console.log('================================');
    
    capsules.forEach(capsule => {
      console.log(`<iframe src="${capsule.embedUrl}" width="100%" height="400px"></iframe>`);
    });
    
  } catch (error) {
    console.error('❌ Failed to generate capsules:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };