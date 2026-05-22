// Code Injector - Background Service Worker
// 负责自动触发和消息中转

// 安装时的初始化
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // 设置默认规则
    chrome.storage.local.set({
      injectRules: [],
      settings: {
        autoInject: true
      }
    });
    console.log('[Code Injector] 插件已安装，初始化完成');
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'executeRuleOnTab') {
    // 在指定标签页中执行规则
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'executeRule',
          rule: message.rule
        }, function (response) {
          sendResponse(response || { success: false, error: '无法连接到内容脚本' });
        });
      } else {
        sendResponse({ success: false, error: '未找到活动标签页' });
      }
    });
    return true; // 保持消息通道开启
  }

  if (message.action === 'executeAllRulesOnTab') {
    // 在指定标签页中执行所有匹配规则
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'executeAllRules'
        }, function (response) {
          sendResponse(response || { success: false, error: '无法连接到内容脚本' });
        });
      } else {
        sendResponse({ success: false, error: '未找到活动标签页' });
      }
    });
    return true;
  }

  if (message.action === 'getMatchingRulesFromTab') {
    // 获取当前页面匹配的规则
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getMatchingRules'
        }, function (response) {
          sendResponse(response || { rules: [] });
        });
      } else {
        sendResponse({ rules: [] });
      }
    });
    return true;
  }

  if (message.action === 'getSettings') {
    chrome.storage.local.get(['settings'], function (result) {
      sendResponse(result.settings || { autoInject: true });
    });
    return true;
  }

  if (message.action === 'saveSettings') {
    chrome.storage.local.set({ settings: message.settings }, function () {
      sendResponse({ success: true });
    });
    return true;
  }
});
