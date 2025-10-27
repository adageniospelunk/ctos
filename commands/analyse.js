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

  // Open a new terminal and execute Claude interactively
  console.log('Opening new terminal for analysis...');
  console.log('');

  try {
    // Detect terminal emulator and open with Claude command
    const command = `cd "${targetDir}" && ${claudePath} -p "$(cat ${tmpFile})" && echo "" && echo "Press Enter to close..." && read`;

    // Try different terminal emulators
    let terminalCmd;
    if (fs.existsSync('/usr/bin/gnome-terminal')) {
      terminalCmd = `gnome-terminal -- bash -c '${command}'`;
    } else if (fs.existsSync('/usr/bin/konsole')) {
      terminalCmd = `konsole -e bash -c '${command}'`;
    } else if (fs.existsSync('/usr/bin/xterm')) {
      terminalCmd = `xterm -e bash -c '${command}'`;
    } else if (fs.existsSync('/usr/bin/x-terminal-emulator')) {
      terminalCmd = `x-terminal-emulator -e bash -c '${command}'`;
    } else {
      console.error('Error: No suitable terminal emulator found.');
      console.error('Please install gnome-terminal, konsole, or xterm.');
      process.exit(1);
    }

    execSync(terminalCmd, {
      stdio: 'ignore',
      detached: true
    });

    console.log('✅ Analysis started in new terminal window.');
    console.log('');

    // Clean up temp file after a delay (terminal needs time to read it)
    setTimeout(() => {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }, 2000);

  } catch (error) {
    // Clean up temp file on error
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


