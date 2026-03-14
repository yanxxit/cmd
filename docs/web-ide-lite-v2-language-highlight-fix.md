# Web IDE Lite v2 - 语言切换和高亮修复

## 问题描述

1. 切换语言后，页面没有随着变化
2. 代码没有高亮效果

## 问题原因

1. **computed.js 中的问题**：
   - `highlightedCode` 计算属性在 Prism 语言未加载时没有触发重新渲染
   - 语言加载后没有响应式更新

2. **editor-actions.js 中的问题**：
   - `changeLanguage` 函数没有强制触发 Vue 响应式更新
   - 语言组件加载后没有更新高亮显示

3. **prism-loader.js 中的问题**：
   - CDN 路径使用外部链接，应该使用本地 `/libs/prismjs/components/`

## 修复内容

### 1. computed.js

```javascript
// 修复前
highlightedCode: vueComputed(() => {
  if (!state.editorContent.value || !state.currentLanguage.value) {
    return state.editorContent.value || '';
  }
  const lang = state.currentLanguage.value;
  if (window.Prism?.languages[lang]) {
    try {
      return window.Prism.highlight(state.editorContent.value, window.Prism.languages[lang], lang);
    } catch (e) { console.warn('Prism 高亮失败:', e); }
  }
  return state.editorContent.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
})

// 修复后
highlightedCode: computed(() => {
  const code = state.editorContent.value || '';
  const lang = state.currentLanguage.value || 'plaintext';
  
  // 纯文本不需要高亮
  if (lang === 'plaintext' || !code) {
    return escapeHtml(code);
  }
  
  // 检查 Prism 是否可用
  if (!window.Prism || !window.Prism.languages[lang]) {
    // 尝试使用 PrismLoader 加载
    if (window.PrismLoader) {
      window.PrismLoader.loadLanguage(lang).then(() => {
        // 加载完成后触发重新渲染
        state.currentLanguage.value = state.currentLanguage.value;
      }).catch(() => {});
    }
    return escapeHtml(code);
  }
  
  // 使用 Prism 高亮
  try {
    return window.Prism.highlight(code, window.Prism.languages[lang], lang);
  } catch (e) {
    console.warn('Prism 高亮失败:', e);
    return escapeHtml(code);
  }
})
```

**改进：**
- 添加了 `escapeHtml` 函数用于转义 HTML
- 在语言组件加载后触发重新渲染
- 更好的错误处理

### 2. editor-actions.js

```javascript
// 修复前
const changeLanguage = async () => {
  if (!state.currentFile.value) return;
  if (window.PrismLoader) await window.PrismLoader.loadLanguage(state.currentLanguage.value);
  state.currentFile.value.language = state.currentLanguage.value;
  showToast(`✅ 语言已切换为 ${state.currentLanguage.value}`, 'success');
};

// 修复后
const changeLanguage = async () => {
  if (!state.currentFile.value) return;
  
  const lang = state.currentLanguage.value;
  
  // 加载语言组件
  if (window.PrismLoader) {
    try {
      await window.PrismLoader.loadLanguage(lang);
    } catch (err) {
      console.warn('加载语言组件失败:', err);
    }
  }
  
  // 更新文件语言
  state.currentFile.value.language = lang;
  
  // 强制触发 Vue 响应式更新
  state.editorContent.value = state.editorContent.value;
  
  showToast(`✅ 语言已切换为 ${lang}`, 'success');
};
```

**改进：**
- 添加了错误处理
- 强制触发响应式更新：`state.editorContent.value = state.editorContent.value;`
- 使用局部变量 `lang` 避免响应式问题

### 3. prism-loader.js

```javascript
// 修复前
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/';

// 修复后
const CDN_BASE = '/libs/prismjs/components/';
```

**改进：**
- 使用本地路径，减少外部依赖
- 提高加载速度

## 测试方法

1. 启动服务器：
```bash
x-static
```

2. 访问 Web IDE：
```
http://127.0.0.1:3000/web-ide-lite-v2/
```

3. 测试步骤：
   - 打开或创建一个文件
   - 在底部状态栏选择不同语言
   - 检查代码高亮是否生效
   - 检查 Toast 提示是否显示

## 支持的语言

| 扩展名 | 语言 | 扩展名 | 语言 |
|--------|------|--------|------|
| .js, .jsx | JavaScript | .py | Python |
| .ts, .tsx | TypeScript | .go | Go |
| .html, .htm | HTML | .css, .scss | CSS/SCSS |
| .json | JSON | .md | Markdown |
| .yaml, .yml | YAML | .sh, .bash | Bash |
| .sql | SQL | .xml | XML |

## 技术细节

### Vue 响应式更新

在 Vue 3 中，修改响应式对象的值会自动触发重新渲染。但是，如果只是想触发计算属性重新计算，可以重新赋值相同的值：

```javascript
state.editorContent.value = state.editorContent.value;
```

这会触发 `highlightedCode` 计算属性重新计算，从而更新高亮。

### Prism 语言加载

Prism 语言组件是按需加载的。当用户切换语言时：

1. 检查语言是否已加载
2. 如果未加载，动态创建 `<script>` 标签
3. 加载完成后，语言组件添加到 `window.Prism.languages`
4. 触发 Vue 响应式更新，重新计算高亮

### 错误处理

```javascript
try {
  await window.PrismLoader.loadLanguage(lang);
} catch (err) {
  console.warn('加载语言组件失败:', err);
}
```

即使语言加载失败，应用也能正常运行，只是没有语法高亮。

## 相关文件

- `/public/web-ide-lite-v2/js/computed.js` - 计算属性
- `/public/web-ide-lite-v2/js/actions/editor-actions.js` - 编辑器操作
- `/public/shared/prism-loader.js` - Prism 语言加载器
- `/public/web-ide-lite-v2/index.html` - 主页面

## 后续优化建议

1. **预加载常用语言**：在应用启动时预加载 JavaScript、TypeScript、Python 等常用语言
2. **懒加载优化**：使用 Intersection Observer 延迟加载不可见区域的语言组件
3. **缓存策略**：使用 Service Worker 缓存语言组件
4. **自定义语言**：支持用户自定义语言高亮规则
