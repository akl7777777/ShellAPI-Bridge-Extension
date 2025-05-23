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
let autoScanEnabled = false; // 控制是否开启自动扫描功能

// ===========================================
// 工具函数（必须在其他函数之前定义）
// ===========================================

// 获取用户ID（从localStorage中解析）
function getUserId() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) {
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
            if (user && user.id) {
                console.log(`✅ 从localStorage userInfo获取到用户ID: ${user.id}`);
                return user.id.toString();
            }
        }
    } catch (e) {
        console.log('解析localStorage userInfo失败:', e);
    }

    console.log('⚠️ 无法自动获取用户ID，使用默认值256');
    return '256';
}

// 统一的API请求函数，确保所有请求都包含必要的请求头
async function makeAPIRequest(url, options = {}) {
    try {
        // 确保有用户ID
        if (!currentUserId) {
            currentUserId = getUserId();
        }

        // 构建默认请求头
        const defaultHeaders = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9',
            'cache-control': 'no-store',
            'new-api-user': currentUserId,  // 🔑 每个请求都必须有这个头
            'pragma': 'no-cache',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        };

        // 如果有access token且options中没有指定Authorization头，则添加
        if (currentAccessToken && !options.headers?.Authorization) {
            defaultHeaders['Authorization'] = `Bearer ${currentAccessToken}`;
        }

        // 合并用户提供的headers
        const headers = {
            ...defaultHeaders,
            ...(options.headers || {})
        };

        // 构建最终的请求选项
        const requestOptions = {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            ...options,
            headers
        };

        console.log(`🌐 发送API请求到: ${url}`, {
            method: requestOptions.method,
            userId: currentUserId,
            hasCustomAuth: !!options.headers?.Authorization
        });

        return fetch(url, requestOptions);
    } catch (error) {
        console.error('❌ API请求预处理失败:', error);
        throw error;
    }
}

// 显示通知
function showNotification(message, type) {
    try {
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
    } catch (error) {
        console.error('❌ 显示通知失败:', error);
    }
}

// ===========================================
// 核心功能函数
// ===========================================

// 获取Access Token
async function fetchAccessToken(baseUrl) {
    try {
        showNotification('正在获取当前页面的Access Token...', 'info');
        console.log('🔑 获取Access Token (不会刷新现有Token)');

        if (!currentUserId) {
            currentUserId = getUserId();
            console.log(`🆔 使用用户ID: ${currentUserId}`);
        }

        // 使用统一的API请求函数
        const response = await makeAPIRequest(`${baseUrl}/api/user/self`, {
            method: 'GET',
            headers: {
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"'
            },
            referrer: `${baseUrl}/personal`,
            referrerPolicy: 'strict-origin-when-cross-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('获取到的API响应:', data);

        if (!data.data || !data.data.access_token) {
            throw new Error('API返回数据格式不正确或未找到access_token');
        }

        const accessToken = data.data.access_token;
        currentAccessToken = accessToken;

        if (data.data.id) {
            currentUserId = data.data.id.toString();
        }

        showNotification('Access Token获取成功！此操作不会刷新现有Token', 'success');
        console.log(`✅ Token获取成功，用户: ${data.data.username || data.data.id}`);
        console.log(`ℹ️ 此操作只是读取现有Token，不会导致Token失效`);

        return {
            success: true,
            accessToken: accessToken,
            userData: data.data
        };

    } catch (error) {
        console.error('❌ 获取Token失败:', error);
        showNotification(`获取Access Token失败: ${error.message}。请确保已登录ShellAPI。`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

// 加载存储的配置
async function loadStoredConfig() {
    return new Promise((resolve) => {
        try {
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
                resolve();
            });
        } catch (error) {
            console.error('❌ 加载配置失败:', error);
            resolve(); // 即使失败也继续执行
        }
    });
}

// 等待页面准备就绪
async function waitForPageReady() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20;

        const checkReady = () => {
            try {
                const tables = document.querySelectorAll('table, .semi-table');
                const dataRows = document.querySelectorAll('tbody tr, .semi-table-tbody tr');

                if (dataRows.length > 0 || attempts >= maxAttempts) {
                    console.log(`📋 页面准备就绪，发现 ${dataRows.length} 行数据`);
                    resolve();
                } else {
                    attempts++;
                    setTimeout(checkReady, 500);
                }
            } catch (error) {
                console.error('❌ 检查页面就绪状态失败:', error);
                resolve(); // 即使失败也继续执行
            }
        };

        checkReady();
    });
}

