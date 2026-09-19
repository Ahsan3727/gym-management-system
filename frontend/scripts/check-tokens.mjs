import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

let errors = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        scanDir(fullPath);
      }
    } else if (/\.(jsx?|tsx?|html)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');

  // Rule 1: No text-white on accent backgrounds (bg-ember, bg-iron, bg-chalk)
  const classMatches = content.match(/className=(?:{[^}]+}|"[^"]+"|'[^']+')/g) || [];
  for (const cls of classMatches) {
    if (cls.includes('text-white') && (cls.includes('bg-ember') || cls.includes('bg-iron') || cls.includes('bg-chalk'))) {
      errors.push(`[Rule 1] ${relPath}: Found 'text-white' combined with accent background in: ${cls}`);
    }
  }

  // Rule 2: meta[name="theme-color"] written anywhere except src/theme/applyTheme.js
  if (relPath !== 'theme/applyTheme.js') {
    if (/meta\[name=["']theme-color["']\]/i.test(content) && content.includes('.setAttribute(')) {
      errors.push(`[Rule 2] ${relPath}: Directly mutating meta[name="theme-color"]. Only src/theme/applyTheme.js may update theme-color.`);
    }
  }

  // Rule 3: ember-dark / ember used for errors/overdue
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/(?:error|overdue|danger|failed|urgent)/i.test(line) && /(?:text-ember-dark|bg-ember\/|border-ember\/)/.test(line)) {
      errors.push(`[Rule 3] ${relPath}:${idx + 1}: Found brand ember used for error/overdue state: ${line.trim()}`);
    }
  });
}

scanDir(srcDir);

if (errors.length > 0) {
  console.error(`Token check failed with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log('check:tokens passed! Zero token regressions found.');
  process.exit(0);
}
