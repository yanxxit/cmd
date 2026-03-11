# 文件上传接口执行步骤文档

## 概述

本文档详细记录了 file-viewer 文件上传功能的完整执行流程，包括前端和后端的每一步操作，方便人工验证和调试。

---

## 上传流程图

```
用户操作（拖拽/点击）
    ↓
前端：uploadFiles()
    ↓
前端：计算相对路径
    ↓
前端：uploadFile() - XMLHttpRequest
    ↓
后端：/api/file/upload-to
    ↓
后端：路径验证
    ↓
后端：formidable 解析文件
    ↓
后端：文件重命名（临时文件 → 目标位置）
    ↓
后端：返回上传结果
    ↓
前端：刷新文件列表
```

---

## 详细执行步骤

### 步骤 1：用户触发上传

**触发方式**:
- 拖拽文件到页面
- 点击上传按钮
- 快捷键 `Ctrl/Cmd + U`

**前端代码位置**: `public/file-viewer/app.js` - `initUploadHandlers()`

---

### 步骤 2：计算上传路径

**函数**: `uploadFiles(files)`

**执行逻辑**:
```javascript
// 1. 获取当前路径和根路径
const uploadPath = getRelativePath(state.currentPath, state.rootPath);

// 2. 计算相对路径（相对于 rootPath）
// 例如：
// - currentPath: /Users/mac/github/cmd/public/file-viewer
// - rootPath: /Users/mac/github/cmd
// - 结果：public/file-viewer
```

**验证点**:
- [ ] `state.currentPath` 有值
- [ ] `state.rootPath` 有值
- [ ] 计算的相对路径正确

**调试代码**:
```javascript
console.log('上传路径信息:', {
  currentPath: state.currentPath,
  rootPath: state.rootPath,
  uploadPath: uploadPath
});
```

---

### 步骤 3：创建 FormData 并发送请求

**函数**: `uploadFile(file, uploadPath)`

**执行逻辑**:
```javascript
// 1. 创建 FormData
const formData = new FormData();
formData.append('file', file);

// 2. 创建 XMLHttpRequest
const xhr = new XMLHttpRequest();

// 3. 打开 POST 请求（带路径参数）
xhr.open('POST', `/api/file/upload-to?path=${encodeURIComponent(uploadPath)}`, true);

// 4. 发送请求
xhr.send(formData);
```

**验证点**:
- [ ] FormData 正确创建
- [ ] 文件正确添加到 FormData
- [ ] URL 路径参数正确编码

**调试代码** (在浏览器控制台):
```javascript
// 监听上传进度
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percent = (e.loaded / e.total) * 100;
    console.log('上传进度:', percent.toFixed(2) + '%');
  }
});
```

---

### 步骤 4：后端接收请求

**接口**: `POST /api/file/upload-to`

**后端代码位置**: `src/http-server/file-viewer.js`

**执行逻辑**:
```javascript
// 1. 获取路径参数
const targetPath = req.query.path;  // 解码后的路径

// 2. 获取根目录
const rootDir = req.app.get('fileViewerRoot') || process.cwd();

// 3. 构建目标路径（统一使用绝对路径）
let safeTargetPath;
if (path.isAbsolute(targetPath)) {
  safeTargetPath = path.resolve(targetPath);
} else {
  safeTargetPath = path.resolve(rootDir, targetPath);
}

// 日志输出
console.log('文件上传：目标路径 =', safeTargetPath);
```

**验证点**:
- [ ] `req.query.path` 有值
- [ ] `rootDir` 正确
- [ ] `safeTargetPath` 计算正确

**预期日志**:
```
文件上传：目标路径 = /Users/mac/github/cmd/public/file-viewer
```

---

### 步骤 5：路径安全检查

**函数**: `safePath(safeTargetPath, rootDir)`

**执行逻辑**:
```javascript
function safePath(requestedPath, rootDir) {
  // 1. 标准化路径
  const normalizedRoot = path.resolve(rootDir);
  const normalizedRequested = path.resolve(requestedPath);

  // 2. 检查是否在根目录内
  if (!normalizedRequested.startsWith(normalizedRoot)) {
    return null;  // 路径不安全
  }

  return normalizedRequested;  // 路径安全
}
```

