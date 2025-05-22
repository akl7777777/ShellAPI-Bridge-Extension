// 后台服务工作脚本
// 处理插件安装和更新事件

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('插件已安装');

        // 设置默认配置
        const defaultSettings = {
            requestMethod: 'GET',
            requestUrl: 'https://jsonplaceholder.typicode.com/posts/1',
            requestData: '',
            baseUrl: 'https://kfcv50.link',
            urlParam: '浏览器插件开发',
            bridgeBaseUrl: 'https://kfcv50.link',
            bridgeName: 'KFC V50 API 一键对接',
            accessToken: ''
        };

        chrome.storage.sync.set({settings: defaultSettings});
    } else if (details.reason === 'update') {
        console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
    }
});

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makeRequest') {
        // 处理HTTP请求
        fetch(request.url, request.options)
            .then(response => response.text())
            .then(data => {
                sendResponse({success: true, data: data});
            })
            .catch(error => {
                sendResponse({success: false, error: error.message});
            });

        // 返回true表示异步发送响应
        return true;
    }

    if (request.action === 'openTab') {
        // 打开新标签页
        chrome.tabs.create({url: request.url}, (tab) => {
            sendResponse({success: true, tabId: tab.id});
        });

        return true;
    }
});

// 处理标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('页面加载完成:', tab.url);
    }
});

// 添加右键菜单（可选功能）
chrome.contextMenus.create({
    id: "autoRequest",
    title: "发送自动请求",
    contexts: ["page"]
});

chrome.contextMenus.create({
    id: "quickJump",
    title: "快速跳转",
    contexts: ["selection"]
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "autoRequest") {
        // 触发自动请求
        chrome.storage.sync.get('settings', (result) => {
            if (result.settings && result.settings.requestUrl) {
                fetch(result.settings.requestUrl)
                    .then(response => response.text())
                    .then(data => console.log('自动请求完成:', data))
                    .catch(error => console.error('自动请求失败:', error));
            }
        });
    }

    if (info.menuItemId === "quickJump" && info.selectionText) {
        // 使用选中的文字进行快速跳转
        chrome.storage.sync.get('settings', (result) => {
            if (result.settings && result.settings.baseUrl) {
                const url = result.settings.baseUrl + encodeURIComponent(info.selectionText);
                chrome.tabs.create({url: url});
            }
        });
    }
});
