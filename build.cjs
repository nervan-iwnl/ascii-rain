// Build tooling is local; the delivered page has no library dependencies.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const esbuild=require('esbuild-wasm');
async function build(){
 let html=fs.readFileSync(path.join(__dirname,'src/index.html'),'utf8');
 const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 new Function(js);
 const script=await esbuild.transform('(()=>{'+js+'})();',{loader:'js',minify:true,target:'es2020',legalComments:'none'});
 const style=await esbuild.transform(css,{loader:'css',minify:true,target:'es2020',legalComments:'none'});
 html=html.replace(/<script>[\s\S]*?<\/script>/,'<script>'+script.code.trim()+'</script>').replace(/<style>[\s\S]*?<\/style>/,'<style>'+style.code.trim()+'</style>').replace(/>\s+</g,'><').trim();
 fs.writeFileSync(path.join(__dirname,'index.html'),html);
 const bytes=Buffer.byteLength(html),gzip=zlib.gzipSync(html).length;
 console.log(JSON.stringify({bytes,gzip,savedBytes:14060-bytes,percentSaved:Math.round((14060-bytes)/14060*100)}));
}
build().catch(e=>{console.error(e);process.exitCode=1});

