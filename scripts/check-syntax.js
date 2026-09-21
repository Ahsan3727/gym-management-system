#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dirsToCheck = ['backend', 'api'];
let checkedCount = 0;
let errorCount = 0;

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      checkedCount++;
      try {
        execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
      } catch (err) {
        console.error(`Syntax check failed for: ${fullPath}`);
        console.error(err.stderr ? err.stderr.toString() : err.message);
        errorCount++;
      }
    }
  }
}

for (const dir of dirsToCheck) {
  walkDir(path.resolve(__dirname, '..', dir));
}

if (errorCount > 0) {
  console.error(`\nFound ${errorCount} syntax error(s) across ${checkedCount} files.`);
  process.exit(1);
} else {
  console.log(`\x1b[32m✔ Syntax check passed on all ${checkedCount} backend & api files.\x1b[0m`);
  process.exit(0);
}
