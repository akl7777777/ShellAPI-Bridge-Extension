// 内容脚本 - 在网页中运行
// 可以访问和修改网页DOM

let tableButtons = []; // 存储添加的按钮元素

// 扫描表格并添加操作按钮
function scanTablesAndAddButtons(bridgeBaseUrl, bridgeName) {
    // 查找所有表格，包括 Semi Design 表格
    const tables = document.querySelectorAll('table, .semi-table');
    let tableCount = 0;
    let buttonCount = 0;

    tables.forEach((table, tableIndex) => {
        // 查找表头和数据行
        const headerRows = table.querySelectorAll('thead tr, .semi-table-thead tr');
        const dataRows = table.querySelectorAll('tbody tr, .semi-table-tbody tr');

        if (dataRows.length > 0) {
            tableCount++;

            // 为表头添加操作列（如果存在表头）
            headerRows.forEach(headerRow => {
                const headerCell = document.createElement('th');
                headerCell.textContent = 'API操作';
                headerCell.className = 'shellapi-header-cell';
                headerCell.setAttribute('role', 'columnheader');
                headerCell.style.cssText = `
                    background: #e8f5e8;
                    padding: 12px 8px;
                    border: 1px solid #ddd;
                    font-weight: bold;
                    text-align: center;
                    color: #2e7d32;
                    min-width: 120px;
                    font-size: 14px;
                `;
                headerRow.appendChild(headerCell);
            });

            // 为每个数据行添加操作按钮
            dataRows.forEach((row, rowIndex) => {
                // 获取所有单元格
                const cells = row.querySelectorAll('td, .semi-table-row-cell');
                if (cells.length === 0) return;

                // 提取名称（查找第二列，因为第一列通常是复选框）
                let keyValue = '';
                if (cells.length > 1 && cells[1]) {
                    // 获取单元格的文本内容，处理可能的嵌套元素
                    const textElement = cells[1].querySelector('[title]') || cells[1];
                    keyValue = textElement.textContent?.trim() || textElement.getAttribute('title')?.trim() || '';
                }

                // 如果没有找到第二列，尝试第一列
                if (!keyValue && cells[0]) {
                    keyValue = cells[0].textContent?.trim() || '';
                }

                if (!keyValue) {
                    console.log('未找到key值，跳过行:', rowIndex);
                    return;
                }

                console.log(`为行 ${rowIndex} 添加按钮，key值: ${keyValue}`);

                // 创建新的操作单元格
                const actionCell = document.createElement('td');
                actionCell.className = 'shellapi-action-cell semi-table-row-cell';
                actionCell.setAttribute('role', 'gridcell');
                actionCell.setAttribute('aria-colindex', cells.length + 1);
                actionCell.style.cssText = `
                    padding: 8px;
                    border: 1px solid #ddd;
                    text-align: center;
                    background: #fafafa;
                    min-width: 120px;
                    vertical-align: middle;
                `;

                const actionBtn = document.createElement('button');
                actionBtn.textContent = '🔗 获取模型';
                actionBtn.className = 'shellapi-action-btn';
                actionBtn.setAttribute('type', 'button');
                actionBtn.style.cssText = `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
                    white-space: nowrap;
                `;

                // 鼠标悬停效果
                actionBtn.addEventListener('mouseenter', () => {
                    actionBtn.style.background = '#45a049';
                    actionBtn.style.transform = 'translateY(-1px)';
                    actionBtn.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.4)';
                });

                actionBtn.addEventListener('mouseleave', () => {
                    actionBtn.style.background = '#4CAF50';
                    actionBtn.style.transform = 'translateY(0)';
                    actionBtn.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.3)';
                });

                // 点击事件
                actionBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleRowAction(keyValue, bridgeBaseUrl, bridgeName, actionBtn);
                });

                actionCell.appendChild(actionBtn);
                row.appendChild(actionCell);

                // 记录添加的按钮和单元格
                tableButtons.push({
                    button: actionBtn,
                    cell: actionCell,
                    keyValue: keyValue
                });
                buttonCount++;
            });
        }
    });

    return { tableCount, buttonCount };
}

// 处理行操作
async function handleRowAction(keyValue, bridgeBaseUrl, bridgeName, button) {
    const originalText = button.textContent;

    try {
        // 更新按钮状态
        button.textContent = '⏳ 获取中...';
        button.disabled = true;
        button.style.background = '#ffa726';

        // 构建API URL
        const apiUrl = `${window.location.protocol}//${window.location.host}/v1/models`;

        showNotification(`正在请求: ${apiUrl}`, 'info');

        // 发送请求到 /v1/models
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 检查返回数据格式
        if (!data.success || !data.data || !Array.isArray(data.data)) {
            throw new Error('API返回数据格式不正确');
        }

        // 拼接模型列表
        const models = data.data.join(',');

        // 构建最终URL
        const finalUrl = buildBridgeUrl(bridgeBaseUrl, bridgeName, models);

        // 在新标签页打开
        window.open(finalUrl, '_blank');

        showNotification(`成功获取 ${data.data.length} 个模型，正在跳转...`, 'success');

        // 恢复按钮状态
        button.textContent = '✅ 完成';
        button.style.background = '#4CAF50';

        // 2秒后恢复原始状态
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        showNotification(`操作失败: ${error.message}`, 'error');

        // 恢复按钮状态
        button.textContent = '❌ 失败';
        button.style.background = '#f44336';
        button.disabled = false;

        // 2秒后恢复原始状态
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#4CAF50';
        }, 2000);
    }
}

