/**
 * x-system-top 命令测试脚本
 * 使用方法：node test/system-top.test.js
 */

import { execSync } from 'child_process';

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
 * 测试主函数
 */
async function runTests() {
    console.log('\n🧪 x-system-top 命令测试开始\n');
    console.log('─'.repeat(60));

    let passed = 0;
    let failed = 0;

    try {
        // 测试 1: 帮助信息
        printTest('帮助信息');
        let result = execCommand(`node bin/system-top.js --help`);
        if (result.success && result.output.includes('查询系统资源占用前列的进程')) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 2: 基本查询功能
        printTest('基本查询功能');
        result = execCommand(`node bin/system-top.js -n 5 --no-log`);
        if (result.success && result.output.includes('系统资源概览')) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 3: 按 CPU 排序
        printTest('按 CPU 排序');
        result = execCommand(`node bin/system-top.js -n 5 -s cpu --no-log`);
        if (result.success && result.output.includes('CPU')) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 4: 按内存排序
        printTest('按内存排序');
        result = execCommand(`node bin/system-top.js -n 5 -s memory --no-log`);
        if (result.success && result.output.includes('Memory')) {
            console.log('✅ 通过');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 5: JSON 格式输出
        printTest('JSON 格式输出');
        result = execCommand(`node bin/system-top.js -n 3 -j --no-log`);
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.system && json.processes && Array.isArray(json.processes)) {
                    console.log('✅ 通过 - JSON 格式正确');
                    console.log(`   进程数：${json.processes.length}`);
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

        // 测试 6: 不显示头部
        printTest('不显示系统信息头部');
        result = execCommand(`node bin/system-top.js -n 3 --no-header --no-log`);
        if (result.success && !result.output.includes('系统资源概览') && result.output.includes('┌')) {
            console.log('✅ 通过 - 只显示进程表格');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 7: 日志记录功能
        printTest('日志记录功能');
        execCommand(`node bin/system-top.js -n 3`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fs = await import('fs');
        if (fs.existsSync('logs/system-top.log')) {
            const logContent = fs.readFileSync('logs/system-top.log', 'utf-8');
            if (logContent.includes('命令开始') && logContent.includes('查询完成')) {
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
        const outputFile = 'test-system-top-result.txt';
        result = execCommand(`node bin/system-top.js -n 5 --file ${outputFile} --no-log`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (fs.existsSync(outputFile)) {
            const content = fs.readFileSync(outputFile, 'utf-8');
            if (content.length > 0 && content.includes('系统资源概览')) {
                console.log('✅ 通过 - 文件保存成功');
                passed++;
                fs.unlinkSync(outputFile);
            } else {
                console.log('❌ 失败 - 文件内容为空或不正确');
                failed++;
            }
        } else {
            console.log('❌ 失败 - 文件未创建');
            failed++;
        }

        // 测试 9: 版本号
        printTest('版本号');
        result = execCommand(`node bin/system-top.js --version`);
        if (result.success && result.output.trim().match(/^\d+\.\d+\.\d+/)) {
            console.log('✅ 通过 - 版本号格式正确');
            passed++;
        } else {
            console.log('❌ 失败');
            failed++;
        }

        // 测试 10: 进程信息完整性
        printTest('进程信息完整性');
        result = execCommand(`node bin/system-top.js -n 3 -j --no-log`);
        if (result.success) {
            try {
                const json = JSON.parse(result.output);
                if (json.processes && json.processes.length > 0) {
                    const proc = json.processes[0];
                    const requiredFields = ['pid', 'command', 'cpu', 'mem', 'rss', 'user'];
                    const missingFields = requiredFields.filter(field => !(field in proc));
                    
                    if (missingFields.length === 0) {
                        console.log('✅ 通过 - 进程信息完整');
                        console.log(`   PID: ${proc.pid}, 命令：${proc.command}`);
                        passed++;
                    } else {
                        console.log('❌ 失败 - 缺少字段:', missingFields);
                        failed++;
                    }
                } else {
                    console.log('❌ 失败 - 无进程信息');
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
