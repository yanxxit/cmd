import { getAdminDatabase } from './admin-db.js';

const ENV_COLLECTION = 'environment_variables';

function nowIso() {
  return new Date().toISOString();
}

function uniqueList(items = []) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  const next = Number(value);
  if (Number.isNaN(next)) {
    throw new Error('数字类型的值必须可转换为 Number');
  }
  return next;
}

function getValuePreview(type, value) {
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') return String(value ?? '');
  if (type === 'db_ref') return value === null || value === undefined ? '' : String(value);
  if (type === 'json' || type === 'array') return JSON.stringify(value);
  return String(value ?? '');
}

export class EnvironmentVariableModel {
  constructor(options = {}) {
    this.options = options;
    this.collection = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.collection = db.collection(ENV_COLLECTION);
    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.collection) {
      await this.connect();
    }
  }

  async _ensureDefaults() {
    const defaults = [
      {
        key: 'site.title',
        title: '站点标题',
        group: '基础配置',
        description: '用于控制后台站点标题与部分页面展示文案',
        type: 'string',
        enabled: true,
        value: '测试案例管理后台',
      },
      {
        key: 'article.reading.enabled',
        title: '文章阅读统计开关',
        group: '文章配置',
        description: '关闭后文章预览不会再累计阅读量',
        type: 'boolean',
        enabled: true,
        value: true,
      },
      {
        key: 'member.sign_in_reward_days',
        title: '连续签到奖励天数',
        group: '用户运营',
        description: '用于控制连续签到奖励阈值，数组元素表示达到该天数后自动发放一次抽奖机会',
        type: 'array',
        arrayItemType: 'number',
        enabled: true,
        value: [3, 7, 14],
      },
    ];

    for (const item of defaults) {
      const existing = await this.collection.findOne({ key: item.key });
      if (!existing) {
        await this.collection.insertOne({
          ...item,
          valuePreview: getValuePreview(item.type, item.value),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
    }
  }

  normalizePayload(data = {}, isUpdate = false) {
    const nextType = String(data.type || '').trim();
    const payload = {};

    if (!isUpdate || data.key !== undefined) {
      const key = String(data.key || '').trim();
      if (!key) throw new Error('变量 Key 不能为空');
      payload.key = key;
    }

    if (!isUpdate || data.title !== undefined) {
      const title = String(data.title || '').trim();
      if (!title) throw new Error('变量名称不能为空');
      payload.title = title;
    }

    if (!isUpdate || data.group !== undefined) {
      payload.group = String(data.group || '').trim() || '默认分组';
    }

    if (!isUpdate || data.description !== undefined) {
      payload.description = String(data.description || '').trim();
    }

    if (!isUpdate || data.type !== undefined) {
      if (!['string', 'number', 'boolean', 'json', 'db_ref', 'array'].includes(nextType)) {
        throw new Error('不支持的环境变量类型');
      }
      payload.type = nextType;
    }

    if (!isUpdate || data.enabled !== undefined) {
      payload.enabled = !!data.enabled;
    }

    const effectiveType = payload.type || data.currentType;
    if ((!isUpdate || data.value !== undefined) && effectiveType) {
      payload.value = this.normalizeValueByType(effectiveType, data.value, data);
      payload.valuePreview = getValuePreview(effectiveType, payload.value);
    }

    if (effectiveType === 'array') {
      payload.arrayItemType = String(data.arrayItemType || 'string');
    }

    if (effectiveType === 'db_ref' || (effectiveType === 'array' && data.arrayItemType === 'db_ref')) {
      const refConfig = {
        collectionName: String(data.refConfig?.collectionName || data.collectionName || '').trim(),
        idField: String(data.refConfig?.idField || data.idField || '_id').trim() || '_id',
        labelField: String(data.refConfig?.labelField || data.labelField || 'title').trim() || 'title',
      };
      if (!refConfig.collectionName) {
        throw new Error('数据库对象类型必须指定 collection/table 名称');
      }
      payload.refConfig = refConfig;
    } else if (effectiveType && effectiveType !== 'db_ref') {
      payload.refConfig = null;
    }

    return payload;
  }

  normalizeValueByType(type, value, data = {}) {
    if (type === 'string') return String(value ?? '');
    if (type === 'number') return toNumber(value);
    if (type === 'boolean') return typeof value === 'boolean' ? value : String(value) === 'true';
    if (type === 'db_ref') return value === undefined || value === null ? '' : value;
    if (type === 'json') {
      if (typeof value === 'object' && value !== null) return value;
      if (!String(value || '').trim()) return {};
      return JSON.parse(String(value));
    }
    if (type === 'array') {
      if (Array.isArray(value)) return value;
      if (!String(value || '').trim()) return [];
      const parsed = JSON.parse(String(value));
      if (!Array.isArray(parsed)) {
        throw new Error('数组类型必须提供合法的 JSON 数组');
      }
      return parsed;
    }
    return value;
  }

  async sanitize(item) {
    if (!item) return null;
    return {
      ...item,
      valuePreview: item.valuePreview || getValuePreview(item.type, item.value),
    };
  }

  async list(filters = {}) {
    await this._ensureConnected();
    const { keyword = '', group = '', type = '', enabled = '' } = filters;
    let items = await this.collection.find({}).toArray();
    if (keyword) {
      const key = keyword.toLowerCase();
      items = items.filter((item) =>
        item.key?.toLowerCase().includes(key) ||
        item.title?.toLowerCase().includes(key) ||
        item.description?.toLowerCase().includes(key)
      );
    }
    if (group) {
      items = items.filter((item) => item.group === group);
    }
    if (type) {
      items = items.filter((item) => item.type === type);
    }
    if (enabled !== '') {
      const nextEnabled = String(enabled) === 'true';
      items = items.filter((item) => !!item.enabled === nextEnabled);
    }

    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return await Promise.all(items.map((item) => this.sanitize(item)));
  }

  async getById(id) {
    await this._ensureConnected();
    const item = await this.collection.findOne({ _id: id });
    return await this.sanitize(item);
  }

  async getByKey(key) {
    await this._ensureConnected();
    const item = await this.collection.findOne({ key });
    return await this.sanitize(item);
  }

  async create(data = {}) {
    await this._ensureConnected();
    const payload = this.normalizePayload(data, false);
    const existing = await this.collection.findOne({ key: payload.key });
    if (existing) throw new Error('变量 Key 已存在');

    const inserted = await this.collection.insertOne({
      ...payload,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return await this.sanitize(inserted);
  }

  async update(id, updates = {}) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('环境变量不存在');

    if (updates.key !== undefined) {
      const duplicate = await this.collection.findOne({ key: String(updates.key).trim() });
      if (duplicate && duplicate._id !== id) {
        throw new Error('变量 Key 已存在');
      }
    }

    const payload = this.normalizePayload({
      ...updates,
      currentType: updates.type || existing.type,
    }, true);

    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...payload,
          updatedAt: nowIso(),
        },
      }
    );
    return await this.getById(id);
  }

  async delete(id) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('环境变量不存在');
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  async getRuntimeConfig(keys = []) {
    await this._ensureConnected();
    let items = await this.collection.find({ enabled: true }).toArray();
    const nextKeys = uniqueList(keys);
    if (nextKeys.length) {
      items = items.filter((item) => nextKeys.includes(item.key));
    }
    return items.reduce((result, item) => {
      result[item.key] = item.value;
      return result;
    }, {});
  }

  async getStats() {
    await this._ensureConnected();
    const items = await this.collection.find({}).toArray();
    return {
      total: items.length,
      enabled: items.filter((item) => item.enabled).length,
      disabled: items.filter((item) => !item.enabled).length,
      groups: uniqueList(items.map((item) => item.group)).length,
      dbRefs: items.filter((item) => item.type === 'db_ref').length,
    };
  }

  async listGroups() {
    await this._ensureConnected();
    const items = await this.collection.find({}).toArray();
    return uniqueList(items.map((item) => item.group)).sort((a, b) => a.localeCompare(b));
  }

  async listReferenceOptions({ collectionName, keyword = '', idField = '_id', labelField = 'title' } = {}) {
    await this._ensureConnected();
    if (!collectionName) throw new Error('collection/table 名称不能为空');
    const db = await getAdminDatabase(this.options);
    const collection = db.collection(collectionName);
    let records = await collection.find({}).limit(100).toArray();
    if (keyword) {
      const lower = keyword.toLowerCase();
      records = records.filter((item) =>
        String(item[labelField] || item.name || item.title || '').toLowerCase().includes(lower) ||
        String(item[idField] || '').toLowerCase().includes(lower)
      );
    }
    return records.slice(0, 50).map((item) => ({
      value: item[idField],
      label: item[labelField] || item.name || item.title || item[idField],
      raw: item,
    }));
  }
}

export const environmentVariableModel = new EnvironmentVariableModel();

export async function getEnvironmentVariableModel(options = {}) {
  const model = new EnvironmentVariableModel(options);
  await model.connect();
  return model;
}
