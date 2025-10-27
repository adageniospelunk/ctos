const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = function(args) {
  if (args.length === 0) {
    console.log('Usage: ctosooa symfony <project-name>');
    console.log('');
    console.log('Creates a complete Symfony API project with:');
    console.log('  - Symfony API skeleton');
    console.log('  - Maker bundle');
    console.log('  - MySQL database (pre-configured)');
    console.log('  - Hello controller example');
    console.log('  - Ready to use with: symfony server:start');
    process.exit(1);
  }

  const projectName = args[0];
  const projectPath = path.join(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory '${projectName}' already exists.`);
    process.exit(1);
  }

  console.log(`🚀 Creating Symfony API project: ${projectName}`);
  console.log('This may take a few minutes...');
  console.log('');

  try {
    // Step 1: Create Symfony project
    console.log('📦 [1/7] Creating Symfony API skeleton...');
    execSync(`composer create-project symfony/skeleton ${projectName}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Step 2: Install necessary packages
    console.log('');
    console.log('📦 [2/7] Installing API Platform and Maker...');
    execSync('composer require api symfony/maker-bundle doctrine/orm symfony/orm-pack --no-interaction', {
      stdio: 'inherit',
      cwd: projectPath
    });

    // Step 3: Configure MySQL database
    console.log('');
    console.log('⚙️  [3/7] Configuring MySQL database...');
    const dbName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const envLocal = `# Database configuration (MySQL)
DATABASE_URL="mysql://root:root@127.0.0.1:3306/${dbName}?serverVersion=8.0&charset=utf8mb4"
`;
    fs.writeFileSync(path.join(projectPath, '.env.local'), envLocal);

    // Step 4: Create database
    console.log('');
    console.log('🗄️  [4/7] Creating database...');
    try {
      execSync('php bin/console doctrine:database:create --if-not-exists', {
        stdio: 'inherit',
        cwd: projectPath
      });
    } catch (error) {
      console.log('');
      console.log('⚠️  Warning: Could not create database automatically.');
      console.log('   Make sure MySQL is running and accessible with:');
      console.log('   - Host: 127.0.0.1:3306');
      console.log('   - User: root');
      console.log('   - Password: root');
      console.log('');
      console.log('   You can create it manually later with:');
      console.log(`   php bin/console doctrine:database:create`);
      console.log('');
    }

    // Step 5: Create Hello Controller
    console.log('');
    console.log('📝 [5/7] Creating Hello controller...');
    const controllerDir = path.join(projectPath, 'src', 'Controller');
    if (!fs.existsSync(controllerDir)) {
      fs.mkdirSync(controllerDir, { recursive: true });
    }

    const helloController = `<?php

namespace App\\Controller;

use Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\Routing\\Annotation\\Route;

class HelloController extends AbstractController
{
    #[Route('/api/hello', name: 'api_hello', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Hello from Symfony API!',
            'project' => '${projectName}',
            'timestamp' => date('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/api/hello/{name}', name: 'api_hello_name', methods: ['GET'])]
    public function hello(string $name): JsonResponse
    {
        return $this->json([
            'message' => "Hello, {$name}!",
            'project' => '${projectName}',
        ]);
    }
}
`;
    fs.writeFileSync(path.join(controllerDir, 'HelloController.php'), helloController);

    // Step 6: Clear cache
    console.log('');
    console.log('🧹 [6/7] Clearing cache...');
    execSync('php bin/console cache:clear', {
      stdio: 'inherit',
      cwd: projectPath
    });

    // Step 7: Create README
    console.log('');
    console.log('📄 [7/7] Creating README...');
    const readme = `# ${projectName}

Symfony API project created with ctosooa.

✅ **Everything is already configured! Just start the server.**

## Running the Server

\`\`\`bash
cd ${projectName}
symfony server:start
\`\`\`

Or with PHP built-in server:
\`\`\`bash
php -S localhost:8000 -t public
\`\`\`

## API Endpoints

### Hello Endpoint
- **GET** \`/api/hello\` - Returns a hello message
- **GET** \`/api/hello/{name}\` - Returns a personalized hello message

Example:
\`\`\`bash
curl http://localhost:8000/api/hello
curl http://localhost:8000/api/hello/World
\`\`\`

## Database

- **Type:** MySQL
- **Host:** 127.0.0.1:3306
- **Database:** ${dbName}
- **User:** root
- **Password:** root

**Note:** Make sure MySQL is running before starting the server.

## Development

### Create a new controller:
\`\`\`bash
php bin/console make:controller
\`\`\`

### Create a new entity:
\`\`\`bash
php bin/console make:entity
\`\`\`

### Generate migration:
\`\`\`bash
php bin/console make:migration
php bin/console doctrine:migrations:migrate
\`\`\`

## What's Included

- ✅ Symfony 7.x (latest)
- ✅ API Platform
- ✅ Maker Bundle
- ✅ Doctrine ORM
- ✅ MySQL Database (pre-configured)
- ✅ HelloController with 2 API endpoints
- ✅ Ready to use!
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

    // Success message
    console.log('');
    console.log('========================================');
    console.log('✅ Symfony API project created successfully!');
    console.log('========================================');
    console.log('');
    console.log('📂 Project location:', projectPath);
    console.log('');
    console.log('🚀 Start now:');
    console.log('');
    console.log(`   cd ${projectName}`);
    console.log('   symfony server:start');
    console.log('');
    console.log('🌐 Then test the API:');
    console.log('');
    console.log('   curl http://localhost:8000/api/hello');
    console.log('   curl http://localhost:8000/api/hello/World');
    console.log('');
    console.log('========================================');

  } catch (error) {
    console.error('');
    console.error('❌ Error during project creation:', error.message);
    console.error('');
    console.error('The project may be partially created. Check the directory and complete setup manually.');
    process.exit(1);
  }
};
