#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';

/**
 * 测试 git clone 工具的功能
 */

console.log('Testing x-git-clone command...');

async function runTest() {
  // 测试1: 检查命令是否存在
  try {
    const testProcess = spawn('node', ['./bin/git-clone.js', '--help']);
    
    let output = '';
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Help command executed successfully');
        console.log(output.substring(0, 200) + '...');
      } else {
        console.log('✗ Help command failed with code:', code);
      }
    });
    
    // 等待进程结束
    await setTimeout(2000);
    
    // 测试2: 尝试克隆一个公开的测试仓库
    console.log('\nTesting clone functionality with a sample repository...');
    
    // 使用一个小型的公共仓库进行测试
    const testRepo = 'https://github.com/iliakan/javascript-tutorial-en.git';
    const testDir = './test-clone-output';
    
    try {
      // 清理可能存在的旧测试目录
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch(e) {
        // 忽略删除错误
      }
      
      // 执行克隆命令
      const cloneProcess = spawn('node', ['./bin/git-clone.js', testRepo, testDir]);
      
      cloneProcess.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      cloneProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      cloneProcess.on('close', async (code) => {
        if (code === 0) {
          console.log('✓ Clone command executed successfully');
          
          // 验证目录是否已创建
          try {
            const stats = await fs.stat(testDir);
            if (stats.isDirectory()) {
              console.log('✓ Target directory created successfully');
              
              // 检查是否有 .git 目录
              const gitDir = path.join(testDir, '.git');
              try {
                const gitStats = await fs.stat(gitDir);
                if (gitStats.isDirectory()) {
                  console.log('✓ .git directory found');
                } else {
                  console.log('⚠ .git directory not found');
                }
              } catch (e) {
                console.log('⚠ .git directory error:', e.message);
              }
            } else {
              console.log('✗ Target directory was not created');
            }
          } catch (e) {
            console.log('✗ Failed to verify target directory:', e.message);
          }
          
          // 清理测试目录
          try {
            await fs.rm(testDir, { recursive: true, force: true });
            console.log('✓ Cleaned up test directory');
          } catch (e) {
            console.log('⚠ Could not clean up test directory:', e.message);
          }
        } else {
          console.log('✗ Clone command failed with code:', code);
        }
      });
    } catch (e) {
      console.log('✗ Test setup failed:', e.message);
    }
  } catch (e) {
    console.log('✗ Command execution failed:', e.message);
  }
}

// 运行测试
runTest().catch(console.error);