**验证点**:
- [ ] 目标路径在 `rootDir` 内
- [ ] 防止路径遍历攻击（`../`）

**错误日志** (如果路径不安全):
```
上传失败：路径不安全 { targetPath: 'xxx', rootDir: 'xxx' }
```

---

### 步骤 6：验证目标路径存在

**执行逻辑**:
```javascript
if (!fs.existsSync(safeTargetPath)) {
  console.error('上传失败：目标路径不存在', { safeTargetPath });
  return res.status(404).json({
    success: false,
    error: '目标路径不存在'
  });
}
```

**验证点**:
- [ ] 目标目录存在
- [ ] 有写入权限

**错误日志** (如果路径不存在):
```
上传失败：目标路径不存在 { safeTargetPath: '/Users/mac/github/cmd/public/file-viewer' }
```

---

### 步骤 7：解析上传文件

**库**: formidable

**执行逻辑**:
```javascript
const formidableModule = await import('formidable');
const formidable = formidableModule.default;

const form = formidable({
  uploadDir: safeTargetPath,    // 上传目录
  keepExtensions: true,          // 保留扩展名
  maxFileSize: 100 * 1024 * 1024, // 最大 100MB
  multiples: true                // 支持多文件
});

form.parse(req, (err, fields, files) => {
  // 处理解析结果
});
```

**验证点**:
- [ ] formidable 正确导入
- [ ] 配置正确
- [ ] 文件解析成功

**日志输出**:
```
上传文件数量：1
```

---

### 步骤 8：文件重命名（临时文件 → 目标位置）

**执行逻辑**:
```javascript
const fileArray = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];

for (const file of fileArray) {
  // 1. 获取原始文件名
  const fileName = file.originalFilename || file.newFilename;
  
  // 2. 构建新路径
  const newPath = path.join(safeTargetPath, fileName);
  
  // 3. 移动文件（重命名）
  console.log('保存文件:', newPath);
  fs.renameSync(file.filepath, newPath);
  
  // 4. 获取文件信息
  const stats = fs.statSync(newPath);
  uploadedFiles.push({
    name: fileName,
    path: newPath,
    relativePath: path.relative(rootDir, newPath),
    size: formatFileSize(stats.size),
    modified: stats.mtime.toISOString()
  });
}
```

**验证点**:
- [ ] 临时文件存在
- [ ] 目标路径可写
- [ ] 文件重命名成功

**预期日志**:
```
保存文件：/Users/mac/github/cmd/public/file-viewer/test.pdf
```

---

### 步骤 9：返回上传结果

**响应格式**:
```javascript
res.json({
  success: true,
  data: {
    uploaded: uploadedFiles,
    count: uploadedFiles.length,
    targetPath: safeTargetPath
  }
});
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "name": "test.pdf",
        "path": "/Users/mac/github/cmd/public/file-viewer/test.pdf",
        "relativePath": "public/file-viewer/test.pdf",
        "size": {"bytes": 102400, "formatted": "100.0 KB"},
        "modified": "2026-03-10T12:00:00Z"
      }
    ],
    "count": 1,
    "targetPath": "/Users/mac/github/cmd/public/file-viewer"
  }
}
```

---

### 步骤 10：前端处理响应

**函数**: `uploadFile(file, uploadPath)`

**执行逻辑**:
```javascript
xhr.onload = () => {
  if (xhr.status === 200) {
    try {
      const result = JSON.parse(xhr.responseText);
      if (result.success) {
        resolve(result.data);  // 上传成功
      } else {
        reject(new Error(result.error || '上传失败'));  // 业务错误
      }
    } catch (e) {
      reject(e);  // JSON 解析错误
    }
  } else {
    reject(new Error('上传失败：' + xhr.status));  // HTTP 错误
  }
};
```

**验证点**:
- [ ] 响应状态码 200
- [ ] `result.success === true`
- [ ] 文件信息正确

---

### 步骤 11：更新上传进度

**函数**: `uploadNext()`

