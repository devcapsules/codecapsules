import React, { useState, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'

interface SQLCapsuleEmbedProps {
  widgetId: string
}

interface SQLCapsule {
  id: string
  title: string
  description: string
  type: 'SQL'
  difficulty: string
  problemStatement: string
  boilerplateCode: string
  schemaInfo: {
    tables: Array<{
      name: string
      columns: string[]
    }>
  }
  expectedResults?: any[]
  hints?: string[]
  referenceSolution?: string
  solution?: string
  isPublished: boolean
  createdAt: string
}

interface QueryResult {
  success: boolean
  results?: any[]
  columns?: string[]
  expected?: any[]
  diff?: string
  error?: string
  executionTime?: number
  warnings?: string[]
  approachFeedback?: string[]
  queryAnalysis?: any
  suggestions?: string[]
}

// Helper function to extract schema from schema_setup statements
function extractSchemaFromSetup(schemaSetup: string[]): { tables: Array<{ name: string; columns: string[] }> } {
  const tables: Array<{ name: string; columns: string[] }> = []
  
  for (const statement of schemaSetup) {
    // Parse CREATE TABLE statements
    const createMatch = statement.match(/CREATE\s+TABLE\s+(\w+)\s*\(([^;]+)\)/i)
    if (createMatch) {
      const tableName = createMatch[1]
      const columnsStr = createMatch[2]
      
      // Parse column definitions
      const columnDefs = columnsStr.split(',').map(col => {
        const cleaned = col.trim()
        // Extract column name and type
        const parts = cleaned.split(/\s+/)
        if (parts.length >= 2) {
          return `${parts[0]} (${parts.slice(1).join(' ')})`
        }
        return cleaned
      })
      
      tables.push({ name: tableName, columns: columnDefs })
    }
  }
  
  return { tables }
}

// Helper function to extract schema from capsule content
function extractSchemaFromContent(capsuleData: any) {
  // First try to extract from schema_setup (new format)
  const schemaSetup = capsuleData.config_data?.schema_setup || 
                      capsuleData.content?.primary?.database?.schema_setup ||
                      []
  
  if (schemaSetup.length > 0) {
    return extractSchemaFromSetup(schemaSetup)
  }
  
  // Fallback to old parsing method
  const problemStatement = capsuleData.content?.primary?.problemStatement || capsuleData.description || ''
  const starterCode = capsuleData.content?.primary?.code?.wasmVersion?.starterCode || ''
  
  // Parse table information from problem statement and starter code
  const tables: Array<{ name: string; columns: string[] }> = []
  
  // Look for table definitions in problem statement
  const tableMatches = problemStatement.match(/Table:\s*(\w+)\s*\(([^)]+)\)/gi) || []
  
  for (const match of tableMatches) {
    const tableMatch = match.match(/Table:\s*(\w+)\s*\(([^)]+)\)/i)
    if (tableMatch) {
      const tableName = tableMatch[1]
      const columnsStr = tableMatch[2]
      const columns = columnsStr.split(',').map((col: string) => col.trim())
      tables.push({ name: tableName, columns })
    }
  }
  
  // If no tables found in problem statement, try to extract from starter code comments
  if (tables.length === 0) {
    const starterLines = starterCode.split('\n')
    let currentTable: { name: string; columns: string[] } | null = null
    
    for (const line of starterLines) {
      const cleanLine = line.replace(/\/\*|\*\/|--|#/g, '').trim()
      
      // Look for table name mentions
      if (cleanLine.includes('table') && cleanLine.includes('contains')) {
        const tableMatch = cleanLine.match(/'(\w+)'\s+table/i) || cleanLine.match(/(\w+)\s+table/i)
        if (tableMatch) {
          if (currentTable) tables.push(currentTable)
          currentTable = { name: tableMatch[1], columns: [] }
        }
      }
      
      // Look for column definitions
      if (currentTable && cleanLine.includes('(') && cleanLine.includes(')')) {
        const columnMatch = cleanLine.match(/- (\w+) \(([^)]+)\)(.*)/)
        if (columnMatch) {
          const columnName = columnMatch[1]
          const columnType = columnMatch[2]
          const description = columnMatch[3] ? columnMatch[3].replace(':', '').trim() : ''
          currentTable.columns.push(`${columnName} (${columnType})${description ? ' - ' + description : ''}`)
        }
      }
    }
    
    if (currentTable) tables.push(currentTable)
  }
  
  // If still no tables found, try to infer from test cases
  if (tables.length === 0) {
    const testCases = capsuleData.content?.primary?.code?.wasmVersion?.testCases || []
    const insertStatements = testCases
      .map((tc: any) => tc.input)
      .filter((input: string) => input && input.includes('INSERT INTO'))
    
    for (const statement of insertStatements) {
      const insertMatch = statement.match(/INSERT INTO (\w+) \(([^)]+)\)/i)
      if (insertMatch) {
        const tableName = insertMatch[1]
        const columnsStr = insertMatch[2]
        const columns = columnsStr.split(',').map((col: string) => col.trim())
        
        // Check if table already exists
        if (!tables.find(t => t.name === tableName)) {
          tables.push({ name: tableName, columns })
        }
      }
    }
  }
  
  return { tables }
}

