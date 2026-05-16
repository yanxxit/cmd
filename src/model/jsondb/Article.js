import { getAdminDatabase } from './admin-db.js';

const ARTICLE_COLLECTION = 'articles';

function nowIso() {
  return new Date().toISOString();
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!String(value || '').trim()) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export class ArticleModel {
  constructor(options = {}) {
    this.options = options;
    this.collection = null;
  }

  async connect() {
    const db = await getAdminDatabase(this.options);
    this.collection = db.collection(ARTICLE_COLLECTION);
    await this._ensureDefaults();
    return this;
  }

  async _ensureConnected() {
    if (!this.collection) {
      await this.connect();
    }
  }

  async _ensureDefaults() {
    const count = await this.collection.countDocuments();
    if (count > 0) return;

    const seedArticles = [
      {
        title: '测试案例平台上线说明',
        summary: '介绍测试案例管理后台的核心能力、适用场景与上线注意事项。',
        content: '<p>测试案例平台已升级为支持管理员、角色权限、环境变量和文章管理的一体化后台。</p><p>你可以继续在这里沉淀内部说明文档与操作指南。</p>',
        author: '系统管理员',
        category: '平台公告',
        tags: ['公告', '上线'],
        status: 'published',
        viewCount: 18,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        publishedAt: nowIso(),
      },
    ];

    for (const article of seedArticles) {
      await this.collection.insertOne(article);
    }
  }

  normalizePayload(data = {}, isUpdate = false) {
    const payload = {};

    if (!isUpdate || data.title !== undefined) {
      const title = String(data.title || '').trim();
      if (!title) throw new Error('文章标题不能为空');
      payload.title = title;
    }
    if (!isUpdate || data.summary !== undefined) {
      payload.summary = String(data.summary || '').trim();
    }
    if (!isUpdate || data.content !== undefined) {
      const content = String(data.content || '').trim();
      if (!content) throw new Error('文章内容不能为空');
      payload.content = content;
    }
    if (!isUpdate || data.author !== undefined) {
      payload.author = String(data.author || '').trim() || '未知作者';
    }
    if (!isUpdate || data.category !== undefined) {
      payload.category = String(data.category || '').trim() || '未分类';
    }
    if (!isUpdate || data.tags !== undefined) {
      payload.tags = toStringList(data.tags);
    }
    if (!isUpdate || data.status !== undefined) {
      const status = String(data.status || 'draft');
      if (!['draft', 'published', 'archived'].includes(status)) {
        throw new Error('文章状态不合法');
      }
      payload.status = status;
    }
    if (!isUpdate || data.coverImage !== undefined) {
      payload.coverImage = String(data.coverImage || '').trim();
    }
    return payload;
  }

  async sanitize(article) {
    if (!article) return null;
    return {
      ...article,
      tags: Array.isArray(article.tags) ? article.tags : [],
      summary: article.summary || '',
      coverImage: article.coverImage || '',
      viewCount: Number(article.viewCount || 0),
    };
  }

  async list(filters = {}) {
    await this._ensureConnected();
    const { keyword = '', status = '', category = '', author = '' } = filters;
    let articles = await this.collection.find({}).toArray();
    if (keyword) {
      const lower = keyword.toLowerCase();
      articles = articles.filter((item) =>
        item.title?.toLowerCase().includes(lower) ||
        item.summary?.toLowerCase().includes(lower) ||
        item.content?.toLowerCase().includes(lower)
      );
    }
    if (status) {
      articles = articles.filter((item) => item.status === status);
    }
    if (category) {
      articles = articles.filter((item) => item.category === category);
    }
    if (author) {
      articles = articles.filter((item) => item.author === author);
    }
    articles.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return await Promise.all(articles.map((item) => this.sanitize(item)));
  }

  async getById(id) {
    await this._ensureConnected();
    const item = await this.collection.findOne({ _id: id });
    return await this.sanitize(item);
  }

  async create(data = {}) {
    await this._ensureConnected();
    const payload = this.normalizePayload(data, false);
    const now = nowIso();
    const inserted = await this.collection.insertOne({
      ...payload,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: payload.status === 'published' ? now : '',
    });
    return await this.sanitize(inserted);
  }

  async update(id, updates = {}) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('文章不存在');
    const payload = this.normalizePayload(updates, true);
    const nextStatus = payload.status || existing.status;

    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...payload,
          publishedAt: nextStatus === 'published' ? (existing.publishedAt || nowIso()) : '',
          updatedAt: nowIso(),
        },
      }
    );
    return await this.getById(id);
  }

  async delete(id) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('文章不存在');
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  async incrementView(id) {
    await this._ensureConnected();
    const existing = await this.collection.findOne({ _id: id });
    if (!existing) throw new Error('文章不存在');
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          viewCount: Number(existing.viewCount || 0) + 1,
          updatedAt: nowIso(),
        },
      }
    );
    return await this.getById(id);
  }

  async getStats() {
    await this._ensureConnected();
    const articles = await this.collection.find({}).toArray();
    return {
      total: articles.length,
      published: articles.filter((item) => item.status === 'published').length,
      draft: articles.filter((item) => item.status === 'draft').length,
      archived: articles.filter((item) => item.status === 'archived').length,
      totalViews: articles.reduce((sum, item) => sum + Number(item.viewCount || 0), 0),
    };
  }

  async listCategories() {
    await this._ensureConnected();
    const articles = await this.collection.find({}).toArray();
    return Array.from(new Set(articles.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }
}

export const articleModel = new ArticleModel();

export async function getArticleModel(options = {}) {
  const model = new ArticleModel(options);
  await model.connect();
  return model;
}
