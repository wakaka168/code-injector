# Code Injector

一款强大的 Chrome 代码注入扩展，支持在指定网页中注入或替换 HTML、CSS、JavaScript 代码。

## 功能特性

- **多类型注入** — 支持 HTML、CSS、JavaScript 三种代码类型
- **灵活定位** — 支持 CSS 选择器和 XPath 两种元素定位方式
- **多种注入位置** — 元素前面、后面、内部开头、内部末尾、替换元素
- **网址匹配** — 支持正则表达式精确匹配目标网址
- **自动执行** — 页面加载时自动执行匹配的已启用规则
- **手动触发** — 通过弹出菜单逐条或批量运行规则
- **规则管理** — 新建、编辑、复制、删除、启用/禁用规则
- **导入导出** — 支持规则的 JSON 导入导出，方便备份和分享

## 项目结构

```
code-injector/
├── manifest.json        # 插件配置清单（Manifest V3）
├── background.js        # 后台服务（自动触发 + 消息中转）
├── content.js           # 内容脚本（执行代码注入）
├── popup.html           # 弹出菜单页面
├── popup.js             # 弹出菜单逻辑
├── options.html         # 规则配置页面
├── options.js           # 配置页面逻辑
├── options.css          # 配置页面样式
└── icons/               # 插件图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 安装步骤

1. 下载或克隆本项目到本地

2. 打开 Chrome 浏览器，在地址栏输入以下地址进入扩展管理页面：
   ```
   chrome://extensions/
   ```

3. 开启页面右上角的 **开发者模式** 开关

4. 点击左上角 **加载已解压的扩展程序** 按钮

5. 选择本项目所在的 `code-injector` 文件夹

6. 安装完成后，浏览器工具栏会出现 Code Injector 图标

## 使用方法

### 快速开始

1. 点击工具栏的 Code Injector 图标，在弹出菜单中点击 **⚙ 设置** 进入配置页面
2. 点击 **+ 新建规则** 创建一条注入规则
3. 填写规则配置（详见下方「规则配置说明」）
4. 保存规则后，访问匹配的网页即可自动执行注入

### 弹出菜单

点击工具栏图标打开弹出菜单，可以看到：

- **当前页面 URL** — 显示当前正在访问的网址
- **规则列表** — 显示所有已创建的规则，标注匹配状态
- **▶ 运行按钮** — 点击可手动执行单条规则
- **▶ 运行全部匹配规则** — 一键执行当前页面所有匹配的已启用规则
- **⚙ 设置** — 打开规则配置页面

### 配置页面

配置页面提供完整的规则管理功能：

- **全局设置** — 开启/关闭页面加载时自动执行
- **规则列表** — 查看所有规则，支持启用/禁用、编辑、复制、删除
- **数据管理** — 导出规则为 JSON 文件 / 从 JSON 文件导入规则

## 规则配置说明

每条规则包含以下配置项：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| **规则名称** | 规则的标识名称 | `注入自定义横幅` |
| **启用** | 是否启用此规则 | 勾选 |
| **网址匹配** | 目标网址的正则表达式，留空或 `*` 匹配所有网址 | `https://example\.com/.*` |
| **定位方式** | CSS 选择器或 XPath | `CSS 选择器` |
| **代码类型** | HTML / CSS / JavaScript | `HTML` |
| **目标选择器** | 定位目标元素的表达式（CSS/JS 类型可留空） | `#header` 或 `//div[@class='header']` |
| **注入位置** | before / after / append / prepend / replace | `after` |
| **匹配全部** | 是否匹配所有符合条件的元素 | 勾选 |
| **注入代码** | 要注入的代码内容 | `<div>hello</div>` |

### 注入位置详解

| 位置 | 说明 | 示例 |
|------|------|------|
| **before** | 在目标元素前面插入 | `<新代码><目标元素>` |
| **after** | 在目标元素后面插入 | `<目标元素><新代码>` |
| **append** | 在目标元素内部末尾插入 | `<目标元素>...<新代码></目标元素>` |
| **prepend** | 在目标元素内部开头插入 | `<目标元素><新代码>...</目标元素>` |
| **replace** | 替换目标元素 | `<新代码>`（原元素被移除） |

### 代码类型说明

- **HTML** — 需要指定目标选择器和注入位置，代码将作为 HTML 片段插入到页面中
- **CSS** — 无需指定选择器，代码将作为 `<style>` 标签注入到 `<head>` 中
- **JavaScript** — 无需指定选择器，代码将作为 `<script>` 标签注入到页面中

## 使用示例

### 示例 1：在页面顶部注入横幅

```
规则名称:    顶部公告横幅
网址匹配:    https://example\.com/.*
定位方式:    CSS 选择器
代码类型:    HTML
目标选择器:  body
注入位置:    prepend
匹配全部:    否
注入代码:
  <div style="background:#ff6b6b;color:white;text-align:center;padding:10px;font-size:14px;">
    系统维护通知：今晚 22:00-23:00 进行系统升级
  </div>
```

### 示例 2：覆盖页面样式

```
规则名称:    自定义暗色主题
网址匹配:    https://example\.com/.*
定位方式:    CSS 选择器
代码类型:    CSS
注入代码:
  body { background: #1a1a2e !important; color: #eee !important; }
  a { color: #667eea !important; }
```

### 示例 3：注入 JavaScript 脚本

```
规则名称:    页面性能监控
网址匹配:    https://myapp\.com/.*
定位方式:    CSS 选择器
代码类型:    JavaScript
注入代码:
  console.log('页面加载时间:', performance.timing.loadEventEnd - performance.timing.navigationStart, 'ms');
```

### 示例 4：使用 XPath 定位并替换元素

```
规则名称:    替换广告位
网址匹配:    https://news\.example\.com/.*
定位方式:    XPath
代码类型:    HTML
目标选择器:  //div[contains(@class, 'ad-banner')]
注入位置:    replace
匹配全部:    是
注入代码:
  <div style="padding:10px;background:#f0f0f0;text-align:center;color:#999;">
    广告位已替换
  </div>
```

## 技术细节

- **Manifest 版本**：V3（符合 Chrome 最新扩展标准）
- **权限说明**：
  - `storage` — 用于保存规则配置数据
  - `activeTab` — 用于获取当前标签页信息
  - `scripting` — 用于在页面中注入脚本
  - `<all_urls>` — 允许在所有网页中执行注入
- **数据存储**：使用 `chrome.storage.local` 存储规则配置
- **消息通信**：通过 `chrome.runtime.onMessage` 实现 popup、background、content script 之间的通信

## 注意事项

- 本扩展需要 `<all_urls>` 权限才能在任意网页中注入代码
- 注入的 JavaScript 代码在页面上下文中执行，请注意安全性
- 正则表达式中的特殊字符需要转义（如 `.` 需写成 `\.`）
- 如果自动注入未生效，可能是页面加载时内容脚本尚未就绪，可通过弹出菜单手动触发
- 导入规则时会自动生成新的 ID，不会覆盖已有规则

## 开发调试

1. 在 `chrome://extensions/` 页面找到 Code Injector
2. 点击 **刷新** 按钮重新加载扩展
3. 点击 **Service Worker** 链接查看后台日志
4. 在目标网页中按 F12 打开开发者工具，在 Console 中查看 `[Code Injector]` 开头的日志

## License

MIT
