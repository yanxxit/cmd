import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 敏感文件过滤列表
const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.git/config',
  '.gitignore',
  'node_modules'
];

// 判断是否为敏感文件
function isSensitiveFile(filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // 检查是否在敏感文件列表中
  for (const sensitive of SENSITIVE_FILES) {
    if (normalizedPath === sensitive || normalizedPath.endsWith('/' + sensitive)) {
      return true;
    }
  }
  return false;
}

// 判断是否为二进制文件
function isBinaryFile(buffer) {
  // 检查文件开头字节是否包含非文本字符
  const chunk = buffer.slice(0, 1024);
  for (let i = 0; i < chunk.length; i++) {
    if (chunk[i] === 0) {
      return true;
    }
  }
  return false;
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return {
    bytes,
    formatted: `${size.toFixed(1)} ${units[unitIndex]}`
  };
}

// 获取文件类型
function getFileType(fileName, stats) {
  if (stats.isDirectory()) {
    return 'directory';
  }

  const ext = path.extname(fileName).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];
  const textExts = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css', '.scss', '.less', '.xml', '.yaml', '.yml'];
  const docExts = ['.pdf'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (archiveExts.includes(ext)) return 'archive';
  if (textExts.includes(ext)) return 'text';
  if (docExts.includes(ext)) return 'document';

  return 'file';
}

// 获取文件图标
function getFileIcon(fileType) {
  const icons = {
    directory: '📁',
    file: '📄',
    image: '🖼️',
    text: '📝',
    video: '🎬',
    audio: '🎵',
    archive: '📦',
    document: '📕'
  };
  return icons[fileType] || '📄';
}

// 获取语言类型（用于代码高亮）
function getLanguage(ext) {
  const languages = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.vue': 'vue',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.sql': 'sql'
  };
  return languages[ext] || 'plaintext';
}

// 安全路径检查
function safePath(requestedPath, rootDir) {
  // 标准化路径
  const normalizedRoot = path.resolve(rootDir);
  const normalizedRequested = path.resolve(requestedPath);
  
  // 检查是否在根目录内
  if (!normalizedRequested.startsWith(normalizedRoot)) {
    return null;
  }
  
  return normalizedRequested;
}

/**
 * GET /api/files
 * 获取文件列表
 */
router.get('/files', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path || rootDir;
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }
    
    // 检查路径是否存在
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '路径不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: '指定路径不是目录'
      });
    }
    
    // 读取目录内容
    const entries = fs.readdirSync(safePathResult, { withFileTypes: true });
    const items = [];
    
    for (const entry of entries) {
      const itemPath = path.join(safePathResult, entry.name);
      
      // 跳过敏感文件
      if (isSensitiveFile(itemPath, rootDir)) {
        continue;
      }
      
      try {
        const itemStats = entry.isFile() ? fs.statSync(itemPath) : (entry.isDirectory() ? { isDirectory: () => true, isFile: () => false, size: 0, mtime: new Date() } : null);
        if (!itemStats) continue;
        
        const fileType = getFileType(entry.name, itemStats);
        const sizeInfo = itemStats.isDirectory() ? null : formatFileSize(itemStats.size);
        
        items.push({
          name: entry.name,
          type: fileType,
          icon: getFileIcon(fileType),
          path: itemPath,
          relativePath: path.relative(rootDir, itemPath),
          size: sizeInfo,
          modified: itemStats.mtime.toISOString()
        });
      } catch (err) {
        // 跳过无法访问的文件
        console.warn(`无法访问文件：${itemPath}`, err.message);
      }
    }
    
    // 排序：目录在前，文件在后，按名称排序
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name, 'zh');
    });
    
    // 计算父目录路径
    const parentPath = safePathResult !== rootDir ? path.dirname(safePathResult) : null;
    
    res.json({
      success: true,
      data: {
        currentPath: safePathResult,
        parentPath,
        rootPath: rootDir,
        items
      }
    });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/file/content
 * 获取文件内容
 */
