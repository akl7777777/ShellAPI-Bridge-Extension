document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const bridgeBaseUrlInput = document.getElementById('bridgeBaseUrl');
    const bridgeNameInput = document.getElementById('bridgeName');
    const scanTablesBtn = document.getElementById('scanTables');
    const removeBtnsBtn = document.getElementById('removeBtns');
    const tableStatusDiv = document.getElementById('tableStatus');
    const fetchTokenBtn = document.getElementById('fetchToken');
    const accessTokenInput = document.getElementById('accessToken');
    const tokenStatusDiv = document.getElementById('tokenStatus');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const clearSettingsBtn = document.getElementById('clearSettings');

    // 加载保存的设置
    loadSettings();

    // 获取Access Token
    fetchTokenBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showTokenStatus('无法获取当前标签页信息', 'error');
                return;
            }
            
            const currentTab = tabs[0];
            try {
                const currentUrl = currentTab.url;
                const baseUrl = new URL(currentUrl).origin;
                
                showTokenStatus('正在从当前页面获取Access Token...', 'info');
                
                // 先检查内容脚本是否已注入
                chrome.tabs.sendMessage(currentTab.id, { action: 'ping' }, function(response) {
                    if (chrome.runtime.lastError) {
                        // 内容脚本未注入，显示错误
                        showTokenStatus('无法连接到页面。请确保你正在访问ShellAPI网站，且插件有权限访问。', 'error');
                        return;
                    }
                    
                    // 内容脚本已注入，发送获取Token请求
                    chrome.tabs.sendMessage(currentTab.id, {
                        action: 'fetchAccessToken',
                        baseUrl: baseUrl
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            showTokenStatus('与页面通信失败：' + chrome.runtime.lastError.message, 'error');
                            return;
                        }
                        
                        if (response && response.success) {
                            accessTokenInput.value = response.accessToken;
                            showTokenStatus('Access Token获取成功！此操作不会刷新现有Token', 'success');

                            // 保存token到存储
                            chrome.storage.sync.set({
                                accessToken: response.accessToken,
                                tokenBaseUrl: baseUrl
                            });
                        } else {
                            showTokenStatus('获取Access Token失败：' + (response?.error || '未知错误') + '。请确保在已登录的ShellAPI页面使用。', 'error');
                        }
                    });
                });
            } catch (error) {
                showTokenStatus('URL解析错误：' + error.message, 'error');
            }
        });
    });

    // 扫描表格并添加按钮
    scanTablesBtn.addEventListener('click', function() {
        const bridgeBaseUrl = bridgeBaseUrlInput.value.trim();
        const bridgeName = bridgeNameInput.value.trim();

        if (!bridgeBaseUrl) {
            showTableStatus('请输入桥接基础URL', 'error');
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showTableStatus('无法获取当前标签页信息', 'error');
                return;
            }
            
            // 先检查内容脚本是否已注入
            chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
                if (chrome.runtime.lastError) {
                    // 内容脚本未注入，显示错误
                    showTableStatus('无法连接到页面。请确保你正在访问包含表格的网站。', 'error');
                    return;
                }
                
                // 内容脚本已注入，发送扫描表格请求
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'scanTables',
                    bridgeBaseUrl: bridgeBaseUrl,
                    bridgeName: bridgeName
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        showTableStatus('与页面通信失败：' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    if (response && response.success) {
                        showTableStatus(`已扫描到 ${response.tableCount} 个表格，添加了 ${response.buttonCount} 个按钮`, 'success');
                    } else {
                        showTableStatus('扫描表格失败：' + (response?.error || '未知错误'), 'error');
                    }
                });
            });
        });
    });

    // 移除所有按钮
    removeBtnsBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showTableStatus('无法获取当前标签页信息', 'error');
                return;
            }
            
            // 先检查内容脚本是否已注入
            chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
                if (chrome.runtime.lastError) {
                    // 内容脚本未注入，显示错误
                    showTableStatus('无法连接到页面。请确保你正在访问包含表格的网站。', 'error');
                    return;
                }
                
                // 内容脚本已注入，发送移除按钮请求
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'removeButtons'
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        showTableStatus('与页面通信失败：' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    if (response && response.success) {
                        showTableStatus(`已移除 ${response.removedCount} 个按钮`, 'success');
                    } else {
                        showTableStatus('移除按钮失败', 'error');
                    }
                });
            });
        });
    });

    // 保存设置
    saveSettingsBtn.addEventListener('click', function() {
        const settings = {
            bridgeBaseUrl: bridgeBaseUrlInput.value,
            bridgeName: bridgeNameInput.value,
            accessToken: accessTokenInput.value
        };

        chrome.storage.sync.set({settings: settings}, function() {
            showTableStatus('设置已保存', 'success');
        });
    });

    // 清除设置
    clearSettingsBtn.addEventListener('click', function() {
        chrome.storage.sync.remove('settings', function() {
            // 重置表单
            bridgeBaseUrlInput.value = 'https://kfcv50.link';
            bridgeNameInput.value = 'KFC V50 API 一键对接';
            accessTokenInput.value = '';
            showTableStatus('设置已清除', 'success');
        });
    });

    // 加载保存的设置
    function loadSettings() {
        chrome.storage.sync.get('settings', function(result) {
            if (result.settings) {
                const settings = result.settings;
                bridgeBaseUrlInput.value = settings.bridgeBaseUrl || 'https://kfcv50.link';
                bridgeNameInput.value = settings.bridgeName || 'KFC V50 API 一键对接';
                accessTokenInput.value = settings.accessToken || '';
            }
        });
    }

    // 显示Token状态信息
    function showTokenStatus(message, type) {
        tokenStatusDiv.textContent = message;
        tokenStatusDiv.className = type;

        // 3秒后自动清除状态
        setTimeout(() => {
            tokenStatusDiv.textContent = '';
            tokenStatusDiv.className = '';
        }, 3000);
    }

    // 显示表格状态信息
    function showTableStatus(message, type) {
        tableStatusDiv.textContent = message;
        tableStatusDiv.className = type;

        // 3秒后自动清除状态
        setTimeout(() => {
            tableStatusDiv.textContent = '';
            tableStatusDiv.className = '';
        }, 3000);
    }

    // 监听Enter键快捷操作
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (e.target === bridgeBaseUrlInput || e.target === bridgeNameInput) {
                scanTablesBtn.click();
            } else if (e.target === accessTokenInput) {
                fetchTokenBtn.click();
            }
        }
    });
});