// 构建桥接URL
function buildBridgeUrl(bridgeBaseUrl, bridgeName, models) {
    const params = new URLSearchParams({
        name: bridgeName,
        base_url: bridgeBaseUrl,
        model: models,
        billing_type: '4',
        type: '7007'
    });

    return `${bridgeBaseUrl}/channel/bridge?${params.toString()}`;
}

// 移除所有添加的按钮
function removeAllButtons() {
    let removedCount = 0;

    // 移除所有添加的按钮和单元格
    tableButtons.forEach(item => {
        if (item.cell && item.cell.parentNode) {
            item.cell.remove(); // 移除整个单元格
            removedCount++;
        }
    });

    // 移除表头中的API操作列
    document.querySelectorAll('.shellapi-header-cell').forEach(th => {
        th.remove();
    });

    // 清空按钮数组
    tableButtons = [];

    return removedCount;
}
function createQuickActionButton() {
    // 检查是否已经存在按钮
    if (document.getElementById('auto-request-quick-btn')) {
        return;
    }

    // 创建浮动按钮
    const quickBtn = document.createElement('div');
    quickBtn.id = 'auto-request-quick-btn';
    quickBtn.innerHTML = '🚀';
    quickBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #4CAF50;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        font-size: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;

    // 鼠标悬停效果
    quickBtn.addEventListener('mouseenter', () => {
        quickBtn.style.transform = 'scale(1.1)';
        quickBtn.style.background = '#45a049';
    });

    quickBtn.addEventListener('mouseleave', () => {
        quickBtn.style.transform = 'scale(1)';
        quickBtn.style.background = '#4CAF50';
    });

    // 点击事件
    quickBtn.addEventListener('click', () => {
        performQuickAction();
    });

    document.body.appendChild(quickBtn);
}

// 执行快速操作
async function performQuickAction() {
    try {
        // 获取保存的设置
        const result = await new Promise((resolve) => {
            chrome.storage.sync.get('settings', resolve);
        });

        if (result.settings) {
            const settings = result.settings;

            // 发送请求
            if (settings.requestUrl) {
                showNotification('正在发送请求...', 'info');

                const response = await fetch(settings.requestUrl, {
                    method: settings.requestMethod || 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: settings.requestMethod === 'POST' ? settings.requestData : undefined
                });

                if (response.ok) {
                    showNotification('请求发送成功!', 'success');
                } else {
                    showNotification('请求发送失败!', 'error');
                }
            }
        }
    } catch (error) {
        showNotification('操作失败: ' + error.message, 'error');
    }
}

// 显示通知
function showNotification(message, type) {
    // 移除现有通知
    const existingNotification = document.getElementById('auto-request-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.id = 'auto-request-notification';

    const bgColor = type === 'success' ? '#4CAF50' :
        type === 'error' ? '#f44336' : '#2196F3';

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10001;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease;
    `;

    // 添加CSS动画
    if (!document.getElementById('auto-request-styles')) {
        const style = document.createElement('style');
        style.id = 'auto-request-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 监听键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl + Shift + R 触发快速请求
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        performQuickAction();
    }

    // Ctrl + Shift + J 快速跳转
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            chrome.storage.sync.get('settings', (result) => {
                if (result.settings && result.settings.baseUrl) {
                    const url = result.settings.baseUrl + encodeURIComponent(selectedText);
                    window.open(url, '_blank');
                }
            });
        } else {
            showNotification('请先选择要搜索的文字', 'info');
        }
    }
});

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scanTables') {
        try {
            const result = scanTablesAndAddButtons(request.bridgeBaseUrl, request.bridgeName);
            sendResponse({
                success: true,
                tableCount: result.tableCount,
                buttonCount: result.buttonCount
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
        return true; // 异步响应
    }

    if (request.action === 'removeButtons') {
        try {
            const removedCount = removeAllButtons();
            sendResponse({
                success: true,
                removedCount: removedCount
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
        return true;
    }

    if (request.action === 'showNotification') {
        showNotification(request.message, request.type);
        sendResponse({success: true});
    }

    if (request.action === 'getPageInfo') {
        sendResponse({
            url: window.location.href,
            title: document.title,
            selectedText: window.getSelection().toString()
        });
    }
});

// 页面加载完成后创建快捷按钮
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createQuickActionButton);
} else {
    createQuickActionButton();
}

// 检测页面变化（对于单页应用）
let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // 页面URL变化，重新创建按钮
        setTimeout(createQuickActionButton, 1000);
    }
}).observe(document, {subtree: true, childList: true});