router.get('/file/content', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: '指定路径是目录，不是文件'
      });
    }
    
    // 检查文件大小（限制 1MB）
    const maxSize = 1 * 1024 * 1024;
    if (stats.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: '文件过大，无法预览（最大支持 1MB）'
      });
    }
    
    // 读取文件内容
    const buffer = fs.readFileSync(safePathResult);
    
    // 判断是否为二进制文件
    const binary = isBinaryFile(buffer);
    
    if (binary) {
      return res.status(400).json({
        success: false,
        error: '二进制文件无法预览'
      });
    }
    
    const content = buffer.toString('utf-8');
    const ext = path.extname(requestedPath).toLowerCase();
    const language = getLanguage(ext);
    const sizeInfo = formatFileSize(stats.size);
    
    res.json({
      success: true,
      data: {
        path: safePathResult,
        relativePath: path.relative(rootDir, safePathResult),
        name: path.basename(requestedPath),
        content,
        language,
        size: sizeInfo,
        modified: stats.mtime.toISOString()
      }
    });
  } catch (err) {
    console.error('获取文件内容失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/file/download
 * 下载文件
 */
router.get('/file/download', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: '无法下载目录'
      });
    }
    
    // 设置下载头
    const fileName = path.basename(requestedPath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    
    // 流式传输文件
    const stream = fs.createReadStream(safePathResult);
    stream.pipe(res);
  } catch (err) {
    console.error('下载文件失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/file/is-binary
 * 判断文件是否为二进制文件
 */
router.get('/file/is-binary', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }
    
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (stats.isDirectory()) {
      return res.json({
        success: true,
        data: {
          isBinary: false,
          isDirectory: true
        }
      });
    }
    
    const buffer = fs.readFileSync(safePathResult, { flag: 'r' });
    const binary = isBinaryFile(buffer);
    
    res.json({
      success: true,
      data: {
        isBinary: binary,
        isDirectory: false
      }
    });
  } catch (err) {
    console.error('判断文件类型失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/files/search
 * 搜索文件
 */
router.get('/files/search', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    const query = req.query.q || '';
    let searchPath = req.query.path || rootDir;
    const type = req.query.type || 'all'; // all, file, directory
    const caseSensitive = req.query.case === 'true';
    
    if (!query) {
      return res.json({
        success: true,
        data: {
          query: '',
          results: [],
          count: 0
        }
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(searchPath)) {
      searchPath = path.join(rootDir, searchPath);
    }
    
    const safePathResult = safePath(searchPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }
    
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '路径不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: '指定路径不是目录'
      });
    }
    
    // 搜索关键词处理
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const results = [];
    const maxResults = parseInt(req.query.limit) || 100;
    
    // 递归搜索文件
    function searchDirectory(dirPath, relativeDir = '') {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // 跳过隐藏文件和敏感文件
          if (entry.name.startsWith('.') && entry.name !== query) {
            continue;
          }
          
          const itemPath = path.join(dirPath, entry.name);
          
          if (isSensitiveFile(itemPath, rootDir)) {
            continue;
          }
          
          const itemRelativePath = path.relative(rootDir, itemPath);
          
          if (entry.isDirectory()) {
            // 递归搜索子目录
            searchDirectory(itemPath, itemRelativePath);
          }
          
          if (entry.isFile()) {
            // 根据类型过滤
            if (type === 'directory') {
              continue;
            }
            
            // 匹配文件名
            const fileName = caseSensitive ? entry.name : entry.name.toLowerCase();
            if (fileName.includes(searchQuery)) {
              try {
                const itemStats = fs.statSync(itemPath);
                const fileType = getFileType(entry.name, itemStats);
                const sizeInfo = formatFileSize(itemStats.size);
                
                results.push({
                  name: entry.name,
                  type: fileType,
                  icon: getFileIcon(fileType),
                  path: itemPath,
                  relativePath: itemRelativePath,
                  size: sizeInfo,
                  modified: itemStats.mtime.toISOString(),
                  match: 'name'
                });
                
                // 限制结果数量
                if (results.length >= maxResults) {
                  return;
                }
              } catch (err) {
                console.warn(`无法访问文件：${itemPath}`, err.message);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`无法读取目录：${dirPath}`, err.message);
      }
    }
    
    searchDirectory(safePathResult);
    
    // 按相关性排序（完全匹配在前）
    results.sort((a, b) => {
      const aName = caseSensitive ? a.name : a.name.toLowerCase();
      const bName = caseSensitive ? b.name : b.name.toLowerCase();
      
      const aExact = aName === searchQuery;
      const bExact = bName === searchQuery;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // 按文件名排序
      return a.name.localeCompare(b.name, 'zh');
    });
    
    res.json({
      success: true,
      data: {
        query,
        searchPath: safePathResult,
        rootPath: rootDir,
        results,
        count: results.length,
        limit: maxResults
      }
    });
  } catch (err) {
    console.error('搜索文件失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/files/search-content
 * 搜索文件内容（代码搜索）
 */
router.get('/files/search-content', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    const query = req.query.q || '';
    let searchPath = req.query.path || rootDir;
    const caseSensitive = req.query.case === 'true';
    const wholeWord = req.query.word === 'true';
    const useRegex = req.query.regex === 'true';
    const maxResults = parseInt(req.query.limit) || 50;
    const contextLines = parseInt(req.query.context) || 2;
    
    // 支持的文件扩展名（代码文件）
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.htm', '.css', '.scss', '.less',
      '.json', '.xml', '.yaml', '.yml', '.md', '.markdown',
      '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs', '.php',
      '.rb', '.swift', '.kt', '.scala', '.sh', '.bash', '.zsh', '.fish',
      '.sql', '.graphql', '.prisma',
      '.env', '.conf', '.config', '.ini', '.toml'
    ];
    
    // 排除的目录
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'];
    
    if (!query) {
      return res.json({
        success: true,
        data: {
          query: '',
          results: [],
          count: 0
        }
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(searchPath)) {
      searchPath = path.join(rootDir, searchPath);
    }
    
    const safePathResult = safePath(searchPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }
    
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '路径不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: '指定路径不是目录'
      });
    }
    
    // 构建搜索正则
    let searchRegex;
    try {
      if (useRegex) {
        searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else if (wholeWord) {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(`\\b${escapedQuery}\\b`, caseSensitive ? 'g' : 'gi');
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: '正则表达式无效：' + err.message
      });
    }
    
    const results = [];
    let filesSearched = 0;
    
    // 递归搜索文件内容
    function searchContentInDirectory(dirPath) {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const itemPath = path.join(dirPath, entry.name);
          
          // 跳过敏感文件和目录
          if (isSensitiveFile(itemPath, rootDir)) {
            continue;
          }
          
          // 跳过排除的目录
          if (entry.isDirectory() && excludeDirs.includes(entry.name)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            // 递归搜索子目录
            searchContentInDirectory(itemPath);
          }
          
          if (entry.isFile()) {
            // 检查文件扩展名
            const ext = path.extname(entry.name).toLowerCase();
            if (!codeExtensions.includes(ext)) {
              continue;
            }
            
            // 检查文件大小（限制 500KB）
            try {
              const fileStats = fs.statSync(itemPath);
              if (fileStats.size > 500 * 1024) {
                continue;
              }
              
              // 读取文件内容
              const content = fs.readFileSync(itemPath, 'utf-8');
              const lines = content.split('\n');
              const matches = [];
              
              // 搜索每一行
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineMatches = [];
                let match;
                
                // 重置正则 lastIndex
                searchRegex.lastIndex = 0;
                
                // 查找所有匹配
                while ((match = searchRegex.exec(line)) !== null) {
                  lineMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                  });
                }
                
                if (lineMatches.length > 0) {
                  // 获取上下文行
                  const contextStart = Math.max(0, i - contextLines);
                  const contextEnd = Math.min(lines.length - 1, i + contextLines);
                  const context = lines.slice(contextStart, contextEnd + 1).join('\n');
                  
                  matches.push({
                    lineNumber: i + 1,
                    line: line.trim(),
                    lineMatches,
                    context,
                    contextStart: contextStart + 1,
                    contextEnd: contextEnd + 1
                  });
                  
                  // 限制每个文件的匹配数
                  if (matches.length >= 10) {
                    break;
                  }
                }
              }
              
              if (matches.length > 0) {
                const relativePath = path.relative(rootDir, itemPath);
                
                results.push({
                  name: entry.name,
                  path: itemPath,
                  relativePath,
                  extension: ext,
                  matches,
                  matchCount: matches.length,
                  size: formatFileSize(fileStats.size),
                  modified: fileStats.mtime.toISOString()
                });
                
                filesSearched++;
                
                // 限制结果文件数量
                if (results.length >= maxResults) {
                  return;
                }
              }
              
              filesSearched++;
            } catch (err) {
              // 跳过无法读取的文件
              console.warn(`无法读取文件：${itemPath}`, err.message);
            }
          }
        }
      } catch (err) {
        console.warn(`无法读取目录：${dirPath}`, err.message);
      }
    }
    
    searchContentInDirectory(safePathResult);
    
    // 按匹配数量排序
    results.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.relativePath.localeCompare(b.relativePath, 'zh');
    });
    
    res.json({
      success: true,
      data: {
        query,
        searchPath: safePathResult,
        rootPath: rootDir,
        results,
        count: results.length,
        filesSearched,
        limit: maxResults,
        options: {
          caseSensitive,
          wholeWord,
          useRegex,
          contextLines
        }
      }
    });
  } catch (err) {
    console.error('搜索文件内容失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/file/meta
 * 获取文件元数据
 */
router.get('/file/meta', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }
    
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    const ext = path.extname(requestedPath).toLowerCase();
    const fileName = path.basename(requestedPath);
    
    // 基础元数据
    const meta = {
      name: fileName,
      path: safePathResult,
      relativePath: path.relative(rootDir, safePathResult),
      extension: ext,
      size: formatFileSize(stats.size),
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      accessed: stats.atime.toISOString(),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
    
    // 获取文件类型
    const fileType = getFileType(fileName, stats);
    meta.fileType = fileType;
    meta.icon = getFileIcon(fileType);

    // 媒体文件和 PDF 额外信息
    if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'document') {
      meta.isMedia = fileType === 'image' || fileType === 'video' || fileType === 'audio';
      meta.mimeType = getMimeType(ext);

      // 图片尺寸信息
      if (fileType === 'image') {
        meta.mediaType = 'image';
        meta.previewUrl = `/api/file/preview?path=${encodeURIComponent(safePathResult)}`;
      } else if (fileType === 'video') {
        meta.mediaType = 'video';
        meta.previewUrl = `/api/file/stream?path=${encodeURIComponent(safePathResult)}`;
      } else if (fileType === 'audio') {
        meta.mediaType = 'audio';
        meta.previewUrl = `/api/file/stream?path=${encodeURIComponent(safePathResult)}`;
      } else if (fileType === 'document') {
        // PDF 文档
        meta.mediaType = 'document';
        meta.previewUrl = `/api/file/preview?path=${encodeURIComponent(safePathResult)}`;
      }
    }
    
    // 二进制文件信息
    if (fileType !== 'text' && fileType !== 'directory') {
      const buffer = fs.readFileSync(safePathResult, { flag: 'r' });
      meta.isBinary = isBinaryFile(buffer);
      
      // 文件头信息（前 16 字节十六进制）
      meta.header = buffer.slice(0, 16).toString('hex').toUpperCase().match(/.{2}/g).join(' ');
      
      // 尝试识别文件类型
      meta.detectedType = detectFileType(buffer, ext);
    }
    
    res.json({
      success: true,
      data: meta
    });
  } catch (err) {
    console.error('获取文件元数据失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/file/preview
 * 获取文件预览（图片/PDF）
 */
router.get('/file/preview', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;

    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }

    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }

    const safePathResult = safePath(requestedPath, rootDir);

    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }

    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    const stats = fs.statSync(safePathResult);
    const ext = path.extname(requestedPath).toLowerCase();

    // 设置正确的 Content-Type
    const mimeType = getMimeType(ext);
    res.setHeader('Content-Type', mimeType);
    
    // 设置缓存控制（PDF 文件禁用缓存，确保最新内容）
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 流式传输文件
    const stream = fs.createReadStream(safePathResult);
    stream.pipe(res);
  } catch (err) {
    console.error('文件预览失败:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
});

