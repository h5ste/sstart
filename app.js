const datasheetId = "dstnVlC9G6DreYx18s";
const viewId = "viwEnVpmXKStR";
const fieldKey = "name";

document.addEventListener("DOMContentLoaded", function() {
  const machineCodeInput = document.getElementById("machineCode");
  const generateBtn = document.getElementById("generateBtn");
  const clearBtn = document.getElementById("clearBtn");
  const copyBtn = document.getElementById("copyBtn");
  const activationCodeElement = document.getElementById("activationCode");
  const logElement = document.getElementById("log");
  
  const captchaContainer = document.getElementById("captchaContainer");
  const captchaInput = document.getElementById("captchaInput");
  const captchaMessage = document.getElementById("captchaMessage");
  const captchaVerifyBtn = document.getElementById("captchaVerifyBtn");
  const captchaCancelBtn = document.getElementById("captchaCancelBtn");
  
  let captchaVerified = false;
  let pendingMachineCode = '';
  
  function addLog(message, isError = false, isSuccess = false) {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    if (isError) {
      logEntry.classList.add("error");
    } else if (isSuccess) {
      logEntry.classList.add("success");
    }
    
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
    console.log(message);
  }
  
  let vika, datasheet;
  
  let apiInitAttempts = 0;
  const maxApiInitAttempts = 10;
  const apiInitInterval = 1000;
  
  function initializeAPI() {
    apiInitAttempts++;
    
    console.log(`尝试初始化API (${apiInitAttempts}/${maxApiInitAttempts})...`);
    
    if (!window.vikaSDKLoaded) {
      if (window.vikaSDKError) {
        addLog(`SDK加载失败: ${window.vikaSDKError}`, true);
        console.error(`SDK加载详细错误:`, window.vikaSDKError);
      }
      
      if (apiInitAttempts < maxApiInitAttempts) {
        addLog(`等待SDK加载...(${apiInitAttempts}/${maxApiInitAttempts})`);
        setTimeout(initializeAPI, apiInitInterval);
        return;
      } else {
        addLog(`SDK加载超时，请刷新页面或使用本地SDK文件重试`, true);
        return;
      }
    }
    
    try {
      console.log("检测到SDK已加载，window.vika=", typeof window.vika);
      console.log("当前token状态:", window.currentVikaToken ? "已设置" : "未设置");
      
      // 如果window.vikaInstance已存在，直接使用
      if (window.vikaInstance) {
        console.log("使用现有的vika实例");
        vika = window.vikaInstance;
      } else {
        console.log("创建新vika实例");
        vika = window.vika.create({
          token: window.currentVikaToken,
          fieldKey: fieldKey
        });
        window.vikaInstance = vika;
      }
      
      if (!vika) {
        throw new Error("获取Vika实例失败");
      }
      
      console.log("创建datasheet实例");
      datasheet = vika.datasheet(datasheetId);
      if (!datasheet) {
        throw new Error("datasheet实例创建失败");
      }
      
      console.log("Vika API 初始化成功");
      addLog("API连接成功", false, true);
      
      console.log("发送测试查询请求");
      datasheet.records.query({
        pageSize: 1,
        viewId: viewId
      }).then(response => {
        console.log("API测试查询响应:", response);
        if (response.success) {
          addLog("数据表连接成功，记录总数: " + response.data.total, false, true);
        } else {
          addLog("数据表连接失败: " + response.message, true);
          console.error("API连接失败详情:", response);
        }
      }).catch(error => {
        addLog("数据查询失败: " + error.message, true);
        console.error("数据查询详细错误:", error);
      });
      
    } catch (error) {
      console.error("Vika SDK 初始化失败:", error);
      addLog("API连接失败: " + error.message, true);
      
      if (error.message.includes("尚未加载完成") && apiInitAttempts < maxApiInitAttempts) {
        addLog(`等待SDK加载...(${apiInitAttempts}/${maxApiInitAttempts})`);
        setTimeout(initializeAPI, apiInitInterval);
      } 
      else if (apiInitAttempts < maxApiInitAttempts && 
          (error.message.includes("未定义") || error.message.includes("创建失败"))) {
        setTimeout(initializeAPI, apiInitInterval);
      }
    }
  }
  
  setTimeout(initializeAPI, 1000);
  
  function sha256Pure(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
      }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      
      for (i = 0; i < 64; i++) {
        var i2 = i + j;
        var w15 = w[i - 15], w2 = w[i - 2];
        
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0
          );
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256(message) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      addLog("使用纯JavaScript SHA-256实现（浏览器不支持Web Crypto API）");
      return sha256Pure(message);
    }
  }

  async function generateActivationCode(machineCode) {
    const salt = "EagleActivation2023!";
    const input = machineCode + salt;
    
    const hash = await sha256(input);
    
    const formattedCode = hash.substring(0, 32).toUpperCase();
    
    return [
      formattedCode.substring(0, 4),
      formattedCode.substring(4, 8),
      formattedCode.substring(8, 12),
      formattedCode.substring(12, 16),
      formattedCode.substring(16, 20),
      formattedCode.substring(20, 24),
      formattedCode.substring(24, 28),
      formattedCode.substring(28, 32)
    ].join('-');
  }

  function validateMachineCode(code) {
    const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(code);
  }

  machineCodeInput.addEventListener('input', function(e) {
    const isValid = validateMachineCode(this.value);
    generateBtn.disabled = !isValid;
    
    if (isValid && !generateBtn.disabled) {
      addLog(`机器码格式有效: ${this.value}`);
    }
  });

  generateBtn.addEventListener('click', async function() {
    const machineCode = machineCodeInput.value.trim();
    
    if (!validateMachineCode(machineCode)) {
      addLog('机器码格式无效，请检查输入', true);
      return;
    }
    
    pendingMachineCode = machineCode;
    showCaptchaDialog();
  });

  clearBtn.addEventListener('click', function() {
    machineCodeInput.value = '';
    activationCodeElement.textContent = '';
    generateBtn.disabled = true;
    copyBtn.disabled = true;
    captchaVerified = false;
    addLog('已清空所有输入');
    machineCodeInput.focus();
  });

  copyBtn.addEventListener('click', function() {
    const activationCode = activationCodeElement.textContent;
    
    if (!activationCode || activationCode === "生成中...") {
      addLog('没有可复制的激活码', true);
      return;
    }
    
    try {
      navigator.clipboard.writeText(activationCode)
        .then(() => {
          addLog('激活码已复制到剪贴板', false, true);
          const originalText = this.textContent;
          this.textContent = '✓ 已复制';
          setTimeout(() => {
            this.textContent = originalText;
          }, 1500);
        })
        .catch(err => {
          throw err;
        });
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = activationCode;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        addLog('激活码已复制到剪贴板', false, true);
        const originalText = this.textContent;
        this.textContent = '✓ 已复制';
        setTimeout(() => {
          this.textContent = originalText;
        }, 1500);
      } catch (err) {
        addLog(`复制失败: ${err.message}`, true);
      }
      
      document.body.removeChild(textarea);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter' && !generateBtn.disabled) {
      generateBtn.click();
    }
    
    if (e.ctrlKey && e.key === 'c' && document.activeElement === activationCodeElement && !copyBtn.disabled) {
      copyBtn.click();
    }
  });

  function showCaptchaDialog() {
    captchaContainer.classList.remove('hidden');
    captchaInput.value = '';
    captchaMessage.textContent = '';
    captchaInput.focus();
    addLog('请完成验证码验证');
  }
  
  function hideCaptchaDialog() {
    captchaContainer.classList.add('hidden');
    captchaInput.value = '';
  }
  
  async function generateActivationCodeForVerified(machineCode) {
    try {
      addLog('正在生成激活码...');
      
      activationCodeElement.textContent = "生成中...";
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const activationCode = await generateActivationCode(machineCode);
      activationCodeElement.textContent = activationCode;
      copyBtn.disabled = false;
      addLog(`成功生成激活码: ${activationCode}`, false, true);
    } catch (error) {
      addLog(`生成激活码失败: ${error.message}`, true);
      activationCodeElement.textContent = "";
    }
  }
  
  async function makeNoiseRequests() {
    const token = window.currentVikaToken;
    console.log("噪音请求使用token:", token ? (token.substring(0, 4) + "***") : "未设置");
    
    const noiseUrls = [
      'https://api.vika.cn/fusion/v1/datasheets',
      'https://api.vika.cn/fusion/v1/spaces',
      'https://api.vika.cn/fusion/v1/spaces/spcNTHEfKrVeH/nodes',
      `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?viewId=${viewId}&pageSize=1&pageNum=${Math.floor(Math.random() * 10)}`,
      `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?viewId=${viewId}&filterByFormula=OR({Status}="INIT",{Status}="PROCESSED")`,
      `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/fields`,
      `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/views`
    ];

    const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

    noiseUrls.forEach(async (url) => {
      try {
        await randomDelay();
        const randomParams = new URLSearchParams({
          pageSize: Math.floor(Math.random() * 100) + 1,
          pageNum: Math.floor(Math.random() * 10) + 1,
          sort: Math.random() > 0.5 ? 'asc' : 'desc'
        });
        
        const finalUrl = url.includes('?') ? `${url}&${randomParams}` : `${url}?${randomParams}`;
        
        fetch(finalUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
      }
    });
  }

  async function verifyCaptcha(captchaCode) {
    if (!captchaCode) {
      captchaMessage.textContent = '请输入验证码';
      return false;
    }
    
    try {
      addLog('正在验证验证码...');
      
      makeNoiseRequests();
      
      let verificationSuccessful = false;
      
      if (window.vikaSDKLoaded && datasheet) {
        try {
          const response = await datasheet.records.query({
            viewId: viewId,
            filterByFormula: `AND({Code} = "${captchaCode}", {Status} = "INIT")`
          });
          
          console.log("SDK查询响应:", response);
          
          if (response.success && response.data.records.length > 0) {
            const recordId = response.data.records[0].recordId;
            
            addLog("验证码有效，更新状态...");
            try {
              await updateRecordWithRateLimit(recordId);
              verificationSuccessful = true;
              addLog('验证码状态更新成功', false, true);
            } catch (updateError) {
              addLog(`更新验证码状态失败: ${updateError.message}`, true);
              throw updateError;
            }
          } else {
            addLog("没有找到匹配的未使用验证码", true);
          }
        } catch (error) {
          addLog(`SDK验证失败，尝试备用API: ${error.message}`);
          try {
            verificationSuccessful = await fallbackQueryCaptchaWithRateLimit(captchaCode);
            if (verificationSuccessful) {
              addLog('使用备用API验证成功', false, true);
            }
          } catch (fallbackError) {
            addLog(`备用API也失败: ${fallbackError.message}`, true);
          }
        }
      } else {
        addLog('SDK未加载，使用备用API验证');
        try {
          verificationSuccessful = await fallbackQueryCaptchaWithRateLimit(captchaCode);
          if (verificationSuccessful) {
            addLog('使用备用API验证成功', false, true);
          }
        } catch (fallbackError) {
          addLog(`备用API验证失败: ${fallbackError.message}`, true);
        }
      }
      
      if (verificationSuccessful) {
        captchaVerified = true;
        hideCaptchaDialog();
        
        if (pendingMachineCode) {
          generateActivationCodeForVerified(pendingMachineCode);
          pendingMachineCode = '';
        }
        
        return true;
      } else {
        captchaMessage.textContent = '验证码无效或已被使用';
        addLog('验证码验证失败：无效或已使用', true);
        return false;
      }
    } catch (error) {
      captchaMessage.textContent = '验证失败，请稍后再试';
      addLog(`验证码验证出错: ${error.message}`, true);
      console.error('验证码验证详细错误:', error);
      return false;
    }
  }
  
  async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function updateRecordWithRateLimit(recordId, retryCount = 3, initialDelayMs = 1000) {
    let currentDelay = initialDelayMs;
    let attempts = 0;
    
    while (attempts < retryCount) {
      try {
        attempts++;
        
        const apiUrl = `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records`;
        const updatePayload = {
          records: [
            {
              recordId: recordId,
              fields: {
                "Status": "PROCESSED",
                "hours": new Date().toLocaleString('zh-CN', { 
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false 
                })
              }
            }
          ]
        };
        
        addLog(`尝试更新验证码状态 (${attempts}/${retryCount})...`);
        console.log("更新记录使用token:", window.currentVikaToken?.substring(0, 4) + "***");
        
        const updateResponse = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${window.currentVikaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
        
        if (updateResponse.status === 429) {
          const responseBody = await updateResponse.json();
          addLog(`API频率限制，等待${currentDelay}ms后重试...`, true);
          console.log("频率限制响应:", responseBody);
          
          await delay(currentDelay);
          currentDelay *= 2;
          continue;
        }
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`更新状态失败: ${updateResponse.status} - ${errorText}`);
        }
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
          addLog("验证码状态已更新为已使用", false, true);
          return true;
        } else {
          throw new Error(`更新验证码状态失败: ${updateData.message}`);
        }
      } catch (error) {
        if (attempts >= retryCount) {
          throw error;
        }
        
        addLog(`更新失败，${currentDelay}ms后重试: ${error.message}`, true);
        await delay(currentDelay);
        currentDelay *= 2;
      }
    }
  }
  
  async function fallbackQueryCaptchaWithRateLimit(captchaCode, retryCount = 3, initialDelayMs = 1000) {
    let currentDelay = initialDelayMs;
    let attempts = 0;
    
    while (attempts < retryCount) {
      try {
        attempts++;
        addLog(`尝试验证验证码 (${attempts}/${retryCount})...`);
        
        const apiUrl = `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records`;
        
        const queryParams = new URLSearchParams();
        if (viewId) {
          queryParams.append('viewId', viewId);
        }
        queryParams.append('filterByFormula', `AND({Code}="${captchaCode}",{Status}="INIT")`);
        
        console.log("备用验证使用token:", window.currentVikaToken?.substring(0, 4) + "***");
        
        const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${window.currentVikaToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 429) {
          const responseBody = await response.json();
          addLog(`API频率限制，等待${currentDelay}ms后重试...`, true);
          console.log("频率限制响应:", responseBody);
          
          await delay(currentDelay);
          currentDelay *= 2;
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data.records && data.data.records.length > 0) {
          const recordId = data.data.records[0].recordId;
          addLog(`找到有效验证码，记录ID: ${recordId}`);
          
          await delay(500);
          
          return await updateRecordWithRateLimit(recordId);
        } else {
          addLog("没有找到匹配的未使用验证码", true);
          return false;
        }
      } catch (error) {
        if (attempts >= retryCount) {
          throw error;
        }
        
        addLog(`查询失败，${currentDelay}ms后重试: ${error.message}`, true);
        await delay(currentDelay);
        currentDelay *= 2;
      }
    }
    
    return false;
  }
  
  captchaVerifyBtn.addEventListener('click', async function() {
    const captchaCode = captchaInput.value.trim();
    await verifyCaptcha(captchaCode);
  });
  
  captchaCancelBtn.addEventListener('click', function() {
    hideCaptchaDialog();
    pendingMachineCode = '';
    addLog('已取消验证码验证');
  });
  
  captchaInput.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
      const captchaCode = captchaInput.value.trim();
      await verifyCaptcha(captchaCode);
    }
  });
  
  addLog('注册机已准备就绪，等待输入机器码...');
  machineCodeInput.focus();
});
