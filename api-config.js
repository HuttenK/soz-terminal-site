// GitHub Pages hosts the interface; Cloudflare stores private results.
window.terminalFetch=(path,options)=>fetch(new URL(path,
 location.hostname==='huttenk.github.io'?'https://divine-grass-9cfc.thomaszalkind.workers.dev':location.origin
),options);
