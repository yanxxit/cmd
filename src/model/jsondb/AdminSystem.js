/**
 * Admin System Model
 * 基于 @yanit/jsondb 的管理员、角色、会话管理数据模型
 */

import crypto from 'crypto';
import { getAdminDatabase } from './admin-db.js';
const ADMINS_COLLECTION = 'admins';
const ROLES_COLLECTION = 'roles';
const SESSIONS_COLLECTION = 'sessions';
const DEFAULT_PASSWORD = 'admin123456';
const SESSION_TTL = 24 * 60 * 60 * 1000;
const REMEMBER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

const PERMISSION_CATALOG = [
  { key: 'dashboard.view', group: '基础访问', label: '查看后台首页', description: '可进入后台并查看统计概览' },
  { key: 'cases.view', group: '测试案例', label: '查看测试案例', description: '可浏览测试案例列表与详情' },
  { key: 'cases.manage', group: '测试案例', label: '管理测试案例', description: '可新增、编辑、删除测试案例及子案例' },
  { key: 'collections.view', group: '测试集合', label: '查看测试集合', description: '可浏览测试案例集合' },
  { key: 'collections.manage', group: '测试集合', label: '管理测试集合', description: '可新增、编辑、删除测试集合' },
  { key: 'admins.view', group: '管理员', label: '查看管理员', description: '可查看管理员列表与基本信息' },
  { key: 'admins.manage', group: '管理员', label: '管理管理员', description: '可新增、编辑、删除管理员并重置密码' },
  { key: 'roles.view', group: '角色权限', label: '查看角色权限', description: '可查看角色与权限矩阵' },
  { key: 'roles.manage', group: '角色权限', label: '管理角色权限', description: '可调整角色说明与权限配置' },
  { key: 'envs.view', group: '环境变量', label: '查看环境变量', description: '可查看环境变量列表、类型与当前值' },
  { key: 'envs.manage', group: '环境变量', label: '管理环境变量', description: '可新增、编辑、删除环境变量并实时生效' },
  { key: 'articles.view', group: '文章管理', label: '查看文章', description: '可查看文章列表、详情与统计信息' },
  { key: 'articles.manage', group: '文章管理', label: '管理文章', description: '可新增、编辑、删除文章并维护发布状态' },
  { key: 'shortlinks.view', group: '短链接', label: '查看短链接', description: '可查看短链接列表、点击数与目标地址' },
  { key: 'shortlinks.manage', group: '短链接', label: '管理短链接', description: '可停用、删除和维护短链接' },
  { key: 'users.view', group: '用户管理', label: '查看用户', description: '可查看用户列表、登录和签到信息' },
  { key: 'users.manage', group: '用户管理', label: '管理用户', description: '可新增、编辑、删除用户并重置密码' },
  { key: 'coupons.view', group: '优惠券', label: '查看优惠券', description: '可查看优惠券列表、领取记录与使用记录' },
  { key: 'coupons.manage', group: '优惠券', label: '管理优惠券', description: '可创建、发放、停用和删除优惠券' },
  { key: 'lottery.view', group: '活动大转盘', label: '查看大转盘', description: '可查看大转盘奖池与抽奖记录' },
  { key: 'lottery.manage', group: '活动大转盘', label: '管理大转盘', description: '可模拟抽奖并维护奖池数据' },
  { key: 'profile.view', group: '账号安全', label: '查看个人账号', description: '可查看个人信息与当前角色' },
  { key: 'password.change', group: '账号安全', label: '修改密码', description: '可修改自己的登录密码' },
];

const DEFAULT_ROLES = [
  {
    code: 'super_admin',
    name: '超级管理员',
    description: '可查看全部管理员并执行增删改查，同时拥有角色与权限配置能力。',
    isSystem: true,
    editable: false,
    permissions: PERMISSION_CATALOG.map((item) => item.key),
  },
  {
    code: 'user',
    name: '普通用户',
    description: '可使用测试案例与测试集合能力，并可维护自己的账号密码。',
    isSystem: true,
    editable: true,
    permissions: [
      'dashboard.view',
      'cases.view',
      'cases.manage',
      'collections.view',
      'collections.manage',
      'articles.view',
      'articles.manage',
      'shortlinks.view',
      'users.view',
      'coupons.view',
      'lottery.view',
      'profile.view',
      'password.change',
    ],
  },
];

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function uniqueList(items = []) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

