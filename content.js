// Code Injector - Content Script
// 负责在页面中执行代码注入

(function () {
  'use strict';

  // 默认规则数据结构
  const DEFAULT_RULES = [];

  // 从 storage 加载规则
  function loadRules(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['injectRules'], function (result) {
        const rules = result.injectRules || DEFAULT_RULES;
        callback(rules);
      });
    } else {
      callback(DEFAULT_RULES);
    }
  }

  // 判断 URL 是否匹配规则
  function isUrlMatch(currentUrl, pattern) {
    if (!pattern || pattern.trim() === '*') return true;
    try {
      const regex = new RegExp(pattern);
      return regex.test(currentUrl);
    } catch (e) {
      // 如果不是正则，尝试简单字符串匹配
      return currentUrl.includes(pattern);
    }
  }

  // 通过 XPath 查找元素
  function findByXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  }

  // 通过 XPath 查找所有匹配元素
  function findAllByXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }
    return nodes;
  }

  // 查找目标元素
  function findTarget(selector, selectorType, matchAll) {
    if (selectorType === 'xpath') {
      return matchAll ? findAllByXPath(selector) : findByXPath(selector);
    } else {
      // CSS 选择器
      return matchAll ? document.querySelectorAll(selector) : document.querySelector(selector);
    }
  }

  // 注入 CSS
  function injectCSS(cssCode) {
    const style = document.createElement('style');
    style.textContent = cssCode;
    document.head.appendChild(style);
    return style;
  }

  // 注入 JavaScript
  function injectJS(jsCode) {
    const script = document.createElement('script');
    script.textContent = jsCode;
    (document.head || document.documentElement).appendChild(script);
    return script;
  }

  // 执行单条规则
  function executeRule(rule) {
    const currentUrl = window.location.href;
    if (!rule.enabled) return false;
    if (!isUrlMatch(currentUrl, rule.urlPattern)) return false;

    const {
      selector,
      selectorType = 'css',
      injectPosition = 'after', // before, after, replace, append, prepend
      contentType = 'html', // html, css, js
      code,
      matchAll = false
    } = rule;

    if (!selector || !code) return false;

    try {
      // CSS 和 JS 类型不需要定位元素，直接注入
      if (contentType === 'css') {
        injectCSS(code);
        console.log('[Code Injector] CSS 注入成功:', rule.name);
        return true;
      }

      if (contentType === 'js') {
        injectJS(code);
        console.log('[Code Injector] JS 注入成功:', rule.name);
        return true;
      }

      // HTML 类型需要定位元素
      const target = findTarget(selector, selectorType, matchAll);
      if (!target) {
        console.warn('[Code Injector] 未找到目标元素:', selector, '规则:', rule.name);
        return false;
      }

      const targets = matchAll && selectorType === 'css'
        ? document.querySelectorAll(selector)
        : matchAll && selectorType === 'xpath'
          ? findAllByXPath(selector)
          : [target];

      targets.forEach((el) => {
        switch (injectPosition) {
          case 'before':
            el.insertAdjacentHTML('beforebegin', code);
            break;
          case 'after':
            el.insertAdjacentHTML('afterend', code);
            break;
          case 'replace':
            el.outerHTML = code;
            break;
          case 'append':
            el.insertAdjacentHTML('beforeend', code);
            break;
          case 'prepend':
            el.insertAdjacentHTML('afterbegin', code);
            break;
          default:
            el.insertAdjacentHTML('afterend', code);
        }
      });

      console.log('[Code Injector] HTML 注入成功:', rule.name, `(${targets.length} 个元素)`);
      return true;
    } catch (e) {
      console.error('[Code Injector] 规则执行失败:', rule.name, e);
      return false;
    }
  }

  // 自动执行所有匹配规则
  function autoExecuteRules() {
    loadRules(function (rules) {
      const enabledRules = rules.filter(r => r.enabled);
      if (enabledRules.length === 0) return;

      let executedCount = 0;
      enabledRules.forEach(rule => {
        if (executeRule(rule)) {
          executedCount++;
        }
      });

      if (executedCount > 0) {
        console.log(`[Code Injector] 自动执行完成，成功 ${executedCount}/${enabledRules.length} 条规则`);
      }
    });
  }

  // 监听来自 popup 或 background 的消息
  function setupMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action === 'executeRule') {
          // 执行指定规则
          const success = executeRule(message.rule);
          sendResponse({ success: success });
          return true;
        }

        if (message.action === 'executeAllRules') {
          // 执行所有匹配规则
          loadRules(function (rules) {
            const enabledRules = rules.filter(r => r.enabled);
            let successCount = 0;
            enabledRules.forEach(rule => {
              if (executeRule(rule)) successCount++;
            });
            sendResponse({ success: true, count: successCount, total: enabledRules.length });
          });
          return true;
        }

        if (message.action === 'getMatchingRules') {
          // 获取当前页面匹配的规则
          loadRules(function (rules) {
            const currentUrl = window.location.href;
            const matching = rules.filter(r => r.enabled && isUrlMatch(currentUrl, r.urlPattern));
            sendResponse({ rules: matching });
          });
          return true;
        }
      });
    }
  }

  // 初始化
  setupMessageListener();

  // 页面加载后自动执行
  if (document.readyState === 'complete') {
    autoExecuteRules();
  } else {
    window.addEventListener('load', autoExecuteRules);
  }
})();