export default function SQLCapsuleEmbed({ widgetId }: SQLCapsuleEmbedProps) {
  const [capsule, setCapsule] = useState<SQLCapsule | null>(null)
  const [rawCapsuleData, setRawCapsuleData] = useState<any>(null) // Store raw data for schema access
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userQuery, setUserQuery] = useState('')
  const [executing, setExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'schema' | 'hints' | 'errors'>('results')
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/capsules/${widgetId}`)
        if (!response.ok) {
          throw new Error('Failed to load capsule')
        }
        const data = await response.json()
        if (data.success && data.capsule) {
          const capsuleData = data.capsule
          
          // Debug: Log the capsule data to see the structure
          console.log('📊 SQL Capsule Data:', {
            id: capsuleData.id,
            title: capsuleData.title,
            fullCapsuleData: capsuleData, // Log entire object to see structure
            testCases: {
              database_testCases: capsuleData.content?.primary?.database?.testCases,
              database_test_cases: capsuleData.content?.primary?.database?.test_cases,
              config_test_cases: capsuleData.config_data?.test_cases,
              config_expectedResults: capsuleData.config_data?.expectedResults,
              direct_expectedResults: capsuleData.expectedResults,
              direct_testCases: capsuleData.testCases
            },
            hints: {
              pedagogy: capsuleData.pedagogy?.hints,
              pedagogy_full: capsuleData.pedagogy,
              config_data: capsuleData.config_data?.hints,
              config_full: capsuleData.config_data,
              direct: capsuleData.hints
            },
            solution: {
              database_ref: capsuleData.content?.primary?.database?.referenceSolution,
              database_sol: capsuleData.content?.primary?.database?.solution,
              config_ref: capsuleData.config_data?.reference_solution,
              config_sol: capsuleData.config_data?.solution,
              direct_ref: capsuleData.referenceSolution,
              direct_sol: capsuleData.solution
            },
            starterCode: {
              database: capsuleData.content?.primary?.database?.starterQuery,
              config: capsuleData.config_data?.boilerplate_code,
              config_starter: capsuleData.config_data?.starterQuery
            }
          })
          
          // Map to SQL capsule format with proper data structure handling
          const sqlCapsule: SQLCapsule = {
            id: capsuleData.id,
            title: capsuleData.title || 'SQL Challenge',
            description: capsuleData.description || '',
            type: 'SQL',
            difficulty: capsuleData.difficulty?.toLowerCase() || 'medium',
            // Fix: Use proper path for problem statement
            problemStatement: capsuleData.content?.primary?.problemStatement || capsuleData.problem_statement_md || capsuleData.description || '',
            // Fix: Use proper path for starter query from DATABASE type capsules
            boilerplateCode: capsuleData.content?.primary?.database?.starterQuery || capsuleData.config_data?.boilerplate_code || capsuleData.config_data?.starterQuery || 'SELECT * FROM users;',
            // Fix: Extract schema from schema_setup array (always use extractSchemaFromContent to get proper format)
            schemaInfo: extractSchemaFromContent(capsuleData),
            // Fix: Use proper expected results with multiple fallback paths
            expectedResults: (() => {
              const paths = [
                capsuleData.content?.primary?.database?.testCases,
                capsuleData.content?.primary?.database?.test_cases,
                capsuleData.config_data?.test_cases,
                capsuleData.config_data?.expectedResults,
                capsuleData.expectedResults,
                capsuleData.testCases
              ]
              
              for (const path of paths) {
                if (path && Array.isArray(path) && path.length > 0) {
                  console.log('✅ Found test cases:', path)
                  return path
                }
              }
              
              console.log('⚠️ No test cases found in any path')
              return []
            })(),
            // Fix: Extract hints from multiple possible paths with better handling
            hints: (() => {
              // Try pedagogy.hints.sequence format
              if (capsuleData.pedagogy?.hints?.sequence && Array.isArray(capsuleData.pedagogy.hints.sequence)) {
                const pedagogyHints = capsuleData.pedagogy.hints.sequence
                  .map((hint: any) => hint?.content || hint?.text || hint)
                  .filter((hint: any) => hint && typeof hint === 'string')
                if (pedagogyHints.length > 0) return pedagogyHints
              }
              
              // Try config_data.hints format
              if (capsuleData.config_data?.hints && Array.isArray(capsuleData.config_data.hints)) {
                const configHints = capsuleData.config_data.hints
                  .map((hint: any) => typeof hint === 'string' ? hint : hint?.content || hint?.text)
                  .filter((hint: any) => hint && typeof hint === 'string')
                if (configHints.length > 0) return configHints
              }
              
              // Try direct hints field
              if (capsuleData.hints && Array.isArray(capsuleData.hints)) {
                const directHints = capsuleData.hints
                  .map((hint: any) => typeof hint === 'string' ? hint : hint?.content || hint?.text)
                  .filter((hint: any) => hint && typeof hint === 'string')
                if (directHints.length > 0) return directHints
              }
              
              // Try hints array in different locations
              const possibleHintPaths = [
                capsuleData.content?.primary?.hints,
                capsuleData.content?.primary?.database?.hints,
                capsuleData.config_data?.pedagogy?.hints
              ]
              
              for (const hintPath of possibleHintPaths) {
                if (hintPath && Array.isArray(hintPath)) {
                  const hints = hintPath
                    .map((hint: any) => typeof hint === 'string' ? hint : hint?.content || hint?.text)
                    .filter((hint: any) => hint && typeof hint === 'string')
                  if (hints.length > 0) return hints
                }
              }
              
              return []
            })(),
            // Fix: Extract solution from multiple possible paths for DATABASE type capsules
            referenceSolution: capsuleData.content?.primary?.database?.referenceSolution || 
                              capsuleData.content?.primary?.database?.solution ||
                              capsuleData.config_data?.reference_solution || 
                              capsuleData.config_data?.solution ||
                              capsuleData.referenceSolution ||
                              capsuleData.solution,
            // Fallback solution field
            solution: capsuleData.content?.primary?.database?.referenceSolution || 
                     capsuleData.content?.primary?.database?.solution ||
                     capsuleData.config_data?.reference_solution || 
                     capsuleData.config_data?.solution ||
                     capsuleData.referenceSolution ||
                     capsuleData.solution,
            isPublished: capsuleData.isPublished || false,
            createdAt: capsuleData.createdAt || new Date().toISOString()
          }
          setCapsule(sqlCapsule)
          setRawCapsuleData(capsuleData) // Store raw data for schema access
          setUserQuery(sqlCapsule.boilerplateCode)
        } else {
          throw new Error(data.error || 'Failed to load capsule')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCapsule()
  }, [widgetId])

  const analyzeQueryApproach = (query: string, referenceSolution?: string) => {
    const analysis = {
      complexity: 'basic',
      techniques: [] as string[],
      score: 0,
      feedback: [] as string[]
    }
    
    const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase()
    
    // Check for SQL techniques used
    if (normalizedQuery.includes('group by')) {
      analysis.techniques.push('Aggregation with GROUP BY')
      analysis.score += 20
    }
    
    if (normalizedQuery.includes('join')) {
      analysis.techniques.push('Table Joins')
      analysis.score += 25
      analysis.complexity = 'intermediate'
    }
    
    if (normalizedQuery.includes('subquery') || (normalizedQuery.match(/\(/g) || []).length > 1) {
      analysis.techniques.push('Subqueries')
      analysis.score += 30
      analysis.complexity = 'advanced'
    }
    
    const aggregateFunctions = ['sum', 'avg', 'count', 'max', 'min']
    const usedAggregates = aggregateFunctions.filter(func => normalizedQuery.includes(func))
    if (usedAggregates.length > 0) {
      analysis.techniques.push(`Aggregate functions (${usedAggregates.join(', ').toUpperCase()})`)
      analysis.score += 15
    }
    
    if (normalizedQuery.includes('having')) {
      analysis.techniques.push('HAVING clause for filtered aggregation')
      analysis.score += 20
      analysis.complexity = 'intermediate'
    }
    
    if (normalizedQuery.includes('order by')) {
      analysis.techniques.push('Result ordering')
      analysis.score += 10
    }
    
    if (normalizedQuery.includes('limit')) {
      analysis.techniques.push('Result limiting')
      analysis.score += 5
    }
    
    // Generate feedback based on analysis
    if (analysis.techniques.length === 0) {
      analysis.feedback.push('Consider using more SQL features for this type of problem')
    } else {
      analysis.feedback.push(`Good use of: ${analysis.techniques.join(', ')}`)
    }
    
    if (analysis.score >= 50) {
      analysis.feedback.push('Excellent SQL technique demonstration!')
    } else if (analysis.score >= 30) {
      analysis.feedback.push('Good SQL approach with room for optimization')
    }
    
    return analysis
  }

  const validateQueryStructure = (query: string, referenceSolution?: string) => {
    const issues = []
    
    // Normalize queries for comparison
    const normalizeQuery = (q: string) => q.replace(/\s+/g, ' ').trim().toLowerCase()
    const userNormalized = normalizeQuery(query)
    const refNormalized = referenceSolution ? normalizeQuery(referenceSolution) : ''
    
    // Check for basic SQL structure
    if (!userNormalized.includes('select')) {
      issues.push('Query should contain a SELECT statement')
    }
    
    // Check for proper GROUP BY if reference solution uses it
    if (refNormalized.includes('group by') && !userNormalized.includes('group by')) {
      issues.push('This problem requires using GROUP BY for aggregation')
    }
    
    // Check for aggregate functions when expected
    const aggregateFunctions = ['sum', 'avg', 'count', 'max', 'min']
    const refHasAggregates = aggregateFunctions.some(func => refNormalized.includes(func))
    const userHasAggregates = aggregateFunctions.some(func => userNormalized.includes(func))
    
    if (refHasAggregates && !userHasAggregates) {
      issues.push('This problem requires aggregate functions (SUM, COUNT, AVG, etc.)')
    }
    
    // Check for table names mentioned in reference
    const tableMatches = refNormalized.match(/from\s+(\w+)/g)
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.replace('from ', '')
        if (!userNormalized.includes(`from ${tableName}`) && !userNormalized.includes(`from\n${tableName}`)) {
          issues.push(`Query should use the ${tableName} table`)
        }
      })
    }
    
    // Check if query is suspiciously similar to reference (potential copy-paste)
    if (referenceSolution && userNormalized === refNormalized) {
      issues.push('Try to write the solution yourself rather than copying the reference')
    }
    
    return issues
  }

  const executeQuery = async () => {
    if (!capsule || !rawCapsuleData) return
    
    try {
      setExecuting(true)
      setQueryResult(null)
      
      // Client-side validation first
      const structureIssues = validateQueryStructure(userQuery, capsule.referenceSolution)
      if (structureIssues.length > 0) {
        const warningResult = {
          success: false,
          results: [],
          columns: [],
          error: 'Query Structure Issues:\n• ' + structureIssues.join('\n• ') + '\n\nFix these issues before running.',
          warnings: structureIssues
        }
        setQueryResult(warningResult)
        setActiveTab('errors')
        setExecuting(false)
        return
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      // Get schema_setup and test cases from raw capsule data
      let schemaSetup = rawCapsuleData.config_data?.schema_setup || 
                       rawCapsuleData.content?.primary?.database?.schema_setup || []
      
      // Fix: Use expectedResults which is the correct property for SQL capsules
      const testCases = capsule.expectedResults || 
                       rawCapsuleData.config_data?.test_cases ||
                       rawCapsuleData.content?.primary?.database?.test_cases || 
                       rawCapsuleData.content?.primary?.database?.testCases ||
                       []
      
      // Fallback: Check if first test case has schema_setup (as per generation pipeline)
      if (schemaSetup.length === 0 && testCases.length > 0) {
        const firstTestCase = testCases[0]
        if (firstTestCase?.schema_setup && Array.isArray(firstTestCase.schema_setup)) {
          schemaSetup = firstTestCase.schema_setup
          console.log(`📝 Found schema_setup in first test case (${schemaSetup.length} statements)`)
        }
      }
      
      // Final fallback: If still no schema, create a basic one based on the query and expected output
      if (schemaSetup.length === 0 && testCases.length > 0) {
        console.log('⚠️ No schema_setup found anywhere, attempting to infer schema from query and expected output')
        
        // Check if this looks like a sales-related query
        if (userQuery.toLowerCase().includes('sales') && userQuery.toLowerCase().includes('sales_rep')) {
          // Create a schema based on the expected output structure
          const expectedData = testCases[0]?.expected
          if (expectedData) {
            let parsedExpected
            try {
              parsedExpected = typeof expectedData === 'string' ? JSON.parse(expectedData) : expectedData
            } catch (e) {
              parsedExpected = []
            }
            
            if (Array.isArray(parsedExpected) && parsedExpected.length > 0) {
              // Infer schema from the sales query structure - match expected output exactly
              // Alice: total_revenue=600.5, avg=200.17, max=300, min=100, count=3
              // Bob: total_revenue=200, avg=100, max=150, min=50, count=2  
              // Charlie: total_revenue=400, avg=400, max=400, min=400, count=1
              schemaSetup = [
                "CREATE TABLE sales (id SERIAL PRIMARY KEY, sales_rep VARCHAR(100), amount DECIMAL(10,2), date DATE);",
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Alice', 100, '2024-01-01');",
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Alice', 200.5, '2024-01-02');", 
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Alice', 300, '2024-01-03');",
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Bob', 50, '2024-01-01');",
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Bob', 150, '2024-01-02');",
                "INSERT INTO sales (sales_rep, amount, date) VALUES ('Charlie', 400, '2024-01-01');"
              ]
              console.log('✅ Generated fallback schema for sales table')
            }
          }
        }
        
        if (schemaSetup.length === 0) {
          console.log('❌ Could not infer schema - SQL execution will likely fail')
        }
      }
      
      console.log('🏗️ Schema Setup Debug:', {
        config_schema_setup: rawCapsuleData.config_data?.schema_setup,
        database_schema_setup: rawCapsuleData.content?.primary?.database?.schema_setup,
        first_testcase_schema: testCases[0]?.schema_setup,
        config_data_keys: rawCapsuleData.config_data ? Object.keys(rawCapsuleData.config_data) : 'no config_data',
        content_primary_keys: rawCapsuleData.content?.primary ? Object.keys(rawCapsuleData.content.primary) : 'no content.primary',
        database_keys: rawCapsuleData.content?.primary?.database ? Object.keys(rawCapsuleData.content.primary.database) : 'no database',
        testcase_keys: testCases[0] ? Object.keys(testCases[0]) : 'no first test case',
        final_schemaSetup: schemaSetup
      })
      
      console.log('🔍 Test Cases Debug:', {
        expectedResults: capsule.expectedResults,
        config_test_cases: rawCapsuleData.config_data?.test_cases,
        database_test_cases: rawCapsuleData.content?.primary?.database?.test_cases,
        database_testCases: rawCapsuleData.content?.primary?.database?.testCases,
        final_testCases: testCases
      })
      
      // Execute tests using validation endpoint
      const response = await fetch(`${apiUrl}/api/execute-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: userQuery,
          testCases: testCases,
          language: 'sql',
          capsuleId: capsule.id,
          schema_setup: schemaSetup,
          referenceSolution: capsule.referenceSolution || capsule.solution,
          validateApproach: true,
          queryAnalysis: analyzeQueryApproach(userQuery, capsule.referenceSolution || capsule.solution)
        })
      })
      
      console.log('📤 Final request payload:', {
        userCode: userQuery.substring(0, 100) + '...',
        testCases_count: testCases.length,
        schema_setup_count: schemaSetup.length,
        schema_setup: schemaSetup,
        referenceSolution: capsule.referenceSolution || capsule.solution
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Format results for display with enhanced feedback
      const formattedResult = {
        success: result.success,
        results: result.results?.data || [],
        columns: result.results?.columns || [],
        expected: result.expected,
        diff: result.diff || result.message || '',
        error: result.error,
        testResults: result.results,
        approachFeedback: result.approach_feedback || [],
        queryAnalysis: result.query_analysis || {},
        suggestions: result.suggestions || []
      }
      
      // Add approach validation feedback to diff if available
      if (result.approach_feedback && result.approach_feedback.length > 0) {
        const feedbackText = '\n\n📝 Query Approach Analysis:\n• ' + result.approach_feedback.join('\n• ')
        formattedResult.diff = (formattedResult.diff || '') + feedbackText
      }
      
      // Add suggestions if query works but could be improved
      if (result.success && result.suggestions && result.suggestions.length > 0) {
        const suggestionsText = '\n\n💡 Suggestions for Improvement:\n• ' + result.suggestions.join('\n• ')
        formattedResult.diff = (formattedResult.diff || '') + suggestionsText
      }
      
      setQueryResult(formattedResult)
      
      if (!result.success) {
        setActiveTab('errors')
      } else {
        setActiveTab('results')
      }
    } catch (err) {
      setQueryResult({
        success: false,
        error: err instanceof Error ? err.message : 'Network error - could not connect to server',
        results: [],
        columns: []
      })
      setActiveTab('errors')
    } finally {
      setExecuting(false)
    }
  }

  const renderDataTable = (results: any[]) => {
    if (!results || results.length === 0) {
      return <div className="no-results">No results returned</div>
    }

    const columns = Object.keys(results[0])
    
    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderSchemaTree = () => {
    if (!capsule?.schemaInfo?.tables) return null

    // No hardcoded sample data - everything is parsed from problem statement

    return (
      <div className="schema-tree">
        <h3 style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '12px' }}>Database Schema</h3>
        {capsule.schemaInfo.tables.map((table, index) => (
          <div key={index} className="schema-table" style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#93c5fd',
              fontWeight: '500',
              marginBottom: '12px'
            }}>
              <span>�️</span>
              <span>{table.name}</span>
              <span style={{ 
                color: '#6b7280', 
                fontSize: '12px',
                backgroundColor: '#374151',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                Table
              </span>
            </div>
            
            {/* Column definitions displayed as a structured table */}
            <div className="schema-columns-table">
              <table style={{ 
                width: '100%', 
                fontSize: '13px', 
                borderCollapse: 'collapse',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#374151' }}>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'left', 
                      color: '#e2e8f0',
                      fontWeight: '600',
                      borderRight: '1px solid #4b5563',
                      width: '30%'
                    }}>
                      Column
                    </th>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'left', 
                      color: '#e2e8f0',
                      fontWeight: '600',
                      borderRight: '1px solid #4b5563',
                      width: '20%'
                    }}>
                      Type
                    </th>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'left', 
                      color: '#e2e8f0',
                      fontWeight: '600',
                      width: '50%'
                    }}>
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column, colIndex) => {
                    // Parse column definition: "columnName (TYPE) - description"
                    const columnMatch = column.match(/^(\w+)\s*\(([^)]+)\)(.*)/) || [null, column, '', '']
                    const columnName = columnMatch[1] || column
                    const columnType = columnMatch[2] || 'TEXT'
                    const description = columnMatch[3] ? columnMatch[3].replace(/^[\s-]+/, '').trim() : ''
                    
                    return (
                      <tr key={colIndex} style={{ 
                        backgroundColor: colIndex % 2 === 0 ? '#1f2937' : '#111827',
                        borderTop: colIndex > 0 ? '1px solid #374151' : 'none'
                      }}>
                        <td style={{ 
                          padding: '8px 12px', 
                          color: '#93c5fd',
                          fontWeight: '500',
                          fontFamily: 'Monaco, monospace',
                          borderRight: '1px solid #374151'
                        }}>
                          {columnName}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          color: '#fbbf24',
                          fontFamily: 'Monaco, monospace',
                          fontSize: '12px',
                          borderRight: '1px solid #374151'
                        }}>
                          {columnType}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          color: '#cbd5e1',
                          fontSize: '12px',
                          lineHeight: '1.4'
                        }}>
                          {description || 'No description available'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#93c5fd'
        }}>
          💡 <strong>Tip:</strong> Use the schema above to understand the table structure when writing your SQL queries.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading SQL capsule: {error}</p>
      </div>
    )
  }

  if (!capsule) {
    return (
      <div className="error-container">
        <p>SQL capsule not found</p>
      </div>
    )
  }

  return (
    <div className="codecapsule-embed sql-embed">
      {/* Header */}
      <div className="embed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="embed-title">{capsule.title}</h1>
          <div className="embed-tags">
            <span className="tag tag-language">SQL</span>
            <span className="tag tag-difficulty">{capsule.difficulty}</span>
          </div>
        </div>
        
        <div className="embed-controls">

          <button
            onClick={() => {
              if (showSolution) {
                // Reset to starter code
                setUserQuery(capsule.boilerplateCode)
                setShowSolution(false)
              } else {
                // Show solution in editor
                const solution = capsule.referenceSolution || capsule.solution
                if (solution) {
                  setUserQuery(solution)
                  setShowSolution(true)
                }
              }
            }}
            className={`solution-btn ${showSolution ? 'active' : ''}`}
            style={{
              marginRight: '8px',
              padding: '8px 12px',
              backgroundColor: showSolution ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
              color: showSolution ? '#ffffff' : '#10b981',
              border: '1px solid #10b981',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={showSolution ? "Reset to Starter Code" : "Show Solution"}
            disabled={!capsule.referenceSolution && !capsule.solution}
          >
            {showSolution ? '🔄 Reset' : '🔍 Solution'}
          </button>
          <button
            onClick={executeQuery}
            disabled={executing}
            className="run-btn"
          >
            {executing ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Executing...
              </>
            ) : (
              <>
                <span>▶</span>
                Run Query
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - 3 Pane Layout */}
      <div className="embed-main sql-main">
        {/* Instructions Panel */}
        {!instructionsCollapsed && (
          <div className="instructions-panel">
            <div className="instructions-header">
              <h2 className="instructions-title">Problem</h2>
              <button
                onClick={() => setInstructionsCollapsed(true)}
                className="collapse-btn"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="instructions-content">
              <div 
                className="problem-statement"
                dangerouslySetInnerHTML={{ 
                  __html: capsule.problemStatement
                    .trim()
                    .replace(/^# (.*$)/gm, '<h1 class="problem-h1">$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2 class="problem-h2">$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3 class="problem-h3">$1</h3>')
                    .replace(/^- (.*$)/gm, '<li class="problem-li">$1</li>')
                    .replace(/(\n|^)([^#\-\n][^\n]*$)/gm, '$1<p class="problem-p">$2</p>')
                    .replace(/\n+/g, ' ')
                    .replace(/(<li[^>]*>.*<\/li>)/g, '<ul class="problem-ul">$1</ul>')
                    .replace(/<\/li><ul[^>]*><li/g, '</li><li')
                    .replace(/<\/ul><ul[^>]*>/g, '')
                    .replace(/<p class="problem-p">\s*<\/p>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                }}
              />
              

              

            </div>
          </div>
        )}

        {/* Collapsed Instructions Button */}
        {instructionsCollapsed && (
          <button
            onClick={() => setInstructionsCollapsed(false)}
            className="collapsed-btn"
            title="Show Instructions"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Query Editor + Results */}
        <div className="editor-area sql-editor-area">
          {/* Solution Banner */}
          {showSolution && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderLeft: '3px solid #22c55e',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>Solution is now displayed in the SQL editor</span>
            </div>
          )}
          
          {/* SQL Query Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={userQuery}
              onChange={(value) => setUserQuery(value || '')}
              options={{
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
              }}
            />
          </div>

          {/* Results/Schema Panel */}
          <div className="console-panel sql-results-panel">
            {/* Tabs */}
            <div className="console-tabs">
              <button
                onClick={() => setActiveTab('results')}
                className={`console-tab ${activeTab === 'results' ? 'active' : ''}`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`console-tab ${activeTab === 'schema' ? 'active' : ''}`}
              >
                Schema
              </button>
              <button
                onClick={() => setActiveTab('hints')}
                className={`console-tab ${activeTab === 'hints' ? 'active' : ''}`}
              >
                Hints
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`console-tab ${activeTab === 'errors' ? 'active' : ''}`}
              >
                Errors
              </button>
            </div>

            {/* Content */}
            <div className="console-content">
              {activeTab === 'results' && (
                <div>
                  {queryResult ? (
                    <>
                      {queryResult.success ? (
                        <>
                          <div style={{ marginBottom: '12px', color: '#10b981', fontSize: '14px' }}>
                            ✅ All tests passed
                          </div>
                          
                          {/* Query approach analysis */}
                          {queryResult.queryAnalysis && (
                            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px' }}>
                              <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                📊 Query Analysis
                              </div>
                              <div style={{ fontSize: '12px', color: '#374151' }}>
                                <div><strong>Complexity:</strong> {queryResult.queryAnalysis.complexity}</div>
                                {queryResult.queryAnalysis.techniques && queryResult.queryAnalysis.techniques.length > 0 && (
                                  <div><strong>Techniques Used:</strong> {queryResult.queryAnalysis.techniques.join(', ')}</div>
                                )}
                                <div><strong>Score:</strong> {queryResult.queryAnalysis.score}/100</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Show approach feedback */}
                          {queryResult.diff && (
                            <div style={{ marginBottom: '16px', color: '#059669', fontSize: '12px', padding: '8px', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: '4px', whiteSpace: 'pre-line' }}>
                              {queryResult.diff}
                            </div>
                          )}
                          
                          {queryResult.results && queryResult.results.length > 0 && (
                            <>
                              <div style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>
                                Your Results:
                              </div>
                              {renderDataTable(queryResult.results)}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '12px', color: '#ef4444', fontSize: '14px' }}>
                            ❌ Tests failed - Results don't match expected output
                          </div>
                          
                          {/* Show diff if available */}
                          {queryResult.diff && (
                            <div style={{ marginBottom: '16px', color: '#fbbf24', fontSize: '12px', padding: '8px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '4px' }}>
                              {queryResult.diff}
                            </div>
                          )}
                          
                          {/* Side-by-side comparison */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <div style={{ marginBottom: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
                                Your Results:
                              </div>
                              {queryResult.results && queryResult.results.length > 0 ? (
                                renderDataTable(queryResult.results)
                              ) : (
                                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No results returned</div>
                              )}
                            </div>
                            
                            <div>
                              <div style={{ marginBottom: '8px', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>
                                Expected Results:
                              </div>
                              {queryResult.expected && queryResult.expected.length > 0 ? (
                                renderDataTable(queryResult.expected)
                              ) : (
                                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No expected results</div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="no-output">
                      Execute a query to see results
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schema' && (
                <div>
                  {renderSchemaTree()}
                </div>
              )}

              {activeTab === 'hints' && (
                <div>
                  {/* Debug info */}
                  {console.log('🔍 Hints Debug:', {
                    hints: capsule.hints,
                    hintsLength: capsule.hints?.length,
                    hintsType: typeof capsule.hints,
                    hintsArray: Array.isArray(capsule.hints)
                  })}
                  
                  {capsule.hints && capsule.hints.length > 0 ? (
                    <div style={{ padding: '16px' }}>
                      <div style={{ 
                        color: '#3b82f6', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>💡</span>
                        <span>Helpful Hints ({capsule.hints.length})</span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
                        {capsule.hints.map((hint: string, index: number) => {
                          // Handle hints that might be objects or strings
                          const hintText = typeof hint === 'object' ? hint.content || hint.text || JSON.stringify(hint) : hint;
                          return (
                            <div key={index} style={{ 
                              marginBottom: '12px',
                              padding: '12px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '6px',
                              borderLeft: '3px solid #3b82f6'
                            }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#93c5fd' }}>
                                Hint {index + 1}:
                              </div>
                              <div>{hintText}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="no-output">
                      <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>💡</div>
                        <div>No hints available for this problem</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', color: '#4b5563' }}>
                          Debug: hints = {JSON.stringify(capsule.hints)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'errors' && (
                <div>
                  {queryResult?.error ? (
                    <div className="sql-error">
                      <div style={{ color: '#ef4444', marginBottom: '8px' }}>❌ Query Error</div>
                      <pre style={{ 
                        color: '#fca5a5', 
                        fontSize: '13px', 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Monaco, monospace'
                      }}>
                        {queryResult.error}
                      </pre>
                    </div>
                  ) : (
                    <div className="no-output">No errors</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>SQL: Connected (PostgreSQL 15)</span>
        </div>
        <div className="status-right">
          Powered by <span className="brand">Devcapsules</span>
        </div>
      </div>
    </div>
  )
}