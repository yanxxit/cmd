import express from 'express';
import { couponSystemModel, memberSystemModel } from '../model/jsondb/index.js';
import { ensureMemberSystemConnected, requireUserAuth } from './user-auth-helpers.js';

const router = express.Router();

router.use(ensureMemberSystemConnected);
router.use(requireUserAuth);
router.use(async (req, res, next) => {
  try {
    if (!couponSystemModel.coupons) {
      await couponSystemModel.connect();
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '优惠券系统初始化失败：' + error.message });
  }
});

router.post('/check-in', async (req, res) => {
  try {
    const result = await memberSystemModel.signIn(req.currentUser._id);
    const user = await memberSystemModel.getUserById(req.currentUser._id);
    const rewardProgress = await memberSystemModel.getSignInRewardProgress(req.currentUser._id);
    res.json({ success: true, data: { ...result, user, rewardProgress } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/claim-daily-coupon', async (req, res) => {
  try {
    const claim = await couponSystemModel.claimDailyRandomCoupon(req.currentUser);
    const coupon = await couponSystemModel.getCouponById(claim.couponId);
    res.json({ success: true, data: { ...claim, coupon } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/lucky-draw', async (req, res) => {
  try {
    const chanceState = await memberSystemModel.consumeLotteryChance(req.currentUser._id, {
      source: 'lucky_draw',
      dayKey: new Date().toISOString().slice(0, 10),
      meta: { trigger: 'user_actions_api' },
    });
    let result;
    try {
      result = await couponSystemModel.luckyDraw(req.currentUser, {
        allowEmpty: true,
        emptyRate: 0.3,
      });
    } catch (error) {
      await memberSystemModel.grantLotteryChance(req.currentUser._id, {
        count: 1,
        source: 'lucky_draw_refund',
        meta: { reason: error.message },
      });
      throw error;
    }
    const user = await memberSystemModel.getUserById(req.currentUser._id);
    res.json({ success: true, data: { ...result, chanceState, user } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/coupons', async (req, res) => {
  try {
    const claims = await couponSystemModel.listUserCoupons(req.currentUser._id);
    res.json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sign-ins', async (req, res) => {
  try {
    const signIns = await memberSystemModel.listSignIns({ userId: req.currentUser._id });
    res.json({ success: true, data: signIns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sign-in-rewards', async (req, res) => {
  try {
    const progress = await memberSystemModel.getSignInRewardProgress(req.currentUser._id);
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/prizes', async (req, res) => {
  try {
    const prizes = await couponSystemModel.listLuckyDrawPrizes();
    res.json({ success: true, data: prizes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/draw-records', async (req, res) => {
  try {
    const records = await couponSystemModel.listLuckyDrawRecords({ userId: req.currentUser._id });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/use-coupon', async (req, res) => {
  try {
    const { claimId, orderAmount } = req.body || {};
    await couponSystemModel.useCoupon({
      userId: req.currentUser._id,
      claimId,
      orderAmount,
    });
    res.json({ success: true, data: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
