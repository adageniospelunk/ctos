const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function(args) {
  const targetDir = args[0] || process.cwd();

  console.log(`Analyzing directory: ${targetDir}`);
  console.log('');

  // Check if directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory '${targetDir}' does not exist.`);
    process.exit(1);
  }

  // Get claude command path from config
  const claudePath = getClaudePath();

  // Check if claude is available
  try {
    execSync(`${claudePath} --version`, { stdio: 'ignore' });
  } catch (error) {
    console.error(`Error: Claude CLI not found at: ${claudePath}`);
    console.error('');
    console.error('Please install Claude CLI or configure the path in config.json');
    console.error('To configure, create a config.json file:');
    console.error(JSON.stringify({ claudePath: '/path/to/claude' }, null, 2));
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

  // Build prompt
  let prompt = 'Analyze this codebase:\n\n';

  files.forEach(file => {
    const relativePath = path.relative(targetDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    prompt += `\n--- ${relativePath} ---\n${content}\n`;
  });

  prompt += '\n\nProvide a comprehensive analysis including:\n';
  prompt += '1. Project structure and organization\n';
  prompt += '2. Technologies and frameworks used\n';
  prompt += '3. Code quality observations\n';
  prompt += '4. Potential improvements\n';
  prompt += '5. Security considerations\n';

  // Write prompt to temp file
  const tmpFile = path.join(require('os').tmpdir(), `ctosooa-prompt-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt);

  // Execute Claude CLI with -p flag reading from file
  console.log('Sending to Claude for analysis...');
  console.log('');

  try {
    const result = execSync(`${claudePath} -p "$(cat ${tmpFile})"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: targetDir,
      shell: '/bin/bash'
    });

    // Clean up temp file
    fs.unlinkSync(tmpFile);

    console.log('=== Analysis Result ===');
    console.log('');
    console.log(result);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    console.error('Error executing Claude:', error.message);
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
};

function getClaudePath() {
  // Try to load from config.json
  const configPath = path.join(__dirname, '..', 'config.json');

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.claudePath) {
        return config.claudePath;
      }
    } catch (error) {
      // Invalid config, use default
    }
  }

  // Default to 'claude' in PATH
  return 'claude';
}

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

