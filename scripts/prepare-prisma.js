/**
 * WebHunt - Production & Development Prisma Manager
 * Ensures PostgreSQL datasource and deploys migrations on production deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
  const envUrl = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.PRISMA_DATABASE_URL;

  if (envUrl) {
    return envUrl.trim();
  }
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^(?:DATABASE_URL|POSTGRES_PRISMA_URL|POSTGRES_URL|PRISMA_DATABASE_URL)=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      process.env.DATABASE_URL = match[1].trim();
      return process.env.DATABASE_URL;
    }
  }
  return '';
}

function preparePrismaSchema() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    if (schemaContent.includes('provider = "sqlite"')) {
      schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    }
  }
}

async function deployMigrationsIfConfigured() {
  const databaseUrl = getDatabaseUrl();
  const isPlaceholderUrl = !databaseUrl || databaseUrl.includes('username:password@') || databaseUrl.includes('ep-your-project-id');

  if (databaseUrl && !isPlaceholderUrl) {
    console.log('[PrismaConfig] PostgreSQL datasource detected. Deploying pending Prisma migrations...');
    try {
      const prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
      execSync(`node "${prismaCliPath}" migrate deploy`, {
        stdio: 'inherit',
        env: process.env,
        cwd: path.join(__dirname, '..')
      });
      console.log('[PrismaConfig] ✅ Migrations deployed successfully.');

      // Automatically reconcile permanent administrator account
      try {
        console.log('[PrismaConfig] Provisioning / reconciling administrator account...');
        const jiti = require('jiti')(path.join(__dirname, '..'), { alias: { '@': path.join(__dirname, '..') } });
        const { bootstrapAdmin } = jiti('./scripts/bootstrap-admin.ts');
        await bootstrapAdmin();
      } catch (adminErr) {
        console.warn('[PrismaConfig] Administrator provisioning note:', adminErr.message);
      }
    } catch (err) {
      console.error('[PrismaConfig] ❌ Migration deployment warning:', err.message);
      if (process.env.VERCEL === '1') {
        console.warn('[PrismaConfig] Note: Ensure DATABASE_URL is properly configured in Vercel environment variables.');
      }
    }
  } else {
    console.log('[PrismaConfig] No production DATABASE_URL supplied during build step. Skipping migrate deploy.');
  }
}

if (require.main === module) {
  preparePrismaSchema();
  if (process.argv.includes('--deploy') || process.env.VERCEL === '1') {
    deployMigrationsIfConfigured().catch(console.error);
  }
}

module.exports = { preparePrismaSchema, deployMigrationsIfConfigured };
