// Code Injector - Options Page Script

(function () {
  'use strict';

  // DOM 元素
  const rulesList = document.getElementById('rulesList');
  const emptyState = document.getElementById('emptyState');
  const addRuleBtn = document.getElementById('addRuleBtn');
  const ruleModal = document.getElementById('ruleModal');
  const modalTitle = document.getElementById('modalTitle');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const autoInjectCheckbox = document.getElementById('autoInject');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  // 表单字段
  const ruleIdField = document.getElementById('ruleId');
  const ruleNameField = document.getElementById('ruleName');
  const ruleEnabledField = document.getElementById('ruleEnabled');
  const urlPatternField = document.getElementById('urlPattern');
  const selectorTypeField = document.getElementById('selectorType');
  const contentTypeField = document.getElementById('contentType');
  const selectorField = document.getElementById('selector');
  const injectPositionField = document.getElementById('injectPosition');
  const matchAllField = document.getElementById('matchAll');
  const codeField = document.getElementById('code');
  const selectorGroup = document.getElementById('selectorGroup');
  const positionGroup = document.getElementById('positionGroup');

  let editingRuleId = null;

  // 生成唯一 ID
  function generateId() {
    return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 显示通知
  function showToast(message, type) {
    type = type || 'info';
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3000);
  }

  // 加载规则
  function loadRules(callback) {
    chrome.storage.local.get(['injectRules'], function (result) {
      const rules = result.injectRules || [];
      callback(rules);
    });
  }

  // 保存规则
  function saveRules(rules, callback) {
    chrome.storage.local.set({ injectRules: rules }, function () {
      if (callback) callback();
    });
  }

  // 渲染规则列表
  function renderRules() {
    loadRules(function (rules) {
      rulesList.innerHTML = '';

      if (rules.length === 0) {
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      rules.forEach(function (rule) {
        const card = document.createElement('div');
        card.className = 'rule-card' + (rule.enabled ? '' : ' disabled');

        const typeLabel = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
        const positionLabel = {
          before: '前面', after: '后面', replace: '替换',
          append: '内部末尾', prepend: '内部开头'
        };

        let metaHtml = '<span class="tag type-' + rule.contentType + '">' + typeLabel[rule.contentType] + '</span>';
        if (rule.contentType === 'html') {
          metaHtml += '<span class="tag">' + positionLabel[rule.injectPosition] + '</span>';
        }
        if (rule.selectorType === 'xpath') {
          metaHtml += '<span class="tag">XPath</span>';
        }
        if (rule.matchAll) {
          metaHtml += '<span class="tag">匹配全部</span>';
        }
        if (rule.urlPattern && rule.urlPattern !== '*') {
          metaHtml += '<span class="tag">' + escapeHtml(rule.urlPattern) + '</span>';
        }

        card.innerHTML =
          '<div class="rule-card-header">' +
          '  <span class="rule-card-name">' + escapeHtml(rule.name) + '</span>' +
          '  <div class="rule-card-actions">' +
          '    <button class="btn btn-sm btn-secondary" data-action="toggle" data-id="' + rule.id + '">' +
          (rule.enabled ? '禁用' : '启用') +
          '    </button>' +
          '    <button class="btn btn-sm btn-secondary" data-action="edit" data-id="' + rule.id + '">编辑</button>' +
          '    <button class="btn btn-sm btn-secondary" data-action="duplicate" data-id="' + rule.id + '">复制</button>' +
          '    <button class="btn btn-sm btn-danger" data-action="delete" data-id="' + rule.id + '">删除</button>' +
          '  </div>' +
          '</div>' +
          '<div class="rule-card-meta">' + metaHtml + '</div>';

        rulesList.appendChild(card);
      });

      // 绑定事件
      rulesList.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const action = this.getAttribute('data-action');
          const id = this.getAttribute('data-id');
          handleRuleAction(action, id);
        });
      });
    });
  }

  // HTML 转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 处理规则操作
  function handleRuleAction(action, id) {
    loadRules(function (rules) {
      const index = rules.findIndex(function (r) { return r.id === id; });
      if (index === -1) return;

      switch (action) {
        case 'toggle':
          rules[index].enabled = !rules[index].enabled;
          saveRules(rules, function () {
            renderRules();
            showToast(rules[index].enabled ? '规则已启用' : '规则已禁用', 'info');
          });
          break;

        case 'edit':
          openEditModal(rules[index]);
          break;

        case 'duplicate':
          var duplicated = JSON.parse(JSON.stringify(rules[index]));
          duplicated.id = generateId();
          duplicated.name = duplicated.name + ' (副本)';
          rules.splice(index + 1, 0, duplicated);
          saveRules(rules, function () {
            renderRules();
            showToast('规则已复制', 'success');
          });
          break;

        case 'delete':
          if (confirm('确定要删除规则 "' + rules[index].name + '" 吗？')) {
            rules.splice(index, 1);
            saveRules(rules, function () {
              renderRules();
              showToast('规则已删除', 'info');
            });
          }
          break;
      }
    });
  }

  // 打开新建弹窗
  function openNewModal() {
    editingRuleId = null;
    modalTitle.textContent = '新建规则';
    ruleIdField.value = '';
    ruleNameField.value = '';
    ruleEnabledField.checked = true;
    urlPatternField.value = '';
    selectorTypeField.value = 'css';
    contentTypeField.value = 'html';
    selectorField.value = '';
    injectPositionField.value = 'after';
    matchAllField.checked = false;
    codeField.value = '';
    updateFormVisibility();
    ruleModal.classList.add('active');
  }

  // 打开编辑弹窗
  function openEditModal(rule) {
    editingRuleId = rule.id;
    modalTitle.textContent = '编辑规则';
    ruleIdField.value = rule.id;
    ruleNameField.value = rule.name;
    ruleEnabledField.checked = rule.enabled;
    urlPatternField.value = rule.urlPattern || '';
    selectorTypeField.value = rule.selectorType || 'css';
    contentTypeField.value = rule.contentType || 'html';
    selectorField.value = rule.selector || '';
    injectPositionField.value = rule.injectPosition || 'after';
    matchAllField.checked = rule.matchAll || false;
    codeField.value = rule.code || '';
    updateFormVisibility();
    ruleModal.classList.add('active');
  }

  // 关闭弹窗
  function closeModalFn() {
    ruleModal.classList.remove('active');
    editingRuleId = null;
  }

  // 根据代码类型显示/隐藏相关字段
  function updateFormVisibility() {
    const contentType = contentTypeField.value;
    if (contentType === 'css' || contentType === 'js') {
      selectorGroup.style.display = 'none';
      positionGroup.style.display = 'none';
    } else {
      selectorGroup.style.display = 'block';
      positionGroup.style.display = 'block';
    }
  }

  // 保存规则
  function saveRule() {
    const name = ruleNameField.value.trim();
    if (!name) {
      showToast('请输入规则名称', 'error');
      return;
    }

    const contentType = contentTypeField.value;
    const code = codeField.value.trim();
    if (!code) {
      showToast('请输入注入代码', 'error');
      return;
    }

    if (contentType === 'html') {
      const selector = selectorField.value.trim();
      if (!selector) {
        showToast('HTML 类型需要填写目标选择器', 'error');
        return;
      }
    }

    const rule = {
      id: editingRuleId || generateId(),
      name: name,
      enabled: ruleEnabledField.checked,
      urlPattern: urlPatternField.value.trim() || '*',
      selectorType: selectorTypeField.value,
      contentType: contentType,
      selector: selectorField.value.trim(),
      injectPosition: injectPositionField.value,
      matchAll: matchAllField.checked,
      code: code
    };

    loadRules(function (rules) {
      if (editingRuleId) {
        const index = rules.findIndex(function (r) { return r.id === editingRuleId; });
        if (index !== -1) {
          rules[index] = rule;
        }
      } else {
        rules.push(rule);
      }
      saveRules(rules, function () {
        closeModalFn();
        renderRules();
        showToast(editingRuleId ? '规则已更新' : '规则已创建', 'success');
      });
    });
  }

  // 加载全局设置
  function loadSettings() {
    chrome.storage.local.get(['settings'], function (result) {
      const settings = result.settings || { autoInject: true };
      autoInjectCheckbox.checked = settings.autoInject;
    });
  }

  // 保存全局设置
  function saveSettings() {
    const settings = {
      autoInject: autoInjectCheckbox.checked
    };
    chrome.storage.local.set({ settings: settings }, function () {
      showToast('设置已保存', 'success');
    });
  }

  // 导出规则
  function exportRules() {
    loadRules(function (rules) {
      const data = JSON.stringify(rules, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code-injector-rules.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('规则已导出', 'success');
    });
  }

  // 导入规则
  function importRules(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedRules = JSON.parse(e.target.result);
        if (!Array.isArray(importedRules)) {
          showToast('无效的规则文件格式', 'error');
          return;
        }

        loadRules(function (existingRules) {
          // 为导入的规则生成新 ID
          importedRules.forEach(function (rule) {
            rule.id = generateId();
          });
          const mergedRules = existingRules.concat(importedRules);
          saveRules(mergedRules, function () {
            renderRules();
            showToast('成功导入 ' + importedRules.length + ' 条规则', 'success');
          });
        });
      } catch (err) {
        showToast('文件解析失败: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // 事件绑定
  addRuleBtn.addEventListener('click', openNewModal);
  closeModal.addEventListener('click', closeModalFn);
  cancelBtn.addEventListener('click', closeModalFn);
  saveBtn.addEventListener('click', saveRule);
  autoInjectCheckbox.addEventListener('change', saveSettings);
  contentTypeField.addEventListener('change', updateFormVisibility);

  exportBtn.addEventListener('click', exportRules);
  importBtn.addEventListener('click', function () {
    importFile.click();
  });
  importFile.addEventListener('change', function () {
    if (this.files.length > 0) {
      importRules(this.files[0]);
      this.value = '';
    }
  });

  // 点击弹窗外部关闭
  ruleModal.addEventListener('click', function (e) {
    if (e.target === ruleModal) {
      closeModalFn();
    }
  });

  // ESC 关闭弹窗
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ruleModal.classList.contains('active')) {
      closeModalFn();
    }
  });

  // 初始化
  loadSettings();
  renderRules();
})();
