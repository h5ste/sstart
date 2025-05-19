// 全局变量
// const API_BASE_URL = 'https://cn.eagle.cool';
const API_BASE_URL = 'http://localhost:8080'; // 使用本地代理服务器
const LICENSE_CODE = 'EG-C32B-C021-C9DF-ECAD';
const EMAIL = 'zhaojun649273552@qq.com'; // 用于注销设备的邮箱

// DOM 元素
const loadingContainer = document.getElementById('loadingContainer');
const devicesList = document.getElementById('devicesList');
const deviceCount = document.getElementById('deviceCount');
const countSpan = document.getElementById('count');
const noDevices = document.getElementById('noDevices');
const refreshBtn = document.getElementById('refreshBtn');
const removeAllBtn = document.getElementById('removeAllBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeModal = document.querySelector('.close-modal');
const confirmMessage = document.getElementById('confirmMessage');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// 页面加载完成后自动获取设备列表
document.addEventListener('DOMContentLoaded', () => {
    fetchDevices();
    
    // 添加事件监听器
    refreshBtn.addEventListener('click', handleRefresh);
    removeAllBtn.addEventListener('click', () => showConfirmModal('确定要移除所有设备吗？', removeAllDevices));
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', closeConfirmModal);
    closeModal.addEventListener('click', closeConfirmModal);
});

// 当前确认操作的回调函数
let currentConfirmCallback = null;

// 获取设备列表
async function fetchDevices() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/get-license-devices`, {
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
                'Sec-Ch-Ua-Platform': '"Windows"'
            },
            body: JSON.stringify({
                licenseCode: LICENSE_CODE
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
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
        
        const registrationDate = new Date(device.activeAt).toLocaleString('zh-CN');
        
        tr.innerHTML = `
            <td>${device.name || '未知设备'}</td>
            <td>${registrationDate}</td>
            <td>${getPlatformName(device.platform)}</td>
            <td>${device.machineID}</td>
            <td>
                <button class="action-btn remove-btn" data-machine-id="${device.machineID}">
                    <i class="fas fa-trash-alt"></i> 移除
                </button>
            </td>
        `;
        
        devicesList.appendChild(tr);
    });
    
    // 为所有移除按钮添加事件监听器
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const machineID = btn.getAttribute('data-machine-id');
            showConfirmModal(`确定要移除设备 ID: ${machineID.substring(0, 8)}... 吗？`, () => removeDevice(machineID));
        });
    });
}

// 获取平台名称的友好显示
function getPlatformName(platform) {
    const platformMap = {
        'Windows_NT': 'Windows',
        'Darwin': 'macOS',
        'Linux': 'Linux'
    };
    
    return platformMap[platform] || platform;
}

// 移除单个设备
async function removeDevice(machineID) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/unregister`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"'
            },
            body: JSON.stringify({
                email: EMAIL,
                licenseCode: LICENSE_CODE,
                machineID: machineID
            })
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
        const devicesResponse = await fetch(`${API_BASE_URL}/get-license-devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site'
            },
            body: JSON.stringify({
                licenseCode: LICENSE_CODE
            })
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
        
        // 串行移除所有设备
        for (const device of devices) {
            await fetch(`${API_BASE_URL}/unregister`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eagle/3.0.0 Chrome/105.0.0.0 Safari/537.36 Electron/21.0.0',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'zh-CN',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                },
                body: JSON.stringify({
                    email: EMAIL,
                    licenseCode: LICENSE_CODE,
                    machineID: device.machineID
                })
            });
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
    
    // 添加淡入效果
    setTimeout(() => {
        confirmModal.style.opacity = '1';
    }, 10);
}

// 关闭确认对话框
function closeConfirmModal() {
    confirmModal.style.opacity = '0';
    
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