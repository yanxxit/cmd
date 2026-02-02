import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Dictionary from './dictionary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 创建字典实例
const dict = new Dictionary();

// 设置静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 解析 JSON 请求体
app.use(express.json());

// 设置视图引擎
app.set('view engine', 'html'); // 我们将使用res.sendFile发送HTML文件

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API 路由：查询单词
app.post('/api/search', (req, res) => {
  const { word } = req.body;
  
  if (!word) {
    return res.status(400).json({ error: 'Word is required' });
  }
  
  try {
    const result = dict.lookupResult(word);
    res.json({ word, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Diaosi Dictionary Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the dictionary`);
});