// 扫描表格并添加操作按钮
function scanTablesAndAddButtons(bridgeBaseUrl, bridgeName) {
    try {
        const tables = document.querySelectorAll('table, .semi-table');
        let tableCount = 0;
        let buttonCount = 0;

        tables.forEach((table, tableIndex) => {
            const headerRows = table.querySelectorAll('thead tr, .semi-table-thead tr');
            const dataRows = table.querySelectorAll('tbody tr, .semi-table-tbody tr');

            if (dataRows.length > 0) {
                tableCount++;

                headerRows.forEach(headerRow => {
                    try {
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
                    } catch (error) {
                        console.error('❌ 添加表头失败:', error);
                    }
                });

                dataRows.forEach((row, rowIndex) => {
                    try {
                        const cells = row.querySelectorAll('td, .semi-table-row-cell');
                        if (cells.length === 0) return;

                        // 首先尝试获取表格行的data-row-key属性作为key值
                        let keyValue = row.getAttribute('data-row-key') || '';
                        
                        // 如果没有data-row-key，则尝试从单元格内容获取
                        if (!keyValue) {
                            if (cells.length > 1 && cells[1]) {
                                const textElement = cells[1].querySelector('[title]') || cells[1];
                                keyValue = textElement.textContent?.trim() || textElement.getAttribute('title')?.trim() || '';
                            }

                            if (!keyValue && cells[0]) {
                                keyValue = cells[0].textContent?.trim() || '';
                            }
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
                        actionBtn.textContent = '🔗 一键对接';
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
                    } catch (error) {
                        console.error(`❌ 为行 ${rowIndex} 添加按钮失败:`, error);
                    }
                });
            }
        });

        return { tableCount, buttonCount };
    } catch (error) {
        console.error('❌ 扫描表格失败:', error);
        throw error;
    }
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
            showNotification('未找到合适的表格数据', 'info');
        }

        return result;
    } catch (error) {
        console.error('❌ 自动扫描失败:', error);
        showNotification('自动扫描失败: ' + error.message, 'error');
        throw error;
    }
}

