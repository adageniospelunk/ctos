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
    console.log('  - MySQL/MariaDB configuration');
    console.log('  - Docker Compose with MySQL');
    console.log('  - Hello controller example');
    process.exit(1);
  }

  const projectName = args[0];
  const projectPath = path.join(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory '${projectName}' already exists.`);
    process.exit(1);
  }

  console.log(`Creating Symfony API project: ${projectName}`);
  console.log('');

  try {
    // Step 1: Create Symfony project
    console.log('📦 Creating Symfony API skeleton...');
    execSync(`composer create-project symfony/skeleton ${projectName}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Step 2: Install necessary packages
    console.log('');
    console.log('📦 Installing API Platform and Maker...');
    execSync('composer require api symfony/maker-bundle doctrine/orm symfony/orm-pack', {
      stdio: 'inherit',
      cwd: projectPath
    });

    // Step 3: Create .env.local with MySQL configuration
    console.log('');
    console.log('⚙️  Configuring MySQL database...');
    const envLocal = `# Database configuration
DATABASE_URL="mysql://root:root@127.0.0.1:3306/${projectName}?serverVersion=8.0&charset=utf8mb4"
`;
    fs.writeFileSync(path.join(projectPath, '.env.local'), envLocal);

    // Step 4: Create docker-compose.yml
    console.log('🐳 Creating Docker Compose configuration...');
    const dockerCompose = `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ${projectName}_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ${projectName}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
`;
    fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), dockerCompose);

    // Step 5: Create Hello Controller
    console.log('📝 Creating Hello controller...');
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

    // Step 6: Create README
    console.log('📄 Creating README...');
    const readme = `# ${projectName}

Symfony API project created with ctosooa.

## Installation

1. Start MySQL with Docker:
\`\`\`bash
docker-compose up -d
\`\`\`

2. Install dependencies:
\`\`\`bash
composer install
\`\`\`

3. Create database:
\`\`\`bash
php bin/console doctrine:database:create
\`\`\`

4. Run migrations (if any):
\`\`\`bash
php bin/console doctrine:migrations:migrate
\`\`\`

## Running the Server

\`\`\`bash
symfony server:start
# or
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

- **Host:** localhost
- **Port:** 3306
- **Database:** ${projectName}
- **User:** root
- **Password:** root

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
\`\`\`

## Stopping MySQL

\`\`\`bash
docker-compose down
\`\`\`
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

    // Success message
    console.log('');
    console.log('✅ Symfony API project created successfully!');
    console.log('');
    console.log('📂 Project location:', projectPath);
    console.log('');
    console.log('🚀 Next steps:');
    console.log(`   cd ${projectName}`);
    console.log('   docker-compose up -d');
    console.log('   php bin/console doctrine:database:create');
    console.log('   symfony server:start');
    console.log('');
    console.log('🌐 Test the API:');
    console.log('   curl http://localhost:8000/api/hello');
    console.log('   curl http://localhost:8000/api/hello/World');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error creating Symfony project:', error.message);
    process.exit(1);
  }
};
