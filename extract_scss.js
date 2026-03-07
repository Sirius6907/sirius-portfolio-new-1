const fs = require('fs');

function extractStyle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/;
  const match = styleRegex.exec(content);
  return match ? match[1] : '';
}

const workStyle = extractStyle('../src/components/SWork.astro');
const aworkStyle = extractStyle('../src/components/AWork.astro');
const myWayStyle = extractStyle('../src/components/SMyWay.astro');
const separatorStyle = extractStyle('../src/components/ASeparator.astro');

const combinedScss = `
@import './_import.scss';

/* SWork */
${workStyle}

/* AWork */
${aworkStyle}

/* SMyWay */
${myWayStyle}

/* ASeparator */
${separatorStyle}
`;

fs.writeFileSync('src/styles/gsap-sections.scss', combinedScss);
console.log('SCSS extraction complete.');
