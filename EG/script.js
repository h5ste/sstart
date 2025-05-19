// 全局变量
// const API_BASE_URL = 'https://cn.eagle.cool';
const API_BASE_URL = 'https://shentianen.xyz'; // 使用本地代理服务器
const LICENSE_CODE = 'EG-C32B-C021-C9DF-ECAD';
const EMAIL = 'zhaojun649273552@qq.com'; // 用于注销设备的邮箱

// 检测是否为iOS设备
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// DOM 元素
let loadingContainer, devicesList, deviceCount, countSpan, noDevices,
    refreshBtn, removeAllBtn, confirmModal, confirmBtn, cancelBtn,
    closeModal, confirmMessage, toast, toastMessage, toastIcon;

// 初始化DOM引用
function initDomReferences() {
    loadingContainer = document.getElementById('loadingContainer');
    devicesList = document.getElementById('devicesList');
    deviceCount = document.getElementById('deviceCount');
    countSpan = document.getElementById('count');
    noDevices = document.getElementById('noDevices');
    refreshBtn = document.getElementById('refreshBtn');
    removeAllBtn = document.getElementById('removeAllBtn');
    confirmModal = document.getElementById('confirmModal');
    confirmBtn = document.getElementById('confirmBtn');
    cancelBtn = document.getElementById('cancelBtn');
    closeModal = document.querySelector('.close-modal');
    confirmMessage = document.getElementById('confirmMessage');
    toast = document.getElementById('toast');
    toastMessage = document.getElementById('toastMessage');
    toastIcon = document.getElementById('toastIcon');
}

// 页面加载完成后自动获取设备列表
document.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM引用
    initDomReferences();
    
    // iOS特定处理
    if (isIOS) {
        // 在iOS中修复100vh问题
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        window.addEventListener('resize', () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        });

        // 防止iOS缩放
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
    }
    
    fetchDevices();
    
    // 添加事件监听器
    refreshBtn.addEventListener('click', handleRefresh);
    removeAllBtn.addEventListener('click', () => showConfirmModal('确定要移除所有设备吗？', removeAllDevices));
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', closeConfirmModal);
    closeModal.addEventListener('click', closeConfirmModal);
    
    // 修复iOS点击事件延迟
    if (isIOS) {
        addTouchListeners();
    }
});

// 为iOS设备添加触摸事件监听
function addTouchListeners() {
    const buttons = document.querySelectorAll('.btn, .action-btn, .close-modal');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('active');
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('active');
        }, { passive: true });
    });
}

// 当前确认操作的回调函数
let currentConfirmCallback = null;