// 处理行操作
async function handleRowAction(keyValue, bridgeBaseUrl, bridgeName, button) {
    const originalText = button.textContent;

    try {
        button.textContent = '⏳ 获取中...';
        button.disabled = true;
        button.style.background = '#ffa726';

        // 步骤1: 获取当前表格这一行的key，添加sk-前缀
        const secretKey = `sk-${keyValue}`;
        console.log(`📌 使用key值: ${keyValue}`);
        console.log(`🔑 生成密钥: ${secretKey}`);

        // 复制SK令牌到剪切板
        try {
            await copyToClipboard(secretKey);
            showNotification(`🔑 SK令牌已复制到剪切板: ${secretKey}`, 'success');
            console.log(`📋 SK令牌已复制到剪切板: ${secretKey}`);
        } catch (clipboardError) {
            console.warn('⚠️ 复制到剪切板失败:', clipboardError);
            showNotification(`⚠️ 复制失败，SK令牌: ${secretKey}`, 'info');
        }

        showNotification(`正在使用密钥获取模型列表...`, 'info');

        // 构建API URL
        const apiUrl = `${window.location.protocol}//${window.location.host}/v1/models`;
        console.log(`🌐 请求API: ${apiUrl}`);

        // 使用统一的API请求函数，确保包含所有必要的请求头，并添加Authorization头
        const response = await makeAPIRequest(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`  // 使用sk-前缀的key作为Bearer Token
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 API响应状态码:', response.status);
        console.log('📊 API响应数据类型:', typeof data);
        console.log('📊 API响应数据结构:', Object.keys(data).join(', '));
        
        if (data.data) {
            console.log('📊 data.data类型:', typeof data.data);
            console.log('📊 data.data是否数组:', Array.isArray(data.data));
            console.log('📊 data.data长度:', data.data?.length || 0);
            if (data.data[0]) {
                console.log('📊 第一个模型结构:', Object.keys(data.data[0]).join(', '));
                console.log('📊 第一个模型ID:', data.data[0].id);
            }
        }
        
        let modelList = [];

        // 处理不同的API返回格式
        if (Array.isArray(data)) {
            modelList = extractModelIds(data);
        } else if (data.data && Array.isArray(data.data)) {
            console.log('📋 解析data.data数组，包含', data.data.length, '个模型');
            modelList = extractModelIds(data.data);
        } else if (data.models && Array.isArray(data.models)) {
            modelList = extractModelIds(data.models);
        } else {
            console.error('❌ 未知的API返回格式:', data);
            throw new Error('API返回数据格式不正确，无法识别模型列表');
        }

        if (modelList.length === 0) {
            throw new Error('未找到可用的模型');
        }

        // 步骤2: 解析请求，把可用模型用逗号拼起来
        const models = modelList.join(',');
        console.log(`✅ 成功获取 ${modelList.length} 个模型`);
        console.log(`📋 模型列表: ${models}`);

        // 步骤3: 拼接可用模型组成url
        const params = new URLSearchParams({
            name: bridgeName,
            base_url: bridgeBaseUrl,
            model: models,
            billing_type: '4',
            type: '7007'
        });

        const finalUrl = `${bridgeBaseUrl}/channel/bridge?${params.toString()}`;
        console.log(`🔗 生成的URL: ${finalUrl}`);

        // 打开URL
        window.open(finalUrl, '_blank');

        showNotification(`🎯 成功获取 ${modelList.length} 个模型，SK已复制，正在跳转...`, 'success');

        button.textContent = '✅ 完成';
        button.style.background = '#4CAF50';

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        showNotification(`操作失败: ${error.message}`, 'error');
        console.error('❌ 获取模型失败:', error);

        button.textContent = '❌ 失败';
        button.style.background = '#f44336';
        button.disabled = false;

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#4CAF50';
        }, 2000);
    }
}

// 复制文本到剪切板的通用函数
async function copyToClipboard(text) {
    try {
        // 优先使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        
        // 兜底方案：使用传统的 execCommand 方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            opacity: 0;
            pointer-events: none;
        `;
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
            throw new Error('execCommand copy failed');
        }
        
    } catch (error) {
        console.error('复制到剪切板失败:', error);
        throw error;
    }
}

// 从模型对象数组中提取模型ID
function extractModelIds(models) {
    if (!Array.isArray(models) || models.length === 0) return [];
    
    // 打印第一个模型对象结构，便于调试
    if (models[0]) {
        console.log('模型对象示例:', models[0]);
    }
    
    // 专门针对API返回的格式提取id字段
    const modelIds = models.map(model => {
        try {
            // 如果模型是对象并且有id字段，直接返回id
            if (model && typeof model === 'object' && model.id) {
                return model.id;
            }
            
            // 如果模型本身就是字符串，直接返回
            if (typeof model === 'string') return model;
            
            // 兜底处理：尝试其他可能的字段
            if (model.model) return model.model;
            if (model.model_id) return model.model_id;
            if (model.name) return model.name;
            
            // 实在找不到就返回未知模型
            return 'unknown_model';
        } catch (error) {
            console.error('❌ 提取模型ID失败:', error);
            return 'error_model';
        }
    });
    
    console.log('提取的模型ID列表:', modelIds);
    return modelIds;
}

// 移除所有添加的按钮
function removeAllButtons() {
    try {
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
    } catch (error) {
        console.error('❌ 移除按钮失败:', error);
        return 0;
    }
}

