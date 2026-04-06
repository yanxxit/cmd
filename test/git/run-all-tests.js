#!/usr/bin/env node

import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 运行所有 Git 命令测试
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Running all Git command tests...'));
console.log(chalk.cyan('='.repeat(60)) + '\n');

const testFiles = [
  'git.test.js',
  'git-clone.test.js',
  'git-commit.test.js',
  'git-log.test.js',
  'git-log-server.test.js',
  'git-sparse.test.js'
];

let totalPassed = 0;
let totalFailed = 0;

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    
    console.log(chalk.yellow(`\nRunning ${testFile}...`));
    console.log(chalk.gray('-'.repeat(60)));
    
    const testProcess = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ file: testFile, passed: true });
      } else {
        resolve({ file: testFile, passed: false, code });
      }
    });

    testProcess.on('error', (error) => {
      console.error(chalk.red(`Error running ${testFile}:`, error));
      resolve({ file: testFile, passed: false, error: error.message });
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();
  
  for (const testFile of testFiles) {
    try {
      const result = await runTest(testFile);
      if (result.passed) {
        totalPassed++;
        console.log(chalk.green(`✓ ${testFile} passed`));
      } else {
        totalFailed++;
        console.log(chalk.red(`✗ ${testFile} failed (code: ${result.code || 'error'})`));
      }
    } catch (error) {
      totalFailed++;
      console.log(chalk.red(`✗ ${testFile} error:`, error.message));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + chalk.cyan('='.repeat(60)));
  console.log(chalk.cyan('Test Summary:'));
  console.log(chalk.green(`✓ Passed: ${totalPassed}`));
  console.log(chalk.red(`✗ Failed: ${totalFailed}`));
  console.log(chalk.gray(`Duration: ${duration}s`));
  console.log(chalk.cyan('='.repeat(60)));
  
  if (totalFailed > 0) {
    console.log(chalk.yellow('\nSome tests failed. Please check the output above.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\nAll tests passed! ✓'));
  }
}

runAllTests().catch((error) => {
  console.error(chalk.red('Test runner error:'), error);
  process.exit(1);
});
