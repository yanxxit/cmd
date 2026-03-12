# XLSX 解析器修复说明

## 问题诊断

### 原问题
- XLSX 文件无法上传
- 上传后无法解析
- 前端报错但无详细信息

### 根本原因
1. **formidable 3.x API 变化** - 返回的 `files.file` 是数组而非单个对象
2. **Promise 处理不当** - 原代码使用回调但外部是 async/await
3. **错误处理不完善** - 缺少详细的日志和错误信息
4. **文件过滤器过严** - MIME 类型过滤可能误杀

## 修复内容

### 后端修复 (src/http-server/xlsx-parser.js)

#### 1. 简化 formidable 使用
```javascript
// 使用 Promise 封装 form.parse
const [fields, files] = await new Promise((resolve, reject) => {
  form.parse(req, (err, fields, files) => {
    if (err) reject(err);
    else resolve([fields, files]);
  });
});

// 正确处理数组格式
const fileArray = files.file || [];
const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;
```

#### 2. 改进错误处理
```javascript
try {
  // 解析逻辑
  const result = parseXLSX(tempFilePath);
  
  // 清理临时文件
  fs.unlinkSync(tempFilePath);
  tempFilePath = null;
} catch (error) {
  // 确保清理临时文件
  if (tempFilePath && fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  throw error;
}
```

#### 3. 优化文件过滤器
```javascript
filter: ({ originalFilename, mimetype }) => {
  const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : '';
  return ['.xlsx', '.xls'].includes(ext);
}
```

#### 4. 添加详细日志
```javascript
console.log('[XLSX Upload] 文件信息:', {
  fileName,
  filePath,
  fileSize,
  originalFilename: uploadedFile.originalFilename,
  newFilename: uploadedFile.newFilename
});
```

### 前端修复 (public/xlsx-parser/index.html)

#### 1. 增强错误诊断
```javascript
console.log('[XLSX Parser] 文件信息:', {
  name: file.name,
  size: file.size,
  type: file.type,
  ext: ext,
  validExts: validExts
});
```

#### 2. 详细的响应检查
```javascript
const responseText = await response.text();
console.log('[XLSX Parser] 响应内容:', responseText.substring(0, 500));

// 检查响应类型
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error(`服务器返回了非 JSON 响应 (${contentType})`);
}

// 手动解析 JSON
let result;
try {
  result = JSON.parse(responseText);
} catch (parseErr) {
  console.error('[XLSX Parser] JSON 解析失败:', parseErr);
  throw new Error('服务器响应格式错误');
}
```

## 测试验证

### 测试步骤
```bash
# 1. 启动服务器
node bin/static.js -p 3002

# 2. 创建测试文件（使用 Python）
pip3 install openpyxl
python3 << 'EOF'
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws.title = 'Sheet1'
ws.append(['name', 'age', 'city'])
ws.append(['Zhang San', 25, 'Beijing'])
ws.append(['Li Si', 30, 'Shanghai'])
wb.save('test.xlsx')
EOF

# 3. 测试上传
curl -X POST -F "file=@test.xlsx" http://127.0.0.1:3002/api/xlsx/upload

# 4. 预期响应
{
  "success": true,
  "data": {
    "fileName": "test.xlsx",
    "fileType": "xlsx",
    "worksheetCount": 1,
    "worksheets": [
      {
        "name": "Sheet1",
        "rowCount": 2,
        "data": [
          {"name": "Zhang San", "age": "25", "city": "Beijing"},
          {"name": "Li Si", "age": "30", "city": "Shanghai"}
        ]
      }
    ]
  }
}
```

### 测试结果
✅ 上传成功 - HTTP 200
✅ 解析成功 - 返回正确的 JSON 数据
✅ 临时文件清理 - 文件已删除

## 优化建议

### 1. 前端优化
- 添加上传进度条
- 支持拖拽上传视觉反馈
- 添加文件预览功能

### 2. 后端优化
- 添加文件大小限制提示
- 支持批量上传
- 添加文件类型白名单配置

### 3. 性能优化
- 使用流式处理大文件
- 添加文件缓存机制
- 支持断点续传

## 常见问题

### Q1: 上传后返回 400 错误
**原因**: 文件字段名不是 "file"
**解决**: 确保 FormData 中使用 `formData.append('file', file)`

### Q2: 上传后返回 500 错误
**原因**: 可能是文件格式损坏或服务器解析错误
**解决**: 检查服务器日志，验证文件是否有效

### Q3: 前端显示"响应不是 JSON"
**原因**: 服务器返回 HTML 错误页面
**解决**: 检查服务器是否正常启动，API 路由是否正确

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/http-server/xlsx-parser.js` | 重写上传逻辑，简化代码，增强错误处理 |
| `public/xlsx-parser/index.html` | 添加详细日志，改进错误提示 |
| `src/http-server/static.js` | 调整路由顺序（之前已完成） |

## 使用方式

```bash
# 启动服务
x-static

# 访问页面
http://127.0.0.1:3001/xlsx-parser/

# 或使用 API
curl -X POST -F "file=@your-file.xlsx" http://127.0.0.1:3001/api/xlsx/upload
```
