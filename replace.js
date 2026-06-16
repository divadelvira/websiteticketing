const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      let c = fs.readFileSync(dirPath, 'utf8');
      if (c.includes('indigo')) {
        fs.writeFileSync(dirPath, c.replace(/indigo/g, 'orange'));
        console.log('updated', dirPath);
      }
    }
  });
}
walk('./src');
