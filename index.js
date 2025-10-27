#!/usr/bin/env node

// parse arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: ctosooa echo <something>');
  process.exit(1);
}

const command = args[0];

if (command === '--version' || command === '-v') {
  const pkg = require('./package.json');
  console.log(pkg.version);
} else if (command === 'echo') {
  const rest = args.slice(1);
  console.log(rest.join(' '));
} else {
  console.log(`Unknown command: ${command}`);
  process.exit(1);
}
