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

  console.log('Preparing analysis...');
  console.log('');

  // Build prompt with just the directory path
  let prompt = `Analyze the codebase located at: ${targetDir}\n\n`;
  prompt += 'Please explore the directory and analyze all relevant files.\n\n';

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


