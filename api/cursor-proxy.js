// 用于在Vercel上代理Cursor API请求的serverless函数
// 此文件需要放在项目的/api目录下，以便在Vercel上自动部署为API路由

const http = require('http');
const url = require('url');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只处理GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支持GET请求' });
  }

  try {
    // 从请求中获取参数
    const deviceCode = req.query.device_code;
    const deviceCodeMd5 = req.query.device_code_md5;

    if (!deviceCode || !deviceCodeMd5) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 构建原始API URL
    const apiUrl = `http://82.157.20.83:9091/api/cursorLoginZs/getCredentials?device_code=${encodeURIComponent(deviceCode)}&device_code_md5=${encodeURIComponent(deviceCodeMd5)}`;
    
    // 解析URL
    const parsedUrl = url.parse(apiUrl);
    
    // 设置请求选项
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json'
      }
    };

    // 创建代理请求
    return new Promise((resolve, reject) => {
      const proxyReq = http.request(options, proxyRes => {
        let data = '';

        // 收集响应数据
        proxyRes.on('data', chunk => {
          data += chunk;
        });

        // 响应结束，返回数据给客户端
        proxyRes.on('end', () => {
          res.status(proxyRes.statusCode);
          
          // 设置原始响应的头部
          const headers = proxyRes.headers;
          Object.keys(headers).forEach(key => {
            res.setHeader(key, headers[key]);
          });

          try {
            // 尝试解析JSON响应
            const jsonData = JSON.parse(data);
            res.json(jsonData);
          } catch (e) {
            // 如果不是有效的JSON，直接返回数据
            res.send(data);
          }
          
          resolve();
        });
      });

      // 处理请求错误
      proxyReq.on('error', error => {
        console.error('代理请求出错:', error);
        res.status(500).json({ error: '代理请求失败', message: error.message });
        resolve();
      });

      // 结束请求
      proxyReq.end();
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return res.status(500).json({ error: '服务器内部错误', message: error.message });
  }
}; 