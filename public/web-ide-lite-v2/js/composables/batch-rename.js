/**
 * Web IDE Lite v2 - 文件批量重命名功能
 * 
 * 功能：
 * 1. 批量选择文件
 * 2. 查找替换文件名
 * 3. 添加前缀/后缀
 * 4. 序号重命名
 * 5. 预览更改
 */

/**
 * 批量重命名文件
 * @param {Array} files - 文件列表
 * @param {Object} options - 重命名选项
 * @returns {Array} 重命名结果
 */
export function batchRenameFiles(files, options = {}) {
  const {
    findText = '',
    replaceText = '',
    prefix = '',
    suffix = '',
    useRegex = false,
    caseSensitive = false,
    addIndex = false,
    indexStart = 1,
    indexPadding = 2
  } = options;
  
  const results = [];
  
  files.forEach((file, fileIndex) => {
    let newName = file.name;
    const extIndex = newName.lastIndexOf('.');
    const namePart = extIndex > -1 ? newName.substring(0, extIndex) : newName;
    const extPart = extIndex > -1 ? newName.substring(extIndex) : '';
    
    // 查找替换
    if (findText) {
      if (useRegex) {
        try {
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(findText, flags);
          newName = namePart.replace(regex, replaceText) + extPart;
        } catch (e) {
          results.push({
            file,
            success: false,
            error: '正则表达式错误'
          });
          return;
        }
      } else {
        const searchStr = caseSensitive ? findText : findText.toLowerCase();
        const currentName = caseSensitive ? namePart : namePart.toLowerCase();
        
        if (currentName.includes(searchStr)) {
          newName = replaceInName(namePart, findText, replaceText, caseSensitive) + extPart;
        }
      }
    }
    
    // 添加序号
    if (addIndex) {
      const index = String(indexStart + fileIndex).padStart(indexPadding + 1, '0');
      newName = `${index}_${newName}`;
    }
    
    // 添加前缀
    if (prefix) {
      newName = `${prefix}${newName}`;
    }
    
    // 添加后缀
    if (suffix) {
      const nameWithoutExt = newName.substring(0, newName.lastIndexOf('.') || newName.length);
      const ext = newName.substring(newName.lastIndexOf('.') || newName.length);
      newName = `${nameWithoutExt}${suffix}${ext}`;
    }
    
    results.push({
      file,
      oldName: file.name,
      newName,
      success: true
    });
  });
  
  return results;
}

/**
 * 在文件名中替换文本
 */
function replaceInName(name, findText, replaceText, caseSensitive) {
  if (caseSensitive) {
    return name.split(findText).join(replaceText);
  } else {
    const regex = new RegExp(escapeRegExp(findText), 'gi');
    return name.replace(regex, replaceText);
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 检查文件名是否冲突
 * @param {Array} results - 重命名结果
 * @returns {Object} 冲突检查结果
 */
export function checkNameConflicts(results) {
  const names = results.filter(r => r.success).map(r => r.newName);
  const uniqueNames = new Set(names);
  const conflicts = [];
  
  if (uniqueNames.size < names.length) {
    // 有重复名称
    const nameCount = {};
    names.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    Object.entries(nameCount).forEach(([name, count]) => {
      if (count > 1) {
        conflicts.push({ name, count });
      }
    });
  }
  
  // 检查是否与现有文件冲突
  const existingNames = new Set(results.map(r => r.file.name));
  const existingConflicts = results.filter(r => 
    r.success && 
    r.oldName !== r.newName && 
    existingNames.has(r.newName) &&
    !results.some(r2 => r2.oldName === r.newName)
  );
  
  return {
    hasConflicts: conflicts.length > 0 || existingConflicts.length > 0,
    conflicts,
    existingConflicts
  };
}

/**
 * 预览重命名结果
 * @param {Array} files - 文件列表
 * @param {Object} options - 重命名选项
 * @returns {Object} 预览结果
 */
export function previewRename(files, options) {
  const results = batchRenameFiles(files, options);
  const conflicts = checkNameConflicts(results);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  return {
    results,
    conflicts,
    stats: {
      total: files.length,
      success: successCount,
      fail: failCount
    }
  };
}

/**
 * 创建批量重命名状态管理
 * @returns {Object} 状态对象
 */
export function createBatchRenameState() {
  return {
    visible: false,
    selectedFiles: [],
    options: {
      findText: '',
      replaceText: '',
      prefix: '',
      suffix: '',
      useRegex: false,
      caseSensitive: false,
      addIndex: false,
      indexStart: 1,
      indexPadding: 2
    },
    preview: null
  };
}

/**
 * 生成序号格式示例
 * @param {number} start - 起始数字
 * @param {number} padding - 填充位数
 * @returns {string} 格式示例
 */
export function getIndexExample(start = 1, padding = 2) {
  return String(start).padStart(padding + 1, '0');
}
