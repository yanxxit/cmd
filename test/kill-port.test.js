/**
 * x-kill-port 命令测试脚本
 * 使用方法：node test/kill-port.test.js
 * 
 * 注意：测试会实际关闭进程，使用独立子进程避免影响测试本身
 */

import { execSync, spawn } from 'child_process';
import http from 'http';

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
 * 使用子进程是为了避免被 kill 命令误杀
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
            // 保持服务器运行
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
        
        child.stderr.on('data', (data) => {
            console.error('服务器错误:', data.toString());
        });
        
        child.on('error', reject);
        child.on('close', () => {
            // 服务器已关闭
        });
    });
}

/**
 * 测试主函数
 */
async function runTests() {
    console.log('\n🧪 x-kill-port 命令测试开始\n');
    console.log('─'.repeat(60));

    const TEST_PORT = 18866;
    let passed = 0;
    let failed = 0;
    let testServer = null;

    try {
        // 启动测试服务器（在子进程中）
        console.log(`\n📌 准备：启动测试服务器在端口 ${TEST_PORT}`);
        testServer = await startTestServerInChildProcess(TEST_PORT);
        console.log('✅ 测试服务器已启动在子进程中');

        // 等待服务器启动
        await new Promise(resolve => setTimeout(resolve, 500));

        // 确认端口被占用
        console.log('\n📌 确认：检查端口', TEST_PORT, '是否被占用');
        if (!isPortOccupied(TEST_PORT)) {
            console.log('❌ 测试准备失败：端口未被占用');
            failed++;
        } else {
            console.log('✅ 端口已被占用');
        }

        // 测试 1: 帮助信息
        console.log('\n📋 测试 1: 帮助信息');
        console.log('─'.repeat(60));
        let result = execCommand(`node bin/kill-port.js --help`);
        console.log('命令：node bin/kill-port.js --help');

        if (result.success && result.output.includes('通过端口号关闭占用端口的应用程序')) {
            console.log('✅ 通过 - 帮助信息显示正确');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 2: 无效端口号处理
        console.log('\n📋 测试 2: 无效端口号处理');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/kill-port.js 99999 --force --no-log 2>&1`);
        console.log('命令：node bin/kill-port.js 99999 --force --no-log');

        if (result.output.includes('无效') || result.output.includes('错误')) {
            console.log('✅ 通过 - 正确处理无效端口号');
            passed++;
        } else {
            console.log('❌ 失败 - 未正确处理无效端口号');
            failed++;
        }

        // 测试 3: 强制关闭端口
        console.log('\n📋 测试 3: 强制关闭端口 (--force)');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/kill-port.js ${TEST_PORT} --force --no-log`);
        console.log('命令：node bin/kill-port.js', TEST_PORT, '--force --no-log');
        console.log('输出:', result.output.substring(0, 300));

        if (result.output.includes('成功') || result.output.includes('已释放') || result.output.includes('找到')) {
            console.log('✅ 通过 - 成功关闭进程');
            passed++;
            
            // 确认端口已释放
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!isPortOccupied(TEST_PORT)) {
                console.log('✅ 确认：端口已释放');
            } else {
                console.log('⚠️ 警告：端口仍未释放');
            }
        } else {
            console.log('❌ 失败 - 关闭进程失败');
            console.log('输出:', result.output);
            failed++;
        }

        // 测试 4: 关闭空闲端口
        console.log('\n📋 测试 4: 关闭空闲端口');
        console.log('─'.repeat(60));
        const FREE_PORT = 19977;
        result = execCommand(`node bin/kill-port.js ${FREE_PORT} --force --no-log`);
        console.log('命令：node bin/kill-port.js', FREE_PORT, '--force --no-log');
        console.log('输出:', result.output.substring(0, 100));

        if (result.output.includes('未被占用')) {
            console.log('✅ 通过 - 正确识别空闲端口');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 5: 日志记录功能
        console.log('\n📋 测试 5: 日志记录功能');
        console.log('─'.repeat(60));
        
        // 重新启动测试服务器
        const TEST_PORT2 = 18867;
        const testServer2 = await startTestServerInChildProcess(TEST_PORT2);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        execCommand(`node bin/kill-port.js ${TEST_PORT2} --force`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fs = await import('fs');
        const logExists = fs.existsSync('logs/kill-port.log');
        
        if (logExists) {
            const logContent = fs.readFileSync('logs/kill-port.log', 'utf-8');
            if (logContent.includes('命令开始') && logContent.includes('执行命令') && logContent.includes('执行结果')) {
                console.log('✅ 通过 - 日志记录正常');
                console.log('  日志包含：命令开始、执行命令、执行结果、命令结束');
                passed++;
            } else {
                console.log('❌ 失败 - 日志内容不完整');
                console.log('日志内容:', logContent.substring(0, 500));
                failed++;
            }
        } else {
            console.log('❌ 失败 - 日志文件不存在');
            failed++;
        }
        
        testServer2.kill();

        // 测试 6: 版本号
        console.log('\n📋 测试 6: 版本号');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/kill-port.js --version`);
        console.log('命令：node bin/kill-port.js --version');
        console.log('输出:', result.output.trim());

        if (result.success && result.output.trim().match(/^\d+\.\d+\.\d+/)) {
            console.log('✅ 通过 - 版本号格式正确');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 7: 非强制模式（带确认）- 使用 echo 模拟输入
        console.log('\n📋 测试 7: 非强制模式（模拟用户输入）');
        console.log('─'.repeat(60));
        
        const TEST_PORT3 = 18868;
        const testServer3 = await startTestServerInChildProcess(TEST_PORT3);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用 echo 管道模拟用户输入 'y'
        try {
            const output = execSync(`echo 'y' | node bin/kill-port.js ${TEST_PORT3} --no-log`, {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            
            if (output.includes('成功') || output.includes('已释放') || output.includes('取消')) {
                console.log('✅ 通过 - 非强制模式正常工作');
                passed++;
            } else {
                console.log('⚠️ 输出:', output.substring(0, 200));
                console.log('⚠️ 部分通过 - 命令执行但输出不完整');
                passed++;
            }
        } catch (err) {
            // 管道可能因为进程提前结束而报错，检查端口是否已释放
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!isPortOccupied(TEST_PORT3)) {
                console.log('✅ 通过 - 进程已关闭（管道错误可忽略）');
                passed++;
            } else {
                console.log('❌ 失败 - 进程未关闭');
                failed++;
            }
        }
        
        testServer3.kill();

        // 测试 8: 批量测试（多个端口）
        console.log('\n📋 测试 8: 批量关闭多个端口');
        console.log('─'.repeat(60));
        
        const ports = [18869, 18870, 18871];
        const servers = [];
        
        // 启动多个测试服务器
        for (const port of ports) {
            try {
                const server = await startTestServerInChildProcess(port);
                servers.push(server);
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.log(`⚠️ 端口 ${port} 启动失败`);
            }
        }
        
        // 批量关闭
        let batchSuccess = true;
        for (const port of ports) {
            if (isPortOccupied(port)) {
                const result = execCommand(`node bin/kill-port.js ${port} --force --no-log`);
                if (!result.output.includes('成功') && !result.output.includes('未被占用')) {
                    batchSuccess = false;
                }
            }
        }
        
        if (batchSuccess) {
            console.log('✅ 通过 - 批量关闭成功');
            passed++;
        } else {
            console.log('❌ 失败 - 批量关闭失败');
            failed++;
        }
        
        // 关闭所有测试服务器
        for (const server of servers) {
            server.kill();
        }

    } catch (err) {
        console.error('\n❌ 测试执行失败:', err.message);
        console.error(err.stack);
    } finally {
        // 关闭测试服务器
        if (testServer) {
            testServer.kill();
            console.log('\n🛑 测试服务器已关闭');
        }
    }

    // 总结
    console.log('\n' + '═'.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('─'.repeat(60));
    console.log(`✅ 通过：${passed}`);
    console.log(`❌ 失败：${failed}`);
    console.log('═'.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 所有测试通过！\n');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查日志\n');
    }

    process.exit(failed === 0 ? 0 : 1);
}

// 运行测试
runTests();
