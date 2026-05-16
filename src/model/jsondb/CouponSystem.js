import { getAdminDatabase } from './admin-db.js';
import dayjs from 'dayjs';

const COUPONS_COLLECTION = 'shopping_coupons';
const COUPON_CLAIMS_COLLECTION = 'shopping_coupon_claims';
const COUPON_USAGES_COLLECTION = 'shopping_coupon_usages';

function nowIso() {
  return new Date().toISOString();
}

function todayKey(date = new Date()) {
  return dayjs(date).format('YYYY-MM-DD');
}

function uniqueList(items = []) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function randomPick(items = []) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export class CouponSystemModel {
  constructor(options = {}) {
    this.options = options;
    this.coupons = null;
    this.claims = null;
    this.usages = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.coupons = db.collection(COUPONS_COLLECTION);
    this.claims = db.collection(COUPON_CLAIMS_COLLECTION);
    this.usages = db.collection(COUPON_USAGES_COLLECTION);
    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.coupons || !this.claims || !this.usages) {
      await this.connect();
    }
  }

  async _ensureDefaults() {
    const count = await this.coupons.countDocuments();
    if (count > 0) return;
    const seeds = [
      ['新人专享 20 元券', 'full_reduction', 99, 20],
      ['满 199 减 40', 'full_reduction', 199, 40],
      ['满 299 减 60', 'full_reduction', 299, 60],
      ['满 399 减 80', 'full_reduction', 399, 80],
      ['满 599 减 120', 'full_reduction', 599, 120],
      ['9 折券', 'discount', 100, 10],
      ['88 折券', 'discount', 200, 12],
      ['包邮券', 'shipping', 0, 0],
      ['美妆品类 50 元券', 'full_reduction', 299, 50],
      ['食品品类 30 元券', 'full_reduction', 129, 30],
    ];
    for (const [title, type, conditionAmount, benefitValue] of seeds) {
      await this.coupons.insertOne({
        title,
        type,
        description: `${title}，可在指定订单金额满足后使用`,
        conditionAmount,
        benefitValue,
        status: 'active',
        totalQuantity: 5000,
        claimedCount: 0,
        usedCount: 0,
        perUserLimit: 3,
        validDays: 15,
        source: 'seed',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }

  async sanitizeCoupon(coupon) {
    if (!coupon) return null;
    return {
      ...coupon,
      conditionAmount: Number(coupon.conditionAmount || 0),
      benefitValue: Number(coupon.benefitValue || 0),
      totalQuantity: Number(coupon.totalQuantity || 0),
      claimedCount: Number(coupon.claimedCount || 0),
      usedCount: Number(coupon.usedCount || 0),
      perUserLimit: Number(coupon.perUserLimit || 0),
      validDays: Number(coupon.validDays || 0),
    };
  }

  normalizeCouponPayload(data = {}, isUpdate = false) {
    const payload = {};
    if (!isUpdate || data.title !== undefined) {
      const title = String(data.title || '').trim();
      if (!title) throw new Error('优惠券名称不能为空');
      payload.title = title;
    }
    if (!isUpdate || data.type !== undefined) {
      const type = String(data.type || '').trim();
      if (!['full_reduction', 'discount', 'shipping'].includes(type)) {
        throw new Error('不支持的优惠券类型');
      }
      payload.type = type;
    }
    if (!isUpdate || data.description !== undefined) {
      payload.description = String(data.description || '').trim();
    }
    if (!isUpdate || data.conditionAmount !== undefined) payload.conditionAmount = Number(data.conditionAmount || 0);
    if (!isUpdate || data.benefitValue !== undefined) payload.benefitValue = Number(data.benefitValue || 0);
    if (!isUpdate || data.totalQuantity !== undefined) payload.totalQuantity = Number(data.totalQuantity || 0);
    if (!isUpdate || data.perUserLimit !== undefined) payload.perUserLimit = Number(data.perUserLimit || 1);
    if (!isUpdate || data.validDays !== undefined) payload.validDays = Number(data.validDays || 7);
    if (!isUpdate || data.status !== undefined) payload.status = data.status === 'inactive' ? 'inactive' : 'active';
    if (!isUpdate || data.category !== undefined) payload.category = String(data.category || '通用').trim() || '通用';
    return payload;
  }

  async listCoupons(filters = {}) {
    await this._ensureConnected();
    const { keyword = '', type = '', status = '', sortBy = 'updatedAt' } = filters;
    let coupons = await this.coupons.find({}).toArray();
    if (keyword) {
      const lower = String(keyword).toLowerCase();
      coupons = coupons.filter((item) =>
        String(item.title || '').toLowerCase().includes(lower) ||
        String(item.description || '').toLowerCase().includes(lower)
      );
    }
    if (type) coupons = coupons.filter((item) => item.type === type);
    if (status) coupons = coupons.filter((item) => item.status === status);
    coupons.sort((a, b) => {
      if (sortBy === 'claimedCount') return Number(b.claimedCount || 0) - Number(a.claimedCount || 0);
      if (sortBy === 'usedCount') return Number(b.usedCount || 0) - Number(a.usedCount || 0);
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
    return await Promise.all(coupons.map((item) => this.sanitizeCoupon(item)));
  }

  async getCouponById(id) {
    await this._ensureConnected();
    return await this.sanitizeCoupon(await this.coupons.findOne({ _id: id }));
  }

  async createCoupon(data = {}) {
    await this._ensureConnected();
    const payload = this.normalizeCouponPayload(data, false);
    const inserted = await this.coupons.insertOne({
      ...payload,
      claimedCount: 0,
      usedCount: 0,
      source: 'manual',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return await this.sanitizeCoupon(inserted);
  }

  async updateCoupon(id, updates = {}) {
    await this._ensureConnected();
    const existing = await this.coupons.findOne({ _id: id });
    if (!existing) throw new Error('优惠券不存在');
    const payload = this.normalizeCouponPayload(updates, true);
    await this.coupons.updateOne({ _id: id }, { $set: { ...payload, updatedAt: nowIso() } });
    return await this.getCouponById(id);
  }

  async deleteCoupon(id) {
    await this._ensureConnected();
    const existing = await this.coupons.findOne({ _id: id });
    if (!existing) throw new Error('优惠券不存在');
    await this.coupons.deleteOne({ _id: id });
    return true;
  }

  async listClaimRecords(filters = {}) {
    await this._ensureConnected();
    const { couponId = '', userId = '', source = '', status = '' } = filters;
    let records = await this.claims.find({}).toArray();
    if (couponId) records = records.filter((item) => item.couponId === couponId);
    if (userId) records = records.filter((item) => item.userId === userId);
    if (source) records = records.filter((item) => item.source === source);
    if (status) records = records.filter((item) => item.status === status);
    records.sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1));

    const coupons = await this.coupons.find({}).toArray();
    const users = await (await getAdminDatabase(this.options)).collection('member_users').find({}).toArray();
    const couponMap = new Map(coupons.map((item) => [item._id, item]));
    const userMap = new Map(users.map((item) => [item._id, item]));

    return records.map((item) => ({
      ...item,
      coupon: couponMap.get(item.couponId)
        ? {
            _id: item.couponId,
            title: couponMap.get(item.couponId).title,
            type: couponMap.get(item.couponId).type,
          }
        : null,
      user: userMap.get(item.userId)
        ? {
            _id: item.userId,
            phone: userMap.get(item.userId).phone,
            nickname: userMap.get(item.userId).nickname,
          }
        : null,
    }));
  }

  async listUsageRecords(filters = {}) {
    await this._ensureConnected();
    const { couponId = '', userId = '' } = filters;
    let records = await this.usages.find({}).toArray();
    if (couponId) records = records.filter((item) => item.couponId === couponId);
    if (userId) records = records.filter((item) => item.userId === userId);
    records.sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1));
    const claimMap = new Map((await this.claims.find({}).toArray()).map((item) => [item._id, item]));
    const coupons = await this.coupons.find({}).toArray();
    const users = await (await getAdminDatabase(this.options)).collection('member_users').find({}).toArray();
    const couponMap = new Map(coupons.map((item) => [item._id, item]));
    const userMap = new Map(users.map((item) => [item._id, item]));
    return records.map((item) => ({
      ...item,
      claim: claimMap.get(item.claimId) || null,
      coupon: couponMap.get(item.couponId)
        ? {
            _id: item.couponId,
            title: couponMap.get(item.couponId).title,
            type: couponMap.get(item.couponId).type,
          }
        : null,
      user: userMap.get(item.userId)
        ? {
            _id: item.userId,
            phone: userMap.get(item.userId).phone,
            nickname: userMap.get(item.userId).nickname,
          }
        : null,
    }));
  }

  async _createClaimRecord({ coupon, user, source = 'manual_grant', operatorId = '', meta = {}, dayKey = '' }) {
    const claimCount = await this.claims.find({ couponId: coupon._id, userId: user._id }).toArray();
    if (coupon.perUserLimit > 0 && claimCount.length >= coupon.perUserLimit) {
      throw new Error('该用户已达到当前优惠券领取上限');
    }
    if (coupon.totalQuantity > 0 && Number(coupon.claimedCount || 0) >= coupon.totalQuantity) {
      throw new Error('优惠券已发放完毕');
    }
    const claimedAt = nowIso();
    const expiresAt = dayjs(claimedAt).add(Number(coupon.validDays || 7), 'day').endOf('day').toISOString();
    const inserted = await this.claims.insertOne({
      couponId: coupon._id,
      userId: user._id,
      source,
      operatorId,
      status: 'claimed',
      meta,
      dayKey,
      claimedAt,
      expiresAt,
      usedAt: '',
    });
    await this.coupons.updateOne(
      { _id: coupon._id },
      {
        $set: {
          claimedCount: Number(coupon.claimedCount || 0) + 1,
          updatedAt: nowIso(),
        },
      }
    );
    return inserted;
  }

  async grantCouponToUser({ couponId, user, source = 'manual_grant', operatorId = '', meta = {} }) {
    await this._ensureConnected();
    const coupon = await this.coupons.findOne({ _id: couponId });
    if (!coupon) throw new Error('优惠券不存在');
    if (coupon.status !== 'active') throw new Error('当前优惠券未启用');
    return await this._createClaimRecord({ coupon, user, source, operatorId, meta });
  }

  async claimDailyRandomCoupon(user) {
    await this._ensureConnected();
    const today = todayKey();
    const todayClaims = await this.claims.find({ userId: user._id, source: 'daily_random', dayKey: today }).toArray();
    if (todayClaims.length > 0) {
      throw new Error('今天已经领取过随机优惠券');
    }
    const activeCoupons = await this.coupons.find({ status: 'active' }).toArray();
    const coupon = randomPick(activeCoupons);
    if (!coupon) throw new Error('当前没有可领取的优惠券');
    return await this._createClaimRecord({
      coupon,
      user,
      source: 'daily_random',
      meta: { reason: 'daily_random' },
      operatorId: '',
      dayKey: today,
    });
  }

  async luckyDraw(user) {
    await this._ensureConnected();
    const today = todayKey();
    const todayClaims = await this.claims.find({ userId: user._id, source: 'lucky_draw', dayKey: today }).toArray();
    if (todayClaims.length > 0) {
      throw new Error('今天已经参与过大转盘');
    }
    const prizes = (await this.coupons.find({ status: 'active' }).toArray()).slice(0, 10);
    const coupon = randomPick(prizes);
    if (!coupon) throw new Error('当前没有可抽取的奖品');
    return await this._createClaimRecord({
      coupon,
      user,
      source: 'lucky_draw',
      meta: { reason: 'lucky_draw' },
      operatorId: '',
      dayKey: today,
    });
  }

  async useCoupon({ userId, claimId, orderAmount = 0 }) {
    await this._ensureConnected();
    const claim = await this.claims.findOne({ _id: claimId, userId });
    if (!claim) throw new Error('优惠券领取记录不存在');
    if (claim.status === 'used') throw new Error('该优惠券已使用');
    const coupon = await this.coupons.findOne({ _id: claim.couponId });
    if (!coupon) throw new Error('优惠券不存在');
    if (dayjs(claim.expiresAt).valueOf() < Date.now()) throw new Error('优惠券已过期');
    if (Number(orderAmount || 0) < Number(coupon.conditionAmount || 0)) {
      throw new Error(`订单金额需满 ${coupon.conditionAmount} 才可使用`);
    }

    await this.claims.updateOne(
      { _id: claimId },
      { $set: { status: 'used', usedAt: nowIso() } }
    );
    await this.usages.insertOne({
      claimId,
      couponId: coupon._id,
      userId,
      orderAmount: Number(orderAmount || 0),
      usedAt: nowIso(),
    });
    await this.coupons.updateOne(
      { _id: coupon._id },
      { $set: { usedCount: Number(coupon.usedCount || 0) + 1, updatedAt: nowIso() } }
    );
    return true;
  }

  async listUserCoupons(userId) {
    await this._ensureConnected();
    const claims = await this.claims.find({ userId }).toArray();
    const coupons = await this.coupons.find({}).toArray();
    const couponMap = new Map(coupons.map((item) => [item._id, item]));
    return claims
      .sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1))
      .map((claim) => ({
        ...claim,
        coupon: couponMap.get(claim.couponId) || null,
      }));
  }

  async getCouponStats() {
    await this._ensureConnected();
    const coupons = await this.coupons.find({}).toArray();
    const claims = await this.claims.find({}).toArray();
    const usages = await this.usages.find({}).toArray();
    return {
      totalCoupons: coupons.length,
      activeCoupons: coupons.filter((item) => item.status === 'active').length,
      totalClaims: claims.length,
      totalUsages: usages.length,
      totalClaimedCount: coupons.reduce((sum, item) => sum + Number(item.claimedCount || 0), 0),
      totalUsedCount: coupons.reduce((sum, item) => sum + Number(item.usedCount || 0), 0),
    };
  }

  async listLuckyDrawPrizes() {
    await this._ensureConnected();
    const coupons = await this.coupons.find({ status: 'active' }).toArray();
    return await Promise.all(coupons.slice(0, 10).map((item) => this.sanitizeCoupon(item)));
  }
}

export const couponSystemModel = new CouponSystemModel();

export async function getCouponSystemModel(options = {}) {
  const model = new CouponSystemModel(options);
  await model.connect();
  return model;
}
