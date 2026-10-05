const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const esbuild = require('esbuild-wasm');

async function build() {
  const source = fs.readFileSync(path.join(__dirname, 'index-readable.html'), 'utf8');
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
  const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
  if (!scriptMatch || !styleMatch) throw new Error('Expected inline script and style');
  new Function(scriptMatch[1]);

  const script = await esbuild.transform(`(()=>{${scriptMatch[1]}})();`, {
    loader: 'js', minify: true, target: 'es2020', legalComments: 'none'
  });
  const style = await esbuild.transform(styleMatch[1], {
    loader: 'css', minify: true, target: 'es2020', legalComments: 'none'
  });

  // Collapse HTML whitespace before inserting code, preserving spaces in JS strings.
  let html = source
    .replace(scriptMatch[0], '<script>__INLINE_JS__</script>')
    .replace(styleMatch[0], '<style>__INLINE_CSS__</style>')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/> +/g, '>')
    .replace(/ +</g, '<')
    .trim();
  html = html
    .replace('__INLINE_JS__', () => script.code.trim())
    .replace('__INLINE_CSS__', () => style.code.trim());
  new Function(script.code);
  fs.writeFileSync(path.join(__dirname, 'index.html'), html);
  const bytes = Buffer.byteLength(html);
  const gzip = zlib.gzipSync(html).length;
  console.log(`index.html: ${bytes} bytes; gzip: ${gzip} bytes`);
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
