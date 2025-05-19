const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8080;
const TARGET_HOST = 'cn.eagle.cool';

const server = http.createServer((req, res) => {
  // 允许所有来源的CORS请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 仅转发POST请求
  if (req.method === 'POST') {
    const bodyChunks = [];
    
    req.on('data', chunk => {
      bodyChunks.push(chunk);
    });
    
    req.on('end', () => {
      const body = Buffer.concat(bodyChunks).toString();
      const path = req.url;
      
      const options = {
        host: TARGET_HOST,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      
      // 发送请求到目标服务器
      const proxyReq = https.request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        proxyRes.on('data', chunk => {
          res.write(chunk);
        });
        
        proxyRes.on('end', () => {
          res.end();
        });
      });
      
      proxyReq.on('error', e => {
        console.error(`代理请求出错: ${e.message}`);
        res.writeHead(500);
        res.end(`代理请求出错: ${e.message}`);
      });
      
      // 写入请求体并发送
      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    res.writeHead(405);
    res.end('只支持POST请求');
  }
});

server.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
  console.log(`请将API请求发送到 http://localhost:${PORT}/get-license-devices 或 http://localhost:${PORT}/unregister`);
}); 