// 获取设备列表
async function fetchDevices() {
    showLoading(true);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN',
        };
        
        // 对于iOS，删除可能导致问题的头信息
        if (!isIOS) {
            Object.assign(headers, {
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"'
            });
        }
        
        console.log("正在发送请求到:", `${API_BASE_URL}/get-license-devices`);
        
        const response = await fetch(`${API_BASE_URL}/get-license-devices`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                licenseCode: LICENSE_CODE
            }),
            credentials: 'omit' // 避免发送cookie
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("收到的数据:", data);
        renderDevices(data);
        showToast('success', '设备信息获取成功');
    } catch (error) {
        console.error('获取设备列表失败:', error);
        showToast('error', `获取设备列表失败: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// 渲染设备列表
function renderDevices(data) {
    devicesList.innerHTML = '';
    
    const devices = data.devices || [];
    countSpan.textContent = devices.length;
    
    if (devices.length === 0) {
        noDevices.style.display = 'block';
        deviceCount.style.display = 'none';
        return;
    }
    
    noDevices.style.display = 'none';
    deviceCount.style.display = 'inline-block';
    
    devices.forEach((device, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row-animation';
        tr.style.animationDelay = `${index * 0.1}s`;
        
        // 安全处理日期转换，避免iOS上的问题
        let registrationDate = '';
        try {
            registrationDate = new Date(device.activeAt).toLocaleString('zh-CN');
        } catch (error) {
            console.error('日期转换错误:', error);
            registrationDate = '未知日期';
        }
        
        const deviceName = device.name || '未知设备';
        const machineID = device.machineID || '';
        const shortMachineID = machineID.substring(0, 8) + '...';
        
        tr.innerHTML = `
            <td>${deviceName}</td>
            <td>${registrationDate}</td>
            <td>${getPlatformName(device.platform)}</td>
            <td title="${machineID}">${shortMachineID}</td>
            <td>
                <button class="action-btn remove-btn" data-machine-id="${machineID}" role="button">
                    <i class="fas fa-trash-alt"></i> 移除
                </button>
            </td>
        `;
        
        devicesList.appendChild(tr);
    });
    
    // 为所有移除按钮添加事件监听器
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        const handleClick = () => {
            const machineID = btn.getAttribute('data-machine-id');
            const shortID = machineID.substring(0, 8) + '...';
            showConfirmModal(`确定要移除设备 ID: ${shortID} 吗？`, () => removeDevice(machineID));
        };
        
        btn.addEventListener('click', handleClick);
        
        // 为iOS设备添加触摸事件
        if (isIOS) {
            btn.addEventListener('touchstart', function() {
                this.classList.add('active');
            }, { passive: true });
            
            btn.addEventListener('touchend', function() {
                this.classList.remove('active');
                // 延迟执行点击处理，避免iOS上的点击延迟问题
                setTimeout(handleClick, 10);
            }, { passive: true });
        }
    });
}

// 获取平台名称的友好显示
function getPlatformName(platform) {
    const platformMap = {
        'Windows_NT': 'Windows',
        'Darwin': 'macOS',
        'Linux': 'Linux',
        'iOS': 'iOS',
        'iPhone OS': 'iOS',
        'iPad OS': 'iPadOS',
        'Android': 'Android'
    };
    
    return platformMap[platform] || platform || '未知平台';
}

// 移除单个设备
async function removeDevice(machineID) {
    showLoading(true);
    
    try {
        const headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN'
        };
        
        // 对于iOS，删除可能导致问题的头信息
        if (!isIOS) {
            Object.assign(headers, {
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"'
            });
        }
        
        console.log("正在发送移除设备请求:", machineID);
        
        const response = await fetch(`${API_BASE_URL}/unregister`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                email: EMAIL,
                licenseCode: LICENSE_CODE,
                machineID: machineID
            }),
            credentials: 'omit' // 避免发送cookie
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('设备移除结果:', result);
        
        // 重新获取设备列表
        fetchDevices();
        showToast('success', '设备已成功移除');
    } catch (error) {
        console.error('移除设备失败:', error);
        showToast('error', `移除设备失败: ${error.message}`);
        showLoading(false);
    }
}

// 移除所有设备
async function removeAllDevices() {
    showLoading(true);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN'
        };
        
        // 对于iOS，删除可能导致问题的头信息
        if (!isIOS) {
            Object.assign(headers, {
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site'
            });
        }
        
        const devicesResponse = await fetch(`${API_BASE_URL}/get-license-devices`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                licenseCode: LICENSE_CODE
            }),
            credentials: 'omit'
        });
        
        if (!devicesResponse.ok) {
            throw new Error(`HTTP错误: ${devicesResponse.status}`);
        }
        
        const data = await devicesResponse.json();
        const devices = data.devices || [];
        
        if (devices.length === 0) {
            showToast('info', '没有设备需要移除');
            showLoading(false);
            return;
        }
        
        console.log(`准备移除 ${devices.length} 个设备`);
        
        // 串行移除所有设备
        for (const device of devices) {
            const unregisterHeaders = {
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN'
            };
            
            if (!isIOS) {
                Object.assign(unregisterHeaders, {
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                });
            }
            
            await fetch(`${API_BASE_URL}/unregister`, {
                method: 'POST',
                headers: unregisterHeaders,
                body: JSON.stringify({
                    email: EMAIL,
                    licenseCode: LICENSE_CODE,
                    machineID: device.machineID
                }),
                credentials: 'omit'
            });
            
            // 每移除一个设备暂停一下，避免服务器压力过大
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 重新获取设备列表
        fetchDevices();
        showToast('success', `成功移除了 ${devices.length} 个设备`);
    } catch (error) {
        console.error('移除所有设备失败:', error);
        showToast('error', `移除所有设备失败: ${error.message}`);
        showLoading(false);
    }
}

// 刷新按钮点击处理
function handleRefresh() {
    const icon = refreshBtn.querySelector('i');
    icon.classList.add('rotate');
    
    // 动画结束后移除类名
    setTimeout(() => {
        icon.classList.remove('rotate');
    }, 1000);
    
    fetchDevices();
}

// 显示确认对话框
function showConfirmModal(message, callback) {
    confirmMessage.textContent = message;
    currentConfirmCallback = callback;
    confirmModal.style.display = 'flex';
    
    // iOS修复：避免滚动问题
    if (isIOS) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    // 添加淡入效果
    setTimeout(() => {
        confirmModal.style.opacity = '1';
    }, 10);
}

// 关闭确认对话框
function closeConfirmModal() {
    confirmModal.style.opacity = '0';
    
    // iOS修复：恢复滚动
    if (isIOS) {
        setTimeout(() => {
            document.body.style.position = '';
            document.body.style.width = '';
        }, 300);
    }
    
    setTimeout(() => {
        confirmModal.style.display = 'none';
        currentConfirmCallback = null;
    }, 300);
}

// 处理确认按钮点击
function handleConfirm() {
    if (currentConfirmCallback) {
        currentConfirmCallback();
        closeConfirmModal();
    }
}

// 显示/隐藏加载动画
function showLoading(show) {
    if (show) {
        loadingContainer.style.display = 'flex';
    } else {
        loadingContainer.style.display = 'none';
    }
}

// 显示通知提示
function showToast(type, message) {
    toastMessage.textContent = message;
    
    // 设置图标
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle success';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle error';
    } else if (type === 'info') {
        toastIcon.className = 'fas fa-info-circle';
    }
    
    // 显示通知
    toast.style.display = 'block';
    
    // 3秒后自动关闭
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
} 
