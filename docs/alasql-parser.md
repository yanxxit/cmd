# AlaSQL 数据工作台

基于 AlaSQL 实现的在线数据查询工具，支持直接使用 SQL 语句操作 Excel、CSV、JSON 等格式的数据。

## 访问地址

启动服务器后访问：http://127.0.0.1:3000/alasql-parser/

## 功能特点

- 📁 **多格式支持**：支持 .xlsx, .xls, .csv, .json 文件格式
- 💬 **SQL 查询**：使用标准 SQL 语法查询数据
- 🔍 **数据筛选**：支持 WHERE、GROUP BY、ORDER BY 等 SQL 子句
- 📊 **结果展示**：表格视图和 JSON 视图切换
- 📥 **导出功能**：支持导出查询结果为 JSON 文件
- 📜 **查询历史**：自动保存最近 10 条查询记录
- 🚀 **本地解析**：文件在浏览器本地解析，数据安全

## 使用方法

### 1. 上传数据文件

- 点击上传区域选择文件
- 或直接拖拽文件到上传区域
- 支持批量上传多个文件

### 2. 编写 SQL 查询

在 SQL 编辑器中输入查询语句，使用 `?` 占位符表示当前数据源：

```sql
-- 查询所有数据
SELECT * FROM ?

-- 条件筛选
SELECT name, age FROM ? WHERE age > 18

-- 分组统计
SELECT department, COUNT(*) as total FROM ? GROUP BY department

-- 排序
SELECT * FROM ? ORDER BY salary DESC

-- 多条件查询
SELECT * FROM ? WHERE status = 'active' AND score >= 60
```

### 3. 执行查询

点击 "▶ 执行查询" 按钮，结果将显示在下方区域。

### 4. 查看结果

- **表格视图**：以表格形式展示数据
- **JSON 视图**：以 JSON 格式展示原始数据

### 5. 导出结果

点击 "📥 导出结果" 按钮，将查询结果导出为 JSON 文件。

## 支持的 SQL 语法

AlaSQL 支持大部分标准 SQL 语法：

### 基础查询
```sql
SELECT * FROM ?
SELECT column1, column2 FROM ?
SELECT DISTINCT column FROM ?
```

### 条件筛选
```sql
SELECT * FROM ? WHERE age > 18
SELECT * FROM ? WHERE name LIKE '%John%'
SELECT * FROM ? WHERE status IN ('active', 'pending')
```

### 聚合函数
```sql
SELECT COUNT(*) FROM ?
SELECT SUM(salary) FROM ?
SELECT AVG(age) FROM ?
SELECT MAX(score), MIN(score) FROM ?
```

### 分组和排序
```sql
SELECT department, COUNT(*) FROM ? GROUP BY department
SELECT * FROM ? ORDER BY name ASC, age DESC
SELECT status, AVG(score) FROM ? GROUP BY status HAVING AVG(score) > 60
```

### JOIN 查询
```sql
-- 多数据源 JOIN（需要先加载多个文件）
SELECT a.name, b.order 
FROM ? AS a 
JOIN ? AS b ON a.id = b.user_id
```

## API 接口

### POST /api/alasql/query

执行 SQL 查询

**请求体：**
```json
{
  "sql": "SELECT * FROM ?",
  "data": [{"name": "Alice", "age": 25}]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "result": [{"name": "Alice", "age": 25}],
    "rowCount": 1,
    "queryTime": "5ms"
  }
}
```

### POST /api/alasql/upload

上传并解析文件

**请求：** multipart/form-data

**响应：**
```json
{
  "success": true,
  "data": {
    "fileName": "data.xlsx",
    "fileType": "xlsx",
    "rowCount": 100,
    "data": [...]
  }
}
```

### GET /api/alasql/parse

解析已存在的文件

**参数：**
- `path`: 文件路径

**响应：**
```json
{
  "success": true,
  "data": {
    "fileName": "data.csv",
    "fileType": "csv",
    "rowCount": 50,
    "data": [...]
  }
}
```

## 示例数据

创建测试数据 `test-data.json`：

```json
[
  {"id": 1, "name": "张三", "department": "技术部", "salary": 8000, "status": "active"},
  {"id": 2, "name": "李四", "department": "销售部", "salary": 6000, "status": "active"},
  {"id": 3, "name": "王五", "department": "技术部", "salary": 9000, "status": "inactive"},
  {"id": 4, "name": "赵六", "department": "人事部", "salary": 5500, "status": "active"},
  {"id": 5, "name": "钱七", "department": "技术部", "salary": 7500, "status": "active"}
]
```

查询示例：

```sql
-- 统计各部门人数
SELECT department, COUNT(*) as count FROM ? GROUP BY department

-- 查询活跃员工平均工资
SELECT AVG(salary) as avg_salary FROM ? WHERE status = 'active'

-- 按工资降序排列
SELECT name, department, salary FROM ? ORDER BY salary DESC
```

## 技术栈

- **前端**：原生 JavaScript + CSS
- **后端**：Node.js + Express
- **核心库**：AlaSQL, SheetJS (xlsx)
- **数据处理**：浏览器本地解析 + 服务端 API

## 注意事项

1. 文件在浏览器本地解析，不会上传到服务器（除非使用后端 API）
2. 大文件可能导致浏览器卡顿，建议单次处理不超过 10000 行数据
3. 复杂查询可能影响性能，请合理使用 SQL 语法
4. 确保数据格式正确，JSON 文件必须是有效的数组格式

## 相关资源

- [AlaSQL 官方文档](https://github.com/AlaSQL/alasql)
- [SheetJS 文档](https://sheetjs.com/)
- [SQL 语法教程](https://www.w3schools.com/sql/)
