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
  const allFiles = scanDirectory(targetDir);

  if (allFiles.length === 0) {
    console.log('No files found to analyze.');
    return;
  }

  // Limit to most important files (max 50 files to avoid command line length issues)
  const MAX_FILES = 50;
  let files = allFiles;

  if (allFiles.length > MAX_FILES) {
    console.log(`Found ${allFiles.length} files. Analyzing the ${MAX_FILES} most important files...`);
    // Prioritize: package.json, main files, controllers, models, etc.
    files = prioritizeFiles(allFiles).slice(0, MAX_FILES);
  } else {
    console.log(`Found ${files.length} files to analyze.`);
  }

  console.log('');

  // Build prompt
  let prompt = 'Analyze this codebase:\n\n';

  files.forEach(file => {
    const relativePath = path.relative(targetDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    prompt += `\n--- ${relativePath} ---\n${content}\n`;
  });

  // Load format template
  const formatPath = path.join(__dirname, 'analyse', 'format.txt');
  let formatInstructions = '';

  if (fs.existsSync(formatPath)) {
    formatInstructions = fs.readFileSync(formatPath, 'utf-8');
    prompt += '\n\n' + formatInstructions;
  } else {
    // Fallback if format file doesn't exist
    prompt += '\n\nProvide a comprehensive analysis including:\n';
    prompt += '1. Project structure and organization\n';
    prompt += '2. Technologies and frameworks used\n';
    prompt += '3. Code quality observations\n';
    prompt += '4. Potential improvements\n';
    prompt += '5. Security considerations\n';
  }

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

function prioritizeFiles(files) {
  // Priority scoring system
  const getPriority = (filePath) => {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);

    // High priority files
    if (fileName === 'package.json') return 1000;
    if (fileName === 'composer.json') return 1000;
    if (fileName === 'README.md') return 900;
    if (fileName === 'index.js' || fileName === 'index.ts') return 850;
    if (fileName === 'app.js' || fileName === 'app.ts') return 850;
    if (fileName === 'main.js' || fileName === 'main.ts') return 850;

    // High priority directories
    if (dirName.includes('/src/Controller')) return 800;
    if (dirName.includes('/src/Service')) return 750;
    if (dirName.includes('/src/Model')) return 750;
    if (dirName.includes('/src/Entity')) return 750;
    if (dirName.includes('/config')) return 700;
    if (dirName.includes('/routes')) return 700;

    // Medium priority
    if (dirName.includes('/src')) return 500;
    if (fileName.endsWith('Controller.php')) return 600;
    if (fileName.endsWith('Service.php')) return 550;
    if (fileName.endsWith('Model.js')) return 550;

    // Lower priority for tests and vendor
    if (dirName.includes('/tests')) return 100;
    if (dirName.includes('/vendor')) return 50;

    return 400; // Default priority
  };

  // Sort by priority (highest first)
  return files.sort((a, b) => getPriority(b) - getPriority(a));
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