export class AdminSystemModel {
  constructor(options = {}) {
    this.options = {
      jsonb: true,
      cacheTTL: 5000,
      enableQueryCache: true,
      queryCacheTTL: 30000,
      ...options,
    };
    this.admins = null;
    this.roles = null;
    this.sessions = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.admins = db.collection(ADMINS_COLLECTION);
    this.roles = db.collection(ROLES_COLLECTION);
    this.sessions = db.collection(SESSIONS_COLLECTION);

    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.admins || !this.roles || !this.sessions) {
      await this.connect();
    }
  }

  async _ensureDefaults() {
    for (const role of DEFAULT_ROLES) {
      const existingRole = await this.roles.findOne({ code: role.code });
      if (!existingRole) {
        await this.roles.insertOne({
          ...role,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      } else if (existingRole.isSystem) {
        const nextPermissions = role.code === 'super_admin'
          ? PERMISSION_CATALOG.map((item) => item.key)
          : uniqueList([...(existingRole.permissions || []), ...(role.permissions || [])]);
        await this.roles.updateOne(
          { code: role.code },
          {
            $set: {
              name: role.name,
              description: role.description,
              editable: role.editable,
              isSystem: true,
              permissions: nextPermissions,
              updatedAt: nowIso(),
            },
          }
        );
      }
    }

    const defaultAdmin = await this.admins.findOne({ username: 'admin' });
    if (!defaultAdmin) {
      await this.admins.insertOne({
        username: 'admin',
        displayName: '系统管理员',
        status: 'active',
        roleCodes: ['super_admin'],
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        lastLoginAt: '',
      });
    }
  }

  async getPermissionCatalog() {
    await this._ensureConnected();
    const groups = {};
    for (const item of PERMISSION_CATALOG) {
      groups[item.group] = groups[item.group] || [];
      groups[item.group].push(item);
    }
    return {
      items: PERMISSION_CATALOG,
      groups: Object.entries(groups).map(([group, permissions]) => ({ group, permissions })),
    };
  }

  async listRoles() {
    await this._ensureConnected();
    const roles = await this.roles.find({}).toArray();
    const admins = await this.admins.find({}).toArray();
    return roles
      .map((role) => ({
        ...role,
        memberCount: admins.filter((admin) => Array.isArray(admin.roleCodes) && admin.roleCodes.includes(role.code)).length,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async findRoleByCode(code) {
    await this._ensureConnected();
    return await this.roles.findOne({ code });
  }

  async validateRoleCodes(roleCodes = []) {
    await this._ensureConnected();
    const nextRoleCodes = uniqueList(roleCodes);
    if (!nextRoleCodes.length) {
      throw new Error('至少需要分配一个角色');
    }

    const roles = await this.listRoles();
    const validCodes = new Set(roles.map((role) => role.code));
    for (const code of nextRoleCodes) {
      if (!validCodes.has(code)) {
        throw new Error(`角色不存在：${code}`);
      }
    }
    return nextRoleCodes;
  }

  async resolvePermissions(roleCodes = []) {
    await this._ensureConnected();
    const roles = await this.listRoles();
    const roleMap = new Map(roles.map((role) => [role.code, role]));
    const permissions = new Set();
    for (const code of roleCodes || []) {
      const role = roleMap.get(code);
      if (!role) continue;
      for (const permission of role.permissions || []) {
        permissions.add(permission);
      }
    }
    return Array.from(permissions);
  }

  async sanitizeAdmin(admin) {
    if (!admin) return null;
    const roles = await this.listRoles();
    const roleMap = new Map(roles.map((role) => [role.code, role]));
    const roleCodes = uniqueList(admin.roleCodes);
    const resolvedRoles = roleCodes.map((code) => roleMap.get(code)).filter(Boolean);
    const permissions = await this.resolvePermissions(roleCodes);
    return {
      _id: admin._id,
      username: admin.username,
      displayName: admin.displayName,
      status: admin.status || 'active',
      roleCodes,
      roles: resolvedRoles,
      permissions,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastLoginAt: admin.lastLoginAt || '',
    };
  }

  async listAdmins(filters = {}) {
    await this._ensureConnected();
    const { keyword = '', roleCode = '', status = '' } = filters;
    let admins = await this.admins.find({}).toArray();
    if (keyword) {
      const key = keyword.toLowerCase();
      admins = admins.filter((item) =>
        item.username?.toLowerCase().includes(key) ||
        item.displayName?.toLowerCase().includes(key)
      );
    }
    if (roleCode) {
      admins = admins.filter((item) => Array.isArray(item.roleCodes) && item.roleCodes.includes(roleCode));
    }
    if (status) {
      admins = admins.filter((item) => (item.status || 'active') === status);
    }

    admins.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return await Promise.all(admins.map((item) => this.sanitizeAdmin(item)));
  }

  async findAdminById(id) {
    await this._ensureConnected();
    const admin = await this.admins.findOne({ _id: id });
    return await this.sanitizeAdmin(admin);
  }

  async createAdmin(data = {}) {
    await this._ensureConnected();
    const username = String(data.username || '').trim().toLowerCase();
    const displayName = String(data.displayName || '').trim();
    const password = String(data.password || '');
    const status = data.status === 'disabled' ? 'disabled' : 'active';
    const roleCodes = await this.validateRoleCodes(data.roleCodes);

    if (!username) throw new Error('用户名不能为空');
    if (!displayName) throw new Error('姓名不能为空');
    if (password.length < 6) throw new Error('密码长度不能少于 6 位');

    const existing = await this.admins.findOne({ username });
    if (existing) throw new Error('用户名已存在');

    const inserted = await this.admins.insertOne({
      username,
      displayName,
      status,
      roleCodes,
      passwordHash: hashPassword(password),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: '',
    });

    return await this.sanitizeAdmin(inserted);
  }

  async updateAdmin(id, updates = {}, actorId = '') {
    await this._ensureConnected();
    const existing = await this.admins.findOne({ _id: id });
    if (!existing) throw new Error('管理员不存在');

    const nextDoc = {};
    if (updates.username !== undefined) {
      const username = String(updates.username || '').trim().toLowerCase();
      if (!username) throw new Error('用户名不能为空');
      const duplicate = await this.admins.findOne({ username });
      if (duplicate && duplicate._id !== id) throw new Error('用户名已存在');
      nextDoc.username = username;
    }
    if (updates.displayName !== undefined) {
      const displayName = String(updates.displayName || '').trim();
      if (!displayName) throw new Error('姓名不能为空');
      nextDoc.displayName = displayName;
    }
    if (updates.status !== undefined) {
      nextDoc.status = updates.status === 'disabled' ? 'disabled' : 'active';
    }
    if (updates.roleCodes !== undefined) {
      nextDoc.roleCodes = await this.validateRoleCodes(updates.roleCodes);
    }

    const finalRoleCodes = nextDoc.roleCodes || existing.roleCodes || [];
    const finalStatus = nextDoc.status || existing.status || 'active';
    await this._assertSuperAdminGuard({
      currentId: id,
      roleCodes: finalRoleCodes,
      status: finalStatus,
      action: 'update',
      actorId,
    });

    await this.admins.updateOne(
      { _id: id },
      {
        $set: {
          ...nextDoc,
          updatedAt: nowIso(),
        },
      }
    );

    const updated = await this.admins.findOne({ _id: id });
    return await this.sanitizeAdmin(updated);
  }

  async deleteAdmin(id, actorId = '') {
    await this._ensureConnected();
    const existing = await this.admins.findOne({ _id: id });
    if (!existing) throw new Error('管理员不存在');
    if (id === actorId) throw new Error('不能删除当前登录账号');

    await this._assertSuperAdminGuard({
      currentId: id,
      roleCodes: [],
      status: 'disabled',
      action: 'delete',
      actorId,
    });

    await this.admins.deleteOne({ _id: id });

    const sessions = await this.sessions.find({ adminId: id }).toArray();
    for (const session of sessions) {
      await this.sessions.deleteOne({ _id: session._id });
    }
    return true;
  }

  async resetPassword(id, newPassword) {
    await this._ensureConnected();
    const existing = await this.admins.findOne({ _id: id });
    if (!existing) throw new Error('管理员不存在');
    const password = String(newPassword || '');
    if (password.length < 6) throw new Error('密码长度不能少于 6 位');

    await this.admins.updateOne(
      { _id: id },
      {
        $set: {
          passwordHash: hashPassword(password),
          updatedAt: nowIso(),
        },
      }
    );
    const sessions = await this.sessions.find({ adminId: id }).toArray();
    for (const session of sessions) {
      await this.sessions.deleteOne({ _id: session._id });
    }
    return true;
  }

  async authenticate(username, password, remember = false) {
    await this._ensureConnected();
    const nextUsername = String(username || '').trim().toLowerCase();
    const nextPassword = String(password || '');
    const admin = await this.admins.findOne({ username: nextUsername });
    if (!admin || admin.passwordHash !== hashPassword(nextPassword)) {
      throw new Error('用户名或密码错误');
    }
    if ((admin.status || 'active') !== 'active') {
      throw new Error('当前账号已被禁用');
    }

    const token = createToken();
    const expiresAt = Date.now() + (remember ? REMEMBER_SESSION_TTL : SESSION_TTL);
    await this.sessions.insertOne({
      token,
      adminId: admin._id,
      remember: !!remember,
      createdAt: nowIso(),
      expiresAt,
    });

    await this.admins.updateOne(
      { _id: admin._id },
      { $set: { lastLoginAt: nowIso(), updatedAt: nowIso() } }
    );

    const freshAdmin = await this.admins.findOne({ _id: admin._id });
    return {
      token,
      expiresAt,
      admin: await this.sanitizeAdmin(freshAdmin),
      defaultPassword: admin.username === 'admin' ? DEFAULT_PASSWORD : undefined,
    };
  }

  async getAdminByToken(token) {
    await this._ensureConnected();
    if (!token) return null;
    const session = await this.sessions.findOne({ token });
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      await this.sessions.deleteOne({ _id: session._id });
      return null;
    }

    const admin = await this.admins.findOne({ _id: session.adminId });
    if (!admin || (admin.status || 'active') !== 'active') {
      return null;
    }
    return await this.sanitizeAdmin(admin);
  }

  async logout(token) {
    await this._ensureConnected();
    if (!token) return true;
    const session = await this.sessions.findOne({ token });
    if (!session) return true;
    await this.sessions.deleteOne({ _id: session._id });
    return true;
  }

  async changePassword(adminId, oldPassword, newPassword) {
    await this._ensureConnected();
    const admin = await this.admins.findOne({ _id: adminId });
    if (!admin) throw new Error('管理员不存在');
    if (admin.passwordHash !== hashPassword(oldPassword)) {
      throw new Error('旧密码不正确');
    }
    if (String(newPassword || '').length < 6) {
      throw new Error('新密码长度不能少于 6 位');
    }

    await this.admins.updateOne(
      { _id: adminId },
      {
        $set: {
          passwordHash: hashPassword(newPassword),
          updatedAt: nowIso(),
        },
      }
    );
    const sessions = await this.sessions.find({ adminId }).toArray();
    for (const session of sessions) {
      await this.sessions.deleteOne({ _id: session._id });
    }
    return true;
  }

  async getDashboardStats() {
    await this._ensureConnected();
    const admins = await this.admins.find({}).toArray();
    const roles = await this.roles.find({}).toArray();
    const activeAdmins = admins.filter((item) => (item.status || 'active') === 'active').length;
    const superAdmins = admins.filter((item) => Array.isArray(item.roleCodes) && item.roleCodes.includes('super_admin')).length;
    return {
      totalAdmins: admins.length,
      activeAdmins,
      disabledAdmins: admins.length - activeAdmins,
      totalRoles: roles.length,
      superAdmins,
    };
  }

  async updateRole(code, updates = {}) {
    await this._ensureConnected();
    const existing = await this.roles.findOne({ code });
    if (!existing) throw new Error('角色不存在');

    const nextDoc = {};
    if (updates.name !== undefined) {
      const name = String(updates.name || '').trim();
      if (!name) throw new Error('角色名称不能为空');
      nextDoc.name = name;
    }
    if (updates.description !== undefined) {
      nextDoc.description = String(updates.description || '').trim();
    }
    if (updates.permissions !== undefined) {
      const validPermissions = new Set(PERMISSION_CATALOG.map((item) => item.key));
      const permissions = uniqueList(updates.permissions);
      for (const permission of permissions) {
        if (!validPermissions.has(permission)) {
          throw new Error(`非法权限：${permission}`);
        }
      }
      nextDoc.permissions = code === 'super_admin'
        ? PERMISSION_CATALOG.map((item) => item.key)
        : permissions;
    }

    await this.roles.updateOne(
      { code },
      {
        $set: {
          ...nextDoc,
          updatedAt: nowIso(),
        },
      }
    );

    return await this.findRoleByCode(code);
  }

  async _assertSuperAdminGuard({ currentId, roleCodes, status, action, actorId }) {
    await this._ensureConnected();
    const admins = await this.admins.find({}).toArray();
    const activeSuperAdmins = admins.filter(
      (item) =>
        item._id !== currentId &&
        (item.status || 'active') === 'active' &&
        Array.isArray(item.roleCodes) &&
        item.roleCodes.includes('super_admin')
    );

    const nextIsSuperAdmin = Array.isArray(roleCodes) && roleCodes.includes('super_admin');
    const nextIsActive = status === 'active';
    const actor = admins.find((item) => item._id === actorId);
    const target = admins.find((item) => item._id === currentId);
    const targetIsSuperAdmin = Array.isArray(target?.roleCodes) && target.roleCodes.includes('super_admin');

    if (action === 'update' && targetIsSuperAdmin && (!nextIsSuperAdmin || !nextIsActive) && activeSuperAdmins.length === 0) {
      throw new Error('系统至少需要保留一个启用中的超级管理员');
    }
    if (action === 'delete' && targetIsSuperAdmin && activeSuperAdmins.length === 0) {
      throw new Error('不能删除系统中最后一个超级管理员');
    }
    if (action === 'update' && actorId && actor?._id === currentId && !nextIsSuperAdmin) {
      throw new Error('不能移除当前登录账号的超级管理员角色');
    }
  }
}

export const adminSystemModel = new AdminSystemModel();

export async function getAdminSystemModel(options = {}) {
  const model = new AdminSystemModel(options);
  await model.connect();
  return model;
}

export const adminPermissionCatalog = PERMISSION_CATALOG;
export const adminDefaultPassword = DEFAULT_PASSWORD;
