import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!file.startsWith(root+sep)){res.writeHead(400);res.end();return;}
 if(!extname(file))file+='.html';
 try {const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(body);}
 catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(root+'/404.html'));}
});
server.listen(4317,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4317'));
