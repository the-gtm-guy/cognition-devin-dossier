// Inlines CSS + JS into a single self-contained HTML file for preview/publishing.
// Usage: node build.js  → dist/index.html
const fs = require('fs'); const path = require('path');
const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="styles.css">/, () => `<style>\n${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => `<script>\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('dist/index.html', (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
