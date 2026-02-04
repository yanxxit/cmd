import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { openURL } from '../../open.js';

// 获取当前文件所在目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保历史记录目录存在
const historyDir = path.resolve(__dirname, '../../../logs/dict');

/**
 * 生成 Markdown 文件记录学习经历
 * @param {Array} history - 历史记录数组
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/learning-history.md
 * @returns {Promise<string>} 生成成功的文件路径
 */
async function generateMarkdown(history, outputPath) {
  try {
    // 按创建时间倒序排序
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // 默认输出路径
    const defaultPath = path.join(historyDir, 'learning-history.md');
    const exportPath = outputPath || defaultPath;
    
    // 确保目录存在
    const exportDir = path.dirname(exportPath);
    await fs.promises.mkdir(exportDir, { recursive: true });
    
    // 生成 Markdown 内容
    let markdownContent = `# 个人学习经历记录

生成时间: ${new Date().toLocaleString()}

共记录了 ${history.length} 个单词的学习

`;
    
    // 按日期分组
    const historyByDate = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!historyByDate[date]) {
        historyByDate[date] = [];
      }
      historyByDate[date].push(item);
    });
    
    // 遍历日期分组，生成 Markdown
    Object.entries(historyByDate).forEach(([date, items]) => {
      markdownContent += `## ${date}

`;
      
      items.forEach(item => {
        const createTime = new Date(item.timestamp).toLocaleTimeString();
        const updateTime = new Date(item.updateTime).toLocaleTimeString();
        
        markdownContent += `### ${item.word}

`;
        markdownContent += `- **创建时间**: ${createTime}
`;
        markdownContent += `- **最近学习时间**: ${updateTime}
`;
        markdownContent += `- **学习次数**: ${item.count || 1}

`;
        markdownContent += `#### 学习内容

`;
        
        // 处理结果内容，转换为 Markdown 格式
        const resultLines = item.result.split(String.fromCharCode(10)).filter(line => line.trim());
        resultLines.forEach(line => {
          if (line.startsWith('英 ') || line.startsWith('美 ')) {
            markdownContent += `**${line}**  
`;
          } else if (line.startsWith('adv.') || line.startsWith('n.') || line.startsWith('v.') || line.startsWith('adj.')) {
            markdownContent += `*${line}*  
`;
          } else {
            markdownContent += `${line}  
`;
          }
        });
        
        markdownContent += `
`;
      });
      
      markdownContent += `
`;
    });
    
    // 写入 Markdown 文件
    await fs.promises.writeFile(exportPath, markdownContent);
    
    return exportPath;
  } catch (error) {
    console.error('生成学习记录失败:', error.message);
    throw error;
  }
}

/**
 * 生成 HTML 文件记录学习经历（使用 React 渲染）
 * @param {Array} history - 历史记录数组
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/learning-history.html
 * @returns {Promise<string>} 生成成功的文件路径
 */
