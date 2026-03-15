/**
 * Web IDE Lite v2 - 面包屑导航功能
 * 
 * 功能：
 * 1. 显示当前文件路径
 * 2. 点击导航到文件夹
 * 3. 文件夹折叠/展开
 * 4. 路径溢出处理
 */

/**
 * 构建文件路径面包屑
 * @param {Object} file - 文件对象
 * @param {Array} folders - 文件夹列表
 * @returns {Array} 面包屑项数组
 */
export function buildBreadcrumbs(file, folders) {
  if (!file) return [];
  
  const crumbs = [];
  
  // 添加根目录
  crumbs.push({
    id: 'root',
    name: '📁 根目录',
    folderId: null,
    isRoot: true
  });
  
  // 如果有文件夹 ID，查找父文件夹
  if (file.folderId) {
    const parentChain = [];
    let currentFolderId = file.folderId;
    
    while (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        parentChain.unshift(folder);
        currentFolderId = folder.folderId;
      } else {
        break;
      }
    }
    
    // 添加父文件夹到面包屑
    parentChain.forEach(folder => {
      crumbs.push({
        id: folder.id,
        name: folder.name,
        folderId: folder.folderId,
        isRoot: false
      });
    });
  }
  
  // 添加当前文件/文件夹
  if (!file.isFolder) {
    crumbs.push({
      id: file.id,
      name: file.name,
      folderId: file.folderId,
      isFile: true,
      isRoot: false
    });
  }
  
  return crumbs;
}

/**
 * 构建文件夹路径面包屑
 * @param {Object} folder - 文件夹对象
 * @param {Array} folders - 文件夹列表
 * @returns {Array} 面包屑项数组
 */
export function buildFolderBreadcrumbs(folder, folders) {
  if (!folder) return [];
  
  const crumbs = [];
  
  // 添加根目录
  crumbs.push({
    id: 'root',
    name: '📁 根目录',
    folderId: null,
    isRoot: true
  });
  
  // 查找父文件夹链
  const parentChain = [];
  let currentFolderId = folder.folderId;
  
  while (currentFolderId) {
    const parentFolder = folders.find(f => f.id === currentFolderId);
    if (parentFolder) {
      parentChain.unshift(parentFolder);
      currentFolderId = parentFolder.folderId;
    } else {
      break;
    }
  }
  
  // 添加父文件夹到面包屑
  parentChain.forEach(f => {
    crumbs.push({
      id: f.id,
      name: f.name,
      folderId: f.folderId,
      isRoot: false
    });
  });
  
  // 添加当前文件夹
  crumbs.push({
    id: folder.id,
    name: folder.name,
    folderId: folder.folderId,
    isFolder: true,
    isRoot: false
  });
  
  return crumbs;
}

/**
 * 处理溢出面包屑（当路径过长时）
 * @param {Array} crumbs - 面包屑数组
 * @param {number} maxVisible - 最大显示数量
 * @returns {Array} 处理后的面包屑
 */
export function truncateBreadcrumbs(crumbs, maxVisible = 5) {
  if (crumbs.length <= maxVisible) return crumbs;
  
  // 保留第一个（根目录）和最后 maxVisible-1 个
  const visibleCrumbs = [
    crumbs[0],
    { type: 'ellipsis', name: '...', id: 'ellipsis' },
    ...crumbs.slice(-(maxVisible - 1))
  ];
  
  return visibleCrumbs;
}

/**
 * 创建面包屑状态管理
 * @returns {Object} 状态对象
 */
export function createBreadcrumbsState() {
  return {
    crumbs: [],
    currentFile: null,
    currentFolder: null,
    visible: true
  };
}

/**
 * 导航到面包屑项
 * @param {Object} crumb - 面包屑项
 * @param {Object} state - 应用状态
 * @param {Object} actions - 操作函数
 */
export function navigateToCrumb(crumb, state, actions) {
  if (crumb.isRoot) {
    // 导航到根目录
    state.currentFolder.value = null;
  } else if (crumb.isFolder) {
    // 导航到文件夹
    const folder = state.folders.value.find(f => f.id === crumb.id);
    if (folder) {
      state.currentFolder.value = folder;
    }
  } else if (crumb.isFile) {
    // 打开文件
    const file = state.files.value.find(f => f.id === crumb.id);
    if (file) {
      actions.openFile(file);
    }
  }
}
