// Vika API 配置
const vikaToken = "uskKKRXMLNDUFTVH5ScFXTR";
const datasheetId = "dstnVlC9G6DreYx18s";
const viewId = "viwEnVpmXKStR";
const fieldKey = "name";  // 添加fieldKey配置

// 确保DOM元素初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const machineCodeInput = document.getElementById('machineCode');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const activationCodeElement = document.getElementById('activationCode');
    const logElement = document.getElementById('log');
    
    // 验证码相关DOM元素
    const captchaContainer = document.getElementById('captchaContainer');
    const captchaInput = document.getElementById('captchaInput');
    const captchaMessage = document.getElementById('captchaMessage');
    const captchaVerifyBtn = document.getElementById('captchaVerifyBtn');
    const captchaCancelBtn = document.getElementById('captchaCancelBtn');
    
    // 验证码验证状态
    let captchaVerified = false;
    let pendingMachineCode = '';
    
    // 添加日志函数
    function addLog(message, isError = false, isSuccess = false) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        if (isError) {
            logEntry.classList.add('error');
        } else if (isSuccess) {
            logEntry.classList.add('success');
        }
        
        logElement.appendChild(logEntry);
        logElement.scrollTop = logElement.scrollHeight;
        console.log(message); // 同时在控制台输出日志
    }
    
    // 初始化 Vika SDK
    let vika, datasheet;
    
    // 延迟初始化API，确保SDK加载完成
    let apiInitAttempts = 0;
    const maxApiInitAttempts = 10; // 增加最大尝试次数
    const apiInitInterval = 1000; // 1秒间隔
    
    function initializeAPI() {
        apiInitAttempts++;
        
        // 记录尝试信息
        console.log(`尝试初始化API (${apiInitAttempts}/${maxApiInitAttempts})...`);
        console.log("使用vikaToken:", vikaToken.substring(0, 4) + "***");
        
        // 检查SDK是否已加载
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
            
            // 使用getVika函数获取实例
            vika = getVika({
                token: vikaToken,
                fieldKey: fieldKey
            });
            
            if (!vika) {
                throw new Error("获取Vika实例失败");
            }
            
            // 获取数据表
            datasheet = vika.datasheet(datasheetId);
            if (!datasheet) {
                throw new Error("datasheet实例创建失败");
            }
            
            console.log("Vika API 初始化成功");
            addLog("API连接成功", false, true);
            
            // 测试API连接
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
            
            // 如果SDK尚未加载完成，继续尝试
            if (error.message.includes("尚未加载完成") && apiInitAttempts < maxApiInitAttempts) {
                addLog(`等待SDK加载...(${apiInitAttempts}/${maxApiInitAttempts})`);
                setTimeout(initializeAPI, apiInitInterval);
            } 
            // 如果是实例创建失败且尚未达到最大尝试次数，也重试
            else if (apiInitAttempts < maxApiInitAttempts && 
                (error.message.includes("未定义") || error.message.includes("创建失败"))) {
                setTimeout(initializeAPI, apiInitInterval);
            }
        }
    }
    
    // 启动初始化过程，等待DOM和SDK加载
    setTimeout(initializeAPI, 2000);
    
    // 纯JavaScript实现的SHA-256（作为Web Crypto API的备选方案）
    function sha256Pure(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j; // 循环计数器
        var result = '';
        
        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;
        
        //* 初始hash值: 取自自然数中前8个素数的平方根的小数部分的前32位
        var hash = sha256.h = sha256.h || [];
        // 常量: 取自自然数中前64个素数的立方根的小数部分的前32位
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
        
        ascii += '\x80'; // 添加位填充
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00'; // 补0直到长度满足特定条件
        
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return; // 仅支持ASCII
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength);
        
        // 处理每个分块
        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16); // 当前块的扩展
            var oldHash = hash;
            hash = hash.slice(0, 8);
            
            for (i = 0; i < 64; i++) {
                var i2 = i + j;
                // 扩展块
                var w15 = w[i - 15], w2 = w[i - 2];
                
                // 计算新的w[i]
                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                    + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
                    + k[i]
                    // 根据是否是前16个字扩展w[i]
                    + (w[i] = (i < 16) ? w[i] : (
                            w[i - 16]
                            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
                            + w[i - 7]
                            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
                        ) | 0
                    );
                // 计算新的hash值
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj
                
                hash = [(temp1 + temp2) | 0].concat(hash); // 添加到开头
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

    // 定义SHA-256哈希函数（尝试使用Web Crypto API，如果不可用则使用回退方案）
    async function sha256(message) {
        try {
            // 尝试使用Web Crypto API
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            // 如果Web Crypto API不可用或失败，使用纯JavaScript实现
            addLog("使用纯JavaScript SHA-256实现（浏览器不支持Web Crypto API）");
            return sha256Pure(message);
        }
    }

    // 生成激活码函数
    async function generateActivationCode(machineCode) {
        // 与C#版本使用相同的盐值
        const salt = "EagleActivation2023!";
        const input = machineCode + salt;
        
        // 计算SHA-256哈希
        const hash = await sha256(input);
        
        // 取前32个字符（16字节）并格式化
        const formattedCode = hash.substring(0, 32).toUpperCase();
        
        // 分成8段，每段4个字符
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

    // 验证机器码格式
    function validateMachineCode(code) {
        const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return regex.test(code);
    }

    // 监听机器码输入变化
    machineCodeInput.addEventListener('input', function(e) {
        // 验证并启用/禁用生成按钮
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
        
        // 直接显示验证码弹窗
        pendingMachineCode = machineCode;
        showCaptchaDialog();
    });

    clearBtn.addEventListener('click', function() {
        machineCodeInput.value = '';
        activationCodeElement.textContent = '';
        generateBtn.disabled = true;
        copyBtn.disabled = true;
        captchaVerified = false; // 重置验证状态
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
                    // 添加视觉反馈
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
            // 回退方案
            const textarea = document.createElement('textarea');
            textarea.value = activationCode;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                addLog('激活码已复制到剪贴板', false, true);
                // 添加视觉反馈
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

    // 快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter 生成激活码
        if (e.ctrlKey && e.key === 'Enter' && !generateBtn.disabled) {
            generateBtn.click();
        }
        
        // Ctrl+C 复制激活码（当激活码区域被聚焦时）
        if (e.ctrlKey && e.key === 'c' && document.activeElement === activationCodeElement && !copyBtn.disabled) {
            copyBtn.click();
        }
    });

    // 验证码相关功能
    // 显示验证码弹窗
    function showCaptchaDialog() {
        captchaContainer.classList.remove('hidden');
        captchaInput.value = '';
        captchaMessage.textContent = '';
        captchaInput.focus();
        addLog('请完成验证码验证');
    }
    
    // 隐藏验证码弹窗
    function hideCaptchaDialog() {
        captchaContainer.classList.add('hidden');
        captchaInput.value = '';
    }
    
    // 验证通过后生成激活码
    async function generateActivationCodeForVerified(machineCode) {
        try {
            addLog('正在生成激活码...');
            
            // 添加生成动画效果
            activationCodeElement.textContent = "生成中...";
            
            // 延迟一下以显示生成过程
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
    
    // 添加噪音请求函数
    async function makeNoiseRequests() {
        const noiseUrls = [
            'https://api.vika.cn/fusion/v1/datasheets',
            'https://api.vika.cn/fusion/v1/spaces',
            'https://api.vika.cn/fusion/v1/spaces/spcNTHEfKrVeH/nodes',
            `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?viewId=${viewId}&pageSize=1&pageNum=${Math.floor(Math.random() * 10)}`,
            `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?viewId=${viewId}&filterByFormula=OR({Status}="INIT",{Status}="PROCESSED")`,
            `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/fields`,
            `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/views`
        ];

        // 随机延迟函数
        const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

        // 发送噪音请求，使用不同的查询参数
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
                        'Authorization': `Bearer ${vikaToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                // 忽略错误
            }
        });
    }

    // 在验证码验证前添加噪音
    async function verifyCaptcha(captchaCode) {
        if (!captchaCode) {
            captchaMessage.textContent = '请输入验证码';
            return false;
        }
        
        try {
            addLog('正在验证验证码...');
            
            // 添加噪音请求
            makeNoiseRequests();
            
            let verificationSuccessful = false;
            
            // 检查是否可以使用正常SDK方式
            if (window.vikaSDKLoaded && datasheet) {
                try {
                    // 使用SDK验证，使用英文字段名
                    const response = await datasheet.records.query({
                        viewId: viewId,
                        filterByFormula: `AND({Code} = "${captchaCode}", {Status} = "INIT")`
                    });
                    
                    console.log("SDK查询响应:", response);
                    
                    if (response.success && response.data.records.length > 0) {
                        const recordId = response.data.records[0].recordId;
                        
                        // 验证成功并找到记录，直接使用备用API更新状态
                        // 这样可以避免SDK更新时的token问题
                        addLog("验证码有效，使用备用API更新状态...");
                        try {
                            // 使用API频率限制处理
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
                    // SDK验证失败，尝试备用方式
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
                // SDK未加载或无法使用，直接使用备用API
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
                
                // 如果有待处理的机器码，继续生成激活码
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
    
    // 添加API请求延迟函数，处理频率限制
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 带重试机制的记录更新函数
    async function updateRecordWithRateLimit(recordId, retryCount = 3, initialDelayMs = 1000) {
        let currentDelay = initialDelayMs;
        let attempts = 0;
        
        while (attempts < retryCount) {
            try {
                attempts++;
                
                // 构建请求URL和数据
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
                
                addLog(`尝试更新验证码状态和使用时间 (尝试 ${attempts}/${retryCount})...`);
                
                // 发送请求
                const updateResponse = await fetch(apiUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${vikaToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatePayload)
                });
                
                // 如果遇到频率限制错误
                if (updateResponse.status === 429) {
                    const responseBody = await updateResponse.json();
                    addLog(`API频率限制，等待${currentDelay}ms后重试...`, true);
                    console.log("频率限制响应:", responseBody);
                    
                    // 等待一段时间后重试
                    await delay(currentDelay);
                    // 指数退避策略，增加等待时间
                    currentDelay *= 2;
                    continue;
                }
                
                // 处理其他错误
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`更新状态失败: ${updateResponse.status} - ${errorText}`);
                }
                
                // 解析响应
                const updateData = await updateResponse.json();
                
                if (updateData.success) {
                    addLog("验证码状态已更新为已使用", false, true);
                    return true;
                } else {
                    throw new Error(`更新验证码状态失败: ${updateData.message}`);
                }
            } catch (error) {
                // 最后一次尝试失败时抛出错误
                if (attempts >= retryCount) {
                    throw error;
                }
                
                // 否则等待后重试
                addLog(`更新失败，${currentDelay}ms后重试: ${error.message}`, true);
                await delay(currentDelay);
                currentDelay *= 2; // 指数退避
            }
        }
    }
    
    // 带频率限制处理的验证码查询函数
    async function fallbackQueryCaptchaWithRateLimit(captchaCode, retryCount = 3, initialDelayMs = 1000) {
        let currentDelay = initialDelayMs;
        let attempts = 0;
        
        while (attempts < retryCount) {
            try {
                attempts++;
                addLog(`尝试验证验证码 (尝试 ${attempts}/${retryCount})...`);
                
                const apiUrl = `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records`;
                
                // 构建查询参数
                const queryParams = new URLSearchParams();
                if (viewId) {
                    queryParams.append('viewId', viewId);
                }
                queryParams.append('filterByFormula', `AND({Code}="${captchaCode}",{Status}="INIT")`);
                
                // 执行查询
                const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${vikaToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                // 处理频率限制
                if (response.status === 429) {
                    const responseBody = await response.json();
                    addLog(`API频率限制，等待${currentDelay}ms后重试...`, true);
                    console.log("频率限制响应:", responseBody);
                    
                    await delay(currentDelay);
                    currentDelay *= 2;
                    continue;
                }
                
                // 处理其他错误
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
                }
                
                // 解析响应
                const data = await response.json();
                
                if (data.success && data.data.records && data.data.records.length > 0) {
                    const recordId = data.data.records[0].recordId;
                    addLog(`找到有效验证码，记录ID: ${recordId}`);
                    
                    // 等待一段时间再更新状态，避免触发频率限制
                    await delay(500);
                    
                    // 更新验证码状态
                    return await updateRecordWithRateLimit(recordId);
                } else {
                    addLog("没有找到匹配的未使用验证码", true);
                    return false;
                }
            } catch (error) {
                // 最后一次尝试失败时抛出错误
                if (attempts >= retryCount) {
                    throw error;
                }
                
                // 否则等待后重试
                addLog(`查询失败，${currentDelay}ms后重试: ${error.message}`, true);
                await delay(currentDelay);
                currentDelay *= 2; // 指数退避
            }
        }
        
        return false;
    }
    
    // 验证按钮点击事件
    captchaVerifyBtn.addEventListener('click', async function() {
        const captchaCode = captchaInput.value.trim();
        await verifyCaptcha(captchaCode);
    });
    
    // 取消按钮点击事件
    captchaCancelBtn.addEventListener('click', function() {
        hideCaptchaDialog();
        pendingMachineCode = '';
        addLog('已取消验证码验证');
    });
    
    // 验证码输入框回车键事件
    captchaInput.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            const captchaCode = captchaInput.value.trim();
            await verifyCaptcha(captchaCode);
        }
    });
    
    // 初始化
    addLog('注册机已准备就绪，等待输入机器码...');
    machineCodeInput.focus();
}); 