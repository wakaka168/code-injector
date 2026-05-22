// Code Injector - Popup Script

(function () {
  'use strict';

  const rulesContainer = document.getElementById('rulesContainer');
  const emptyState = document.getElementById('emptyState');
  const currentUrlEl = document.getElementById('currentUrl');
  const settingsBtn = document.getElementById('settingsBtn');
  const goSettings = document.getElementById('goSettings');
  const runAllBtn = document.getElementById('runAllBtn');
  const footer = document.getElementById('footer');
  const matchInfo = document.getElementById('matchInfo');

  // 判断 URL 是否匹配规则
  function isUrlMatch(currentUrl, pattern) {
    if (!pattern || pattern.trim() === '*') return true;
    try {
      const regex = new RegExp(pattern);
      return regex.test(currentUrl);
    } catch (e) {
      return currentUrl.includes(pattern);
    }
  }

  // 加载并渲染规则
  function loadAndRenderRules() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      const tabUrl = tabs[0].url;
      currentUrlEl.textContent = tabUrl;

      chrome.storage.local.get(['injectRules'], function (result) {
        const rules = result.injectRules || [];

        if (rules.length === 0) {
          emptyState.style.display = 'block';
          footer.style.display = 'none';
          return;
        }

        emptyState.style.display = 'none';
        rulesContainer.innerHTML = '';

        let matchCount = 0;

        rules.forEach(function (rule) {
          const isMatch = isUrlMatch(tabUrl, rule.urlPattern);
          if (isMatch && rule.enabled) matchCount++;

          const item = document.createElement('div');
          item.className = 'rule-item' + (rule.enabled ? '' : ' disabled');

          const typeLabel = { html: 'HTML', css: 'CSS', js: 'JS' };

          item.innerHTML =
            '<div class="rule-info">' +
            '  <div class="rule-name">' + escapeHtml(rule.name) + '</div>' +
            '  <div class="rule-meta">' +
            '    <span class="tag">' + typeLabel[rule.contentType] + '</span>' +
            '    <span class="tag ' + (isMatch ? 'matched' : 'unmatched') + '">' +
            (isMatch ? '匹配' : '不匹配') +
            '    </span>' +
            (rule.enabled ? '' : '<span class="tag">已禁用</span>') +
            '  </div>' +
            '</div>' +
            '<button class="run-btn" data-rule-id="' + rule.id + '"' +
            (!rule.enabled || !isMatch ? ' disabled' : '') +
            '>▶ 运行</button>';

          rulesContainer.appendChild(item);
        });

        // 绑定运行按钮事件
        rulesContainer.querySelectorAll('.run-btn:not([disabled])').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const ruleId = this.getAttribute('data-rule-id');
            const rule = rules.find(function (r) { return r.id === ruleId; });
            if (!rule) return;

            executeRule(rule, this);
          });
        });

        // 显示底部
        if (matchCount > 0) {
          footer.style.display = 'flex';
          matchInfo.textContent = matchCount + '/' + rules.length + ' 条匹配';
        } else {
          footer.style.display = 'none';
        }
      });
    });
  }

  // HTML 转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 执行单条规则
  function executeRule(rule, btnEl) {
    const originalText = btnEl.textContent;
    btnEl.textContent = '执行中...';
    btnEl.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        btnEl.textContent = originalText;
        btnEl.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'executeRule',
        rule: rule
      }, function (response) {
        if (chrome.runtime.lastError) {
          // 内容脚本未加载，尝试注入
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, function () {
            // 注入后重试
            setTimeout(function () {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'executeRule',
                rule: rule
              }, function (retryResponse) {
                handleResponse(retryResponse, btnEl, originalText);
              });
            }, 300);
          });
        } else {
          handleResponse(response, btnEl, originalText);
        }
      });
    });

    function handleResponse(response, btn, original) {
      if (response && response.success) {
        btn.textContent = '✓ 成功';
        btn.classList.add('success');
      } else {
        btn.textContent = '✗ 失败';
        btn.classList.add('error');
      }
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('success', 'error');
        btn.disabled = false;
      }, 2000);
    }
  }

  // 运行全部匹配规则
  runAllBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      const originalText = runAllBtn.textContent;
      runAllBtn.textContent = '执行中...';
      runAllBtn.disabled = true;

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'executeAllRules'
      }, function (response) {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, function () {
            setTimeout(function () {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'executeAllRules'
              }, function (retryResponse) {
                handleAllResponse(retryResponse);
              });
            }, 300);
          });
        } else {
          handleAllResponse(response);
        }

        function handleAllResponse(resp) {
          if (resp && resp.success) {
            runAllBtn.textContent = '✓ 成功 ' + resp.count + '/' + resp.total;
            runAllBtn.style.background = '#2ed573';
          } else {
            runAllBtn.textContent = '✗ 执行失败';
            runAllBtn.style.background = '#ff4757';
          }
          setTimeout(function () {
            runAllBtn.textContent = originalText;
            runAllBtn.style.background = '#667eea';
            runAllBtn.disabled = false;
          }, 2000);
        }
      });
    });
  });

  // 打开设置页面
  settingsBtn.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });

  goSettings.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // 初始化
  loadAndRenderRules();
})();
