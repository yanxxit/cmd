/**
 * TODO API 测试脚本
 * 使用方法：node test/todo-api-test.js
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000/api/todos';

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
 * 测试主函数
 */
async function runTests() {
  console.log('\n🧪 TODO API 测试开始\n');
  console.log('基准 URL:', BASE_URL);
  console.log('─'.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // 测试 1: 获取任务列表
    console.log('\n📋 测试 1: 获取任务列表 (GET /api/todos)');
    let res = await request(`${BASE_URL}?sort=created_desc`);
    console.log('状态码:', res.status);
    console.log('响应:', JSON.stringify(res.data, null, 2).substring(0, 200));
    
    if (res.status === 200 && res.data.success) {
      console.log('✅ 通过');
      passed++;
    } else {
      console.log('❌ 失败');
      failed++;
    }
    
    // 测试 2: 创建任务
    console.log('\n📝 测试 2: 创建任务 (POST /api/todos)');
    const newTodo = {
      content: '测试任务 ' + Date.now(),
      priority: 2,
      due_date: '2026-12-31',
      note: '测试备注'
    };
    res = await request(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: newTodo
    });
    console.log('状态码:', res.status);
    console.log('响应:', JSON.stringify(res.data, null, 2));
    
    if (res.status === 200 && res.data.success) {
      console.log('✅ 通过');
      passed++;
      
      const taskId = res.data.data.id;
      console.log('创建的任务 ID:', taskId);
      
      // 测试 3: 更新任务
      console.log('\n✏️ 测试 3: 更新任务 (PUT /api/todos/:id)');
      res = await request(`${BASE_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { completed: true }
      });
      console.log('状态码:', res.status);
      console.log('响应:', JSON.stringify(res.data, null, 2));
      
      if (res.status === 200 && res.data.success) {
        console.log('✅ 通过');
        passed++;
      } else {
        console.log('❌ 失败');
        failed++;
      }
      
      // 测试 4: 删除任务
      console.log('\n🗑️ 测试 4: 删除任务 (DELETE /api/todos/:id)');
      res = await request(`${BASE_URL}/${taskId}`, {
        method: 'DELETE'
      });
      console.log('状态码:', res.status);
      console.log('响应:', JSON.stringify(res.data, null, 2));
      
      if (res.status === 200 && res.data.success) {
        console.log('✅ 通过');
        passed++;
      } else {
        console.log('❌ 失败');
        failed++;
      }
      
    } else {
      console.log('❌ 失败');
      failed++;
    }
    
    // 测试 5: 获取统计信息
    console.log('\n📊 测试 5: 获取统计信息 (GET /api/todos/stats)');
    res = await request(`${BASE_URL}/stats`);
    console.log('状态码:', res.status);
    console.log('响应:', JSON.stringify(res.data, null, 2));
    
    if (res.status === 200 && res.data.success) {
      console.log('✅ 通过');
      passed++;
    } else {
      console.log('❌ 失败');
      failed++;
    }
    
    // 测试 6: 批量操作
    console.log('\n📦 测试 6: 批量操作 (POST /api/todos/batch)');
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
    
    if (task1.data.success && task2.data.success) {
      const ids = [task1.data.data.id, task2.data.data.id];
      res = await request(`${BASE_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { ids, action: 'delete' }
      });
      console.log('状态码:', res.status);
      console.log('响应:', JSON.stringify(res.data, null, 2));
      
      if (res.status === 200 && res.data.success) {
        console.log('✅ 通过');
        passed++;
      } else {
        console.log('❌ 失败');
        failed++;
      }
    } else {
      console.log('⏭️ 跳过（创建测试任务失败）');
    }
    
  } catch (err) {
    console.error('\n❌ 测试执行失败:', err.message);
    console.error('请确保服务已启动：x-static');
  }
  
  // 总结
  console.log('\n' + '═'.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('─'.repeat(50));
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log('═'.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！\n');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志\n');
  }
}

// 运行测试
runTests();
