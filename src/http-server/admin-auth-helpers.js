import { adminSystemModel } from '../model/jsondb/index.js';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

export async function ensureAdminSystemConnected(req, res, next) {
  try {
    if (!adminSystemModel.admins) {
      await adminSystemModel.connect();
    }
    next();
  } catch (error) {
    console.error('管理员系统数据库初始化失败:', error);
    res.status(500).json({
      success: false,
      error: '管理员系统初始化失败：' + error.message,
    });
  }
}

export async function requireAdminAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    const admin = await adminSystemModel.getAdminByToken(token);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '登录已失效，请重新登录',
      });
    }
    req.adminToken = token;
    req.currentAdmin = admin;
    next();
  } catch (error) {
    console.error('管理员鉴权失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export function requireAdminPermission(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      const admin = req.currentAdmin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: '未登录或登录已失效',
        });
      }
      const permissionSet = new Set(admin.permissions || []);
      const granted = requiredPermissions.every((permission) => permissionSet.has(permission));
      if (!granted) {
        return res.status(403).json({
          success: false,
          error: '当前账号没有执行该操作的权限',
        });
      }
      next();
    } catch (error) {
      console.error('管理员权限校验失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}