**执行逻辑**:
```javascript
uploadFile(file, uploadPath)
  .then(() => {
    uploaded++;
    loadedSize += file.size;
    updateProgress(uploaded + failed, files.length, loadedSize, totalSize);
    uploadNext();  // 上传下一个
  })
  .catch((err) => {
    console.error('上传文件失败:', file.name, err);
    failed++;
    updateProgress(uploaded + failed, files.length, loadedSize, totalSize);
    uploadNext();
  });
```

**进度更新函数**: `updateProgress(completed, total, loadedSize, totalSize)`

**UI 显示**:
```
已上传 1/3 个文件 (1.5 MB/5.0 MB)
[████████████░░░░░░░░] 33%
```

---

### 步骤 12：上传完成，刷新文件列表

**函数**: `uploadFiles(files)`

**执行逻辑**:
```javascript
if (uploadQueue.length === 0) {
  // 上传完成
  setTimeout(() => {
    hideUploadProgress();
    showUploadComplete(uploaded, failed);
    // 刷新文件列表
    loadFiles(state.currentPath);
  }, 1000);
  return;
}
```

**验证点**:
- [ ] 进度条隐藏
- [ ] 文件列表刷新
- [ ] 新上传的文件显示在列表中

---

## 人工验证清单

### 前端验证

- [ ] **步骤 2**: 在浏览器控制台检查 `uploadPath` 是否正确
- [ ] **步骤 3**: 检查 XHR 请求 URL 和 FormData
- [ ] **步骤 10**: 检查响应数据是否正确
- [ ] **步骤 12**: 检查文件列表是否刷新

### 后端验证

- [ ] **步骤 4**: 检查日志中的目标路径
- [ ] **步骤 5**: 确认路径安全检查通过
- [ ] **步骤 6**: 确认目标目录存在
- [ ] **步骤 8**: 检查文件保存日志
- [ ] **步骤 9**: 检查响应数据格式

### 文件系统验证

- [ ] 文件存在于目标目录
- [ ] 文件名正确
- [ ] 文件大小正确
- [ ] 文件内容完整

---

## 常见错误及排查

### 错误 1: "缺少目标路径参数"

**原因**: 前端未传递 `path` 参数

**排查**:
```javascript
// 前端检查
console.log('uploadPath:', uploadPath);

// 后端检查
console.log('req.query.path:', req.query.path);
```

---

### 错误 2: "禁止访问该路径"

**原因**: 目标路径不在 `rootDir` 内

**排查**:
```javascript
// 后端检查
console.log('rootDir:', rootDir);
console.log('safeTargetPath:', safeTargetPath);
console.log('starts with:', safeTargetPath.startsWith(rootDir));
```

---

### 错误 3: "目标路径不存在"

**原因**: 目标目录不存在或权限问题

**排查**:
```bash
# 检查目录是否存在
ls -la /path/to/target

# 检查权限
chmod 755 /path/to/target
```

---

### 错误 4: "文件上传失败：EACCES: permission denied"

**原因**: 没有写入权限

**排查**:
```bash
# 修改目录权限
chmod 755 /path/to/target

# 或修改所有者
chown $(whoami) /path/to/target
```

---

### 错误 5: 文件上传成功但未显示

**原因**: 前端未刷新或缓存问题

**排查**:
```javascript
// 前端检查
console.log('刷新文件列表:', state.currentPath);

// 清除缓存
clearFileCache();
loadFiles(state.currentPath);
```

---

## 调试技巧

### 前端调试

```javascript
// 在 uploadFiles 函数开始处添加
console.group('📤 文件上传');
console.log('文件列表:', files);
console.log('当前路径:', state.currentPath);
console.log('根路径:', state.rootPath);
console.log('上传路径:', uploadPath);
console.groupEnd();
```

### 后端调试

```javascript
// 在 /api/file/upload-to 接口开始处添加
console.group('📥 上传请求');
console.log('路径参数:', req.query.path);
console.log('根目录:', rootDir);
console.log('目标路径:', safeTargetPath);
console.groupEnd();
```

---

## 性能优化建议

1. **并发控制**: 当前最多 3 个文件并发上传
2. **文件大小限制**: 单个文件最大 100MB
3. **进度显示**: 实时更新上传进度
4. **错误处理**: 单个文件失败不影响其他文件

---

*文档创建时间：2026-03-10*
