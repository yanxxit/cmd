import express from 'express';
import { couponSystemModel, memberSystemModel } from '../model/jsondb/index.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);
router.use(async (req, res, next) => {
  try {
    if (!couponSystemModel.coupons) {
      await couponSystemModel.connect();
    }
    if (!memberSystemModel.users) {
      await memberSystemModel.connect();
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '优惠券系统初始化失败：' + error.message });
  }
});

router.get('/', requireAdminPermission('coupons.view'), async (req, res) => {
  try {
    const coupons = await couponSystemModel.listCoupons(req.query || {});
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAdminPermission('coupons.view'), async (req, res) => {
  try {
    const stats = await couponSystemModel.getCouponStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/claims', requireAdminPermission('coupons.view'), async (req, res) => {
  try {
    const claims = await couponSystemModel.listClaimRecords(req.query || {});
    res.json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/usages', requireAdminPermission('coupons.view'), async (req, res) => {
  try {
    const usages = await couponSystemModel.listUsageRecords(req.query || {});
    res.json({ success: true, data: usages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/prizes', requireAdminPermission('lottery.view'), async (req, res) => {
  try {
    const prizes = await couponSystemModel.listLuckyDrawPrizes();
    res.json({ success: true, data: prizes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/draw-records', requireAdminPermission('lottery.view'), async (req, res) => {
  try {
    const records = await couponSystemModel.listLuckyDrawRecords(req.query || {});
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireAdminPermission('coupons.manage'), async (req, res) => {
  try {
    const coupon = await couponSystemModel.createCoupon(req.body || {});
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireAdminPermission('coupons.manage'), async (req, res) => {
  try {
    const coupon = await couponSystemModel.updateCoupon(req.params.id, req.body || {});
    res.json({ success: true, data: coupon });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAdminPermission('coupons.manage'), async (req, res) => {
  try {
    await couponSystemModel.deleteCoupon(req.params.id);
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.post('/:id/grant', requireAdminPermission('coupons.manage'), async (req, res) => {
  try {
    const user = await memberSystemModel.getUserById(req.body?.userId || '');
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    const claim = await couponSystemModel.grantCouponToUser({
      couponId: req.params.id,
      user,
      source: 'manual_grant',
      operatorId: req.currentAdmin._id,
      meta: { operator: req.currentAdmin.username },
    });
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/lucky-draw', requireAdminPermission('lottery.manage'), async (req, res) => {
  try {
    const user = await memberSystemModel.getUserById(req.body?.userId || '');
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    const claim = await couponSystemModel.luckyDraw(user);
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
