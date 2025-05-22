// 内容脚本 - 在网页中运行
// 可以访问和修改网页DOM

let tableButtons = []; // 存储添加的按钮元素
let currentAccessToken = ''; // 存储当前的access token
let currentUserId = ''; // 存储当前用户ID
let autoProcessing = false; // 防止重复自动处理
let currentBridgeConfig = {
    baseUrl: 'https://kfcv50.link',
    name: 'KFC V50 API 一键对接'
};

// ===========================================
// 工具函数（必须在其他函数之前定义）
// ===========================================

// 获取用户ID（从localStorage中解析）
function getUserId() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.id) {
                console.log(`✅ 从localStorage获取到用户ID: ${user.id}`);
                return user.id.toString();
            }
        }
    } catch (e) {
        console.log('解析localStorage user失败:', e);
    }

    try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            if (user.id) {
                console.log(`✅ 从localStorage userInfo获取到用户ID: ${user.id}`);
                return user.id.toString();
            }
        }
    } catch (e) {}

    const userElements = document.querySelectorAll('[data-user-id], [data-userid], .user-id');
    for (const el of userElements) {
        const id = el.getAttribute('data-user-id') || el.getAttribute('data-userid') || el.textContent;
        if (id && !isNaN(id)) {
            console.log(`✅ 从页面元素获取到用户ID: ${id}`);
            return id.toString();
        }
    }

    console.log('⚠️ 无法自动获取用户ID，使用默认值256');
    return '256';
}

