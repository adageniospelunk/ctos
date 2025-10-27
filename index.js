#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// parse arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: ctosooa <command> [args...]');
  console.log('Available commands:');
  console.log('  echo <message>   - Echo a message');
  console.log('  --version, -v    - Show version');

  // List available commands from commands folder
  const commandsDir = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
    if (files.length > 0) {
      files.forEach(file => {
        const cmdName = file.replace('.js', '');
        console.log(`  ${cmdName}           - Custom command`);
      });
    }
  }
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

if (command === '--version' || command === '-v') {
  const pkg = require('./package.json');
  console.log(pkg.version);
} else if (command === 'echo') {
  console.log(commandArgs.join(' '));
} else {
  // Try to load command from commands folder
  const commandPath = path.join(__dirname, 'commands', `${command}.js`);

  if (fs.existsSync(commandPath)) {
    try {
      const commandModule = require(commandPath);
      commandModule(commandArgs);
    } catch (error) {
      console.error(`Error executing command '${command}':`, error.message);
      process.exit(1);
    }
  } else {
    console.log(`Unknown command: ${command}`);
    console.log('Run "ctosooa" without arguments to see available commands.');
    process.exit(1);
  }
}
