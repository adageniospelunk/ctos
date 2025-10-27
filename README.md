# ctosooa

CTO Sooatek tool - A command-line utility package.

## Installation

Install globally using npm:

```bash
npm install -g ctosooa
```

## Usage

### Built-in Commands

#### Echo Command

The `echo` command prints the provided message to the console.

```bash
ctosooa echo <message>
```

**Examples:**

```bash
# Simple message
ctosooa echo "Hello World"

# Multiple words
ctosooa echo This is a test message

# With quotes
ctosooa echo "Welcome to ctosooa CLI"
```

**Output:**
```
Hello World
This is a test message
Welcome to ctosooa CLI
```

#### Version Command

```bash
ctosooa --version
ctosooa -v
```

### Custom Commands

The CLI automatically routes commands to files in the `commands/` folder.

#### Example: Hello Command

```bash
ctosooa hello 1
```

**Output:**
```
Hello 1! Welcome to ctosooa.
You passed the number: 1
Double of 1 is: 2
```

```bash
ctosooa hello World
```

**Output:**
```
Hello World! Welcome to ctosooa.
```

#### Analyse Command

Analyze a directory using Claude AI to get insights about the codebase.

```bash
ctosooa analyse [directory]
```

**Setup:**

First, set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Get your API key from: https://console.anthropic.com/

**Examples:**

```bash
# Analyze current directory
ctosooa analyse

# Analyze specific directory
ctosooa analyse /path/to/project
```

**What it does:**
- Scans all code files in the directory (`.js`, `.ts`, `.json`, `.md`, etc.)
- Skips `node_modules`, `.git`, and hidden files
- Sends the code to Claude for analysis
- Provides insights on:
  - Project structure and organization
  - Technologies and frameworks used
  - Code quality observations
  - Potential improvements
  - Security considerations

#### Creating Your Own Commands

1. Create a new `.js` file in the `commands/` folder
2. Export a function that takes an `args` array as parameter
3. The command name will match the filename

**Example: `commands/greet.js`**

```javascript
module.exports = function(args) {
  const name = args[0] || 'Guest';
  console.log(`Greetings, ${name}!`);
};
```

**Usage:**
```bash
ctosooa greet Alice
# Output: Greetings, Alice!
```

## Uninstallation

To remove the package:

```bash
npm uninstall -g ctosooa
```
