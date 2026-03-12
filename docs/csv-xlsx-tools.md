# CSV/XLSX 转 JSON 工具说明

## 功能拆分说明

原 `xlsx-to-json` 功能已拆分为两个独立的工具：

### 1. CSV 转 JSON（前端解析）

**访问地址：** `http://127.0.0.1:3001/csv-to-json/`

**特点：**
- 🔒 **前端直接解析**：文件在浏览器中解析，不会上传到服务器
- ⚡ **实时解析**：无需等待服务器响应，解析速度快
- ⚙️ **可配置选项**：支持自定义分隔符、表头、空行处理等

**支持格式：**
- `.csv` 文件（UTF-8 编码）

**解析选项：**
- 分隔符：支持自定义分隔符（默认逗号 `,`）
- 第一行是表头：可选择是否将第一行作为字段名
- 跳过空行：自动过滤空行
- 去除首尾空格：自动清理字段值的首尾空格

**文件结构：**
```
public/csv-to-json/
  └── index.html          # CSV 工具页面（包含 HTML/CSS/JS）
```

---

### 2. XLSX 转 JSON（后端解析）

**访问地址：** `http://127.0.0.1:3001/xlsx-parser/`

**特点：**
- 📊 **后端解析**：使用 xlsx 库在服务器端解析 Excel 文件
- 📑 **支持多工作表**：可处理包含多个工作表的 Excel 文件
- 🔀 **工作表切换**：支持在不同工作表之间切换查看
- 🗑️ **自动清理**：解析完成后自动删除临时文件

**支持格式：**
- `.xlsx` 文件
- `.xls` 文件

**API 接口：**

1. **上传并解析**
   ```bash
   POST /api/xlsx/upload
   Content-Type: multipart/form-data
   
   # 请求体
   file: <文件对象>
   ```

2. **解析已存在的文件**
   ```bash
   GET /api/xlsx/parse?path=/path/to/file.xlsx
   ```

3. **获取文件信息**
   ```bash
   GET /api/xlsx/info?path=/path/to/file.xlsx
   ```

**文件结构：**
```
src/http-server/
  └── xlsx-parser.js      # XLSX 解析 API 路由

public/xlsx-parser/
  └── index.html          # XLSX 工具页面（包含 HTML/CSS/JS）
```

---

## 技术实现对比

| 特性 | CSV 工具 | XLSX 工具 |
|------|---------|----------|
| 解析位置 | 前端（浏览器） | 后端（服务器） |
| 依赖库 | 无（原生 JS） | xlsx (npm 包) |
| 文件上传 | 不需要 | 需要 |
| 多工作表 | 不支持 | 支持 |
| 配置选项 | 丰富 | 无 |
| 解析速度 | 快 | 中等（受网络影响） |
| 文件大小限制 | 浏览器内存限制 | 50MB |

---

## 使用场景

### CSV 工具适用场景：
- 快速查看和转换 CSV 文件
- 对隐私要求高，不希望文件上传
- 需要自定义解析选项
- 批量处理多个 CSV 文件

### XLSX 工具适用场景：
- 处理 Excel 文件（.xlsx, .xls）
- 需要处理多工作表文件
- CSV 工具无法处理的复杂格式
- 需要从文件列表中选择文件解析

---

## 启动方式

```bash
# 启动静态文件服务
x-static

# 或指定目录和端口
x-static ./my-project -p 8080

# 访问工具
http://127.0.0.1:3001/csv-to-json/
http://127.0.0.1:3001/xlsx-parser/
```

---

## 代码示例

### CSV 前端解析（浏览器中）

```javascript
// 读取文件
const reader = new FileReader();
reader.onload = (e) => {
  const content = e.target.result;
  const result = parseCSV(content, {
    delimiter: ',',
    hasHeader: true,
    skipEmpty: true,
    trimValues: true
  });
  console.log(result.data);
};
reader.readAsText(file);
```

### XLSX 后端解析（Node.js）

```javascript
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

// 解析文件
const workbook = xlsxRead(filePath, { type: 'file' });
const result = {
  worksheets: workbook.SheetNames.map(name => ({
    name,
    data: xlsxUtils.sheet_to_json(workbook.Sheets[name], { defval: '' })
  }))
};
```

---

## 注意事项

### CSV 工具：
- 文件编码必须是 UTF-8
- 大文件可能导致浏览器卡顿
- 特殊字符需要使用引号包裹

### XLSX 工具：
- 文件大小限制 50MB
- 文件会在解析后自动删除
- 需要网络连接（上传到服务器）
- 不支持加密的 Excel 文件