/**
 * GET /api/file/stream
 * 流式传输媒体文件（视频/音频）
 */
router.get('/file/stream', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }
    
    const safePathResult = safePath(requestedPath, rootDir);
    
    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该文件'
      });
    }
    
    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    const stats = fs.statSync(safePathResult);
    const ext = path.extname(requestedPath).toLowerCase();
    const mimeType = getMimeType(ext);
    const range = req.headers.range;
    
    // 支持范围请求（用于视频seek）
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(safePathResult, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      });
      
      const file = fs.createReadStream(safePathResult);
      file.pipe(res);
    }
  } catch (err) {
    console.error('文件流传输失败:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
});

/**
 * 获取文件 MIME 类型
 */
function getMimeType(ext) {
  const mimeTypes = {
    // 图片
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.avif': 'image/avif',
    '.heic': 'image/heic',
    // 视频
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    // 音频
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.m4a': 'audio/mp4',
    '.wma': 'audio/x-ms-wma',
    // 文档
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 检测文件类型（基于文件头）
 */
function detectFileType(buffer, ext) {
  // 文件头魔数检测
  const header = buffer.slice(0, 16).toString('hex').toUpperCase();
  
  const signatures = {
    '89504E470D0A1A0A': 'PNG 图片',
    'FFD8FF': 'JPEG 图片',
    '474946383': 'GIF 图片',
    '52494646': 'RIFF (可能是 WebP/AVI)',
    '0000001866747970': 'MP4 视频',
    '1A45DFA3': 'Matroska (MKV) 视频',
    '494433': 'ID3 (MP3 音频)',
    '664C6143': 'FLAC 音频',
    '25504446': 'PDF 文档',
    '504B0304': 'ZIP 压缩包',
    '1F8B08': 'GZIP 压缩文件',
    '7F454C46': 'ELF 可执行文件',
    '4D5A': 'DOS/Windows 可执行文件'
  };
  
  for (const [sig, type] of Object.entries(signatures)) {
    if (header.startsWith(sig)) {
      return type;
    }
  }
  
  // 根据扩展名判断
  if (ext === '.pdf') return 'PDF 文档';
  
  return '未知二进制文件';
}

/**
 * POST /api/file/upload
 * 上传文件
 */
router.post('/file/upload', async (req, res) => {
  try {
    // 动态导入 formidable (ES 模块兼容)
    let formidable;
    try {
      const formidableModule = await import('formidable');
      formidable = formidableModule.default;
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: '文件上传功能未安装依赖。请运行：npm install formidable'
      });
    }
    
    const form = formidable({
      uploadDir: req.app.get('fileViewerRoot') || process.cwd(),
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      multiples: true
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('文件上传失败:', err);
        return res.status(500).json({
          success: false,
          error: '文件上传失败：' + err.message
        });
      }

      const uploadedFiles = [];
      
      // 处理上传的文件
      const fileArray = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];
      
      for (const file of fileArray) {
        try {
          const fileName = file.originalFilename || file.newFilename;
          const newPath = path.join(form.uploadDir, fileName);
          
          // 重命名文件
          fs.renameSync(file.filepath, newPath);
          
          const stats = fs.statSync(newPath);
          uploadedFiles.push({
            name: fileName,
            path: newPath,
            size: formatFileSize(stats.size),
            modified: stats.mtime.toISOString()
          });
        } catch (err) {
          console.error('处理上传文件失败:', err);
        }
      }

      res.json({
        success: true,
        data: {
          uploaded: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    });
  } catch (err) {
    console.error('文件上传失败:', err);
    res.status(500).json({
      success: false,
      error: '文件上传失败：' + err.message
    });
  }
});

/**
 * POST /api/file/upload-to
 * 上传文件到指定目录
 */
router.post('/file/upload-to', async (req, res) => {
  const targetPath = req.query.path;

  if (!targetPath) {
    return res.status(400).json({
      success: false,
      error: '缺少目标路径参数'
    });
  }

  const rootDir = req.app.get('fileViewerRoot') || process.cwd();

  // 构建目标路径（统一使用绝对路径处理）
  let safeTargetPath;
  if (path.isAbsolute(targetPath)) {
    // 如果是绝对路径，直接使用
    safeTargetPath = path.resolve(targetPath);
  } else {
    // 如果是相对路径，相对于 rootDir 构建
    safeTargetPath = path.resolve(rootDir, targetPath);
  }

  // 安全检查：确保目标路径在 rootDir 内
  safeTargetPath = safePath(safeTargetPath, rootDir);

  if (!safeTargetPath) {
    console.error('上传失败：路径不安全', { targetPath, rootDir });
    return res.status(403).json({
      success: false,
      error: '禁止访问该路径'
    });
  }

  if (!fs.existsSync(safeTargetPath)) {
    console.error('上传失败：目标路径不存在', { safeTargetPath });
    return res.status(404).json({
      success: false,
      error: '目标路径不存在'
    });
  }

  console.log('文件上传：目标路径 =', safeTargetPath);

  try {
    let formidable;
    try {
      const formidableModule = await import('formidable');
      formidable = formidableModule.default;
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: '文件上传功能未安装依赖。请运行：npm install formidable'
      });
    }

    const form = formidable({
      uploadDir: safeTargetPath,
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024,
      multiples: true
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('文件上传失败:', err);
        return res.status(500).json({
          success: false,
          error: '文件上传失败：' + err.message
        });
      }

      const uploadedFiles = [];
      const fileArray = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];

      console.log('上传文件数量:', fileArray.length);

      for (const file of fileArray) {
        try {
          const fileName = file.originalFilename || file.newFilename;
          const newPath = path.join(safeTargetPath, fileName);

          console.log('保存文件:', newPath);
          fs.renameSync(file.filepath, newPath);

          const stats = fs.statSync(newPath);
          uploadedFiles.push({
            name: fileName,
            path: newPath,
            relativePath: path.relative(rootDir, newPath),
            size: formatFileSize(stats.size),
            modified: stats.mtime.toISOString()
          });
        } catch (err) {
          console.error('处理上传文件失败:', err);
        }
      }

      res.json({
        success: true,
        data: {
          uploaded: uploadedFiles,
          count: uploadedFiles.length,
          targetPath: safeTargetPath
        }
      });
    });
  } catch (err) {
    console.error('文件上传失败:', err);
    res.status(500).json({
      success: false,
      error: '文件上传失败：' + err.message
    });
  }
});

