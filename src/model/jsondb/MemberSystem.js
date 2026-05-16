import crypto from 'crypto';
import dayjs from 'dayjs';
import { getAdminDatabase } from './admin-db.js';
import { environmentVariableModel } from './EnvironmentVariable.js';

const USERS_COLLECTION = 'member_users';
const USER_SESSIONS_COLLECTION = 'member_user_sessions';
const USER_SMS_CODES_COLLECTION = 'member_user_sms_codes';
const USER_SIGN_INS_COLLECTION = 'member_user_sign_ins';
const USER_LOTTERY_CHANCE_LOGS_COLLECTION = 'member_user_lottery_chance_logs';
const USER_SIGN_IN_REWARD_RECORDS_COLLECTION = 'member_user_sign_in_reward_records';

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
    this.lotteryChanceLogs = null;
    this.signInRewardRecords = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.users = db.collection(USERS_COLLECTION);
    this.sessions = db.collection(USER_SESSIONS_COLLECTION);
    this.smsCodes = db.collection(USER_SMS_CODES_COLLECTION);
    this.signIns = db.collection(USER_SIGN_INS_COLLECTION);
    this.lotteryChanceLogs = db.collection(USER_LOTTERY_CHANCE_LOGS_COLLECTION);
    this.signInRewardRecords = db.collection(USER_SIGN_IN_REWARD_RECORDS_COLLECTION);
    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.users || !this.sessions || !this.smsCodes || !this.signIns || !this.lotteryChanceLogs || !this.signInRewardRecords) {
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
      currentSignInCycleStart: '',
      signInStreak: 0,
      totalSignInDays: 0,
      lotteryChanceBalance: 0,
      totalLotteryChances: 0,
      totalLotteryDraws: 0,
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
      currentSignInCycleStart: user.currentSignInCycleStart || '',
      signInStreak: Number(user.signInStreak || 0),
      totalSignInDays: Number(user.totalSignInDays || 0),
      lotteryChanceBalance: Number(user.lotteryChanceBalance || 0),
      totalLotteryChances: Number(user.totalLotteryChances || 0),
      totalLotteryDraws: Number(user.totalLotteryDraws || 0),
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
      currentSignInCycleStart: '',
      signInStreak: 0,
      totalSignInDays: 0,
      lotteryChanceBalance: 0,
      totalLotteryChances: 0,
      totalLotteryDraws: 0,
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
        lotteryChanceBalance: Number(user.lotteryChanceBalance || 0),
        totalLotteryChances: Number(user.totalLotteryChances || 0),
        chanceGranted: 0,
        streakRewardChanceGranted: 0,
      };
    }

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const nextStreak = user.lastSignInDate === yesterday ? Number(user.signInStreak || 0) + 1 : 1;
    const cycleStartKey = user.lastSignInDate === yesterday
      ? (user.currentSignInCycleStart || dayjs().subtract(nextStreak - 1, 'day').format('YYYY-MM-DD'))
      : today;
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
          currentSignInCycleStart: cycleStartKey,
          signInStreak: nextStreak,
          totalSignInDays,
          updatedAt: nowIso(),
        },
      }
    );
    const chanceState = await this.grantLotteryChance(userId, {
      count: 1,
      source: 'check_in',
      dayKey: today,
      meta: { signInStreak: nextStreak },
    });
    const streakRewardResult = await this.grantStreakRewards(userId, {
      signInStreak: nextStreak,
      dayKey: today,
      cycleStartKey,
    });
    return {
      alreadySigned: false,
      signInStreak: nextStreak,
      totalSignInDays,
      signedAt: nowIso(),
      lotteryChanceBalance: chanceState.lotteryChanceBalance,
      totalLotteryChances: chanceState.totalLotteryChances + Number(streakRewardResult.extraChanceGranted || 0),
      chanceGranted: 1 + Number(streakRewardResult.extraChanceGranted || 0),
      baseChanceGranted: 1,
      streakRewardChanceGranted: Number(streakRewardResult.extraChanceGranted || 0),
      streakRewardRecords: streakRewardResult.records || [],
    };
  }

  async getSignInRewardDays() {
    await this._ensureConnected();
    const runtime = await environmentVariableModel.getRuntimeConfig(['member.sign_in_reward_days']);
    const rawValue = Array.isArray(runtime['member.sign_in_reward_days'])
      ? runtime['member.sign_in_reward_days']
      : [3, 7, 14];
    const values = rawValue
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
    return uniqueList(values).sort((a, b) => a - b);
  }

  async grantStreakRewards(userId, options = {}) {
    await this._ensureConnected();
    const {
      signInStreak = 0,
      dayKey = todayKey(),
      cycleStartKey = dayKey,
    } = options;
    const rewardDays = await this.getSignInRewardDays();
    const rewardableDays = rewardDays.filter((day) => day <= Number(signInStreak || 0));
    if (!rewardableDays.length) {
      return { extraChanceGranted: 0, records: [] };
    }
    const existing = await this.signInRewardRecords.find({ userId, cycleStartKey }).toArray();
    const grantedDays = new Set(existing.map((item) => Number(item.rewardDay || 0)));
    const pendingDays = rewardableDays.filter((day) => !grantedDays.has(day));
    if (!pendingDays.length) {
      return { extraChanceGranted: 0, records: [] };
    }
    const records = [];
    for (const rewardDay of pendingDays) {
      await this.grantLotteryChance(userId, {
        count: 1,
        source: 'sign_in_streak_reward',
        dayKey,
        meta: {
          rewardDay,
          cycleStartKey,
        },
      });
      const record = await this.signInRewardRecords.insertOne({
        userId,
        rewardDay,
        rewardType: 'lottery_chance',
        rewardCount: 1,
        cycleStartKey,
        signInStreak: Number(signInStreak || 0),
        grantedAt: nowIso(),
        dayKey,
        status: 'claimed',
      });
      records.push(record);
    }
    return {
      extraChanceGranted: pendingDays.length,
      records,
    };
  }

  async listSignInRewardRecords(filters = {}) {
    await this._ensureConnected();
    const { userId = '', cycleStartKey = '' } = filters;
    let records = await this.signInRewardRecords.find({}).toArray();
    if (userId) records = records.filter((item) => item.userId === userId);
    if (cycleStartKey) records = records.filter((item) => item.cycleStartKey === cycleStartKey);
    records.sort((a, b) => (a.grantedAt < b.grantedAt ? 1 : -1));
    return records;
  }

  async getSignInRewardProgress(userId) {
    await this._ensureConnected();
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new Error('用户不存在');
    const rewardDays = await this.getSignInRewardDays();
    const cycleStartKey = user.currentSignInCycleStart || '';
    const records = cycleStartKey
      ? await this.listSignInRewardRecords({ userId, cycleStartKey })
      : [];
    const recordMap = new Map(records.map((item) => [Number(item.rewardDay || 0), item]));
    let prevDay = 0;
    let nextTargetDay = rewardDays[rewardDays.length - 1] || 0;
    let progressPercent = rewardDays.length ? 100 : 0;
    let remainDays = 0;

    for (const day of rewardDays) {
      if (Number(user.signInStreak || 0) < day) {
        nextTargetDay = day;
        const span = Math.max(1, day - prevDay);
        progressPercent = Math.min(100, Math.round((Math.max(0, Number(user.signInStreak || 0) - prevDay) / span) * 100));
        remainDays = Math.max(0, day - Number(user.signInStreak || 0));
        break;
      }
      prevDay = day;
    }

    const completed = rewardDays.length
      ? Number(user.signInStreak || 0) >= rewardDays[rewardDays.length - 1]
      : false;
    if (completed) {
      nextTargetDay = rewardDays[rewardDays.length - 1] || 0;
      progressPercent = 100;
      remainDays = 0;
    }

    return {
      rewardDays,
      currentStreak: Number(user.signInStreak || 0),
      cycleStartKey,
      completed,
      nextTargetDay,
      progressPercent,
      remainDays,
      stages: rewardDays.map((day) => {
        const record = recordMap.get(day);
        const reached = Number(user.signInStreak || 0) >= day;
        let status = 'locked';
        if (record) {
          status = 'claimed';
        } else if (reached) {
          status = 'reached';
        } else if (day === nextTargetDay) {
          status = 'current';
        }
        return {
          day,
          rewardType: 'lottery_chance',
          rewardCount: 1,
          rewardLabel: '额外 1 次抽奖机会',
          status,
          reached,
          claimedAt: record?.grantedAt || '',
          cycleStartKey: record?.cycleStartKey || cycleStartKey,
        };
      }),
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

  async grantLotteryChance(userId, options = {}) {
    await this._ensureConnected();
    const {
      count = 1,
      source = 'manual',
      dayKey = '',
      meta = {},
    } = options;
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new Error('用户不存在');
    const nextCount = Math.max(1, Number(count || 1));
    const nextBalance = Number(user.lotteryChanceBalance || 0) + nextCount;
    const totalLotteryChances = Number(user.totalLotteryChances || 0) + nextCount;
    const createdAt = nowIso();
    const log = await this.lotteryChanceLogs.insertOne({
      userId,
      type: 'grant',
      delta: nextCount,
      balanceAfter: nextBalance,
      source,
      dayKey,
      meta,
      createdAt,
    });
    await this.users.updateOne(
      { _id: userId },
      {
        $set: {
          lotteryChanceBalance: nextBalance,
          totalLotteryChances,
          updatedAt: createdAt,
        },
      }
    );
    return {
      log,
      lotteryChanceBalance: nextBalance,
      totalLotteryChances,
      totalLotteryDraws: Number(user.totalLotteryDraws || 0),
    };
  }

  async consumeLotteryChance(userId, options = {}) {
    await this._ensureConnected();
    const {
      count = 1,
      source = 'lucky_draw',
      dayKey = '',
      meta = {},
    } = options;
    const user = await this.users.findOne({ _id: userId });
    if (!user) throw new Error('用户不存在');
    const nextCount = Math.max(1, Number(count || 1));
    const currentBalance = Number(user.lotteryChanceBalance || 0);
    if (currentBalance < nextCount) {
      throw new Error('当前抽奖机会不足，请先签到获取抽奖机会');
    }
    const nextBalance = currentBalance - nextCount;
    const totalLotteryDraws = Number(user.totalLotteryDraws || 0) + nextCount;
    const createdAt = nowIso();
    const log = await this.lotteryChanceLogs.insertOne({
      userId,
      type: 'consume',
      delta: -nextCount,
      balanceAfter: nextBalance,
      source,
      dayKey,
      meta,
      createdAt,
    });
    await this.users.updateOne(
      { _id: userId },
      {
        $set: {
          lotteryChanceBalance: nextBalance,
          totalLotteryDraws,
          updatedAt: createdAt,
        },
      }
    );
    return {
      log,
      lotteryChanceBalance: nextBalance,
      totalLotteryChances: Number(user.totalLotteryChances || 0),
      totalLotteryDraws,
    };
  }

  async listLotteryChanceLogs(filters = {}) {
    await this._ensureConnected();
    const { userId = '', source = '', type = '' } = filters;
    let logs = await this.lotteryChanceLogs.find({}).toArray();
    if (userId) logs = logs.filter((item) => item.userId === userId);
    if (source) logs = logs.filter((item) => item.source === source);
    if (type) logs = logs.filter((item) => item.type === type);
    logs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const users = await this.users.find({}).toArray();
    const userMap = new Map(users.map((item) => [item._id, item]));
    return logs.map((item) => ({
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
      totalLotteryChanceBalance: users.reduce((sum, item) => sum + Number(item.lotteryChanceBalance || 0), 0),
    };
  }
}

export const memberSystemModel = new MemberSystemModel();

export async function getMemberSystemModel(options = {}) {
  const model = new MemberSystemModel(options);
  await model.connect();
  return model;
}
