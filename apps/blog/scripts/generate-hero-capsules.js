/**
 * Generate Hero Blog Capsules using Devcapsules AI Generation Engine
 * This script creates the actual capsules for the hero blog post
 */

async function generateHeroBlogCapsules() {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api.devcapsules.com' 
    : 'http://localhost:3001';

  // 1. Python Challenge - Find Largest Number
  const pythonPrompt = `Create a Python coding challenge where the user writes a function to find the largest number in a list. 

Requirements:
- Function name: find_largest(nums)
- Should work with positive and negative numbers
- Include test cases with different scenarios
- Provide hints for beginners
- Make it beginner-friendly but educational

This is for a blog post demo, so make it engaging and interactive!`;

  // 2. SQL Challenge - Database Query
  const sqlPrompt = `Create a SQL challenge where the user queries a products database to find all electronics items.

Requirements:
- Table: products (id, name, category, price)
- Task: Find all products where category = 'Electronics'
- Include sample data context
- Provide hints about SQL syntax
- Make it practical and real-world focused

This is for demonstrating server-side database capabilities in a blog post.`;

  // 3. Linux Terminal Challenge
  const terminalPrompt = `Create a Linux command-line challenge covering basic file operations.

Requirements:
- List files with ls -la
- Create a file with echo and redirection
- Display file contents with cat
- Progressive difficulty
- Include explanations of what each command does
- Make it practical for beginners

This is for demonstrating our browser-based Linux terminal in a blog post.`;

  const capsuleRequests = [
    {
      prompt: pythonPrompt,
      language: 'python',
      difficulty: 'easy',
      tags: ['hero-blog', 'python', 'algorithms', 'beginner']
    },
    {
      prompt: sqlPrompt, 
      language: 'sql',
      difficulty: 'easy',
      tags: ['hero-blog', 'sql', 'database', 'queries']
    },
    {
      prompt: terminalPrompt,
      language: 'bash', 
      difficulty: 'easy',
      tags: ['hero-blog', 'linux', 'terminal', 'devops']
    }
  ];

  const generatedCapsules = [];

  for (let i = 0; i < capsuleRequests.length; i++) {
    const request = capsuleRequests[i];
    
    try {
      console.log(`Generating ${request.language} capsule...`);
      
      const response = await fetch(`${apiUrl}/api/generate-and-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          language: request.language,
          difficulty: request.difficulty,
          concepts: request.tags
        }),
      });

      const result = await response.json();
      
      if (result.success && result.generation?.savedCapsuleId) {
        const capsuleId = result.generation.savedCapsuleId;
        
        generatedCapsules.push({
          id: capsuleId,
          language: request.language,
          embedUrl: `${apiUrl.replace('3001', '3002')}?widgetId=${capsuleId}`,
          title: result.generation.title,
          description: result.generation.description,
          difficulty: request.difficulty
        });
        
        console.log(`✅ Generated ${request.language} capsule: ${capsuleId}`);
      } else {
        console.error(`❌ Failed to generate ${request.language} capsule:`, result);
      }
    } catch (error) {
      console.error(`❌ Error generating ${request.language} capsule:`, error.message);
    }
  }

  return generatedCapsules;
}

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
    console.log('1. Copy these capsule IDs');
    console.log('2. Update the blog post with the actual capsule IDs');
    console.log('3. Test the embeds in the blog post');
    console.log('\n📝 Replace in HeroBlogPost.tsx:');
    console.log('=====================================');
    
    const replacements = {
      'PYTHON_CAPSULE_ID': capsules.find(c => c.language === 'python')?.id || 'NOT_GENERATED',
      'SQL_CAPSULE_ID': capsules.find(c => c.language === 'sql')?.id || 'NOT_GENERATED',
      'TERMINAL_CAPSULE_ID': capsules.find(c => c.language === 'bash')?.id || 'NOT_GENERATED'
    };

    Object.entries(replacements).forEach(([placeholder, actualId]) => {
      console.log(`${placeholder} -> ${actualId}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to generate capsules:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, generateHeroBlogCapsules };