/**
 * POST /api/file/create-dir
 * 创建新目录
 */
router.post('/file/create-dir', (req, res) => {
  const rootDir = req.app.get('fileViewerRoot') || process.cwd();
  let targetPath = req.query.path;
  const dirName = req.query.name;
  
  if (!dirName) {
    return res.status(400).json({
      success: false,
      error: '缺少目录名称'
    });
  }
  
  if (!targetPath) {
    targetPath = rootDir;
  }
  
  if (!path.isAbsolute(targetPath)) {
    targetPath = path.join(rootDir, targetPath);
  }
  
  const safeTargetPath = safePath(targetPath, rootDir);
  
  if (!safeTargetPath) {
    return res.status(403).json({
      success: false,
      error: '禁止访问该路径'
    });
  }
  
  try {
    const newDirPath = path.join(safeTargetPath, dirName);
    fs.mkdirSync(newDirPath, { recursive: true });

    res.json({
      success: true,
      data: {
        path: newDirPath,
        relativePath: path.relative(rootDir, newDirPath),
        name: dirName
      }
    });
  } catch (err) {
    console.error('创建目录失败:', err);
    res.status(500).json({
      success: false,
      error: '创建目录失败：' + err.message
    });
  }
});

/**
 * POST /api/file/create
 * 创建新文件（空文件）
 */
