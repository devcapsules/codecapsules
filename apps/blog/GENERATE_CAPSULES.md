# Generate Hero Blog Capsules

## Step 1: Run the Generation Script

First, make sure your API server is running on `localhost:3001`, then run:

```bash
cd apps/blog/scripts
node run-generation.js
```

This will:
1. Use your AI generation engine to create 3 capsules
2. Make them public and embeddable
3. Output the capsule IDs and embed URLs

## Step 2: Update the Blog Post

Replace the placeholder IDs in `apps/dashboard/src/components/blog/HeroBlogPost.tsx`:

```typescript
// Replace these placeholder IDs with the actual generated IDs:
'PYTHON_CAPSULE_ID'   -> actual Python capsule ID
'SQL_CAPSULE_ID'      -> actual SQL capsule ID  
'TERMINAL_CAPSULE_ID' -> actual Terminal capsule ID
```

## Step 3: Test the Embeds

1. Start your dashboard: `npm run dev` in `apps/dashboard`
2. Navigate to `/blog/stop-copy-pasting`
3. Verify all 3 capsules load and work properly

## Expected Capsules

### 1. Python Challenge
- **Prompt**: "Create a Python function to find the largest number in a list"
- **Language**: Python
- **Difficulty**: Easy
- **Features**: WASM execution, instant feedback

### 2. SQL Challenge  
- **Prompt**: "Query a products database for Electronics category"
- **Language**: SQL
- **Difficulty**: Easy
- **Features**: Server-side execution, real database

### 3. Terminal Challenge
- **Prompt**: "Basic Linux commands - ls, echo, cat"
- **Language**: Bash
- **Difficulty**: Easy
- **Features**: Full Linux environment in browser

## Troubleshooting

If generation fails:
1. Check API server is running (`localhost:3001`)
2. Verify database connections
3. Check console for detailed error messages
4. Ensure your generation engine is properly configured

## Manual Alternative

If the script doesn't work, you can manually create capsules via:
1. Go to `/create-capsule` in your dashboard
2. Use the prompts from the generation script
3. Mark as "Public" and "Embeddable"
4. Copy the capsule IDs to the blog post

## Expected Output

The generation script should output something like:
```
✅ Successfully generated capsules:
=====================================
1. PYTHON - Find the Largest Number in a List
   ID: abc123-python-capsule
   Embed URL: http://localhost:3000/embed/abc123-python-capsule

2. SQL - Query Electronics Products  
   ID: def456-sql-capsule
   Embed URL: http://localhost:3000/embed/def456-sql-capsule

3. BASH - Linux Command Practice
   ID: ghi789-terminal-capsule  
   Embed URL: http://localhost:3000/embed/ghi789-terminal-capsule
```

Copy these IDs into the blog post iframe src attributes!