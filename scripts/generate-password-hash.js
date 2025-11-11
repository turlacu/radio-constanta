#!/usr/bin/env node
/**
 * Generate bcrypt password hash for admin panel
 * Usage: node scripts/generate-password-hash.js <password>
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-password-hash.js <password>');
  console.error('Example: node scripts/generate-password-hash.js MySecurePassword123');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n=== Admin Password Hash Generated ===\n');
console.log('Add this to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('=====================================\n');
