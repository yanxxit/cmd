import crypto from 'crypto';
import dayjs from 'dayjs';
import { getAdminDatabase } from './admin-db.js';

const USERS_COLLECTION = 'member_users';
const USER_SESSIONS_COLLECTION = 'member_user_sessions';
const USER_SMS_CODES_COLLECTION = 'member_user_sms_codes';
const USER_SIGN_INS_COLLECTION = 'member_user_sign_ins';

const USER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
const SMS_CODE_TTL = 5 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function todayKey(date = new Date()) {
  return dayjs(date).format('YYYY-MM-DD');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createDefaultPassword(phone) {
  const suffix = String(phone || '').slice(-6);
  return suffix || '123456';
}

function createSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function uniqueList(items = []) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

export class MemberSystemModel {
  constructor(options = {}) {
    this.options = options;
    this.users = null;
    this.sessions = null;
    this.smsCodes = null;
    this.signIns = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.users = db.collection(USERS_COLLECTION);
    this.sessions = db.collection(USER_SESSIONS_COLLECTION);
    this.smsCodes = db.collection(USER_SMS_CODES_COLLECTION);
    this.signIns = db.collection(USER_SIGN_INS_COLLECTION);
    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.users || !this.sessions || !this.smsCodes || !this.signIns) {
      await this.connect();
    }
  }

  async _ensureDefaults() {
    const count = await this.users.countDocuments();
    if (count > 0) return;
    const phone = '13800000001';
    const defaultPassword = createDefaultPassword(phone);
    await this.users.insertOne({
      phone,
      nickname: '演示用户',
      gender: 'male',
      age: 26,
      status: 'active',
      passwordHash: hashPassword(defaultPassword),
      defaultPassword,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: '',
      lastSignInDate: '',
      signInStreak: 0,
      totalSignInDays: 0,
    });
  }

  async sanitizeUser(user) {
    if (!user) return null;
    return {
      _id: user._id,
      phone: user.phone,
      nickname: user.nickname || '',
      gender: user.gender || 'unknown',
      age: Number(user.age || 0),
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt || '',
      lastSignInDate: user.lastSignInDate || '',
      signInStreak: Number(user.signInStreak || 0),
      totalSignInDays: Number(user.totalSignInDays || 0),
      defaultPassword: user.defaultPassword || '',
    };
  }

  async listUsers(filters = {}) {
    await this._ensureConnected();
    const { keyword = '', gender = '', status = '' } = filters;
    let users = await this.users.find({}).toArray();
    if (keyword) {
      const lower = String(keyword).toLowerCase();
      users = users.filter((item) =>
        String(item.phone || '').includes(keyword) ||
        String(item.nickname || '').toLowerCase().includes(lower)
      );
    }
    if (gender) users = users.filter((item) => item.gender === gender);
    if (status) users = users.filter((item) => (item.status || 'active') === status);
    users.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return await Promise.all(users.map((item) => this.sanitizeUser(item)));
  }

  async getUserById(id) {
    await this._ensureConnected();
    return await this.sanitizeUser(await this.users.findOne({ _id: id }));
  }

  async getUserByPhone(phone) {
    await this._ensureConnected();
    return await this.users.findOne({ phone: String(phone || '').trim() });
  }

  async createUser(data = {}) {
    await this._ensureConnected();
    const phone = String(data.phone || '').trim();
    const nickname = String(data.nickname || '').trim();
    const gender = ['male', 'female', 'unknown'].includes(data.gender) ? data.gender : 'unknown';
    const age = Number(data.age || 0);
    const status = data.status === 'disabled' ? 'disabled' : 'active';
    if (!/^1\d{10}$/.test(phone)) throw new Error('请输入合法的手机号');
    if (!nickname) throw new Error('昵称不能为空');
    if (!Number.isFinite(age) || age <= 0) throw new Error('年龄必须大于 0');
    const existing = await this.users.findOne({ phone });
    if (existing) throw new Error('手机号已存在');

    const defaultPassword = String(data.password || '').trim() || createDefaultPassword(phone);
    if (defaultPassword.length < 6) throw new Error('默认密码长度不能少于 6 位');

    const inserted = await this.users.insertOne({
      phone,
      nickname,
      gender,
      age,
      status,
      passwordHash: hashPassword(defaultPassword),
      defaultPassword,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: '',
      lastSignInDate: '',
      signInStreak: 0,
      totalSignInDays: 0,
    });
    return await this.sanitizeUser(inserted);
  }

  async updateUser(id, updates = {}) {
    await this._ensureConnected();
    const existing = await this.users.findOne({ _id: id });
    if (!existing) throw new Error('用户不存在');

    const nextDoc = {};
    if (updates.phone !== undefined) {
      const phone = String(updates.phone || '').trim();
      if (!/^1\d{10}$/.test(phone)) throw new Error('请输入合法的手机号');
      const duplicate = await this.users.findOne({ phone });
      if (duplicate && duplicate._id !== id) throw new Error('手机号已存在');
      nextDoc.phone = phone;
    }
    if (updates.nickname !== undefined) {
      const nickname = String(updates.nickname || '').trim();
      if (!nickname) throw new Error('昵称不能为空');
      nextDoc.nickname = nickname;
    }
    if (updates.gender !== undefined) {
      nextDoc.gender = ['male', 'female', 'unknown'].includes(updates.gender) ? updates.gender : 'unknown';
    }
    if (updates.age !== undefined) {
      const age = Number(updates.age || 0);
      if (!Number.isFinite(age) || age <= 0) throw new Error('年龄必须大于 0');
      nextDoc.age = age;
    }
    if (updates.status !== undefined) {
      nextDoc.status = updates.status === 'disabled' ? 'disabled' : 'active';
    }

    await this.users.updateOne({ _id: id }, { $set: { ...nextDoc, updatedAt: nowIso() } });
    return await this.getUserById(id);
  }

  async resetPassword(id, newPassword = '') {
    await this._ensureConnected();
    const existing = await this.users.findOne({ _id: id });
    if (!existing) throw new Error('用户不存在');
    const nextPassword = String(newPassword || '').trim() || createDefaultPassword(existing.phone);
    if (nextPassword.length < 6) throw new Error('密码长度不能少于 6 位');
    await this.users.updateOne(
      { _id: id },
      {
        $set: {
          passwordHash: hashPassword(nextPassword),
          defaultPassword: nextPassword,
          updatedAt: nowIso(),
        },
      }
    );
    const sessions = await this.sessions.find({ userId: id }).toArray();
    for (const session of sessions) {
      await this.sessions.deleteOne({ _id: session._id });
    }
    return true;
  }

  async deleteUser(id) {
    await this._ensureConnected();
    const existing = await this.users.findOne({ _id: id });
    if (!existing) throw new Error('用户不存在');
    await this.users.deleteOne({ _id: id });
    const sessions = await this.sessions.find({ userId: id }).toArray();
    for (const session of sessions) {
      await this.sessions.deleteOne({ _id: session._id });
    }
    return true;
  }

  async sendSmsCode(phone) {
    await this._ensureConnected();
    const user = await this.getUserByPhone(phone);
    if (!user) throw new Error('用户不存在');
    const code = createSmsCode();
    await this.smsCodes.insertOne({
      phone,
      code,
      createdAt: nowIso(),
      expiresAt: Date.now() + SMS_CODE_TTL,
      usedAt: '',
    });
    return {
      phone,
      code,
      expiresAt: Date.now() + SMS_CODE_TTL,
    };
  }

  async authenticateWithPassword(phone, password) {
    await this._ensureConnected();
    const user = await this.getUserByPhone(phone);
    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new Error('手机号或密码错误');
    }
    return await this._createUserSession(user);
  }

  async authenticateWithSmsCode(phone, code) {
    await this._ensureConnected();
    const user = await this.getUserByPhone(phone);
    if (!user) throw new Error('用户不存在');
    const smsCode = await this.smsCodes.findOne({ phone, code: String(code || '').trim() });
    if (!smsCode || smsCode.usedAt || smsCode.expiresAt < Date.now()) {
      throw new Error('验证码错误或已过期');
    }
    await this.smsCodes.updateOne({ _id: smsCode._id }, { $set: { usedAt: nowIso() } });
    return await this._createUserSession(user);
  }

  async _createUserSession(user) {
    if ((user.status || 'active') !== 'active') {
      throw new Error('当前用户已被禁用');
    }
    const token = createToken();
    const expiresAt = Date.now() + USER_SESSION_TTL;
    await this.sessions.insertOne({
      userId: user._id,
      token,
      createdAt: nowIso(),
      expiresAt,
    });
    await this.users.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: nowIso(), updatedAt: nowIso() } }
    );
    const freshUser = await this.users.findOne({ _id: user._id });
    return {
      token,
      expiresAt,
      user: await this.sanitizeUser(freshUser),
    };
  }

  async getUserByToken(token) {
    await this._ensureConnected();
    if (!token) return null;
    const session = await this.sessions.findOne({ token });
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      await this.sessions.deleteOne({ _id: session._id });
      return null;
    }
    const user = await this.users.findOne({ _id: session.userId });
    if (!user || (user.status || 'active') !== 'active') return null;
    return await this.sanitizeUser(user);
  }

  async logout(token) {
    await this._ensureConnected();
    if (!token) return true;
    const session = await this.sessions.findOne({ token });
    if (!session) return true;
    await this.sessions.deleteOne({ _id: session._id });
    return true;
  }

  async signIn(userId) {
    await this._ensureConnected();
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new Error('用户不存在');
    const today = todayKey();
    const existing = await this.signIns.findOne({ userId, dayKey: today });
    if (existing) {
      return {
        alreadySigned: true,
        signInStreak: Number(user.signInStreak || 0),
        totalSignInDays: Number(user.totalSignInDays || 0),
      };
    }

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const nextStreak = user.lastSignInDate === yesterday ? Number(user.signInStreak || 0) + 1 : 1;
    const totalSignInDays = Number(user.totalSignInDays || 0) + 1;
    await this.signIns.insertOne({
      userId,
      dayKey: today,
      createdAt: nowIso(),
    });
    await this.users.updateOne(
      { _id: userId },
      {
        $set: {
          lastSignInDate: today,
          signInStreak: nextStreak,
          totalSignInDays,
          updatedAt: nowIso(),
        },
      }
    );
    return {
      alreadySigned: false,
      signInStreak: nextStreak,
      totalSignInDays,
      signedAt: nowIso(),
    };
  }

  async listSignIns(filters = {}) {
    await this._ensureConnected();
    const { userId = '' } = filters;
    let records = await this.signIns.find({}).toArray();
    if (userId) records = records.filter((item) => item.userId === userId);
    records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const users = await this.users.find({}).toArray();
    const userMap = new Map(users.map((item) => [item._id, item]));
    return records.map((item) => ({
      ...item,
      user: userMap.has(item.userId)
        ? {
            _id: item.userId,
            phone: userMap.get(item.userId).phone,
            nickname: userMap.get(item.userId).nickname,
          }
        : null,
    }));
  }

  async getDashboardStats() {
    await this._ensureConnected();
    const users = await this.users.find({}).toArray();
    const today = todayKey();
    return {
      totalUsers: users.length,
      activeUsers: users.filter((item) => (item.status || 'active') === 'active').length,
      todaySignedUsers: (await this.signIns.find({ dayKey: today }).toArray()).length,
      maleUsers: users.filter((item) => item.gender === 'male').length,
      femaleUsers: users.filter((item) => item.gender === 'female').length,
    };
  }
}

export const memberSystemModel = new MemberSystemModel();

export async function getMemberSystemModel(options = {}) {
  const model = new MemberSystemModel(options);
  await model.connect();
  return model;
}
