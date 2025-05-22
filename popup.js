document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const requestMethodSelect = document.getElementById('requestMethod');
    const requestUrlInput = document.getElementById('requestUrl');
    const requestDataTextarea = document.getElementById('requestData');
    const sendRequestBtn = document.getElementById('sendRequest');
    const baseUrlInput = document.getElementById('baseUrl');
    const urlParamInput = document.getElementById('urlParam');
    const jumpBtn = document.getElementById('jumpButton');
    const bridgeBaseUrlInput = document.getElementById('bridgeBaseUrl');
    const bridgeNameInput = document.getElementById('bridgeName');
    const scanTablesBtn = document.getElementById('scanTables');
    const removeBtnsBtn = document.getElementById('removeBtns');
    const tableStatusDiv = document.getElementById('tableStatus');
    const statusDiv = document.getElementById('status');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const clearSettingsBtn = document.getElementById('clearSettings');

    // 加载保存的设置
    loadSettings();

    // 发送请求功能
    sendRequestBtn.addEventListener('click', async function() {
        const method = requestMethodSelect.value;
        const url = requestUrlInput.value.trim();
        const data = requestDataTextarea.value.trim();

        if (!url) {
            showStatus('请输入请求URL', 'error');
            return;
        }

        try {
            showStatus('正在发送请求...', 'info');

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // 如果是POST请求且有数据，添加请求体
            if (method === 'POST' && data) {
                try {
                    JSON.parse(data); // 验证JSON格式
                    options.body = data;
                } catch (e) {
                    showStatus('POST数据必须是有效的JSON格式', 'error');
                    return;
                }
            }

            const response = await fetch(url, options);

            if (response.ok) {
                const responseData = await response.text();
                showStatus(`请求成功! 状态码: ${response.status}`, 'success');
                console.log('Response:', responseData);
            } else {
                showStatus(`请求失败! 状态码: ${response.status}`, 'error');
            }
        } catch (error) {
            showStatus(`请求出错: ${error.message}`, 'error');
            console.error('Request error:', error);
        }
    });

    // URL跳转功能
    jumpBtn.addEventListener('click', function() {
        const baseUrl = baseUrlInput.value.trim();
        const param = urlParamInput.value.trim();

        if (!baseUrl) {
            showStatus('请输入基础URL', 'error');
            return;
        }

        // 拼接URL
        let finalUrl = baseUrl;
        if (param) {
            // 如果参数需要编码（比如中文）
            const encodedParam = encodeURIComponent(param);
            finalUrl += encodedParam;
        }

        try {
            // 获取当前活动标签页并跳转
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.update(tabs[0].id, {url: finalUrl});
                showStatus(`正在跳转到: ${finalUrl}`, 'success');

                // 关闭弹窗
                setTimeout(() => {
                    window.close();
                }, 1000);
            });
        } catch (error) {
            showStatus(`跳转出错: ${error.message}`, 'error');
        }
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
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'scanTables',
                bridgeBaseUrl: bridgeBaseUrl,
                bridgeName: bridgeName
            }, function(response) {
                if (response && response.success) {
                    showTableStatus(`已扫描到 ${response.tableCount} 个表格，添加了 ${response.buttonCount} 个按钮`, 'success');
                } else {
                    showTableStatus('扫描表格失败：' + (response?.error || '未知错误'), 'error');
                }
            });
        });
    });

    // 移除所有按钮
    removeBtnsBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'removeButtons'
            }, function(response) {
                if (response && response.success) {
                    showTableStatus(`已移除 ${response.removedCount} 个按钮`, 'success');
                } else {
                    showTableStatus('移除按钮失败', 'error');
                }
            });
        });
    });
    saveSettingsBtn.addEventListener('click', function() {
        const settings = {
            requestMethod: requestMethodSelect.value,
            requestUrl: requestUrlInput.value,
            requestData: requestDataTextarea.value,
            baseUrl: baseUrlInput.value,
            urlParam: urlParamInput.value,
            bridgeBaseUrl: bridgeBaseUrlInput.value,
            bridgeName: bridgeNameInput.value
        };

        chrome.storage.sync.set({settings: settings}, function() {
            showStatus('设置已保存', 'success');
        });
    });

    // 清除设置
    clearSettingsBtn.addEventListener('click', function() {
        chrome.storage.sync.remove('settings', function() {
            // 重置表单
            requestMethodSelect.value = 'GET';
            requestUrlInput.value = 'https://jsonplaceholder.typicode.com/posts/1';
            requestDataTextarea.value = '';
            baseUrlInput.value = 'https://kfcv50.link';
            urlParamInput.value = '浏览器插件开发';
            bridgeBaseUrlInput.value = 'https://kfcv50.link';
            bridgeNameInput.value = 'KFC V50 API 一键对接';
            showStatus('设置已清除', 'success');
        });
    });

    // 加载保存的设置
    function loadSettings() {
        chrome.storage.sync.get('settings', function(result) {
            if (result.settings) {
                const settings = result.settings;
                requestMethodSelect.value = settings.requestMethod || 'GET';
                requestUrlInput.value = settings.requestUrl || 'https://jsonplaceholder.typicode.com/posts/1';
                requestDataTextarea.value = settings.requestData || '';
                baseUrlInput.value = settings.baseUrl || 'https://kfcv50.link';
                urlParamInput.value = settings.urlParam || '浏览器插件开发';
                bridgeBaseUrlInput.value = settings.bridgeBaseUrl || 'https://kfcv50.link';
                bridgeNameInput.value = settings.bridgeName || 'KFC V50 API 一键对接';
            }
        });
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

    // 显示状态信息
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;

        // 3秒后自动清除状态
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }

    // 监听Enter键快捷操作
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (e.target === requestUrlInput || e.target === requestDataTextarea) {
                sendRequestBtn.click();
            } else if (e.target === baseUrlInput || e.target === urlParamInput) {
                jumpBtn.click();
            } else if (e.target === bridgeBaseUrlInput || e.target === bridgeNameInput) {
                scanTablesBtn.click();
            }
        }
    });
});