// 显示通知
function showNotification(message, type) {
    const existingNotification = document.getElementById('shellapi-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'shellapi-notification';

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

    if (!document.getElementById('shellapi-styles')) {
        const style = document.createElement('style');
        style.id = 'shellapi-styles';
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

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// ===========================================
// 核心功能函数
// ===========================================

// 获取Access Token
async function fetchAccessToken(baseUrl) {
    try {
        showNotification('正在获取Access Token...', 'info');

        if (!currentUserId) {
            currentUserId = getUserId();
            console.log(`🆔 使用用户ID: ${currentUserId}`);
        }

        const response = await fetch(`${baseUrl}/api/user/self`, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'zh-CN,zh;q=0.9',
                'cache-control': 'no-store',
                'new-api-user': currentUserId,
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            },
            referrer: `${baseUrl}/personal`,
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            mode: 'cors',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.data || !data.data.access_token) {
            throw new Error('API返回数据格式不正确或未找到access_token');
        }

        const accessToken = data.data.access_token;
        currentAccessToken = accessToken;

        if (data.data.id) {
            currentUserId = data.data.id.toString();
        }

        showNotification('Access Token获取成功！', 'success');
        console.log(`✅ Token获取成功，用户: ${data.data.username || data.data.id}`);

        return {
            success: true,
            accessToken: accessToken,
            userData: data.data
        };

    } catch (error) {
        console.error('❌ 获取Token失败:', error);
        showNotification(`获取Access Token失败: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

// 验证Access Token是否有效
async function validateAccessToken() {
    try {
        if (!currentUserId) {
            currentUserId = getUserId();
        }

        const response = await fetch(`${window.location.origin}/api/user/self`, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'zh-CN,zh;q=0.9',
                'cache-control': 'no-store',
                'new-api-user': currentUserId,
                'pragma': 'no-cache',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            },
            credentials: 'include'
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}

// 加载存储的配置
async function loadStoredConfig() {
    return new Promise((resolve) => {
        currentUserId = getUserId();

        chrome.storage.sync.get(['settings'], (result) => {
            if (result.settings) {
                if (result.settings.bridgeBaseUrl) {
                    currentBridgeConfig.baseUrl = result.settings.bridgeBaseUrl;
                }
                if (result.settings.bridgeName) {
                    currentBridgeConfig.name = result.settings.bridgeName;
                }
                if (result.settings.accessToken) {
                    currentAccessToken = result.settings.accessToken;
                }
                console.log('📦 已加载存储的配置');
            }

            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    console.log('👤 用户信息:', {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    });

                    if (user.id && user.id.toString() !== currentUserId) {
                        currentUserId = user.id.toString();
                        console.log(`🔄 更新用户ID为: ${currentUserId}`);
                    }
                }
            } catch (e) {
                console.log('解析localStorage用户信息失败:', e);
            }

            resolve();
        });
    });
}

// 等待页面准备就绪
async function waitForPageReady() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20;

        const checkReady = () => {
            const tables = document.querySelectorAll('table, .semi-table');
            const dataRows = document.querySelectorAll('tbody tr, .semi-table-tbody tr');

            if (dataRows.length > 0 || attempts >= maxAttempts) {
                console.log(`📋 页面准备就绪，发现 ${dataRows.length} 行数据`);
                resolve();
            } else {
                attempts++;
                setTimeout(checkReady, 500);
            }
        };

        checkReady();
    });
}

// 自动获取Access Token
async function autoFetchAccessToken() {
    try {
        if (currentAccessToken) {
            const isValid = await validateAccessToken();
            if (isValid) {
                console.log('✅ 现有Token仍然有效');
                return { success: true };
            }
        }

        console.log('🔑 正在自动获取Access Token...');
        const baseUrl = window.location.origin;
        const result = await fetchAccessToken(baseUrl);

        if (result.success) {
            chrome.storage.sync.set({
                accessToken: result.accessToken,
                tokenBaseUrl: baseUrl
            });
            console.log('✅ Access Token获取成功');
        }

        return result;
    } catch (error) {
        console.error('❌ 自动获取Token失败:', error);
        return { success: false, error: error.message };
    }
}

// 扫描表格并添加操作按钮
function scanTablesAndAddButtons(bridgeBaseUrl, bridgeName) {
    const tables = document.querySelectorAll('table, .semi-table');
    let tableCount = 0;
    let buttonCount = 0;

    tables.forEach((table, tableIndex) => {
        const headerRows = table.querySelectorAll('thead tr, .semi-table-thead tr');
        const dataRows = table.querySelectorAll('tbody tr, .semi-table-tbody tr');

        if (dataRows.length > 0) {
            tableCount++;

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

            dataRows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td, .semi-table-row-cell');
                if (cells.length === 0) return;

                let keyValue = '';
                if (cells.length > 1 && cells[1]) {
                    const textElement = cells[1].querySelector('[title]') || cells[1];
                    keyValue = textElement.textContent?.trim() || textElement.getAttribute('title')?.trim() || '';
                }

                if (!keyValue && cells[0]) {
                    keyValue = cells[0].textContent?.trim() || '';
                }

                if (!keyValue) {
                    console.log('未找到key值，跳过行:', rowIndex);
                    return;
                }

                console.log(`为行 ${rowIndex} 添加按钮，key值: ${keyValue}`);

                const actionCell = document.createElement('td');
                actionCell.className = `shellapi-action-cell-${Date.now()}-${rowIndex} semi-table-row-cell`;
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
                actionBtn.className = `shellapi-action-btn-${Date.now()}-${rowIndex}`;
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

                actionBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleRowAction(keyValue, bridgeBaseUrl, bridgeName, actionBtn);
                });

                actionCell.appendChild(actionBtn);
                row.appendChild(actionCell);

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

// 自动扫描并添加按钮
async function autoScanAndAddButtons() {
    try {
        removeAllButtons();

        const result = scanTablesAndAddButtons(currentBridgeConfig.baseUrl, currentBridgeConfig.name);

        if (result.buttonCount > 0) {
            console.log(`✅ 自动添加了 ${result.buttonCount} 个按钮`);
            showNotification(`自动扫描完成：添加了 ${result.buttonCount} 个API操作按钮`, 'success');
        } else {
            console.log('ℹ️ 未找到合适的表格行');
        }

        return result;
    } catch (error) {
        console.error('❌ 自动扫描失败:', error);
        throw error;
    }
}

// 处理行操作
async function handleRowAction(keyValue, bridgeBaseUrl, bridgeName, button) {
    const originalText = button.textContent;

    try {
        if (!currentAccessToken) {
            showNotification('请先获取Access Token', 'error');
            return;
        }

        button.textContent = '⏳ 获取中...';
        button.disabled = true;
        button.style.background = '#ffa726';

        const apiUrl = `${window.location.protocol}//${window.location.host}/v1/models`;

        showNotification(`正在请求: ${apiUrl}`, 'info');

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAccessToken}`,
                'accept': 'application/json, text/plain, */*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.data || !Array.isArray(data.data)) {
            throw new Error('API返回数据格式不正确');
        }

        const models = data.data.join(',');
        const finalUrl = buildBridgeUrl(bridgeBaseUrl, bridgeName, models);

        window.open(finalUrl, '_blank');

        showNotification(`成功获取 ${data.data.length} 个模型，正在跳转...`, 'success');

        button.textContent = '✅ 完成';
        button.style.background = '#4CAF50';

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        showNotification(`操作失败: ${error.message}`, 'error');

        button.textContent = '❌ 失败';
        button.style.background = '#f44336';
        button.disabled = false;

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

    tableButtons.forEach(item => {
        if (item.cell && item.cell.parentNode) {
            item.cell.remove();
            removedCount++;
        }
    });

    document.querySelectorAll('.shellapi-header-cell').forEach(th => {
        if (th.parentNode) {
            th.remove();
        }
    });

    document.querySelectorAll('[class*="shellapi-action-"]').forEach(element => {
        if (element.parentNode) {
            element.remove();
            removedCount++;
        }
    });

    tableButtons = [];

    console.log(`🧹 清理了 ${removedCount} 个元素`);
    return removedCount;
}

// 创建快捷操作按钮
function createQuickActionButton() {
    const existingBtn = document.getElementById('shellapi-quick-btn');
    if (existingBtn) {
        return;
    }

    const quickBtn = document.createElement('div');
    quickBtn.id = 'shellapi-quick-btn';
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
        user-select: none;
    `;

    quickBtn.addEventListener('mouseenter', () => {
        quickBtn.style.transform = 'scale(1.1)';
        quickBtn.style.background = '#45a049';
    });

    quickBtn.addEventListener('mouseleave', () => {
        quickBtn.style.transform = 'scale(1)';
        quickBtn.style.background = '#4CAF50';
    });

    quickBtn.addEventListener('click', () => {
        performQuickAction();
    });

    document.body.appendChild(quickBtn);
}

// 执行快速操作
async function performQuickAction() {
    try {
        if (!autoProcessing) {
            showNotification('🔄 正在重新初始化...', 'info');
            await autoInitialize();
        } else {
            showNotification('⚠️ 正在处理中，请稍候...', 'info');
        }
    } catch (error) {
        showNotification('操作失败: ' + error.message, 'error');
    }
}

// ===========================================
// 自动初始化主函数
// ===========================================

// 自动初始化功能
async function autoInitialize() {
    if (autoProcessing) return;
    autoProcessing = true;

    try {
        console.log('🚀 开始自动初始化...');

        await loadStoredConfig();

        const tokenResult = await autoFetchAccessToken();
        if (!tokenResult.success) {
            console.log('⚠️ 无法自动获取Token，可能需要登录');
            autoProcessing = false;
            return;
        }

        await waitForPageReady();
        await autoScanAndAddButtons();

        console.log('✅ 自动初始化完成');

    } catch (error) {
        console.error('❌ 自动初始化失败:', error);
        showNotification('自动初始化失败: ' + error.message, 'error');
    } finally {
        autoProcessing = false;
    }
}

// ===========================================
// 消息监听和页面初始化
// ===========================================

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchAccessToken') {
        fetchAccessToken(request.baseUrl)
            .then(result => {
                if (result.success) {
                    currentAccessToken = result.accessToken;
                }
                sendResponse(result);
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        return true;
    }

    if (request.action === 'scanTables') {
        try {
            chrome.storage.sync.get(['accessToken'], (result) => {
                if (result.accessToken) {
                    currentAccessToken = result.accessToken;
                }
            });

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
        return true;
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

// 监听键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        performQuickAction();
    }

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

// 统一的初始化入口
async function initializeExtension() {
    try {
        createQuickActionButton();
        await autoInitialize();
    } catch (error) {
        console.error('❌ 插件初始化失败:', error);
    }
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    setTimeout(initializeExtension, 1000);
}

// 监听页面变化（对于单页应用）
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('🔄 页面URL变化，重新初始化...');
        setTimeout(() => {
            if (!autoProcessing) {
                initializeExtension();
            }
        }, 2000);
    }
});

urlObserver.observe(document, {subtree: true, childList: true});

window.addEventListener('beforeunload', () => {
    urlObserver.disconnect();
    removeAllButtons();
});
