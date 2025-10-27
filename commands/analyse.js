const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = async function(args) {
  const targetDir = args[0] || process.cwd();

  console.log(`Analyzing directory: ${targetDir}`);
  console.log('');

  // Check if directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory '${targetDir}' does not exist.`);
    process.exit(1);
  }

  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.');
    console.error('Please set your Claude API key:');
    console.error('  export ANTHROPIC_API_KEY="your-api-key-here"');
    console.error('');
    console.error('Get your API key from: https://console.anthropic.com/');
    process.exit(1);
  }

  // Scan directory
  console.log('Scanning files...');
  const files = scanDirectory(targetDir);

  if (files.length === 0) {
    console.log('No files found to analyze.');
    return;
  }

  console.log(`Found ${files.length} files to analyze.`);
  console.log('');

  // Build context for Claude
  let context = 'Analyze this codebase:\n\n';

  files.forEach(file => {
    const relativePath = path.relative(targetDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    context += `\n--- ${relativePath} ---\n${content}\n`;
  });

  // Call Claude API
  console.log('Sending to Claude for analysis...');
  console.log('');

  try {
    const response = await callClaudeAPI(apiKey, context);
    console.log('=== Analysis Result ===');
    console.log('');
    console.log(response);
  } catch (error) {
    console.error('Error calling Claude API:', error.message);
    process.exit(1);
  }
};

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules, .git, and hidden files/folders
    if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
      return;
    }

    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (stat.isFile()) {
      // Only include common code files
      const ext = path.extname(file);
      const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml', '.sh'];

      if (codeExtensions.includes(ext)) {
        // Skip large files (> 100KB)
        if (stat.size < 100 * 1024) {
          fileList.push(filePath);
        }
      }
    }
  });

  return fileList;
}

function callClaudeAPI(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt + '\n\nProvide a comprehensive analysis including:\n1. Project structure and organization\n2. Technologies and frameworks used\n3. Code quality observations\n4. Potential improvements\n5. Security considerations'
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);

          if (json.error) {
            reject(new Error(json.error.message || 'API error'));
            return;
          }

          if (json.content && json.content[0] && json.content[0].text) {
            resolve(json.content[0].text);
          } else {
            reject(new Error('Unexpected API response format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse API response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