// 创建控制面板
function createControlPanel() {
    try {
        const existingPanel = document.getElementById('shellapi-control-panel');
        if (existingPanel) {
            return;
        }

        // 创建主容器
        const container = document.createElement('div');
        container.id = 'shellapi-control-panel';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        // 创建折叠状态的小按钮
        const toggleButton = document.createElement('div');
        toggleButton.id = 'shellapi-toggle-btn';
        toggleButton.innerHTML = '🔌';
        toggleButton.title = 'ShellAPI Bridge - 点击展开，长按拖动';
        toggleButton.style.cssText = `
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            border: 2px solid rgba(255,255,255,0.2);
            user-select: none;
            position: relative;
            overflow: hidden;
        `;

        // 拖动相关变量
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let initialX = 0;
        let initialY = 0;
        let dragStartTime = 0;
        let isCollapsed = false; // 是否处于贴边收起状态
        let justDragged = false; // 标记是否刚刚完成拖动，用于阻止click事件

        // 边缘检测和自动收起功能
        function checkEdgeCollapse() {
            const rect = container.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const edgeThreshold = 10; // 距离边缘多少像素开始收起
            
            const nearLeftEdge = rect.left <= edgeThreshold;
            const nearRightEdge = rect.right >= viewportWidth - edgeThreshold;
            const nearTopEdge = rect.top <= edgeThreshold;
            const nearBottomEdge = rect.bottom >= viewportHeight - edgeThreshold;
            
            const shouldCollapse = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;
            
            if (shouldCollapse && !isCollapsed) {
                // 开始收起
                isCollapsed = true;
                let collapsedStyle = '';
                
                if (nearLeftEdge) {
                    // 左边缘收起 - 向左移动一半宽度，让小条伸出左边缘
                    collapsedStyle = `
                        width: 12px;
                        height: 48px;
                        border-radius: 0 24px 24px 0;
                        transform: translateX(-6px);
                    `;
                    toggleButton.style.fontSize = '14px';
                    toggleButton.style.paddingLeft = '8px';
                    toggleButton.style.paddingRight = '0px';
                } else if (nearRightEdge) {
                    // 右边缘收起 - 向右移动一半宽度，让小条伸出右边缘
                    collapsedStyle = `
                        width: 12px;
                        height: 48px;
                        border-radius: 24px 0 0 24px;
                        transform: translateX(36px);
                    `;
                    toggleButton.style.fontSize = '14px';
                    toggleButton.style.paddingRight = '8px';
                    toggleButton.style.paddingLeft = '0px';
                } else if (nearTopEdge) {
                    // 上边缘收起 - 向上移动一半高度，让小条伸出上边缘
                    collapsedStyle = `
                        width: 48px;
                        height: 12px;
                        border-radius: 0 0 24px 24px;
                        transform: translateY(-6px);
                    `;
                    toggleButton.style.fontSize = '12px';
                    toggleButton.style.paddingTop = '8px';
                    toggleButton.style.paddingBottom = '0px';
                } else if (nearBottomEdge) {
                    // 下边缘收起 - 向下移动一半高度，让小条伸出下边缘
                    collapsedStyle = `
                        width: 48px;
                        height: 12px;
                        border-radius: 24px 24px 0 0;
                        transform: translateY(36px);
                    `;
                    toggleButton.style.fontSize = '12px';
                    toggleButton.style.paddingBottom = '8px';
                    toggleButton.style.paddingTop = '0px';
                }
                
                toggleButton.style.cssText += collapsedStyle;
                toggleButton.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
                toggleButton.style.boxShadow = '0 1px 6px rgba(0,0,0,0.2)';
                toggleButton.title = 'ShellAPI Bridge (已收起) - 点击展开';
                
                console.log('🔽 控制面板已收起到边缘');
                
            } else if (!shouldCollapse && isCollapsed) {
                // 展开回圆形
                isCollapsed = false;
                toggleButton.style.cssText = `
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    border: 2px solid rgba(255,255,255,0.2);
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                    padding: 0;
                    transform: none;
                `;
                toggleButton.title = 'ShellAPI Bridge - 点击展开，长按拖动';
                
                console.log('🔼 控制面板已展开为圆形');
            }
        }

        // 创建展开的菜单面板
        const panel = document.createElement('div');
        panel.id = 'shellapi-menu-panel';
        panel.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            gap: 10px;
            min-width: 200px;
            border: 1px solid #e0e0e0;
            transform: scale(0.95);
            opacity: 0;
            transition: all 0.2s ease;
        `;

        // 面板标题
        const title = document.createElement('div');
        title.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: bold; color: #333; font-size: 16px;">🔌 ShellAPI Bridge</span>
                <span id="shellapi-close-btn" style="cursor: pointer; font-size: 18px; color: #666; padding: 2px 6px; border-radius: 50%; transition: all 0.2s ease;" title="收起菜单">×</span>
            </div>
        `;
        title.style.cssText = `
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
            margin-bottom: 8px;
        `;
        panel.appendChild(title);

        // 添加"一键对接"按钮
        const scanBtn = document.createElement('button');
        scanBtn.innerHTML = '🔍 一键对接';
        scanBtn.style.cssText = `
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        scanBtn.addEventListener('mouseenter', () => {
            scanBtn.style.transform = 'translateY(-1px)';
            scanBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
        });
        scanBtn.addEventListener('mouseleave', () => {
            scanBtn.style.transform = 'translateY(0)';
            scanBtn.style.boxShadow = 'none';
        });
        scanBtn.addEventListener('click', async () => {
            if (!autoProcessing) {
                autoScanEnabled = true;
                showNotification('🔄 开始扫描表格...', 'info');
                await autoInitialize();
            } else {
                showNotification('⚠️ 正在处理中，请稍候...', 'info');
            }
        });
        panel.appendChild(scanBtn);

        // 添加"清除按钮"按钮
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '🗑️ 清除按钮';
        clearBtn.style.cssText = `
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.transform = 'translateY(-1px)';
            clearBtn.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.transform = 'translateY(0)';
            clearBtn.style.boxShadow = 'none';
        });
        clearBtn.addEventListener('click', () => {
            const removedCount = removeAllButtons();
            showNotification(`🎯 已清除 ${removedCount} 个按钮`, 'success');
        });
        panel.appendChild(clearBtn);

        // 添加状态信息
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            text-align: center;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-top: 4px;
        `;
        statusDiv.textContent = '点击上方按钮开始操作';
        panel.appendChild(statusDiv);

        // 组装容器
        container.appendChild(toggleButton);
        container.appendChild(panel);
        document.body.appendChild(container);

        // 从存储中恢复位置
        chrome.storage.sync.get(['controlPanelPosition'], (result) => {
            if (result.controlPanelPosition) {
                const pos = result.controlPanelPosition;
                container.style.left = pos.x + 'px';
                container.style.top = pos.y + 'px';
                container.style.right = 'auto'; // 取消右侧定位
                
                // 恢复位置后检查是否需要收起
                setTimeout(() => {
                    checkEdgeCollapse();
                }, 100);
            }
        });

        // 拖动功能实现
        toggleButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragStartTime = Date.now();
            isDragging = true;
            
            // 记录鼠标按下时的位置和元素位置
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            const rect = container.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // 拖动时的视觉反馈
            toggleButton.style.cursor = 'grabbing';
            toggleButton.style.transform = 'scale(1.1)';
            toggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            toggleButton.style.zIndex = '10001';
            
            // 拖动时恢复圆形状态
            if (isCollapsed) {
                isCollapsed = false;
                toggleButton.style.width = '48px';
                toggleButton.style.height = '48px';
                toggleButton.style.borderRadius = '50%';
                toggleButton.style.fontSize = '20px';
                toggleButton.style.padding = '0';
            }
            
            // 添加拖动提示
            toggleButton.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
            
            console.log('🖱️ 开始拖动控制面板');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            // 计算新位置
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // 边界检测 - 确保不会拖出视窗
            const containerRect = container.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 左边界
            newX = Math.max(0, newX);
            // 右边界
            newX = Math.min(viewportWidth - containerRect.width, newX);
            // 上边界
            newY = Math.max(0, newY);
            // 下边界
            newY = Math.min(viewportHeight - containerRect.height, newY);
            
            // 更新位置
            container.style.left = newX + 'px';
            container.style.top = newY + 'px';
            container.style.right = 'auto'; // 取消右侧定位
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            const dragDuration = Date.now() - dragStartTime;
            
            // 计算拖动距离
            const dragDistance = Math.sqrt(
                Math.pow(e.clientX - dragStartX, 2) + 
                Math.pow(e.clientY - dragStartY, 2)
            );
            
            // 恢复按钮样式
            toggleButton.style.cursor = 'pointer';
            toggleButton.style.transform = 'scale(1)';
            toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
            toggleButton.style.zIndex = '10000';
            toggleButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            
            // 保存新位置到存储
            const rect = container.getBoundingClientRect();
            const position = {
                x: rect.left,
                y: rect.top
            };
            
            chrome.storage.sync.set({
                controlPanelPosition: position
            }, () => {
                console.log('💾 控制面板位置已保存:', position);
            });
            
            // 拖动结束后检查是否需要收起
            setTimeout(() => {
                checkEdgeCollapse();
            }, 100);
            
            // 判断是否为真正的拖动（距离超过5像素或时间超过200ms）
            const isDragAction = dragDistance >= 5 || dragDuration >= 200;
            
            if (isDragAction) {
                // 真正的拖动 - 设置标志阻止后续的click事件
                justDragged = true;
                console.log(`🖱️ 拖动结束，距离: ${dragDistance.toFixed(1)}px，时间: ${dragDuration}ms，新位置:`, position);
                
                // 延迟重置标志，确保click事件被阻止
                setTimeout(() => {
                    justDragged = false;
                }, 100);
            } else {
                // 快速点击 - 允许展开面板
                justDragged = false;
                console.log('🖱️ 检测到快速点击，准备展开面板');
            }
        });

        // 折叠按钮悬停效果（仅在非拖动状态下）
        toggleButton.addEventListener('mouseenter', () => {
            if (!isDragging) {
                if (isCollapsed) {
                    // 收起状态下的悬停效果 - 暂时恢复球形
                    toggleButton.style.cssText = `
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #42A5F5, #1E88E5);
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        box-shadow: 0 4px 15px rgba(66, 165, 245, 0.4);
                        transition: all 0.3s ease;
                        border: 2px solid rgba(255,255,255,0.3);
                        user-select: none;
                        position: relative;
                        overflow: hidden;
                        padding: 0;
                        transform: scale(1.05);
                        z-index: 10001;
                    `;
                    toggleButton.title = 'ShellAPI Bridge - 点击展开菜单';
                    console.log('🔵 收起状态悬停：暂时恢复球形');
                } else {
                    // 正常状态下的悬停效果
                    toggleButton.style.transform = 'scale(1.05)';
                    toggleButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }
            }
        });
        
        toggleButton.addEventListener('mouseleave', () => {
            if (!isDragging) {
                if (isCollapsed) {
                    // 直接恢复收起状态，不重新检查位置
                    const rect = container.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const edgeThreshold = 10;
                    
                    const nearLeftEdge = rect.left <= edgeThreshold;
                    const nearRightEdge = rect.right >= viewportWidth - edgeThreshold;
                    const nearTopEdge = rect.top <= edgeThreshold;
                    const nearBottomEdge = rect.bottom >= viewportHeight - edgeThreshold;
                    
                    // 根据边缘位置直接恢复对应的收起样式
                    if (nearLeftEdge) {
                        toggleButton.style.cssText = `
                            width: 12px;
                            height: 48px;
                            border-radius: 0 24px 24px 0;
                            transform: translateX(-6px);
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            box-shadow: 0 1px 6px rgba(0,0,0,0.2);
                            transition: all 0.3s ease;
                            border: 2px solid rgba(255,255,255,0.2);
                            user-select: none;
                            position: relative;
                            overflow: hidden;
                            padding-left: 8px;
                            padding-right: 0px;
                        `;
                    } else if (nearRightEdge) {
                        toggleButton.style.cssText = `
                            width: 12px;
                            height: 48px;
                            border-radius: 24px 0 0 24px;
                            transform: translateX(36px);
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            box-shadow: 0 1px 6px rgba(0,0,0,0.2);
                            transition: all 0.3s ease;
                            border: 2px solid rgba(255,255,255,0.2);
                            user-select: none;
                            position: relative;
                            overflow: hidden;
                            padding-right: 8px;
                            padding-left: 0px;
                        `;
                    } else if (nearTopEdge) {
                        toggleButton.style.cssText = `
                            width: 48px;
                            height: 12px;
                            border-radius: 0 0 24px 24px;
                            transform: translateY(-6px);
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            box-shadow: 0 1px 6px rgba(0,0,0,0.2);
                            transition: all 0.3s ease;
                            border: 2px solid rgba(255,255,255,0.2);
                            user-select: none;
                            position: relative;
                            overflow: hidden;
                            padding-top: 8px;
                            padding-bottom: 0px;
                        `;
                    } else if (nearBottomEdge) {
                        toggleButton.style.cssText = `
                            width: 48px;
                            height: 12px;
                            border-radius: 24px 24px 0 0;
                            transform: translateY(36px);
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            box-shadow: 0 1px 6px rgba(0,0,0,0.2);
                            transition: all 0.3s ease;
                            border: 2px solid rgba(255,255,255,0.2);
                            user-select: none;
                            position: relative;
                            overflow: hidden;
                            padding-bottom: 8px;
                            padding-top: 0px;
                        `;
                    }
                    
                    toggleButton.title = 'ShellAPI Bridge (已收起) - 点击展开';
                    console.log('🔽 悬停结束：直接恢复收起状态');
                } else {
                    // 恢复正常状态的样式
                    toggleButton.style.transform = 'scale(1)';
                    toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
                }
            }
        });

        // 点击折叠按钮展开菜单（只有在非拖动状态且没有刚刚拖动时才触发）
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // 如果刚刚拖动过，阻止展开面板
            if (justDragged) {
                console.log('🚫 阻止拖动后的点击事件');
                return;
            }
            
            // 只有在真正点击时才展开面板
            if (!isDragging) {
                console.log('🖱️ 点击展开面板');
                showPanel();
            }
        });

        // 点击关闭按钮收起菜单
        const closeBtn = panel.querySelector('#shellapi-close-btn');
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f0f0f0';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'transparent';
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hidePanel();
        });

        // 点击外部区域收起菜单
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target) && !isDragging) {
                hidePanel();
            }
        });

        // 窗口大小改变时重新检查边缘收起
        window.addEventListener('resize', () => {
            setTimeout(() => {
                checkEdgeCollapse();
            }, 100);
        });

        // 展开面板函数
        function showPanel() {
            panel.style.display = 'flex';
            toggleButton.style.display = 'none';
            // 添加展开动画
            setTimeout(() => {
                panel.style.transform = 'scale(1)';
                panel.style.opacity = '1';
            }, 10);
        }

        // 收起面板函数
        function hidePanel() {
            panel.style.transform = 'scale(0.95)';
            panel.style.opacity = '0';
            setTimeout(() => {
                panel.style.display = 'none';
                toggleButton.style.display = 'flex';
                // 面板收起后重新检查边缘收起
                setTimeout(() => {
                    checkEdgeCollapse();
                }, 50);
            }, 200);
        }

        console.log('✅ 可拖动控制面板创建成功');

    } catch (error) {
        console.error('❌ 创建控制面板失败:', error);
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
        console.log('🚀 开始初始化...');

        await loadStoredConfig();

        await waitForPageReady();
        
        // 只有在启用自动扫描时才扫描并添加按钮
        if (autoScanEnabled) {
            await autoScanAndAddButtons();
            autoScanEnabled = false; // 完成后重置标志
        }

        console.log('✅ 初始化完成');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showNotification('初始化失败: ' + error.message, 'error');
    } finally {
        autoProcessing = false;
    }
}

// ===========================================
// 消息监听和页面初始化
// ===========================================

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 添加ping响应，用于检查内容脚本是否已注入
    if (request.action === 'ping') {
        sendResponse({success: true, message: 'ShellAPI Bridge内容脚本已加载'});
        return true;
    }

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
        return true;
    }
    
    // 默认返回，避免未处理的消息
    sendResponse({success: false, error: '未知的操作'});
    return true;
});

// 统一的初始化入口
async function initializeExtension() {
    try {
        console.log('🔄 初始化ShellAPI Bridge扩展...');
        createControlPanel();
        await loadStoredConfig(); // 只加载配置，不自动扫描
        console.log('✅ 扩展初始化完成');
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
