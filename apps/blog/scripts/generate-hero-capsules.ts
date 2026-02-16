/**
 * Generate Hero Blog Capsules using Devcapsules AI Generation Engine
 * This script creates the actual capsules for the hero blog post
 */

export async function generateHeroBlogCapsules() {
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
          concepts: request.tags,
          // Make these public and embeddable
          isPublic: true,
          enableEmbed: true
        }),
      });

      const result = await response.json();
      
      if (result.success && result.generation?.savedCapsuleId) {
        const capsuleId = result.generation.savedCapsuleId;
        
        generatedCapsules.push({
          id: capsuleId,
          language: request.language,
          embedUrl: `${apiUrl}/embed/${capsuleId}`,
          title: result.generation.title,
          description: result.generation.description,
          difficulty: request.difficulty
        });
        
        console.log(`✅ Generated ${request.language} capsule: ${capsuleId}`);
      } else {
        console.error(`❌ Failed to generate ${request.language} capsule:`, result);
      }
    } catch (error) {
      console.error(`❌ Error generating ${request.language} capsule:`, error);
    }
  }

  return generatedCapsules;
}

// Export the capsule IDs once they're generated
export const heroBlogCapsuleIds = {
  python: 'python-find-largest-hero',  // Will be replaced with actual generated ID
  sql: 'sql-electronics-hero',         // Will be replaced with actual generated ID  
  terminal: 'linux-commands-hero'      // Will be replaced with actual generated ID
};

// Helper function to get embed URLs
export function getEmbedUrl(capsuleId: string): string {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://devcapsules.com' 
    : 'http://localhost:3000';
  return `${baseUrl}/embed/${capsuleId}`;
}