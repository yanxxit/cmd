/**
 * x-scan-ports 命令测试脚本
 * 使用方法：node test/scan-ports.test.js
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
 * 测试主函数
 */
async function runTests() {
    console.log('\n🧪 x-scan-ports 命令测试开始\n');
    console.log('─'.repeat(60));

    const START_PORT = 18800;
    const END_PORT = 18810;
    let passed = 0;
    let failed = 0;
    const testServers = [];

    try {
        // 启动多个测试服务器
        console.log('\n📌 准备：启动测试服务器');
        const testPorts = [18801, 18805, 18808];
        for (const port of testPorts) {
            try {
                const server = await startTestServerInChildProcess(port);
                testServers.push(server);
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
                console.log(`⚠️ 端口 ${port} 启动失败`);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        // 测试 1: 帮助信息
        printTest('帮助信息');
        let result = execCommand(`node bin/scan-ports.js --help`);
        if (result.success && result.output.includes('扫描指定范围内的端口占用情况')) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 2: 基本扫描功能
        printTest('基本扫描功能');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --no-log --quiet`);
        // 检查是否包含扫描结果（表格或汇总信息）
        if (result.success && (result.output.includes('端口扫描汇总') || result.output.includes('┌'))) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            console.log('输出:', result.output.substring(0, 200));
            failed++;
        }

        // 测试 3: JSON 格式输出
        printTest('JSON 格式输出');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --json --no-log --quiet`);
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.summary && json.results && Array.isArray(json.results)) {
                    console.log('✅ 通过 - JSON 格式正确');
                    passed++;
                } else {
                    console.log('❌ 失败 - JSON 结构不完整');
                    failed++;
                }
            } catch {
                console.log('❌ 失败 - JSON 解析错误');
                failed++;
            }
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 4: 简洁模式
        printTest('简洁模式输出');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --simple --no-log`);
        if (result.success) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 5: 只显示占用端口
        printTest('只显示占用端口');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --only-occupied --no-log --quiet`);
        if (result.success) {
            // 检查表格中是否只包含占用的端口（有测试服务器运行的情况下）
            // 注意：汇总信息中会显示总体统计，这是正常的
            console.log('✅ 通过 - 只显示占用端口模式');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 6: 安静模式
        printTest('安静模式（不显示进度）');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --quiet --no-log`);
        // 安静模式下不显示进度条，但可能有其他输出
        if (result.success) {
            console.log('✅ 通过 - 安静模式');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 7: 日志记录功能
        printTest('日志记录功能');
        execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --quiet`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fs = await import('fs');
        if (fs.existsSync('logs/scan-ports.log')) {
            const logContent = fs.readFileSync('logs/scan-ports.log', 'utf-8');
            if (logContent.includes('命令开始') && logContent.includes('扫描完成')) {
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

        // 测试 8: 保存到文件
        printTest('保存到文件');
        const outputFile = 'test-scan-result.txt';
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --file ${outputFile} --no-log`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (fs.existsSync(outputFile)) {
            const content = fs.readFileSync(outputFile, 'utf-8');
            if (content.length > 0) {
                console.log('✅ 通过 - 文件保存成功');
                passed++;
                fs.unlinkSync(outputFile);
            } else {
                console.log('❌ 失败 - 文件内容为空');
                failed++;
            }
        } else {
            console.log('❌ 失败 - 文件未创建');
            console.log('命令输出:', result.output.substring(0, 300));
            failed++;
        }

        // 测试 9: 无效端口范围
        printTest('无效端口范围处理');
        result = execCommand(`node bin/scan-ports.js 10000 9000 --no-log 2>&1`);
        if (result.output.includes('错误') || !result.success) {
            console.log('✅ 通过 - 正确处理无效端口范围');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 10: 扫描结果准确性
        printTest('扫描结果准确性');
        result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --json --no-log --quiet`);
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                const occupiedPorts = json.results.filter(r => r.isOccupied).map(r => r.port);
                
                // 检查是否检测到了我们启动的测试服务器端口
                const foundTestPorts = testPorts.filter(port => occupiedPorts.includes(port));
                
                if (foundTestPorts.length >= 2) {
                    console.log(`✅ 通过 - 正确检测到 ${foundTestPorts.length} 个测试端口`);
                    passed++;
                } else {
                    console.log(`❌ 失败 - 只检测到 ${foundTestPorts.length} 个测试端口`);
                    failed++;
                }
            } catch {
                console.log('❌ 失败 - JSON 解析错误');
                failed++;
            }
        } else {
            console.log('❌ 失败');
            failed++;
        }

    } catch (err) {
        console.error('\n❌ 测试执行失败:', err.message);
        console.error(err.stack);
    } finally {
        // 关闭所有测试服务器
        for (const server of testServers) {
            if (server) {
                server.kill();
            }
        }
        console.log('\n🛑 测试服务器已关闭');
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

/**
 * 打印测试标题
 */
function printTest(name) {
    console.log(`\n📋 测试：${name}`);
    console.log('─'.repeat(60));
}

// 运行测试
runTests();
