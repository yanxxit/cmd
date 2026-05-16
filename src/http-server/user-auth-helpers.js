import { memberSystemModel } from '../model/jsondb/index.js';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

export async function ensureMemberSystemConnected(req, res, next) {
  try {
    if (!memberSystemModel.users) {
      await memberSystemModel.connect();
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '用户系统初始化失败：' + error.message,
    });
  }
}

export async function requireUserAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    const user = await memberSystemModel.getUserByToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户登录已失效，请重新登录',
      });
    }
    req.userToken = token;
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
