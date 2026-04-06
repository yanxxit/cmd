import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Vitest 版本 TODO API 测试
 * 使用方法：npm run test:todo
 * 
 * 注意：此测试需要 TODO 服务运行在 http://127.0.0.1:3000
 * 测试会自动启动服务，测试完成后会自动关闭
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'http://127.0.0.1:3000/api/todos';

let todoServer = null;

/**
 * HTTP 请求封装
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (err) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * 等待服务启动
 */
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };
    
    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(new Error('服务启动超时'));
      } else {
        setTimeout(checkServer, 500);
      }
    };
    
    checkServer();
  });
}

/**
 * TODO API 测试套件
 */
describe('TODO API', () => {
  let createdTaskId = null;

  beforeAll(async () => {
    console.log('\n🧪 TODO API 测试开始');
    console.log('基准 URL:', BASE_URL);
    
    // 尝试启动 TODO 服务
    try {
      console.log('正在启动 TODO 服务...');
      todoServer = spawn('node', [path.join(PROJECT_ROOT, 'bin', 'static.js'), PROJECT_ROOT, '-p', '3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });
      
      // 等待服务启动
      await waitForServer(BASE_URL);
      console.log('✅ TODO 服务已启动');
    } catch (error) {
      console.log('⚠️  服务启动失败，请确保 bin/static.js 存在');
      console.log('错误:', error.message);
    }
  });

  afterAll(async () => {
    // 关闭服务
    if (todoServer) {
      todoServer.kill();
      console.log('✅ TODO 服务已关闭');
    }
    console.log('\n🧪 TODO API 测试结束\n');
  });

  describe('基本操作', () => {
    it('应该能够获取任务列表 (GET /api/todos)', async () => {
      const res = await request(`${BASE_URL}?sort=created_desc`);
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      
      console.log('✅ 通过：获取任务列表');
    });

    it('应该能够创建任务 (POST /api/todos)', async () => {
      const newTodo = {
        content: '测试任务 ' + Date.now(),
        priority: 2,
        due_date: '2026-12-31',
        note: '测试备注'
      };
      
      const res = await request(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newTodo
      });
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.content).toBe(newTodo.content);
      
      // 保存任务 ID 供后续测试使用
      createdTaskId = res.data.data.id;
      
      console.log('✅ 通过：创建任务');
      console.log('创建的任务 ID:', createdTaskId);
    });

    it('应该能够更新任务 (PUT /api/todos/:id)', async () => {
      if (!createdTaskId) {
        console.log('⏭️ 跳过：没有可用的任务 ID');
        return;
      }
      
      const res = await request(`${BASE_URL}/${createdTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { completed: true }
      });
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.completed).toBe(true);
      
      console.log('✅ 通过：更新任务');
    });

    it('应该能够删除任务 (DELETE /api/todos/:id)', async () => {
      if (!createdTaskId) {
        console.log('⏭️ 跳过：没有可用的任务 ID');
        return;
      }
      
      const res = await request(`${BASE_URL}/${createdTaskId}`, {
        method: 'DELETE'
      });
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      
      console.log('✅ 通过：删除任务');
      
      // 清理任务 ID
      createdTaskId = null;
    });
  });

  describe('统计功能', () => {
    it('应该能够获取统计信息 (GET /api/todos/stats)', async () => {
      const res = await request(`${BASE_URL}/stats`);
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      
      console.log('✅ 通过：获取统计信息');
    });
  });

  describe('批量操作', () => {
    let batchTaskIds = [];

    afterAll(async () => {
      // 清理批量测试创建的任务
      if (batchTaskIds.length > 0) {
        try {
          await request(`${BASE_URL}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { ids: batchTaskIds, action: 'delete' }
          });
          console.log('✅ 清理：批量测试任务已删除');
        } catch (e) {
          // 忽略清理错误
        }
      }
    });

    it('应该能够批量操作 (POST /api/todos/batch)', async () => {
      // 先创建两个任务
      const task1 = await request(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { content: '批量测试 1', priority: 1 }
      });
      
      const task2 = await request(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { content: '批量测试 2', priority: 2 }
      });
      
      if (!task1.data.success || !task2.data.success) {
        console.log('⏭️ 跳过：创建测试任务失败');
        return;
      }
      
      batchTaskIds = [task1.data.data.id, task2.data.data.id];
      
      // 执行批量删除
      const res = await request(`${BASE_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { ids: batchTaskIds, action: 'delete' }
      });
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      
      console.log('✅ 通过：批量操作');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效的任务 ID', async () => {
      const res = await request(`${BASE_URL}/invalid-id-12345`, {
        method: 'GET'
      });
      
      // 应该返回错误状态或 404
      expect(res.status).toBeGreaterThanOrEqual(400);
      
      console.log('✅ 通过：错误处理');
    });

    it('应该正确处理无效的请求方法', async () => {
      const res = await request(`${BASE_URL}`, {
        method: 'PATCH'
      });
      
      expect(res.status).toBeGreaterThanOrEqual(400);
      
      console.log('✅ 通过：无效方法处理');
    });
  });
});
