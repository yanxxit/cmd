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
    res.json({ success: true, data: result });
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
    const claim = await couponSystemModel.luckyDraw(req.currentUser);
    const coupon = await couponSystemModel.getCouponById(claim.couponId);
    res.json({ success: true, data: { ...claim, coupon } });
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

router.get('/prizes', async (req, res) => {
  try {
    const prizes = await couponSystemModel.listLuckyDrawPrizes();
    res.json({ success: true, data: prizes });
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
