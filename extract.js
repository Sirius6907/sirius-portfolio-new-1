const fs = require('fs');

const workAstro = fs.readFileSync('../src/components/SWork.astro', 'utf8');
const myWayAstro = fs.readFileSync('../src/components/SMyWay.astro', 'utf8');
const aworkAstro = fs.readFileSync('../src/components/AWork.astro', 'utf8');
const separatorAstro = fs.readFileSync('../src/components/ASeparator.astro', 'utf8');

function extractBlocks(astroCode) {
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;
  const htmlRegex = /---.*?---\s*([\s\S]*?)(?:<style|<\/style>|<script>|$)/s;

  let script = scriptRegex.exec(astroCode)?.[1] || '';
  let html = htmlRegex.exec(astroCode)?.[1] || '';
  return { script, html };
}

const workBlocks = extractBlocks(workAstro);
fs.writeFileSync('work-html.txt', workBlocks.html);
fs.writeFileSync('work-js.js', workBlocks.script);

const myWayBlocks = extractBlocks(myWayAstro);
fs.writeFileSync('myway-html.txt', myWayBlocks.html);
fs.writeFileSync('myway-js.js', myWayBlocks.script);

// AWork and ASeparator components
const aworkBlocks = extractBlocks(aworkAstro);
fs.writeFileSync('awork-html.txt', aworkBlocks.html);
const separatorBlocks = extractBlocks(separatorAstro);
fs.writeFileSync('separator-html.txt', separatorBlocks.html);

console.log('Extraction complete.');