router.post('/file/create', (req, res) => {
  const rootDir = req.app.get('fileViewerRoot') || process.cwd();
  let targetPath = req.query.path;
  const fileName = req.query.name;

  if (!fileName) {
    return res.status(400).json({
      success: false,
      error: '缺少文件名称'
    });
  }

  if (!targetPath) {
    targetPath = rootDir;
  }

  // 如果是相对路径，转换为绝对路径
  let safeTargetPath;
  if (!path.isAbsolute(targetPath)) {
    safeTargetPath = path.join(rootDir, targetPath);
  } else {
    safeTargetPath = targetPath;
  }

  safeTargetPath = safePath(safeTargetPath, rootDir);

  if (!safeTargetPath) {
    return res.status(403).json({
      success: false,
      error: '禁止访问该路径'
    });
  }

  try {
    const newFilePath = path.join(safeTargetPath, fileName);

    // 检查文件是否已存在
    if (fs.existsSync(newFilePath)) {
      return res.status(400).json({
        success: false,
        error: '文件已存在'
      });
    }

    // 创建空文件
    fs.writeFileSync(newFilePath, '');

    res.json({
      success: true,
      data: {
        path: newFilePath,
        relativePath: path.relative(rootDir, newFilePath),
        name: fileName
      }
    });
  } catch (err) {
    console.error('创建文件失败:', err);
    res.status(500).json({
      success: false,
      error: '创建文件失败：' + err.message
    });
  }
});

