// 记录SDK加载状态
window.vikaSDKLoaded = false;
window.vikaSDKError = null;
window.vikaInstance = null;
window.currentVikaToken = null; // 存储当前使用的token

// 直接内联实现vika对象和API
(function createVikaPolyfill() {
    console.log("创建内联vika对象...");
    
    // 简单实现vika对象和API
    window.vika = {
        create: function(options) {
            console.log("创建vika实例，配置:", options);
            
            // 保存token到全局变量
            if (options && options.token) {
                window.currentVikaToken = options.token;
            }
            
            return {
                datasheet: function(datasheetId) {
                    console.log("创建datasheet实例，ID:", datasheetId);
                    
                    return {
                        records: {
                            query: async function(params) {
                                console.log("查询记录，参数:", params);
                                
                                try {
                                    // 获取最新的token，如果有更新
                                    const token = window.currentVikaToken || options.token;
                                    
                                    // 构建查询参数
                                    const queryParams = new URLSearchParams();
                                    
                                    // 添加视图ID
                                    if (params.viewId) {
                                        queryParams.append('viewId', params.viewId);
                                    }
                                    
                                    // 添加页大小
                                    if (params.pageSize) {
                                        queryParams.append('pageSize', params.pageSize);
                                    }
                                    
                                    // 添加筛选公式，注意编码格式
                                    if (params.filterByFormula) {
                                        // 确保公式中的特殊字符得到正确编码
                                        queryParams.append('filterByFormula', params.filterByFormula);
                                    }
                                    
                                    // 构建完整URL
                                    const url = `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?${queryParams.toString()}`;
                                    console.log("API请求URL:", url);
                                    
                                    // 确保token有效
                                    if (!token) {
                                        throw new Error("缺少API认证Token");
                                    }
                                    
                                    // 认证头部日志记录
                                    console.log("使用token:", token.substring(0, 4) + "***");
                                    
                                    // 发送请求
                                    const response = await fetch(url, {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    
                                    console.log("API响应状态:", response.status, response.statusText);
                                    
                                    if (!response.ok) {
                                        const errorText = await response.text();
                                        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
                                    }
                                    
                                    const data = await response.json();
                                    console.log("API响应数据:", data);
                                    return data;
                                } catch (error) {
                                    console.error("API调用失败:", error);
                                    return {
                                        success: false,
                                        message: error.message
                                    };
                                }
                            },
                            update: async function(records) {
                                console.log("更新记录，参数:", records);
                                
                                try {
                                    // 直接使用fetch API调用vika接口
                                    const response = await fetch(`https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records`, {
                                        method: 'PATCH',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ records: records })
                                    });
                                    
                                    if (!response.ok) {
                                        throw new Error(`API请求失败: ${response.status}`);
                                    }
                                    
                                    const data = await response.json();
                                    return data;
                                } catch (error) {
                                    console.error("API调用失败:", error);
                                    return {
                                        success: false,
                                        message: error.message
                                    };
                                }
                            }
                        }
                    };
                }
            };
        },
        version: "1.1.0-polyfill"
    };
    
    window.vikaSDKLoaded = true;
    console.log("内联vika对象创建成功");
})();

// 直接嵌入vika SDK内容的方式（仍然保留，但不再是主要方式）
function embedVikaSDK() {
    // 只在内联实现失败时尝试加载外部SDK
    if (typeof window.vika === 'undefined') {
        console.log("内联实现不可用，尝试加载外部SDK...");
        // 创建script元素
        const script = document.createElement('script');
        // 设置script的src为绝对路径
        script.src = "https://cdn.jsdelivr.net/npm/@vikadata/vika@1.1.0/dist/vika.umd.min.js";
        // 使用绝对路径确保加载
        script.crossOrigin = "anonymous"; // 添加跨域支持
        script.async = false; // 同步加载
        
        // 加载成功回调
        script.onload = function() {
            console.log("Vika SDK 加载成功");
            window.vikaSDKLoaded = true;
            
            // 尝试初始化vika
            try {
                if (typeof window.vika !== 'undefined') {
                    window.vikaInstance = window.vika.create({
                        token: "uskKKRXMLNDUFTVH5ScFXTR",
                        fieldKey: "name"
                    });
                    console.log("Vika实例创建成功");
                } else {
                    console.error("异常：window.vika对象不存在");
                    window.vikaSDKError = "window.vika对象不存在";
                }
            } catch (error) {
                console.error("Vika实例创建失败:", error);
                window.vikaSDKError = error.message;
            }
        };
        
        // 加载失败回调
        script.onerror = function(error) {
            console.error("Vika SDK 加载失败:", error);
            window.vikaSDKError = "SDK加载失败，请检查网络连接";
            
            // 尝试使用本地文件
            loadLocalSDK();
        };
        
        // 将script添加到document中
        document.head.appendChild(script);
    }
}

// 尝试加载本地SDK文件
function loadLocalSDK() {
    console.log("尝试加载本地SDK文件...");
    // 如果内联实现已可用，则不需要加载本地文件
    if (typeof window.vika !== 'undefined') {
        console.log("内联vika对象已可用，无需加载本地SDK");
        return;
    }
    
    const localScript = document.createElement('script');
    localScript.src = "vika.umd.min.js"; // 同目录下的本地文件
    localScript.async = false; // 同步加载
    
    localScript.onload = function() {
        window.vikaSDKLoaded = true;
        console.log("本地SDK加载成功");
        
        // 初始化vika
        try {
            if (typeof window.vika !== 'undefined') {
                window.vikaInstance = window.vika.create({
                    token: "uskKKRXMLNDUFTVH5ScFXTR",
                    fieldKey: "name"
                });
                console.log("Vika实例创建成功（本地SDK）");
            } else {
                console.error("异常：本地SDK中window.vika对象不存在");
                window.vikaSDKError = "本地SDK中window.vika对象不存在";
            }
        } catch (error) {
            console.error("Vika实例创建失败（本地SDK）:", error);
            window.vikaSDKError = error.message;
        }
    };
    
    localScript.onerror = function() {
        window.vikaSDKError = "所有SDK源都加载失败，包括本地文件";
        console.error("无法加载任何SDK源，请确保网络连接或提供本地SDK文件");
    };
    
    document.head.appendChild(localScript);
}

// 页面加载完成后立即开始加载SDK
window.addEventListener('DOMContentLoaded', function() {
    console.log("开始加载Vika SDK...");
    embedVikaSDK();
});

// 获取vika实例的函数
function getVika() {
    // 如果已有实例，直接返回
    if (window.vikaInstance) {
        return window.vikaInstance;
    }
    
    // 如果SDK已加载但没有实例，创建实例
    if (window.vikaSDKLoaded && typeof window.vika !== 'undefined') {
        try {
            window.vikaInstance = window.vika.create({
                token: "uskKKRXMLNDUFTVH5ScFXTR",
                fieldKey: "name"
            });
            return window.vikaInstance;
        } catch (error) {
            console.error("创建Vika实例失败:", error);
            throw error;
        }
    }
    
    // 如果SDK未加载或加载失败
    if (window.vikaSDKError) {
        throw new Error(window.vikaSDKError);
    } else {
        throw new Error("Vika SDK尚未加载完成，请稍后再试");
    }
} 