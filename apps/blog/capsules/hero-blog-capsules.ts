/**
 * Blog Capsule Generator
 * Creates the specific capsules needed for the hero blog post
 */

export const heroBlogCapsules = [
  {
    id: 'python-find-largest-hero',
    title: 'Find the Largest Number',
    description: 'Write a Python function that returns the largest number in a list.',
    language: 'python',
    difficulty: 'easy',
    problemStatement: `Write a Python function \`find_largest(nums)\` that returns the largest number in a list.

**Requirements:**
- Function should work with positive and negative numbers
- Handle edge cases like single-element lists
- Return the actual largest value

**Example:**
\`\`\`python
find_largest([1, 5, 3, 9, 2])  # Should return 9
find_largest([-1, -5, -3])     # Should return -1
find_largest([42])             # Should return 42
\`\`\``,
    starterCode: `def find_largest(nums):
    # Your code here
    pass

# Test cases
print(find_largest([1, 5, 3, 9, 2]))
print(find_largest([-1, -5, -3]))
print(find_largest([42]))`,
    solution: `def find_largest(nums):
    return max(nums)

# Test cases
print(find_largest([1, 5, 3, 9, 2]))
print(find_largest([-1, -5, -3]))
print(find_largest([42]))`,
    testCases: [
      {
        input: '[1, 5, 3, 9, 2]',
        expected: '9',
        description: 'Mixed positive numbers'
      },
      {
        input: '[-1, -5, -3]',
        expected: '-1',
        description: 'All negative numbers'
      },
      {
        input: '[42]',
        expected: '42',
        description: 'Single element'
      }
    ],
    hints: [
      "Python has a built-in max() function that works perfectly for this",
      "Alternatively, you could iterate through the list keeping track of the largest value",
      "Don't forget to handle the case where the list might be empty"
    ]
  },
  {
    id: 'sql-electronics-hero',  
    title: 'Query Electronics Products',
    description: 'Find all products in the Electronics category from our sample database.',
    language: 'sql',
    difficulty: 'easy',
    problemStatement: `Query our products database to find all electronics items.

**Database Schema:**
\`\`\`sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2)
);
\`\`\`

**Sample Data:**
- iPhone 15 (Electronics, $999.99)
- Coffee Maker (Appliances, $79.99)  
- Laptop Pro (Electronics, $1299.99)
- Bluetooth Headphones (Electronics, $199.99)

**Task:** Write a SQL query to find all products where category = 'Electronics'`,
    starterCode: `-- Write your SQL query here
SELECT * FROM products WHERE `,
    solution: `-- Find all electronics products
SELECT * FROM products WHERE category = 'Electronics';`,
    testCases: [
      {
        input: "category = 'Electronics'",
        expected: '3 rows returned',
        description: 'Should return iPhone, Laptop, and Headphones'
      }
    ],
    hints: [
      "Use the WHERE clause to filter by category",
      "Remember to put string values in quotes: 'Electronics'", 
      "SELECT * will return all columns for matching rows"
    ]
  },
  {
    id: 'linux-commands-hero',
    title: 'Linux Command Practice', 
    description: 'Practice basic Linux commands in a real terminal environment.',
    language: 'bash',
    difficulty: 'easy',
    problemStatement: `Complete these Linux command tasks:

1. **List all files** in the current directory (including hidden files)
2. **Create a file** named \`hello.txt\` with the content "Hello Devcapsules!"
3. **Display the contents** of the file you created

**Commands you'll need:**
- \`ls -la\` - List all files with details
- \`echo "text" > file.txt\` - Create file with content
- \`cat file.txt\` - Display file contents`,
    starterCode: `# Linux Terminal Commands
# Complete these tasks:

# 1. List all files (including hidden ones)
ls -la

# 2. Create hello.txt with content
echo "Hello Devcapsules!" > hello.txt

# 3. Display the file contents  
cat hello.txt`,
    solution: `# Linux Terminal Commands - Solution
ls -la
echo "Hello Devcapsules!" > hello.txt
cat hello.txt`,
    testCases: [
      {
        input: 'ls -la',
        expected: 'File listing with details',
        description: 'Shows all files including hidden ones'
      },
      {
        input: 'cat hello.txt',
        expected: 'Hello Devcapsules!',
        description: 'Displays the file content'
      }
    ],
    hints: [
      "The -la flags show all files (-a) in long format (-l)",
      "Use > to redirect echo output to a file",
      "cat is short for 'concatenate' and displays file contents"
    ]
  }
];

export async function generateHeroBlogCapsules() {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api.devcapsules.com' 
    : 'http://localhost:3001';

  const results = [];

  for (const capsule of heroBlogCapsules) {
    try {
      const response = await fetch(`${apiUrl}/api/generate-capsule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: capsule.problemStatement,
          language: capsule.language,
          difficulty: capsule.difficulty,
          title: capsule.title,
          description: capsule.description,
          starterCode: capsule.starterCode,
          solution: capsule.solution,
          testCases: capsule.testCases,
          hints: capsule.hints,
          isPublic: true, // Make these publicly embeddable
          tags: ['hero-blog', 'interactive-tutorial', capsule.language]
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        results.push({
          ...capsule,
          generatedId: result.capsuleId,
          embedUrl: `${apiUrl}/embed/${result.capsuleId}`
        });
      }
    } catch (error) {
      console.error(`Failed to generate capsule ${capsule.id}:`, error);
    }
  }

  return results;
}