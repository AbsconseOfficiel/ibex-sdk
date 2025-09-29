// inject-license.js
const fs = require('fs');
const path = require('path');

const header = `// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

`;

const extensions = ['.js', '.ts', '.tsx'];
const rootDir = './src'; // Change this to your source folder

function injectHeader(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.startsWith('// Copyright')) {
    fs.writeFileSync(filePath, header + content);
    console.log(`✅ Injected license into: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (extensions.includes(path.extname(fullPath))) {
      injectHeader(fullPath);
    }
  });
}

walk(rootDir);