/**
 * DELETE /api/file
 * 删除文件或空目录
 */
router.delete('/file', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let requestedPath = req.query.path;

    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }

    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(requestedPath)) {
      requestedPath = path.join(rootDir, requestedPath);
    }

    const safePathResult = safePath(requestedPath, rootDir);

    if (!safePathResult) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }

    if (!fs.existsSync(safePathResult)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    const stats = fs.statSync(safePathResult);

    // 如果是目录，检查是否为空
    if (stats.isDirectory()) {
      const entries = fs.readdirSync(safePathResult);
      if (entries.length > 0) {
        return res.status(400).json({
          success: false,
          error: '无法删除非空目录，请先清空目录内容'
        });
      }
    }

    // 删除文件或目录
    fs.rmSync(safePathResult, { recursive: true, force: true });

    res.json({
      success: true,
      data: {
        path: safePathResult,
        relativePath: path.relative(rootDir, safePathResult),
        deleted: true
      }
    });
  } catch (err) {
    console.error('删除文件失败:', err);
    res.status(500).json({
      success: false,
      error: '删除失败：' + err.message
    });
  }
});

/**
 * POST /api/file/rename
 * 重命名文件或目录
 */
router.post('/file/rename', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    const oldPath = req.query.path;
    const newName = req.query.name;

    if (!oldPath || !newName) {
      return res.status(400).json({
        success: false,
        error: '缺少路径或新名称参数'
      });
    }

    // 如果是相对路径，转换为绝对路径
    let safeOldPath = !path.isAbsolute(oldPath) ? path.join(rootDir, oldPath) : oldPath;
    safeOldPath = safePath(safeOldPath, rootDir);

    if (!safeOldPath) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }

    if (!fs.existsSync(safeOldPath)) {
      return res.status(404).json({
        success: false,
        error: '原路径不存在'
      });
    }

    // 构建新路径
    const parentDir = path.dirname(safeOldPath);
    const safeNewPath = path.join(parentDir, newName);

    // 检查新路径是否安全
    const validatedNewPath = safePath(safeNewPath, rootDir);
    if (!validatedNewPath) {
      return res.status(403).json({
        success: false,
        error: '新路径不合法'
      });
    }

    // 检查新名称是否已存在
    if (fs.existsSync(safeNewPath)) {
      return res.status(400).json({
        success: false,
        error: '新名称已存在'
      });
    }

    // 重命名
    fs.renameSync(safeOldPath, safeNewPath);

    const stats = fs.statSync(safeNewPath);
    res.json({
      success: true,
      data: {
        oldPath: safeOldPath,
        newPath: safeNewPath,
        relativePath: path.relative(rootDir, safeNewPath),
        name: newName,
        isDirectory: stats.isDirectory()
      }
    });
  } catch (err) {
    console.error('重命名失败:', err);
    res.status(500).json({
      success: false,
      error: '重命名失败：' + err.message
    });
  }
});

export default router;
