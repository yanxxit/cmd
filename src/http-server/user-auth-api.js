import express from 'express';
import { memberSystemModel } from '../model/jsondb/index.js';
import { ensureMemberSystemConnected, requireUserAuth } from './user-auth-helpers.js';

const router = express.Router();

router.use(ensureMemberSystemConnected);

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, error: '请输入手机号' });
    }
    const result = await memberSystemModel.sendSmsCode(phone);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password, smsCode, loginType = 'password' } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, error: '请输入手机号' });
    }
    const data = loginType === 'sms'
      ? await memberSystemModel.authenticateWithSmsCode(phone, smsCode)
      : await memberSystemModel.authenticateWithPassword(phone, password);
    res.json({ success: true, data });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/logout', requireUserAuth, async (req, res) => {
  await memberSystemModel.logout(req.userToken);
  res.json({ success: true, data: true });
});

router.get('/me', requireUserAuth, async (req, res) => {
  res.json({ success: true, data: req.currentUser });
});

export default router;
