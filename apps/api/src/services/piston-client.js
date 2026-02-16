const axios = require('axios');

class PistonClient {
  constructor(pistonUrl = 'http://localhost:2000') {
    this.baseURL = pistonUrl;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Language version mapping (keep synced with Piston setup script)
    this.LANGUAGE_VERSIONS = {
      python: '3.10.0',
      javascript: '18.15.0', 
      typescript: '5.0.3',
      go: '1.16.2',
      java: '15.0.2',
      cpp: '10.2.0',
      c: '10.2.0',
      csharp: '6.12.0',
      php: '8.2.3',
      ruby: '3.0.1',
      rust: '1.68.2',
      sql: '3.36.0' // SQLite
    };
  }

  /**
   * Get available runtimes from Piston
   * @returns {Promise<Array>} Available runtimes
   */
  async getRuntimes() {
    try {
      const response = await this.api.get('/api/v2/runtimes');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get Piston runtimes:', error.message);
      throw new Error('Failed to connect to Piston execution engine');
    }
  }

  /**
   * Execute code using Piston
   * @param {string} language - Programming language
   * @param {string} code - Code to execute
   * @param {string} input - Optional input for the code
   * @param {object} options - Additional execution options
   * @returns {Promise<object>} Execution result
   */
  async executeCode(language, code, input = '', options = {}) {
    try {
      const version = this.LANGUAGE_VERSIONS[language] || this.LANGUAGE_VERSIONS.python;
      const fileName = this.getFileName(language);
      
      const payload = {
        language,
        version,
        files: [{
          name: fileName,
          content: code
        }],
        stdin: input,
        compile_timeout: options.compileTimeout || 10000,
        run_timeout: options.timeout || 30000,
        compile_memory_limit: options.compileMemoryLimit || 128000000,
        run_memory_limit: options.runMemoryLimit || 128000000
      };

      console.log(`🚀 Executing ${language} code via Piston...`);
      const startTime = Date.now();
      
      const response = await this.api.post('/api/v2/execute', payload);
      const executionTime = Date.now() - startTime;
      
      const result = response.data;
      
      // Normalize the response format
      const normalizedResult = {
        success: result.run?.code === 0,
        stdout: result.run?.stdout || result.run?.output || '',
        stderr: result.run?.stderr || '',
        exitCode: result.run?.code || 0,
        executionTime,
        language,
        memoryUsed: result.run?.memory || 0,
        signal: result.run?.signal || null
      };

      console.log(`✅ Execution completed in ${executionTime}ms`);
      return normalizedResult;

    } catch (error) {
      console.error(`❌ Piston execution error (${language}):`, error.message);
      
      // Return error in normalized format
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        executionTime: 0,
        language,
        error: error.message
      };
    }
  }

  /**
   * Install a language runtime in Piston
   * @param {string} language - Language to install
   * @param {string} version - Version to install
   * @returns {Promise<boolean>} Installation success
   */
  async installRuntime(language, version) {
    try {
      await this.api.post('/api/v2/packages', {
        language,
        version
      });
      
      console.log(`✅ Installed ${language} ${version}`);
      return true;
    } catch (error) {
      if (error.response?.data?.message?.includes('Already installed')) {
        console.log(`✅ ${language} ${version} already installed`);
        return true;
      }
      
      console.error(`❌ Failed to install ${language} ${version}:`, error.message);
      return false;
    }
  }

  /**
   * Ensure required language runtimes are installed
   * @returns {Promise<void>}
   */
  async ensureRuntimesInstalled() {
    console.log('📦 Ensuring Piston runtimes are installed...');
    
    const installPromises = Object.entries(this.LANGUAGE_VERSIONS).map(
      ([language, version]) => this.installRuntime(language, version)
    );
    
    const results = await Promise.allSettled(installPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`✅ ${successful}/${results.length} runtimes verified/installed`);
  }

  /**
   * Get filename for language
   * @param {string} language - Programming language
   * @returns {string} Appropriate filename
   */
  getFileName(language) {
    const extensions = {
      python: 'main.py',
      javascript: 'main.js',
      typescript: 'main.ts',
      java: 'Main.java',
      cpp: 'main.cpp',
      c: 'main.c',
      csharp: 'main.cs',
      go: 'main.go',
      php: 'main.php',
      ruby: 'main.rb',
      rust: 'main.rs',
      sql: 'main.sql'
    };
    
    return extensions[language] || 'main.txt';
  }

  /**
   * Health check for Piston service
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const runtimes = await this.getRuntimes();
      return {
        status: 'healthy',
        runtimesCount: runtimes.length,
        availableLanguages: runtimes.map(r => r.language),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = PistonClient;