import express from 'express';
import Dictionary from './dictionary.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 设置静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));

// 解析 JSON 请求体
app.use(express.json());

// 创建词典实例
let dict = new Dictionary();

// 单词查询 API
app.get('/api/lookup/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const result = await dict.lookupResult(word);
    
    if (result) {
      res.json({ word, result });
    } else {
      res.status(404).json({ error: `${word}: Not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 前缀查找 API
app.get('/api/prefix/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const limit = parseInt(req.query.limit) || 30;
    const matches = await dict.prefixLookup(prefix, limit);
    
    res.json({ prefix, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DS-V2 Dictionary Server' });
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`屌丝词典 v2 服务器运行在 http://localhost:${port}`);
});

// 处理应用退出事件
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await dict.close(); // 关闭数据库连接
  process.exit(0);
});