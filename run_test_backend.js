const fs = require('fs');

async function testBackend() {
  const r = await fetch("http://localhost:3000/api/archive/metadata/ashtangahrdayameng00vagb");
  const m = await r.json();
  console.log("Book:", m.metadata.identifier);
  console.log("Files:", m.files.map(f=>f.format));
  
  const imgRes = await fetch("http://localhost:3000/api/archive/page-image?identifier=ashtangahrdayameng00vagb&page=1");
  console.log("Image response status:", imgRes.status);
}
testBackend();
