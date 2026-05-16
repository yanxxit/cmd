import dayjs from 'dayjs';
import {
  articleModel,
  couponSystemModel,
  memberSystemModel,
  shortLinkModel,
} from '../src/model/jsondb/index.js';

const DEMO_USERS = [
  { phone: '13800000001', nickname: '演示用户-A', gender: 'male', age: 26 },
  { phone: '13800000002', nickname: '演示用户-B', gender: 'female', age: 29 },
  { phone: '13800000003', nickname: '演示用户-C', gender: 'female', age: 24 },
  { phone: '13800000004', nickname: '演示用户-D', gender: 'male', age: 31 },
];

const DEMO_ARTICLES = [
  {
    title: '会员中心体验说明',
    summary: '介绍用户登录、签到、领券和大转盘的本地体验流程。',
    content: '<p>会员中心现已支持手机号密码登录、短信验证码登录、签到、随机领券与大转盘抽奖。</p><p>你可以直接使用演示账号验证整条流程。</p>',
    author: '系统管理员',
    category: '用户运营',
    tags: ['会员中心', '演示'],
    status: 'published',
  },
  {
    title: '优惠券活动预热公告',
    summary: '购物优惠券活动上线，支持满减券、折扣券和包邮券。',
    content: '<p>本次活动支持多种购物优惠券，用户可通过签到、每日随机领券和大转盘获取。</p>',
    author: '运营同学',
    category: '活动公告',
    tags: ['优惠券', '活动'],
    status: 'published',
  },
];

function nowIso() {
  return new Date().toISOString();
}

function defaultPassword(phone) {
  return String(phone || '').slice(-6) || '123456';
}

async function ensureUsers() {
  const users = [];
  for (const item of DEMO_USERS) {
    const existing = await memberSystemModel.getUserByPhone(item.phone);
    if (!existing) {
      const created = await memberSystemModel.createUser({
        ...item,
        password: defaultPassword(item.phone),
        status: 'active',
      });
      users.push(created);
      continue;
    }

    await memberSystemModel.updateUser(existing._id, {
      nickname: item.nickname,
      gender: item.gender,
      age: item.age,
      status: 'active',
    });
    await memberSystemModel.resetPassword(existing._id, defaultPassword(item.phone));
    users.push(await memberSystemModel.getUserById(existing._id));
  }
  return users;
}

async function ensureArticles() {
  const existingArticles = await articleModel.list({});
  const result = [...existingArticles];
  for (const item of DEMO_ARTICLES) {
    const matched = existingArticles.find((article) => article.title === item.title);
    if (matched) continue;
    const created = await articleModel.create(item);
    result.push(created);
  }
  return result;
}

async function ensureShortLinks(articles = []) {
  const now = nowIso();
  const articleTargets = articles.slice(0, 2);
  for (const article of articleTargets) {
    const shortLink = await shortLinkModel.create({
      code: `art${String(article._id).slice(-4)}`,
      type: 'article',
      resourceId: article._id,
      title: article.title,
      targetUrl: `/test-case-manager/article-view.html?id=${article._id}`,
      active: true,
    });
    await shortLinkModel.collection.updateOne(
      { _id: shortLink._id },
      { $set: { hitCount: 16, lastHitAt: now, updatedAt: now } }
    );
  }

  const memberCenterCode = 'member6';
  const existingMemberCenterLink = await shortLinkModel.collection.findOne({ code: memberCenterCode });
  if (!existingMemberCenterLink) {
    await shortLinkModel.create({
      code: memberCenterCode,
      type: 'generic',
      resourceId: 'member-center',
      title: '会员中心演示页',
      targetUrl: '/test-case-manager/member-center.html',
      active: true,
    });
  }
  const memberCenterLink = await shortLinkModel.collection.findOne({ code: memberCenterCode });
  await shortLinkModel.collection.updateOne(
    { _id: memberCenterLink._id },
    { $set: { hitCount: 28, lastHitAt: now, updatedAt: now } }
  );
}

async function ensureBusinessFlow(users = []) {
  const today = dayjs().format('YYYY-MM-DD');
  const coupons = await couponSystemModel.listCoupons({ status: 'active' });
  if (!coupons.length || users.length < 3) return;

  for (const user of users.slice(0, 3)) {
    try {
      await memberSystemModel.signIn(user._id);
    } catch (error) {}
  }

  const [couponA, couponB] = coupons;
  const userA = users[0];
  const userB = users[1];
  const userC = users[2];

  const userAClaims = await couponSystemModel.listClaimRecords({ userId: userA._id });
  if (!userAClaims.some((item) => item.couponId === couponA._id && item.source === 'manual_grant')) {
    try {
      await couponSystemModel.grantCouponToUser({
        couponId: couponA._id,
        user: userA,
        source: 'manual_grant',
        operatorId: 'seed-script',
        meta: { seed: true },
      });
    } catch (error) {}
  }

  const userBClaims = await couponSystemModel.listClaimRecords({ userId: userB._id });
  if (!userBClaims.some((item) => item.couponId === couponB._id && item.source === 'manual_grant')) {
    try {
      await couponSystemModel.grantCouponToUser({
        couponId: couponB._id,
        user: userB,
        source: 'manual_grant',
        operatorId: 'seed-script',
        meta: { seed: true },
      });
    } catch (error) {}
  }

  const todayRandomClaim = await couponSystemModel.claims.findOne({ userId: userB._id, source: 'daily_random', dayKey: today });
  if (!todayRandomClaim) {
    try {
      await couponSystemModel.claimDailyRandomCoupon(userB);
    } catch (error) {}
  }

  const todayLuckyClaim = await couponSystemModel.claims.findOne({ userId: userC._id, source: 'lucky_draw', dayKey: today });
  if (!todayLuckyClaim) {
    try {
      await couponSystemModel.luckyDraw(userC);
    } catch (error) {}
  }

  const refreshedUserAClaims = await couponSystemModel.listClaimRecords({ userId: userA._id });
  const useTarget = refreshedUserAClaims.find((item) => item.status === 'claimed' && item.couponId === couponA._id);
  if (useTarget) {
    const existingUsage = await couponSystemModel.usages.findOne({ claimId: useTarget._id });
    if (!existingUsage) {
      try {
        await couponSystemModel.useCoupon({
          userId: userA._id,
          claimId: useTarget._id,
          orderAmount: Math.max(Number(couponA.conditionAmount || 0), 199),
        });
      } catch (error) {}
    }
  }
}

async function main() {
  await Promise.all([
    articleModel.connect(),
    couponSystemModel.connect(),
    memberSystemModel.connect(),
    shortLinkModel.connect(),
  ]);

  const users = await ensureUsers();
  const articles = await ensureArticles();
  await ensureShortLinks(articles);
  await ensureBusinessFlow(users);

  console.log('✅ test-case-manager 本地演示数据已准备完成');
  console.log('演示账号：');
  for (const user of users.slice(0, 3)) {
    console.log(`- ${user.nickname} / ${user.phone} / ${defaultPassword(user.phone)}`);
  }
  console.log('页面入口：');
  console.log('- 后台：/test-case-manager/');
  console.log('- 会员中心：/test-case-manager/member-center.html');
  console.log('- 无扩展路由：/test-case-manager/member-center');
}

main().catch((error) => {
  console.error('❌ 演示数据准备失败:', error);
  process.exit(1);
});
