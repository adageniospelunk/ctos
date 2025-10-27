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

  // Open a new terminal and execute Claude visibly
  console.log('Opening new terminal for analysis...');
  console.log('');

  try {
    // Create a script file to execute in the terminal
    const scriptFile = path.join(require('os').tmpdir(), `ctosooa-script-${Date.now()}.sh`);
    const homeDir = require('os').homedir();
    const script = `#!/bin/bash
# Load shell profile to get PATH and nvm
[ -f "${homeDir}/.bashrc" ] && source "${homeDir}/.bashrc"
[ -f "${homeDir}/.profile" ] && source "${homeDir}/.profile"
[ -f "${homeDir}/.bash_profile" ] && source "${homeDir}/.bash_profile"

# Load nvm explicitly if available
export NVM_DIR="${homeDir}/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

cd '${targetDir}'
echo "=== CTO Sooatek Code Analysis ==="
echo "Analyzing: ${targetDir}"
echo ""
echo "Please wait, Claude is analyzing..."
echo "(This may take a few minutes)"
echo ""

# Use -p mode (no progress visible but reliable)
${claudePath} -p "$(cat '${tmpFile}')"

echo ""
echo ""
echo "=== Analysis Complete ==="
echo "Press Enter to close..."
read

# Clean up
rm -f '${tmpFile}' '${scriptFile}'
`;
    fs.writeFileSync(scriptFile, script);
    fs.chmodSync(scriptFile, 0o755);

    // Execute with gnome-terminal and wait for it
    execSync(`gnome-terminal --wait -- bash -c "bash '${scriptFile}'"`, {
      stdio: 'inherit'
    });

    console.log('✅ Analysis window closed.');
    console.log('');

  } catch (error) {
    // Clean up temp files on error
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    console.error('Error opening terminal:', error.message);
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


