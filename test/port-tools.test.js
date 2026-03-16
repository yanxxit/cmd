/**
 * 端口管理工具集 - 综合测试脚本
 * 使用方法：node test/port-tools.test.js
 * 
 * 包含：
 * - x-who-port 测试
 * - x-kill-port 测试
 * - 集成测试
 */

import { execSync, spawn } from 'child_process';
import http from 'http';

// 测试结果统计
const stats = {
    whoPort: { passed: 0, failed: 0 },
    killPort: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 }
};

/**
 * 执行命令并返回输出
 */
function execCommand(command, options = {}) {
    try {
        const output = execSync(command, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
            ...options
        });
        return { success: true, output, error: null };
    } catch (err) {
        return { success: false, output: err.stdout || '', error: err.message };
    }
}

/**
 * 检查端口是否被占用
 */
function isPortOccupied(port) {
    try {
        const result = execCommand(`lsof -ti:${port}`);
        return result.success && result.output.trim().length > 0;
    } catch {
        return false;
    }
}

/**
 * 在独立进程中启动测试服务器
 */
function startTestServerInChildProcess(port) {
    const serverCode = `
        const http = require('http');
        const server = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('Test Server');
        });
        server.listen(${port}, () => {
            console.log('SERVER_READY');
            setInterval(() => {}, 1000);
        });
    `;
    
    const child = spawn('node', ['-e', serverCode], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('服务器启动超时'));
        }, 5000);
        
        child.stdout.on('data', (data) => {
            if (data.toString().includes('SERVER_READY')) {
                clearTimeout(timeout);
                resolve(child);
            }
        });
        
        child.on('error', reject);
    });
}

/**
 * 打印测试标题
 */
function printHeader(title) {
    console.log('\n' + '═'.repeat(60));
    console.log(`  ${title}`);
    console.log('═'.repeat(60) + '\n');
}

/**
 * 打印测试用例
 */
function printTest(name) {
    console.log(`\n📋 测试：${name}`);
    console.log('─'.repeat(60));
}

/**
 * x-who-port 测试
 */
async function testWhoPort() {
    printHeader('x-who-port 测试套件');
    
    const TEST_PORT = 18901;
    let testServer = null;
    
    try {
        testServer = await startTestServerInChildProcess(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 测试 1: 基本查询
        printTest('基本查询功能');
        let result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        if (result.success && result.output.includes('端口占用信息查询结果')) {
            console.log('✅ 通过');
            stats.whoPort.passed++;
        } else {
            console.log('❌ 失败');
            stats.whoPort.failed++;
        }
        
        // 测试 2: JSON 格式
        printTest('JSON 格式输出');
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --json --no-log`);
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.isOccupied && json.port === TEST_PORT) {
                    console.log('✅ 通过');
                    stats.whoPort.passed++;
                } else {
                    console.log('❌ 失败');
                    stats.whoPort.failed++;
                }
            } catch {
                console.log('❌ 失败 - JSON 解析错误');
                stats.whoPort.failed++;
            }
        } else {
            console.log('❌ 失败');
            stats.whoPort.failed++;
        }
        
        // 测试 3: 详细模式
        printTest('详细模式 (-v)');
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --verbose --no-log`);
        if (result.output.includes('工作目录')) {
            console.log('✅ 通过');
            stats.whoPort.passed++;
        } else {
            console.log('❌ 失败');
            stats.whoPort.failed++;
        }
        
        // 测试 4: 空闲端口
        printTest('查询空闲端口');
        result = execCommand(`node bin/who-port.js 19999 --no-log`);
        if (result.output.includes('未被占用')) {
            console.log('✅ 通过');
            stats.whoPort.passed++;
        } else {
            console.log('❌ 失败');
            stats.whoPort.failed++;
        }
        
    } finally {
        if (testServer) testServer.kill();
    }
}

/**
 * x-kill-port 测试
 */
