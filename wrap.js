const fs = require('fs');

function findHtml(d, f=[]) {
  fs.readdirSync(d).forEach(x => {
    const p = d + '/' + x;
    fs.statSync(p).isDirectory() ? findHtml(p, f) : p.endsWith('.html') && f.push(p);
  });
  return f;
}

findHtml('.').forEach(file => {
  let txt = fs.readFileSync(file, 'utf8');
  if(!txt.includes('id="page-content"')) {
    txt = txt.replace(/<body([^>]*)>/i, '<body$1>\n<div id="page-content">').replace(/<\/body>/i, '</div>\n</body>');
    fs.writeFileSync(file, txt, 'utf8');
    console.log('Updated ' + file);
  }
});
