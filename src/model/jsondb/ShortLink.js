import crypto from 'crypto';
import { getAdminDatabase } from './admin-db.js';

const SHORT_LINK_COLLECTION = 'short_links';

function nowIso() {
  return new Date().toISOString();
}

function createCode(size = 6) {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
}

export class ShortLinkModel {
  constructor(options = {}) {
    this.options = options;
    this.collection = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.collection = db.collection(SHORT_LINK_COLLECTION);
    return this;
  }

  async _ensureConnected() {
    if (!this.collection) {
      await this.connect();
    }
  }

  async sanitize(item) {
    if (!item) return null;
    return {
      ...item,
      hitCount: Number(item.hitCount || 0),
      active: item.active !== false,
    };
  }

  async list(filters = {}) {
    await this._ensureConnected();
    const { type = '', resourceId = '', active = '' } = filters;
    let items = await this.collection.find({}).toArray();
    if (type) items = items.filter((item) => item.type === type);
    if (resourceId) items = items.filter((item) => item.resourceId === resourceId);
    if (active !== '') {
      const nextActive = String(active) === 'true';
      items = items.filter((item) => (item.active !== false) === nextActive);
    }
    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return await Promise.all(items.map((item) => this.sanitize(item)));
  }

  async getByCode(code) {
    await this._ensureConnected();
    const item = await this.collection.findOne({ code });
    return await this.sanitize(item);
  }

  async create(data = {}) {
    await this._ensureConnected();
    const type = String(data.type || '').trim() || 'generic';
    const resourceId = String(data.resourceId || '').trim();
    const targetUrl = String(data.targetUrl || '').trim();
    const title = String(data.title || '').trim();
    if (!targetUrl) throw new Error('短链接目标地址不能为空');

    const existingByResource = resourceId
      ? await this.collection.findOne({ type, resourceId })
      : null;
    if (existingByResource) {
      return await this.sanitize(existingByResource);
    }

    let code = String(data.code || '').trim();
    if (!code) {
      do {
        code = createCode(6);
      } while (await this.collection.findOne({ code }));
    } else {
      const duplicate = await this.collection.findOne({ code });
      if (duplicate) throw new Error('短链接 code 已存在');
    }

    const inserted = await this.collection.insertOne({
      code,
      type,
      resourceId,
      title,
      targetUrl,
      active: data.active !== false,
      hitCount: 0,
      lastHitAt: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return await this.sanitize(inserted);
  }

  async update(id, updates = {}) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('短链接不存在');
    const payload = {};
    if (updates.title !== undefined) payload.title = String(updates.title || '').trim();
    if (updates.targetUrl !== undefined) {
      const targetUrl = String(updates.targetUrl || '').trim();
      if (!targetUrl) throw new Error('短链接目标地址不能为空');
      payload.targetUrl = targetUrl;
    }
    if (updates.active !== undefined) payload.active = !!updates.active;

    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...payload,
          updatedAt: nowIso(),
        },
      }
    );
    return await this.sanitize(await this.collection.findOne({ _id: id }));
  }

  async delete(id) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('短链接不存在');
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  async resolve(code) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ code });
    if (!existing || existing.active === false) {
      return null;
    }
    await this.collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          hitCount: Number(existing.hitCount || 0) + 1,
          lastHitAt: nowIso(),
          updatedAt: nowIso(),
        },
      }
    );
    return await this.sanitize(await this.collection.findOne({ _id: existing._id }));
  }
}

export const shortLinkModel = new ShortLinkModel();

export async function getShortLinkModel(options = {}) {
  const model = new ShortLinkModel(options);
  await model.connect();
  return model;
}
