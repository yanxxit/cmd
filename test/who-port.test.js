/**
 * x-who-port 命令测试脚本
 * 使用方法：node test/who-port.test.js
 */

import { execSync } from 'child_process';
import http from 'http';

/**
 * 启动一个测试服务器占用指定端口
 */
function startTestServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('Test Server');
        });

        server.listen(port, () => {
            console.log(`✅ 测试服务器已启动在端口 ${port}`);
            resolve(server);
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
}

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
        return { success: false, output: err.stdout, error: err.message };
    }
}

/**
 * 测试主函数
 */
async function runTests() {
    console.log('\n🧪 x-who-port 命令测试开始\n');
    console.log('─'.repeat(60));

    const TEST_PORT = 18765;
    let passed = 0;
    let failed = 0;
    let testServer = null;

    try {
        // 启动测试服务器
        console.log(`\n📌 准备：启动测试服务器在端口 ${TEST_PORT}`);
        testServer = await startTestServer(TEST_PORT);

        // 等待服务器启动
        await new Promise(resolve => setTimeout(resolve, 500));

        // 测试 1: 基本查询
        console.log('\n📋 测试 1: 基本查询功能');
        console.log('─'.repeat(60));
        let result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        console.log('命令：node bin/who-port.js', TEST_PORT, '--no-log');
        console.log('输出:', result.output.substring(0, 300));

        if (result.success && result.output.includes('端口占用信息查询结果') && result.output.includes(TEST_PORT.toString())) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 2: JSON 格式输出
        console.log('\n📋 测试 2: JSON 格式输出');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --json --no-log`);
        console.log('命令：node bin/who-port.js', TEST_PORT, '--json --no-log');

        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.isOccupied === true && json.processCount > 0 && json.port === TEST_PORT) {
                    console.log('✅ 通过 - JSON 格式正确');
                    console.log('进程数:', json.processCount);
                    passed++;
                } else {
                    console.log('❌ 失败 - JSON 结构不正确');
                    failed++;
                }
            } catch (err) {
                console.log('❌ 失败 - 无法解析 JSON');
                console.log('输出:', result.output.substring(0, 200));
                failed++;
            }
        } else {
            console.log('❌ 失败 - 命令执行失败');
            failed++;
        }

        // 测试 3: 详细模式
        console.log('\n📋 测试 3: 详细模式 (-v)');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --verbose --no-log`);
        console.log('命令：node bin/who-port.js', TEST_PORT, '--verbose --no-log');

        if (result.success && result.output.includes('工作目录')) {
            console.log('✅ 通过 - 显示工作目录信息');
            passed++;
        } else {
            console.log('❌ 失败 - 未显示工作目录信息');
            failed++;
        }

        // 测试 4: 查询空闲端口
        console.log('\n📋 测试 4: 查询空闲端口');
        console.log('─'.repeat(60));
        const FREE_PORT = 19876;
        result = execCommand(`node bin/who-port.js ${FREE_PORT} --no-log`);
        console.log('命令：node bin/who-port.js', FREE_PORT, '--no-log');
        console.log('输出:', result.output.substring(0, 100));

        if (result.success && result.output.includes('未被占用')) {
            console.log('✅ 通过 - 正确识别空闲端口');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 5: 无效端口号
        console.log('\n📋 测试 5: 无效端口号处理');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/who-port.js 99999 --no-log 2>&1`);
        console.log('命令：node bin/who-port.js 99999 --no-log');

        if (!result.success || result.output.includes('无效') || result.output.includes('错误')) {
            console.log('✅ 通过 - 正确处理无效端口号');
            passed++;
        } else {
            console.log('❌ 失败 - 未正确处理无效端口号');
            failed++;
        }

        // 测试 6: 帮助信息
        console.log('\n📋 测试 6: 帮助信息');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/who-port.js --help`);
        console.log('命令：node bin/who-port.js --help');

        if (result.success && result.output.includes('查询占用指定端口的服务详细信息')) {
            console.log('✅ 通过 - 帮助信息显示正确');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 7: 日志记录功能
        console.log('\n📋 测试 7: 日志记录功能');
        console.log('─'.repeat(60));
        execCommand(`node bin/who-port.js ${TEST_PORT}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fs = await import('fs');
        const logExists = fs.existsSync('logs/who-port.log');
        
        if (logExists) {
            const logContent = fs.readFileSync('logs/who-port.log', 'utf-8');
            if (logContent.includes('命令开始') && logContent.includes('查询结果')) {
                console.log('✅ 通过 - 日志记录正常');
                passed++;
            } else {
                console.log('❌ 失败 - 日志内容不完整');
                failed++;
            }
        } else {
            console.log('❌ 失败 - 日志文件不存在');
            failed++;
        }

        // 测试 8: 进程信息完整性
        console.log('\n📋 测试 8: 进程信息完整性');
        console.log('─'.repeat(60));
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --json --no-log`);
        
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.processes && json.processes.length > 0) {
                    const proc = json.processes[0];
                    const requiredFields = ['command', 'pid', 'user', 'port', 'startTime', 'processInfo'];
                    const missingFields = requiredFields.filter(field => !(field in proc));
                    
                    if (missingFields.length === 0) {
                        console.log('✅ 通过 - 进程信息完整');
                        console.log('  - 命令:', proc.command);
                        console.log('  - PID:', proc.pid);
                        console.log('  - 用户:', proc.user);
                        console.log('  - 启动时间:', proc.startTime);
                        passed++;
                    } else {
                        console.log('❌ 失败 - 缺少字段:', missingFields);
                        failed++;
                    }
                } else {
                    console.log('❌ 失败 - 无进程信息');
                    failed++;
                }
            } catch (err) {
                console.log('❌ 失败 - 解析错误');
                failed++;
            }
        } else {
            console.log('❌ 失败 - 命令执行失败');
            failed++;
        }

    } catch (err) {
        console.error('\n❌ 测试执行失败:', err.message);
        console.error(err.stack);
    } finally {
        // 关闭测试服务器
        if (testServer) {
            testServer.close();
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