async function testKillPort() {
    printHeader('x-kill-port 测试套件');
    
    const TEST_PORT = 18902;
    let testServer = null;
    
    try {
        testServer = await startTestServerInChildProcess(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 测试 1: 帮助信息
        printTest('帮助信息');
        let result = execCommand(`node bin/kill-port.js --help`);
        if (result.output.includes('通过端口号关闭占用端口的应用程序')) {
            console.log('✅ 通过');
            stats.killPort.passed++;
        } else {
            console.log('❌ 失败');
            stats.killPort.failed++;
        }
        
        // 测试 2: 强制关闭
        printTest('强制关闭端口');
        result = execCommand(`node bin/kill-port.js ${TEST_PORT} --force --no-log`);
        if (result.output.includes('成功') || result.output.includes('已释放')) {
            console.log('✅ 通过');
            stats.killPort.passed++;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!isPortOccupied(TEST_PORT)) {
                console.log('✅ 确认：端口已释放');
            }
        } else {
            console.log('❌ 失败');
            stats.killPort.failed++;
        }
        
        // 测试 3: 空闲端口
        printTest('关闭空闲端口');
        result = execCommand(`node bin/kill-port.js 19998 --force --no-log`);
        if (result.output.includes('未被占用')) {
            console.log('✅ 通过');
            stats.killPort.passed++;
        } else {
            console.log('❌ 失败');
            stats.killPort.failed++;
        }
        
        // 测试 4: 日志记录
        printTest('日志记录功能');
        const TEST_PORT2 = 18903;
        const testServer2 = await startTestServerInChildProcess(TEST_PORT2);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        execCommand(`node bin/kill-port.js ${TEST_PORT2} --force`);
        await new Promise(resolve => setTimeout(resolve, 500));
        testServer2.kill();
        
        const fs = await import('fs');
        if (fs.existsSync('logs/kill-port.log')) {
            const logContent = fs.readFileSync('logs/kill-port.log', 'utf-8');
            if (logContent.includes('命令开始') && logContent.includes('执行命令')) {
                console.log('✅ 通过');
                stats.killPort.passed++;
            } else {
                console.log('❌ 失败');
                stats.killPort.failed++;
            }
        } else {
            console.log('❌ 失败');
            stats.killPort.failed++;
        }
        
    } finally {
        if (testServer) testServer.kill();
    }
}

/**
 * 集成测试
 */
async function testIntegration() {
    printHeader('集成测试套件');
    
    // 测试场景：查询 -> 关闭 -> 验证
    const TEST_PORT = 18904;
    let testServer = null;
    
    try {
        printTest('完整工作流程：查询 -> 关闭 -> 验证');
        
        // 1. 启动服务器
        testServer = await startTestServerInChildProcess(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. 查询端口
        let result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        if (!result.output.includes('端口占用信息查询结果')) {
            console.log('❌ 失败 - 查询失败');
            stats.integration.failed++;
            return;
        }
        console.log('✓ 查询成功');
        
        // 3. 关闭端口
        result = execCommand(`node bin/kill-port.js ${TEST_PORT} --force --no-log`);
        if (!result.output.includes('成功')) {
            console.log('❌ 失败 - 关闭失败');
            stats.integration.failed++;
            return;
        }
        console.log('✓ 关闭成功');
        
        // 4. 验证端口已释放
        await new Promise(resolve => setTimeout(resolve, 500));
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        if (result.output.includes('未被占用')) {
            console.log('✓ 验证成功 - 端口已释放');
            console.log('✅ 通过');
            stats.integration.passed++;
        } else {
            console.log('❌ 失败 - 端口仍未释放');
            stats.integration.failed++;
        }
        
    } finally {
        if (testServer) testServer.kill();
    }
}

/**
 * 打印总结
 */
function printSummary() {
    printHeader('测试结果汇总');
    
    console.log('x-who-port 测试:');
    console.log(`  ✅ 通过：${stats.whoPort.passed}`);
    console.log(`  ❌ 失败：${stats.whoPort.failed}`);
    
    console.log('\nx-kill-port 测试:');
    console.log(`  ✅ 通过：${stats.killPort.passed}`);
    console.log(`  ❌ 失败：${stats.killPort.failed}`);
    
    console.log('\n集成测试:');
    console.log(`  ✅ 通过：${stats.integration.passed}`);
    console.log(`  ❌ 失败：${stats.integration.failed}`);
    
    const totalPassed = stats.whoPort.passed + stats.killPort.passed + stats.integration.passed;
    const totalFailed = stats.whoPort.failed + stats.killPort.failed + stats.integration.failed;
    
    console.log('\n' + '─'.repeat(60));
    console.log(`总计：✅ 通过 ${totalPassed}  |  ❌ 失败 ${totalFailed}`);
    console.log('═'.repeat(60));
    
    if (totalFailed === 0) {
        console.log('\n🎉 所有测试通过！\n');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查日志\n');
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('\n🧪 端口管理工具集 - 综合测试');
    console.log('开始时间:', new Date().toLocaleString('zh-CN'));
    
    try {
        await testWhoPort();
        await testKillPort();
        await testIntegration();
    } catch (err) {
        console.error('\n❌ 测试执行失败:', err.message);
        console.error(err.stack);
    }
    
    printSummary();
    
    console.log('结束时间:', new Date().toLocaleString('zh-CN'));
    
    const totalFailed = stats.whoPort.failed + stats.killPort.failed + stats.integration.failed;
    process.exit(totalFailed === 0 ? 0 : 1);
}

// 运行测试
main();
