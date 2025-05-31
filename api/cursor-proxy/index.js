// 用于在Vercel上代理Cursor API请求的serverless函数
// 使用index.js文件确保路由能被正确识别

const http = require('http');
const url = require('url');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 调试信息 - 记录请求方法和URL
  console.log(`请求方法: ${req.method}`);
  console.log(`请求URL: ${req.url}`);
  
  // 记录查询参数
  console.log('查询参数:', req.query);

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
    // 从请求中获取参数 - 支持多种方式获取参数
    let deviceCode, deviceCodeMd5;
    
    // 方法1: 直接从req.query获取
    if (req.query && req.query.device_code && req.query.device_code_md5) {
      deviceCode = req.query.device_code;
      deviceCodeMd5 = req.query.device_code_md5;
    } 
    // 方法2: 从URL手动解析
    else if (req.url) {
      const parsedReqUrl = url.parse(req.url, true);
      if (parsedReqUrl.query) {
        deviceCode = parsedReqUrl.query.device_code;
        deviceCodeMd5 = parsedReqUrl.query.device_code_md5;
      }
    }

    console.log(`解析后参数: device_code=${deviceCode}, device_code_md5=${deviceCodeMd5}`);

    if (!deviceCode || !deviceCodeMd5) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        received: { query: req.query, url: req.url }
      });
    }

    // 构建原始API URL
    const apiUrl = `http://82.157.20.83:9091/api/cursorLoginZs/getCredentials?device_code=${encodeURIComponent(deviceCode)}&device_code_md5=${encodeURIComponent(deviceCodeMd5)}`;
    console.log(`请求API: ${apiUrl}`);
    
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

    console.log('请求选项:', options);

    // 创建代理请求
    return new Promise((resolve, reject) => {
      const proxyReq = http.request(options, proxyRes => {
        console.log(`API响应状态码: ${proxyRes.statusCode}`);
        console.log('API响应头:', proxyRes.headers);
        
        let data = '';

        // 收集响应数据
        proxyRes.on('data', chunk => {
          data += chunk;
        });

        // 响应结束，返回数据给客户端
        proxyRes.on('end', () => {
          console.log(`API响应数据: ${data.substring(0, 200)}...`);
          
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
            console.error('解析JSON失败:', e);
            // 如果不是有效的JSON，直接返回数据
            res.send(data);
          }
          
          resolve();
        });
      });

      // 处理请求错误
      proxyReq.on('error', error => {
        console.error('代理请求出错:', error);
        res.status(500).json({ 
          error: '代理请求失败', 
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        resolve();
      });

      // 结束请求
      proxyReq.end();
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return res.status(500).json({ 
      error: '服务器内部错误', 
      message: error.message,
      stack: error.stack
    });
  }
}; 