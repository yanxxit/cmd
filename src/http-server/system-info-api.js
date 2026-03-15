/**
 * 系统信息 API - Socket.IO 实现
 * 提供实时系统信息推送
 */

import { getAllSystemInfo } from '../system-info.js';

/**
 * 设置 Socket.IO 系统信息路由
 * @param {Server} io - Socket.IO 服务器实例
 */
export function setupSystemInfoSocket(io) {
  // Socket.IO 命名空间
  const systemNamespace = io.of('/system-info');

  systemNamespace.on('connection', (socket) => {
    console.log('客户端连接到系统信息 Socket:', socket.id);

    // 立即发送一次当前系统信息
    sendSystemInfo(socket);

    // 设置定时器，每 2 秒发送一次系统信息
    const interval = setInterval(() => {
      sendSystemInfo(socket);
    }, 2000);

    // 监听客户端请求
    socket.on('request-info', () => {
      sendSystemInfo(socket);
    });

    // 监听客户端断开连接
    socket.on('disconnect', () => {
      console.log('客户端断开系统信息 Socket:', socket.id);
      clearInterval(interval);
    });

    // 监听错误
    socket.on('error', (error) => {
      console.error('Socket 错误:', error);
    });
  });

  return systemNamespace;
}

/**
 * 发送系统信息到客户端
 * @param {Socket} socket - Socket.IO 客户端
 */
async function sendSystemInfo(socket) {
  try {
    const info = await getAllSystemInfo();
    socket.emit('system-info', info);
  } catch (error) {
    console.error('获取系统信息失败:', error);
    socket.emit('system-error', {
      message: '获取系统信息失败',
      error: error.message
    });
  }
}

/**
 * 系统信息 HTTP API 路由
 * @param {Express} app - Express 应用实例
 */
export function setupSystemInfoAPI(app) {
  // 获取所有系统信息
  app.get('/api/system-info', async (req, res) => {
    try {
      const info = await getAllSystemInfo();
      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // 获取 CPU 信息
  app.get('/api/system-info/cpu', (req, res) => {
    try {
      const cpu = getAllSystemInfo().cpu;
      res.json({
        success: true,
        data: cpu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // 获取内存信息
  app.get('/api/system-info/memory', (req, res) => {
    try {
      const memory = getAllSystemInfo().memory;
      res.json({
        success: true,
        data: memory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // 获取磁盘信息
  app.get('/api/system-info/disk', async (req, res) => {
    try {
      const disk = await getAllSystemInfo().disk;
      res.json({
        success: true,
        data: disk
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // 获取网络信息
  app.get('/api/system-info/network', (req, res) => {
    try {
      const network = getAllSystemInfo().network;
      res.json({
        success: true,
        data: network
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  // 获取系统基本信息
  app.get('/api/system-info/system', (req, res) => {
    try {
      const system = getAllSystemInfo().system;
      res.json({
        success: true,
        data: system
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
}
