# 大型文件生成工具

## 概述

`generate-large-file.js` 是一个功能强大的大文件生成工具，支持多种文件格式和自定义配置。

## 安装

```bash
# 安装依赖
npm install docx  # DOCX 格式需要
```

## 使用方法

### 基本语法

```bash
node bin/generate-large-file.js <format> [size] [options]
```

### 支持的格式

#### 1. DOCX 文档

生成 Microsoft Word 文档：

```bash
# 生成 50MB 的 DOCX 文件
node bin/generate-large-file.js docx 50 -o document.docx

# 自定义标题和段落数
node bin/generate-large-file.js docx 100 \
  -o large.docx \
  -t "测试文档" \
  -p 1000

# 使用不同方法
node bin/generate-large-file.js docx 50 -m content  # 通过内容重复
node bin/generate-large-file.js docx 50 -m padding  # 通过填充数据
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-document.docx）
- `-t, --title <title>`: 文档标题
- `-p, --paragraphs <count>`: 基础段落数量
- `-m, --method <method>`: 生成方法（padding|content|attachment）

#### 2. TXT 文本文件

生成大型文本文件：

```bash
# 生成 100MB 的 TXT 文件
node bin/generate-large-file.js txt 100 -o large-file.txt

# 生成中文内容
node bin/generate-large-file.js txt 50 \
  -o chinese.txt \
  -c chinese \
  -l 200

# 生成随机字符
node bin/generate-large-file.js txt 50 \
  -o random.txt \
  -c random
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-file.txt）
- `-t, --title <title>`: 文档标题
- `-e, --encoding <encoding>`: 文件编码（默认：utf-8）
- `-l, --line-length <length>`: 每行字符数（默认：120）
- `-c, --content <type>`: 内容类型（lorem|random|chinese|zeros）

#### 3. LOG 日志文件

生成大型日志文件：

```bash
# 生成 200MB 的日志文件
node bin/generate-large-file.js log 200 -o app.log

# 生成 JSON 格式日志
node bin/generate-large-file.js log 100 \
  -o app.json.log \
  -f json \
  -l warn

# 指定日志来源
node bin/generate-large-file.js log 50 \
  -o server.log \
  -s web-server-01 \
  -l error
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-file.log）
- `-l, --level <level>`: 日志级别（debug|info|warn|error）
- `-f, --format <format>`: 日志格式（json|text）
- `-s, --source <source>`: 日志来源

#### 4. CSV 数据文件

生成大型 CSV 数据文件：

```bash
# 生成 500MB 的 CSV 文件
node bin/generate-large-file.js csv 500 -o data.csv

# 指定列名
node bin/generate-large-file.js csv 100 \
  -o users.csv \
  -c "id,name,email,age,city,country"

# 生成指定行数（优先于大小）
node bin/generate-large-file.js csv 0 \
  -o million-rows.csv \
  -r 1000000

# 使用分号分隔符
node bin/generate-large-file.js csv 50 \
  -o eu-data.csv \
  -d ";" \
  -q
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-file.csv）
- `-c, --columns <names>`: 列名（逗号分隔）
- `-r, --rows <count>`: 行数（0 表示按大小生成）
- `-d, --delimiter <char>`: 分隔符（默认：,）
- `-q, --quotes`: 使用引号包裹字符串

#### 5. JSON 数据文件

生成大型 JSON 数据文件：

```bash
# 生成数组格式 JSON
node bin/generate-large-file.js json 100 -o data.json

# 生成 NDJSON（每行一个 JSON 对象）
node bin/generate-large-file.js json 200 \
  -o stream.json \
  -f ndjson

# 美化输出
node bin/generate-large-file.js json 50 \
  -o pretty.json \
  -p
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-file.json）
- `-f, --format <format>`: 格式（array|stream|ndjson）
- `-p, --pretty`: 格式化输出

#### 6. Binary 二进制文件

生成大型二进制文件：

```bash
# 生成 1GB 的二进制文件
node bin/generate-large-file.js binary 1GB -o large-file.bin

# 使用随机数据填充
node bin/generate-large-file.js bin 500MB \
  -o random.bin \
  -p random

# 使用自定义模式
node bin/generate-large-file.js bin 100MB \
  -o pattern.bin \
  -p pattern \
  --pattern-value CAFEBABE

