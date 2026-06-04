#!/usr/bin/env node

/**
 * Deploy script for VATRate.
 * Validates data before deployment.
 *
 * Usage: node deploy.mjs
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');

async function deploy() {
  console.log('🚀 VATRate Deploy\n');

  // Step 1: Validate data
  console.log('📋 Step 1/4: Validating VAT rates data...');
  try {
    execSync('node apps/data/scripts/validate.mjs', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌ Data validation failed. Aborting deploy.');
    process.exit(1);
  }

  // Step 2: Run tests
  console.log('\n🧪 Step 2/4: Running tests...');
  try {
    execSync('npm test', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌ Tests failed. Aborting deploy.');
    process.exit(1);
  }

  // Step 3: Build
  console.log('\n🔨 Step 3/4: Building...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌ Build failed. Aborting deploy.');
    process.exit(1);
  }

  // Step 4: Git tag
  console.log('\n🏷️  Step 4/4: Tagging release...');
  const version = JSON.parse(
    execSync('cat package.json', { cwd: ROOT, encoding: 'utf-8' }),
  ).version;
  const tag = `v${version}`;

  try {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`, { cwd: ROOT, stdio: 'inherit' });
    execSync(`git push origin ${tag}`, { cwd: ROOT, stdio: 'inherit' });
    console.log(`✅ Tagged and pushed: ${tag}`);
  } catch (e) {
    console.warn(`⚠️  Could not create git tag: ${e.message}`);
  }

  console.log('\n✅ Deploy complete!');
}

deploy().catch(console.error);
