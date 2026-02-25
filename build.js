/**
 * build.js — Assemble HTML partials into index.html
 * Usage: node build.js
 * No dependencies required (Node.js built-in fs/path only)
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'src', 'html', 'index.template.html');
const OUTPUT = path.join(__dirname, 'index.html');
const PARTIALS_DIR = path.join(__dirname, 'src', 'html');

let template = fs.readFileSync(TEMPLATE, 'utf-8');

// Replace <!-- @include _filename.html --> with file contents
const includePattern = /^([ \t]*)<!--\s*@include\s+([\w\-]+\.html)\s*-->/gm;

const result = template.replace(includePattern, (match, indent, filename) => {
    const filePath = path.join(PARTIALS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] Partial not found: ${filename}`);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8').trimEnd();
    // Indent each line of the partial to match the include marker's indentation
    return content.split('\n').map(line => line ? indent + line : line).join('\n');
});

fs.writeFileSync(OUTPUT, result, 'utf-8');

const lines = result.split('\n').length;
console.log(`✓ index.html generated (${lines} lines)`);
