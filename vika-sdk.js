window.vikaSDKLoaded = false;
window.vikaSDKError = null;
window.vikaInstance = null;
window.currentVikaToken = null;

function _dt(t1, t2, t3) {
    try {
        return atob(t1 + t2 + t3).trim();
    } catch (e) {
        console.error('Token解码失败', e);
        return '';
    }
}

function secureTokenCreator() {
    try {
        const originalParts = ["dXNrS0tSWE1M", "TkRVRlRWSDVT", "Y0ZYVFIg"];
        return _dt(originalParts[0], originalParts[1], originalParts[2]);
    } catch (e) {
        console.error("Token生成失败:", e);
        return "";
    }
}

// 直接设置token
window.currentVikaToken = secureTokenCreator();
console.log("初始化token值:", window.currentVikaToken.substring(0, 4) + "***");

(function createVikaPolyfill() {
    console.log("创建内联vika对象...");
    
    window.vika = {
        create: function(options) {
            console.log("创建vika实例，配置:", options);
            
            // 优先使用传入的token，否则使用全局token
            const activeToken = (options && options.token) ? options.token : window.currentVikaToken;
            
            // 始终更新全局token
            window.currentVikaToken = activeToken;
            console.log("使用token:", activeToken.substring(0, 4) + "***");
            
            return {
                datasheet: function(datasheetId) {
                    console.log("创建datasheet实例，ID:", datasheetId);
                    
                    return {
                        records: {
                            query: async function(params) {
                                console.log("查询记录，参数:", params);
                                
                                try {
                                    // 使用实例的token
                                    const token = window.currentVikaToken;
                                    console.log("查询使用token:", token.substring(0, 4) + "***");
                                    
                                    const queryParams = new URLSearchParams();
                                    
                                    if (params.viewId) {
                                        queryParams.append('viewId', params.viewId);
                                    }
                                    
                                    if (params.pageSize) {
                                        queryParams.append('pageSize', params.pageSize);
                                    }
                                    
                                    if (params.filterByFormula) {
                                        queryParams.append('filterByFormula', params.filterByFormula);
                                    }
                                    
                                    const url = `https://api.vika.cn/fusion/v1/datasheets/${datasheetId}/records?${queryParams.toString()}`;
                                    console.log("API请求URL:", url);
                                    
                                    if (!token) {
                                        throw new Error("认证失败");
                                    }
                                    
                                    const response = await fetch(url, {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    
                                    console.log("API响应状态:", response.status, response.statusText);
                                    
                                    if (!response.ok) {
                                        throw new Error(`请求失败: ${response.status}`);
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
                                    // 使用实例的token
                                    const token = window.currentVikaToken;
                                    console.log("更新使用token:", token.substring(0, 4) + "***");
                                    
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
        version: "1.1.0"
    };
    
    window.vikaSDKLoaded = true;
    console.log("内联vika对象创建成功");
})();

function embedVikaSDK() {
    if (typeof window.vika === 'undefined') {
        console.log("内联实现不可用，尝试加载外部SDK...");
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@vikadata/vika@1.1.0/dist/vika.umd.min.js";
        script.crossOrigin = "anonymous";
        script.async = false;
        
        script.onload = function() {
            console.log("Vika SDK 加载成功");
            window.vikaSDKLoaded = true;
            
            try {
                if (typeof window.vika !== 'undefined') {
                    if (!window.currentVikaToken) {
                        window.currentVikaToken = secureTokenCreator();
                    }
                    
                    window.vikaInstance = window.vika.create({
                        token: window.currentVikaToken,
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
        
        script.onerror = function(error) {
            console.error("Vika SDK 加载失败:", error);
            window.vikaSDKError = "SDK加载失败，请检查网络连接";
            
            loadLocalSDK();
        };
        
        document.head.appendChild(script);
    }
}

function loadLocalSDK() {
    console.log("尝试加载本地SDK文件...");
    if (typeof window.vika !== 'undefined') {
        console.log("内联vika对象已可用，无需加载本地SDK");
        return;
    }
    
    const localScript = document.createElement('script');
    localScript.src = "vika.umd.min.js";
    localScript.async = false;
    
    localScript.onload = function() {
        window.vikaSDKLoaded = true;
        console.log("本地SDK加载成功");
        
        try {
            if (typeof window.vika !== 'undefined') {
                if (!window.currentVikaToken) {
                    window.currentVikaToken = secureTokenCreator();
                }
                
                window.vikaInstance = window.vika.create({
                    token: window.currentVikaToken,
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

window.addEventListener('DOMContentLoaded', function() {
    console.log("开始加载Vika SDK...");
    embedVikaSDK();
});

function getVika(options = {}) {
    console.log("获取Vika实例");
    
    if (window.vikaInstance) {
        console.log("返回现有实例");
        return window.vikaInstance;
    }
    
    if (window.vikaSDKLoaded && typeof window.vika !== 'undefined') {
        try {
            if (!window.currentVikaToken) {
                window.currentVikaToken = secureTokenCreator();
                console.log("重新生成token:", window.currentVikaToken.substring(0, 4) + "***");
            } else {
                console.log("使用现有token:", window.currentVikaToken.substring(0, 4) + "***");
            }
            
            // 使用传入的token或全局token
            const activeToken = options.token || window.currentVikaToken;
            
            console.log("创建实例使用token:", activeToken.substring(0, 4) + "***");
            window.vikaInstance = window.vika.create({
                token: activeToken,
                fieldKey: options.fieldKey || "name"
            });
            return window.vikaInstance;
        } catch (error) {
            console.error("实例创建失败:", error);
            throw new Error("实例创建失败");
        }
    }
    
    if (window.vikaSDKError) {
        throw new Error(window.vikaSDKError);
    } else {
        throw new Error("SDK未就绪");
    }
} 