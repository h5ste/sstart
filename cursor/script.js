document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const deviceCodeInput = document.getElementById('device_code');
    const deviceCodeMd5Input = document.getElementById('device_code_md5');
    const resetButton = document.getElementById('reset-btn');
    const resultDiv = document.getElementById('result');
    const statusMessage = document.getElementById('status-message');
    const emailDisplay = document.getElementById('email-display');

    // 为重置按钮添加点击事件
    resetButton.addEventListener('click', async () => {
        // 获取输入值
        const deviceCode = deviceCodeInput.value.trim();
        const deviceCodeMd5 = deviceCodeMd5Input.value.trim();

        // 验证输入
        if (!deviceCode || !deviceCodeMd5) {
            showResult('请填写设备码和设备码MD5', '', 'error');
            return;
        }

        // 禁用按钮，显示加载状态
        resetButton.disabled = true;
        resetButton.textContent = '正在请求...';

        try {
            // 构建API URL
            const apiUrl = `http://82.157.20.83:9091/api/cursorLoginZs/getCredentials?device_code=${encodeURIComponent(deviceCode)}&device_code_md5=${encodeURIComponent(deviceCodeMd5)}`;
            
            // 发送GET请求
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            // 检查响应中是否包含email
            if (data && data.data && data.data.email) {
                // 创建详细信息的HTML
                const detailsHtml = createDetailsHtml(data);
                showResult('重置成功！', detailsHtml, 'success');
            } else {
                showResult('重置失败', '未能获取到邮箱信息', 'error');
            }
        } catch (error) {
            showResult('请求出错', `错误信息: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            resetButton.disabled = false;
            resetButton.textContent = '重置额度';
        }
    });

    // 创建详细信息HTML的函数
    function createDetailsHtml(response) {
        if (!response || !response.data) {
            return '无数据';
        }
        
        const data = response.data;
        let html = '<div class="details">';
        
        // 添加主要信息
        html += `<div class="detail-item"><strong>邮箱:</strong> ${data.email || '无'}</div>`;
        html += `<div class="detail-item"><strong>密码:</strong> ${data.pwd || '无'}</div>`;
        html += `<div class="detail-item"><strong>Token:</strong> <span class="token-text">${data.token || '无'}</span></div>`;
        
        // 添加其他信息
        html += `<div class="detail-item"><strong>ID:</strong> ${data.id || '无'}</div>`;
        html += `<div class="detail-item"><strong>设备码:</strong> ${data.deviceCode || '无'}</div>`;
        html += `<div class="detail-item"><strong>激活码:</strong> ${data.activationCode || '无'}</div>`;
        html += `<div class="detail-item"><strong>创建时间:</strong> ${data.createTime || '无'}</div>`;
        html += `<div class="detail-item"><strong>上次Token时间:</strong> ${data.lastTokenTime || '无'}</div>`;
        html += `<div class="detail-item"><strong>使用时间:</strong> ${data.useTime || '无'}</div>`;
        html += `<div class="detail-item"><strong>更新时间:</strong> ${data.updateTime || '无'}</div>`;
        html += `<div class="detail-item"><strong>使用次数:</strong> ${data.useCount || '0'}</div>`;
        html += `<div class="detail-item"><strong>类型:</strong> ${data.type || '无'}</div>`;
        html += `<div class="detail-item"><strong>备注名:</strong> ${data.banName || '无'}</div>`;
        
        html += '</div>';
        return html;
    }

    // 显示结果的辅助函数
    function showResult(message, detailsHtml, type) {
        statusMessage.textContent = message;
        emailDisplay.innerHTML = detailsHtml;
        
        resultDiv.className = `result-visible ${type}`;
    }
}); 