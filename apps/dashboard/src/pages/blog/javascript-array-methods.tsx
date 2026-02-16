import React from 'react'
import Head from 'next/head'
import BlogLayout from '../../components/blog/BlogLayout'
import SEOEnhancements from '../../components/blog/SEOEnhancements'
import ConversionCTA from '../../components/blog/ConversionCTA'

export default function JavaScriptArrayMethodsPost() {
  return (
    <>
      <Head>
        <title>JavaScript Array Methods Cheat Sheet: map, filter, reduce & More | DevCapsules</title>
        <meta 
          name="description" 
          content="Master JavaScript array methods with interactive examples. Learn map(), filter(), reduce(), forEach(), find() and more with code you can run instantly." 
        />
        <meta name="keywords" content="javascript array methods, javascript map filter reduce, js array methods cheat sheet, javascript tutorial, array methods examples" />
        <meta name="author" content="DevCapsules Team" />
        <link rel="canonical" href="https://devcapsules.com/blog/javascript-array-methods" />
        
        {/* Open Graph */}
        <meta property="og:title" content="JavaScript Array Methods Cheat Sheet: Complete Guide with Examples" />
        <meta property="og:description" content="Master all essential JavaScript array methods with interactive examples you can run instantly." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://devcapsules.com/blog/javascript-array-methods" />
        
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": "JavaScript Array Methods Cheat Sheet: map, filter, reduce & More",
              "datePublished": "2025-11-07T00:00:00Z",
              "author": {
                "@type": "Organization",
                "name": "DevCapsules Team"
              },
              "description": "Master JavaScript array methods with interactive examples. Learn map(), filter(), reduce(), forEach(), find() and more."
            })
          }}
        />
      </Head>
      
      <BlogLayout>
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* SEO Enhancements */}
          <SEOEnhancements
            title="JavaScript Array Methods Cheat Sheet: map, filter, reduce & More"
            category="Quick Tips"
            language="JavaScript"
            readTime="6 min read"
            publishDate="2025-11-07"
            url="/blog/javascript-array-methods"
          />
          
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                ⚡ JavaScript Essential
              </span>
              <span className="text-sm text-gray-500">Interactive Tutorial</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              JavaScript Array Methods: The Complete Cheat Sheet
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Stop writing messy <code className="bg-gray-100 px-2 py-1 rounded text-sm">for</code> loops. 
              Master the 10 most important JavaScript array methods with interactive examples you can run right here.
            </p>
          </header>

          {/* Problem Statement */}
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-900 mb-2">😩 The Old Way (Don't Do This)</h2>
            <p className="text-red-800 mb-4">
              Before modern JavaScript, you had to write verbose loops for everything:
            </p>
            <pre className="bg-red-100 p-4 rounded text-sm text-red-900 font-mono overflow-x-auto">
{`// Transform array - Old way (6 lines)
const numbers = [1, 2, 3, 4, 5];
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

// Filter array - Old way (6 lines)  
const evens = [];
for (let i = 0; i < doubled.length; i++) {
  if (doubled[i] % 2 === 0) {
    evens.push(doubled[i]);
  }
}`}
            </pre>
            <p className="text-red-800 mt-3">
              <strong>12 lines of code</strong> for basic array operations. There's a much better way.
            </p>
          </div>

          {/* The Modern Way */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ The Modern Way</h2>
            <p className="text-lg text-gray-700 mb-6">
              Modern JavaScript provides elegant array methods that make your code cleaner and more readable. 
              Try this interactive example:
            </p>

            {/* Interactive Widget */}
            <div className="my-8 border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-lg font-bold">Master Array Methods</h3>
                    <span className="text-yellow-200 text-sm">Interactive JavaScript • Run instantly</span>
                  </div>
                </div>
                <p className="mt-2 text-yellow-100">Transform the verbose loops into elegant one-liners</p>
              </div>
              
              {/* DevCapsules Interactive Widget */}
              <iframe
                src={`http://localhost:3002/?widgetId=cmhupk1t3000buj71jtfsotcu`}
                width="100%"
                height="600"
                frameBorder="0"
                allow="clipboard-write"
                className="rounded-lg"
                title="JavaScript Array Methods Interactive Tutorial"
                allowFullScreen
              />
              
              <div className="bg-green-50 px-6 py-3 border-t border-green-200">
                <p className="text-sm text-green-700">
                  <strong>🎯 Perfect!</strong> Same result with 75% less code. That's the power of modern JavaScript.
                </p>
              </div>
            </div>
          </section>

          {/* The Essential 10 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 The Essential 10 Array Methods</h2>
            
            <div className="space-y-6">
              {/* map() */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">map() - Transform Every Element</h3>
                    <p className="text-blue-800 mb-3">Creates a new array by transforming each element.</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-mono text-sm">
                        <div className="text-gray-600">// Double all numbers</div>
                        <div className="text-gray-800">[1, 2, 3].map(n =&gt; n * 2) <span className="text-green-600">// [2, 4, 6]</span></div>
                        <div className="text-gray-600 mt-2">// Extract property from objects</div>
                        <div className="text-gray-800">users.map(user =&gt; user.name) <span className="text-green-600">// ['John', 'Jane']</span></div>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mt-2"><strong>Use when:</strong> You need to transform every element</p>
                  </div>
                </div>
              </div>

              {/* filter() */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900 mb-2">filter() - Keep Only What You Want</h3>
                    <p className="text-green-800 mb-3">Creates a new array with elements that pass a test.</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-mono text-sm">
                        <div className="text-gray-600">// Get even numbers only</div>
                        <div className="text-gray-800">[1, 2, 3, 4].filter(n =&gt; n % 2 === 0) <span className="text-green-600">// [2, 4]</span></div>
                        <div className="text-gray-600 mt-2">// Get active users</div>
                        <div className="text-gray-800">users.filter(u =&gt; u.active) <span className="text-green-600">// [{`{name: 'John', active: true}`}]</span></div>
                      </div>
                    </div>
                    <p className="text-sm text-green-700 mt-2"><strong>Use when:</strong> You need to remove unwanted elements</p>
                  </div>
                </div>
              </div>

              {/* reduce() */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-purple-900 mb-2">reduce() - Combine Into One Value</h3>
                    <p className="text-purple-800 mb-3">Reduces array to a single value (sum, object, etc.).</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-mono text-sm">
                        <div className="text-gray-600">// Sum all numbers</div>
                        <div className="text-gray-800">[1, 2, 3, 4].reduce((sum, n) =&gt; sum + n, 0) <span className="text-green-600">// 10</span></div>
                        <div className="text-gray-600 mt-2">// Count occurrences</div>
                        <div className="text-gray-800">words.reduce((count, word) =&gt; ({`{...count, [word]: (count[word] || 0) + 1}`}), {}) </div>
                      </div>
                    </div>
                    <p className="text-sm text-purple-700 mt-2"><strong>Use when:</strong> You need to calculate a single result</p>
                  </div>
                </div>
              </div>

              {/* find() */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-orange-900 mb-2">find() - Get First Match</h3>
                    <p className="text-orange-800 mb-3">Returns the first element that passes a test.</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-mono text-sm">
                        <div className="text-gray-600">// Find first even number</div>
                        <div className="text-gray-800">[1, 3, 4, 6].find(n =&gt; n % 2 === 0) <span className="text-green-600">// 4</span></div>
                        <div className="text-gray-600 mt-2">// Find user by ID</div>
                        <div className="text-gray-800">users.find(u =&gt; u.id === 123) <span className="text-green-600">// {`{id: 123, name: 'John'}`}</span></div>
                      </div>
                    </div>
                    <p className="text-sm text-orange-700 mt-2"><strong>Use when:</strong> You need the first matching element</p>
                  </div>
                </div>
              </div>

              {/* forEach() */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-white font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">forEach() - Do Something With Each</h3>
                    <p className="text-gray-800 mb-3">Executes a function for each element (doesn't return new array).</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-mono text-sm">
                        <div className="text-gray-600">// Log each element</div>
                        <div className="text-gray-800">[1, 2, 3].forEach(n =&gt; console.log(n))</div>
                        <div className="text-gray-600 mt-2">// Update DOM elements</div>
                        <div className="text-gray-800">buttons.forEach(btn =&gt; btn.addEventListener('click', handler))</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2"><strong>Use when:</strong> You need to perform side effects (logging, DOM updates)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Quick Reference: The Other 5</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">What it does</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">some()</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Tests if ANY element passes</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">[1,2,3].some(n =&gt; n &gt; 2) // true</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">every()</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Tests if ALL elements pass</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">[1,2,3].every(n =&gt; n &gt; 0) // true</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">includes()</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Checks if element exists</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">[1,2,3].includes(2) // true</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">findIndex()</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Gets index of first match</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">[1,2,3].findIndex(n =&gt; n &gt; 1) // 1</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">sort()</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Sorts array in place</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">[3,1,2].sort() // [1,2,3]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Method Chaining */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⛓️ Method Chaining: The Real Power</h2>
            <p className="text-lg text-gray-700 mb-6">
              The magic happens when you chain methods together. Complex data transformations become readable one-liners:
            </p>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Real Example: Process User Data</h3>
              <div className="bg-white p-4 rounded border font-mono text-sm">
                <div className="text-gray-600 mb-2">// Get names of active users over 18, sorted alphabetically</div>
                <div className="text-gray-800">
                  users<br/>
                  &nbsp;&nbsp;.filter(user =&gt; user.active)<br/>
                  &nbsp;&nbsp;.filter(user =&gt; user.age &gt; 18)<br/>
                  &nbsp;&nbsp;.map(user =&gt; user.name)<br/>
                  &nbsp;&nbsp;.sort()<br/>
                  &nbsp;&nbsp;.slice(0, 10); <span className="text-green-600">// Top 10 results</span>
                </div>
              </div>
              <p className="text-indigo-800 text-sm mt-4">
                <strong>This would be 20+ lines with traditional loops!</strong> Method chaining makes complex operations readable.
              </p>
            </div>
          </section>

          {/* Performance Tips */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Performance Tips</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-green-900 mb-3">✅ Fast Methods</h3>
                <ul className="space-y-2 text-green-800 text-sm">
                  <li className="flex items-start"><span className="text-green-600 mr-2">🚀</span> <code>forEach()</code> - Just iterates</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2">🚀</span> <code>find()</code> - Stops at first match</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2">🚀</span> <code>some()</code> - Stops at first true</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2">🚀</span> <code>includes()</code> - Native optimization</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-3">⚠️ Watch Out For</h3>
                <ul className="space-y-2 text-yellow-800 text-sm">
                  <li className="flex items-start"><span className="text-yellow-600 mr-2">⚠️</span> <code>map()</code> creates new array</li>
                  <li className="flex items-start"><span className="text-yellow-600 mr-2">⚠️</span> <code>filter()</code> creates new array</li>
                  <li className="flex items-start"><span className="text-yellow-600 mr-2">⚠️</span> Chaining creates multiple arrays</li>
                  <li className="flex items-start"><span className="text-yellow-600 mr-2">⚠️</span> <code>reduce()</code> can be complex</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3">💡 Pro Tip: When to Use Traditional Loops</h3>
              <p className="text-blue-800 text-sm mb-2">Use traditional <code>for</code> loops when:</p>
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>• Working with very large arrays (millions of elements)</li>
                <li>• You need to break out early based on complex conditions</li>
                <li>• Performance is absolutely critical</li>
              </ul>
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">❌ Common Mistakes to Avoid</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <h3 className="font-bold text-red-900 mb-2">Mistake #1: Forgetting to return in map()</h3>
                <div className="bg-red-100 p-3 rounded font-mono text-sm text-red-900 mb-2">
                  // Wrong - no return statement<br/>
                  numbers.map(n =&gt; {`{ n * 2 }`}) <span className="text-red-600">// [undefined, undefined, ...]</span>
                </div>
                <div className="bg-green-100 p-3 rounded font-mono text-sm text-green-900">
                  // Correct - explicit return<br/>
                  numbers.map(n =&gt; {`{ return n * 2 }`}) <span className="text-green-600">// [2, 4, 6, ...]</span><br/>
                  // Or use arrow function shorthand<br/>
                  numbers.map(n =&gt; n * 2) <span className="text-green-600">// [2, 4, 6, ...]</span>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h3 className="font-bold text-yellow-900 mb-2">Mistake #2: Using map() when you should use forEach()</h3>
                <div className="bg-yellow-100 p-3 rounded font-mono text-sm text-yellow-900 mb-2">
                  // Wrong - map() for side effects<br/>
                  users.map(user =&gt; console.log(user.name)) <span className="text-yellow-600">// Creates useless array</span>
                </div>
                <div className="bg-green-100 p-3 rounded font-mono text-sm text-green-900">
                  // Correct - forEach() for side effects<br/>
                  users.forEach(user =&gt; console.log(user.name)) <span className="text-green-600">// No return value</span>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-bold text-blue-900 mb-2">Mistake #3: Mutating original array</h3>
                <div className="bg-blue-100 p-3 rounded font-mono text-sm text-blue-900">
                  // Array methods don't mutate (except sort/reverse)<br/>
                  const original = [1, 2, 3];<br/>
                  const doubled = original.map(n =&gt; n * 2);<br/>
                  console.log(original); <span className="text-green-600">// Still [1, 2, 3] ✓</span>
                </div>
              </div>
            </div>
          </section>

          {/* CTA to Hero Content */}
          <ConversionCTA type="feeder-to-hero" heroPostUrl="/blog/stop-copy-pasting" className="mb-12" />

          {/* Newsletter */}
          <ConversionCTA type="newsletter" className="mb-12" />

          {/* Related Posts */}
          <ConversionCTA 
            type="related-content" 
            relatedPosts={[
              {
                id: 'javascript-async-await-guide',
                title: 'Async/Await vs Promises: The Complete Guide',
                description: 'Master asynchronous JavaScript with interactive examples. See the difference in real code.',
                readTime: '5 min read',
                language: 'JavaScript'
              },
              {
                id: 'javascript-destructuring',
                title: 'JavaScript Destructuring: Arrays and Objects',
                description: 'Master ES6 destructuring syntax with practical examples you can run instantly.',
                readTime: '4 min read',
                language: 'JavaScript'
              },
              {
                id: 'javascript-spread-operator',
                title: 'JavaScript Spread Operator: 5 Practical Uses',
                description: 'Learn when and how to use the spread operator (...) in modern JavaScript.',
                readTime: '3 min read',
                language: 'JavaScript'
              },
              {
                id: 'javascript-closures-explained',
                title: 'JavaScript Closures Explained with Examples',
                description: 'Understand closures with practical examples. No more confusion about scope!',
                readTime: '6 min read',
                language: 'JavaScript'
              }
            ]}
          />
        </div>
      </BlogLayout>
    </>
  )
}
