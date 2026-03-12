import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * 解析 XLSX/XLS 文件
 * @param {string} filePath - 文件路径
 * @returns {Object} - 包含所有工作表数据的对象
 */
function parseXLSX(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在：${filePath}`);
  }
  
  const workbook = xlsxRead(filePath, { type: 'file', cellDates: true });
  const result = {
    worksheets: []
  };

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsxUtils.sheet_to_json(worksheet, { defval: '', raw: false });
    
    result.worksheets.push({
      name: sheetName,
      data: jsonData
    });
  });

  return result;
}

/**
 * 获取文件类型
 * @param {string} fileName - 文件名
 * @returns {string} - 文件类型 (xlsx, xls)
 */
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (['.xlsx', '.xls'].includes(ext)) {
    return 'xlsx';
  }
  return null;
}

/**
 * POST /api/xlsx/upload
 * 上传并解析 xlsx/xls 文件为 JSON
 */
router.post('/upload', async (req, res) => {
  const rootDir = req.app.get('fileViewerRoot') || process.cwd();
  let tempFilePath = null;
  
  try {
    // 动态导入 formidable
    const { default: formidable } = await import('formidable');
    
    const form = formidable({
      uploadDir: rootDir,
      keepExtensions: false,
      maxFileSize: 50 * 1024 * 1024,
      multiples: false,
      createDirs: true,
      filter: ({ originalFilename, mimetype }) => {
        const ext = originalFilename ? path.extname(originalFilename).toLowerCase() : '';
        return ['.xlsx', '.xls'].includes(ext);
      }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // 获取上传的文件（formidable 3.x 返回数组）
    const fileArray = files.file || [];
    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: '未找到上传的文件，请确保表单字段名为 "file"'
      });
    }

    tempFilePath = uploadedFile.filepath || uploadedFile.path;
    const fileName = uploadedFile.originalFilename || uploadedFile.newFilename;

    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      return res.status(400).json({
        success: false,
        error: '临时文件不存在'
      });
    }

    // 验证文件类型
    const fileType = getFileType(fileName);
    if (!fileType) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        success: false,
        error: '不支持的文件格式，请上传 .xlsx 或 .xls 文件'
      });
    }

    // 解析文件
    const result = parseXLSX(tempFilePath);

    // 删除临时文件
    try {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    } catch (unlinkErr) {
      console.warn('[XLSX Upload] 删除临时文件失败:', unlinkErr.message);
    }

    res.json({
      success: true,
      data: {
        fileName,
        fileType,
        worksheetCount: result.worksheets.length,
        worksheets: result.worksheets.map(ws => ({
          name: ws.name,
          rowCount: ws.data.length,
          data: ws.data
        }))
      }
    });

  } catch (error) {
    console.error('[XLSX Upload] 错误:', error.message);
    
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '上传失败'
    });
  }
});

/**
 * GET /api/xlsx/parse
 * 解析已存在的 xlsx/xls 文件为 JSON
 */
router.get('/parse', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }

    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(rootDir, filePath);
    }

    // 安全检查路径
    const safePath = path.resolve(filePath);
    const normalizedRoot = path.resolve(rootDir);

    if (!safePath.startsWith(normalizedRoot)) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }

    // 检查文件是否存在
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    const fileName = path.basename(safePath);
    const fileType = getFileType(fileName);

    if (!fileType) {
      return res.status(400).json({
        success: false,
        error: '不支持的文件格式，请上传 .xlsx 或 .xls 文件'
      });
    }

    // 解析文件
    const result = parseXLSX(safePath);

    res.json({
      success: true,
      data: {
        fileName,
        fileType,
        path: safePath,
        worksheetCount: result.worksheets.length,
        worksheets: result.worksheets.map(ws => ({
          name: ws.name,
          rowCount: ws.data.length,
          data: ws.data
        }))
      }
    });
  } catch (err) {
    console.error('[XLSX Parse] 错误:', err.message);
    res.status(500).json({
      success: false,
      error: '解析失败：' + err.message
    });
  }
});

/**
 * GET /api/xlsx/info
 * 获取 xlsx/xls 文件基本信息
 */
router.get('/info', (req, res) => {
  try {
    const rootDir = req.app.get('fileViewerRoot') || process.cwd();
    let filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '缺少文件路径参数'
      });
    }

    // 如果是相对路径，转换为绝对路径
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(rootDir, filePath);
    }

    // 安全检查路径
    const safePath = path.resolve(filePath);
    const normalizedRoot = path.resolve(rootDir);

    if (!safePath.startsWith(normalizedRoot)) {
      return res.status(403).json({
        success: false,
        error: '禁止访问该路径'
      });
    }

    // 检查文件是否存在
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    const stats = fs.statSync(safePath);
    const fileName = path.basename(safePath);
    const fileType = getFileType(fileName);

    if (!fileType) {
      return res.status(400).json({
        success: false,
        error: '不支持的文件格式'
      });
    }

    // 获取工作表信息
    const workbook = xlsxRead(safePath, { type: 'file' });
    const worksheetInfo = {
      worksheets: workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        const range = xlsxUtils.decode_range(worksheet['!ref'] || 'A1');
        return {
          name,
          rows: range.e.r,
          columns: range.e.c + 1
        };
      })
    };

    res.json({
      success: true,
      data: {
        fileName,
        fileType,
        path: safePath,
        size: {
          bytes: stats.size,
          formatted: `${(stats.size / 1024).toFixed(2)} KB`
        },
        modified: stats.mtime.toISOString(),
        ...worksheetInfo
      }
    });
  } catch (err) {
    console.error('[XLSX Info] 错误:', err.message);
    res.status(500).json({
      success: false,
      error: '获取文件信息失败：' + err.message
    });
  }
});

export default router;
