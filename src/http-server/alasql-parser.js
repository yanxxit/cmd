import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import alasql from 'alasql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * 解析文件为 JSON 数据
 * @param {string} filePath - 文件路径
 * @param {string} fileType - 文件类型 (xlsx, xls, csv, json)
 * @returns {Array} - JSON 数据数组
 */
function parseFile(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在：${filePath}`);
  }

  let data = [];

  if (['xlsx', 'xls', 'csv'].includes(fileType)) {
    // 使用 AlaSQL 读取 Excel/CSV 文件
    const fileName = path.basename(filePath);
    // AlaSQL 需要从文件路径读取
    data = alasql(`SELECT * FROM FILE("${filePath}", {headers:true})`);
  } else if (fileType === 'json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
    if (!Array.isArray(data)) {
      data = [data];
    }
  }

  return data;
}

/**
 * 获取文件类型
 * @param {string} fileName - 文件名
 * @returns {string} - 文件类型
 */
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase().slice(1);
  if (['xlsx', 'xls', 'csv', 'json'].includes(ext)) {
    return ext;
  }
  return null;
}

/**
 * POST /api/alasql/upload
 * 上传文件并解析
 */
router.post('/upload', async (req, res) => {
  let tempFilePath = null;

  try {
    // 动态导入 formidable
    const { default: formidable } = await import('formidable');

    const rootDir = req.app.get('fileViewerRoot') || process.cwd();

    const form = formidable({
      uploadDir: rootDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
      multiples: false,
      createDirs: true,
      filter: ({ originalFilename, mimetype }) => {
        const ext = originalFilename ? path.extname(originalFilename).toLowerCase().slice(1) : '';
        return ['xlsx', 'xls', 'csv', 'json'].includes(ext);
      }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // 获取上传的文件
    const fileArray = files.file || [];
    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: '未找到上传的文件'
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
        error: '不支持的文件格式，请上传 .xlsx, .xls, .csv 或 .json 文件'
      });
    }

    // 解析文件
    const data = parseFile(tempFilePath, fileType);

    // 删除临时文件
    try {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    } catch (unlinkErr) {
      console.warn('[AlaSQL Upload] 删除临时文件失败:', unlinkErr.message);
    }

    res.json({
      success: true,
      data: {
        fileName,
        fileType,
        rowCount: data.length,
        data: data
      }
    });

  } catch (error) {
    console.error('[AlaSQL Upload] 错误:', error.message);

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
 * POST /api/alasql/query
 * 执行 SQL 查询
 */
router.post('/query', async (req, res) => {
  try {
    const { sql, data } = req.body;

    if (!sql) {
      return res.status(400).json({
        success: false,
        error: '缺少 SQL 查询语句'
      });
    }

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '数据必须为数组格式'
      });
    }

    const startTime = Date.now();
    
    // 执行 AlaSQL 查询
    let result;
    if (sql.includes('FROM ?')) {
      result = alasql(sql, [data]);
    } else {
      // 创建临时表
      const tableName = `temp_${Date.now()}`;
      alasql(`CREATE TABLE ${tableName} = ?`, [data]);
      result = alasql(sql);
      // 清理临时表
      alasql(`DROP TABLE IF EXISTS ${tableName}`);
    }

    const queryTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        result: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : 1,
        queryTime: `${queryTime}ms`
      }
    });

  } catch (error) {
    console.error('[AlaSQL Query] 错误:', error.message);
    res.status(500).json({
      success: false,
      error: '查询失败：' + error.message
    });
  }
});

/**
 * GET /api/alasql/parse
 * 解析已存在的文件
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
        error: '不支持的文件格式'
      });
    }

    // 解析文件
    const data = parseFile(safePath, fileType);

    res.json({
      success: true,
      data: {
        fileName,
        fileType,
        path: safePath,
        rowCount: data.length,
        data: data
      }
    });
  } catch (err) {
    console.error('[AlaSQL Parse] 错误:', err.message);
    res.status(500).json({
      success: false,
      error: '解析失败：' + err.message
    });
  }
});

/**
 * GET /api/alasql/export
 * 导出数据为指定格式
 */
router.get('/export', (req, res) => {
  try {
    const { format, data, fileName } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '数据必须为数组格式'
      });
    }

    const exportFormat = (format || 'json').toLowerCase();

    if (exportFormat === 'json') {
      res.json({
        success: true,
        data: data
      });
    } else if (exportFormat === 'csv') {
      // 生成 CSV
      if (data.length === 0) {
        return res.json({ success: true, data: '' });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // 处理包含逗号或引号的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];

      res.json({
        success: true,
        data: csvRows.join('\n')
      });
    } else {
      res.status(400).json({
        success: false,
        error: '不支持的导出格式'
      });
    }

  } catch (error) {
    console.error('[AlaSQL Export] 错误:', error.message);
    res.status(500).json({
      success: false,
      error: '导出失败：' + error.message
    });
  }
});

export default router;