# 生成零填充文件
node bin/generate-large-file.js bin 50MB -o zeros.bin -p zeros
```

**选项**:
- `-o, --output <path>`: 输出文件路径（默认：./large-file.bin）
- `-p, --pattern <pattern>`: 填充模式（zeros|random|pattern）
- `--pattern-value <hex>`: 自定义填充模式（16 进制）

**支持的大小单位**:
- KB - 千字节
- MB - 兆字节（默认）
- GB - 吉字节
- TB - 太字节

## 使用示例

### 性能测试文件生成

```bash
# 生成 10GB 的测试文件
node bin/generate-large-file.js bin 10GB -o test-10gb.bin

# 生成 100 万行 CSV
node bin/generate-large-file.js csv 0 -r 1000000 -o million-rows.csv

# 生成 500MB 日志文件用于日志分析测试
node bin/generate-large-file.js log 500 -o test-logs.log -f json
```

### 开发测试数据

```bash
# 生成测试数据库导出文件
node bin/generate-large-file.js csv 100 \
  -c "id,username,email,created_at,status" \
  -o users-export.csv

# 生成 API 响应测试数据
node bin/generate-large-file.js json 50 \
  -f ndjson \
  -o api-responses.json
```

### 文档测试

```bash
# 生成 Word 文档测试打印功能
node bin/generate-large-file.js docx 100 \
  -t "产品手册" \
  -p 2000 \
  -o product-manual.docx

# 生成大型文本文件测试编辑器性能
node bin/generate-large-file.js txt 200 \
  -c lorem \
  -o stress-test.txt
```

## 输出示例

### TXT 文件生成
```
📝 开始生成 TXT 文件...
目标大小：10 MB
输出路径：/path/to/test-file.txt
编码：utf-8
内容类型：lorem

进度：100.0% (85432 行，10.00 MB)

✅ TXT 文件生成成功！
──────────────────────────────────────────────────
保存路径：/path/to/test-file.txt
最终大小：10.00 MB
总行数：85432
──────────────────────────────────────────────────
```

### CSV 文件生成
```
📊 开始生成 CSV 文件...
目标大小：50 MB
输出路径：/path/to/data.csv
列数：8
分隔符：,

进度：100.0% (524,288 行，50.00 MB)

✅ CSV 文件生成成功！
──────────────────────────────────────────────────
保存路径：/path/to/data.csv
最终大小：50.00 MB
总行数：524,288
生成时间：2345ms
──────────────────────────────────────────────────
```

## 性能参考

| 文件大小 | TXT 生成时间 | CSV 生成时间 | LOG 生成时间 |
|---------|------------|------------|------------|
| 10 MB   | ~0.5s      | ~1.2s      | ~0.8s      |
| 100 MB  | ~3s        | ~8s        | ~5s        |
| 500 MB  | ~15s       | ~40s       | ~25s       |
| 1 GB    | ~30s       | ~80s       | ~50s       |

*性能数据仅供参考，实际速度取决于系统配置*

## 高级技巧

### 1. 并行生成多个文件

```bash
# 使用后台进程
node bin/generate-large-file.js txt 100 -o file1.txt &
node bin/generate-large-file.js txt 100 -o file2.txt &
node bin/generate-large-file.js txt 100 -o file3.txt &
wait
```

### 2. 生成特定大小的文件

```bash
# 精确到字节
node bin/generate-large-file.js bin 10485760 -o exactly-10mb.bin

# 使用小数
node bin/generate-large-file.js txt 0.5 -o half-mb.txt
```

### 3. 自定义内容

修改源代码中的内容生成逻辑，添加自定义文本：

```javascript
// 在 txt 命令中添加自定义内容
const customText = "自定义文本内容 ";
// ...
line = customText.repeat(Math.ceil(lineLength / customText.length));
```

## 故障排除

### 问题：内存不足

**解决方案**:
- 使用流式写入（已默认启用）
- 减小生成文件的大小
- 增加系统可用内存

### 问题：生成速度慢

**解决方案**:
- 使用 SSD 硬盘
- 减少格式化选项（如 JSON 的 pretty 模式）
- 使用二进制填充模式（最快）

### 问题：DOCX 无法打开

**解决方案**:
- 确保安装了 `docx` 模块：`npm install docx`
- 使用 padding 方法而不是 content 方法
- 检查 Word 版本是否支持

## 相关资源

- [docx 模块文档](https://docx.js.org/)
- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [CSV 格式规范](https://tools.ietf.org/html/rfc4180)

## 许可证

ISC