async function generateHTML(history, outputPath) {
  try {
    // 按创建时间倒序排序
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // 默认输出路径
    const defaultPath = path.join(historyDir, 'learning-history.html');
    const exportPath = outputPath || defaultPath;
    
    // 确保目录存在
    const exportDir = path.dirname(exportPath);
    await fs.promises.mkdir(exportDir, { recursive: true });
    
    // 按日期分组
    const historyByDate = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!historyByDate[date]) {
        historyByDate[date] = [];
      }
      historyByDate[date].push(item);
    });
    
    // 生成 HTML 内容（使用 React）
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>个人学习经历记录</title>
    <!-- 引入国内 React CDN -->
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 0;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header-info {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .date-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .date-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .word-card {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .word-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .word-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .word-header h3 {
            color: #333;
            font-size: 1.4em;
        }
        
        .word-count {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        .word-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
            font-size: 0.95em;
            color: #667eea;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
        }
        
        .meta-item i {
            margin-right: 8px;
        }
        
        .word-content {
            background: white;
            border-radius: 6px;
            padding: 15px;
            border-left: 4px solid #667eea;
        }
        
        .pronunciation {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .definition {
            font-style: italic;
            margin-bottom: 10px;
            color: #555;
        }
        
        .examples {
            margin-top: 10px;
        }
        
        .example {
            margin-bottom: 5px;
            padding-left: 15px;
            border-left: 2px solid #e0e0e0;
        }
        
        .result-content {
            position: relative;
        }
        
        .result-preview {
            max-height: 150px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .result-full {
            max-height: none;
        }
        
        .expand-btn {
            background: #f0f0f0;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9em;
            color: #667eea;
            margin-top: 10px;
            transition: background 0.2s ease;
        }
        
        .expand-btn:hover {
            background: #e0e0e0;
        }
        
        footer {
            text-align: center;
            padding: 30px 0;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .word-meta {
                grid-template-columns: 1fr;
            }
            
            .word-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // 历史记录数据
        const historyData = ${JSON.stringify(historyByDate)};
        const totalWords = ${history.length};
        const generateTime = "${new Date().toLocaleString()}";
        
        // 主应用组件
        function App() {
            const [expandedIds, setExpandedIds] = React.useState({});
            
            const toggleExpand = function(id) {
                setExpandedIds(function(prev) {
                    const newState = Object.assign({}, prev);
                    newState[id] = !prev[id];
                    return newState;
                });
            };
            
            return React.createElement('div', { className: 'container' },
                React.createElement('header', null,
                    React.createElement('h1', null, '个人学习经历记录'),
                    React.createElement('div', { className: 'header-info' },
                        React.createElement('p', null, '生成时间: ', generateTime),
                        React.createElement('p', null, '共记录了 ', totalWords, ' 个单词的学习')
                    )
                ),
                React.createElement('main', null,
                    Object.entries(historyData).map(function(dateItems) {
                        const date = dateItems[0];
                        const items = dateItems[1];
                        return React.createElement('section', { key: date, className: 'date-section' },
                            React.createElement('h2', null, date),
                            items.map(function(item, index) {
                                const createTime = new Date(item.timestamp).toLocaleTimeString();
                                const updateTime = new Date(item.updateTime).toLocaleTimeString();
                                const resultLines = item.result.split('\\n').filter(function(line) { return line.trim(); });
                                const cardId = date + '-' + index;
                                
                                return React.createElement('div', { key: index, className: 'word-card' },
                                    React.createElement('div', { className: 'word-header' },
                                        React.createElement('h3', null, item.word),
                                        React.createElement('span', { className: 'word-count' }, (item.count || 1) + '次')
                                    ),
                                    React.createElement('div', { className: 'word-meta' },
                                        React.createElement('div', { className: 'meta-item' },
                                            React.createElement('i', null, '📅'),
                                            React.createElement('span', null, '创建时间: ', createTime)
                                        ),
                                        React.createElement('div', { className: 'meta-item' },
                                            React.createElement('i', null, '⏰'),
                                            React.createElement('span', null, '最近学习: ', updateTime)
                                        )
                                    ),
                                    React.createElement('div', { className: 'word-content' },
                                        React.createElement('div', { className: 'result-content' },
                                            React.createElement('div', {
                                                className: expandedIds[cardId] ? 'result-preview result-full' : 'result-preview'
                                            },
                                                resultLines.map(function(line, lineIndex) {
                                                    if (line.startsWith('英 ') || line.startsWith('美 ')) {
                                                        return React.createElement('div', { key: lineIndex, className: 'pronunciation' }, line);
                                                    } else if (line.startsWith('adv.') || line.startsWith('n.') || line.startsWith('v.') || line.startsWith('adj.')) {
                                                        return React.createElement('div', { key: lineIndex, className: 'definition' }, line);
                                                    } else {
                                                        return React.createElement('div', { key: lineIndex, className: 'example' }, line);
                                                    }
                                                })
                                            ),
                                            React.createElement('button', {
                                                className: 'expand-btn',
                                                onClick: function() { toggleExpand(cardId); }
                                            }, expandedIds[cardId] ? '收起' : '展开全部')
                                        )
                                    )
                                );
                            })
                        );
                    })
                ),
                React.createElement('footer', null,
                    React.createElement('p', null, '© 2026 个人学习记录')
                )
            );
        }
        
        // 渲染应用
        ReactDOM.render(
            React.createElement(App),
            document.getElementById('root')
        );
    </script>
</body>
</html>`;
    
    // 写入 HTML 文件
    await fs.promises.writeFile(exportPath, htmlContent);
    
    // 自动打开网页
    try {
        const absolutePath = path.resolve(exportPath);
        await openURL(absolutePath);
        console.log('已自动打开生成的网页');
    } catch (error) {
        console.log('自动打开网页失败，您可以手动打开文件：', exportPath);
    }
    
    return exportPath;
  } catch (error) {
    console.error('生成 HTML 学习记录失败:', error.message);
    throw error;
  }
}

/**
 * 使用 EJS 模板引擎生成 HTML 文件记录学习经历
 * @param {Array} history - 历史记录数组
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/learning-history.html
 * @param {string} templatePath - 模板文件路径，默认 src/dict/templates/dict.ejs
 * @returns {Promise<string>} 生成成功的文件路径
 */
async function generateHTMLWithEJS(history, outputPath, templatePath) {
  try {
    // 按创建时间倒序排序
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // 默认输出路径
    const defaultPath = path.join(historyDir, 'learning-history.html');
    const exportPath = outputPath || defaultPath;
    
    // 默认模板路径
    const defaultTemplatePath = path.join(__dirname, '../templates/dict.ejs');
    const usedTemplatePath = templatePath || defaultTemplatePath;
    
    // 确保目录存在
    const exportDir = path.dirname(exportPath);
    await fs.promises.mkdir(exportDir, { recursive: true });
    
    // 按日期分组
    const historyByDate = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!historyByDate[date]) {
        historyByDate[date] = [];
      }
      historyByDate[date].push(item);
    });
    
    // 渲染 EJS 模板
    const htmlContent = await ejs.renderFile(usedTemplatePath, {
      historyByDate,
      history
    });
    
    // 写入 HTML 文件
    await fs.promises.writeFile(exportPath, htmlContent);
    
    // 自动打开网页
    try {
        const absolutePath = path.resolve(exportPath);
        await openURL(absolutePath);
        console.log('已自动打开生成的网页');
    } catch (error) {
        console.log('自动打开网页失败，您可以手动打开文件：', exportPath);
    }
    
    return exportPath;
  } catch (error) {
    console.error('使用 EJS 模板生成 HTML 学习记录失败:', error.message);
    throw error;
  }
}

export default {
  generateMarkdown,
  generateHTML,
  generateHTMLWithEJS
};