#!/usr/bin/env node

import ora from 'ora';
import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

/**
 * 解析 Git URL 并提取仓库信息
 * @param {string} url - Git 仓库 URL
 * @returns {object} - 包含 owner 和 repo 名称的对象
 */
function parseGitUrl(url) {
  // 支持 HTTPS 和 SSH 格式的 URL
  const httpsRegex = /^https:\/\/([^\/]+)\/([^\/]+)\/(.+?)(?:\.git)?$/;
  const sshRegex = /^git@([^:]+):([^\/]+)\/(.+?)(?:\.git)?$/;
  const githubShorthandRegex = /^([\w-]+)\/([\w-]+)$/;

  if (httpsRegex.test(url)) {
    const match = url.match(httpsRegex);
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      protocol: 'https'
    };
  } else if (sshRegex.test(url)) {
    const match = url.match(sshRegex);
    return {
      host: match[1],
      owner: match[2],
      repo: match[3],
      protocol: 'ssh'
    };
  } else if (githubShorthandRegex.test(url)) {
    const match = url.match(githubShorthandRegex);
    return {
      host: 'github.com',
      owner: match[1],
      repo: match[2],
      protocol: 'https'
    };
  } else {
    throw new Error('Invalid Git URL format');
  }
}

/**
 * 验证仓库路径是否有效
 * @param {string} repoPath - 仓库路径
 * @returns {boolean} - 是否有效
 */
async function validateRepo(repoPath) {
  try {
    // 尝试解析 URL 以验证格式
    parseGitUrl(repoPath);

    // 如果是本地路径，检查是否存在
    if (repoPath.startsWith('./') || repoPath.startsWith('../') || repoPath.startsWith('/')) {
      const stats = await fs.stat(repoPath);
      return stats.isDirectory();
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 克隆仓库到指定目录
 * @param {string} repo - 仓库地址
 * @param {string} dest - 目标目录
 * @param {object} options - 克隆选项
 */
async function cloneRepo(repo, dest, options = {}) {
  const spinner = ora({
    text: `Cloning repository ${repo}...`,
    spinner: 'clock'
  });

  spinner.start();

  try {
    // 确定目标目录名（如果未指定则使用仓库名）
    const targetDir = dest || path.basename(repo, '.git');

    // 检查目标目录是否已存在
    try {
      await fs.access(targetDir);
      throw new Error(`Directory ${targetDir} already exists.`);
    } catch (accessError) {
      // 目录不存在，可以继续
      if (accessError.code !== 'ENOENT') {
        // 如果错误不是因为目录不存在，则抛出错误
        throw accessError;
      }
    }

    // 首先尝试解析仓库 URL
    const parsed = parseGitUrl(repo);

    // 使用 child_process 执行真实的 git clone 命令
    const cloneCommand = `git clone ${options.singleBranch ? '--single-branch' : ''} ${options.depth ? `--depth ${options.depth}` : ''} ${options.branch ? `-b ${options.branch}` : ''} ${repo} "${targetDir}"`;

    // 执行克隆命令
    execSync(cloneCommand, { stdio: 'inherit' });

    spinner.succeed(`Repository cloned successfully to ${targetDir}`);
  } catch (error) {
    spinner.fail(`Clone failed: ${error.message}`);
    console.error(`Error details: ${error.stderr || error}`);
    throw error;
  }
}

// 配置 Commander.js 以定义 CLI 接口
program
  .name('x-git-clone')
  .description('A custom git clone tool built with Node.js')
  .version('1.0.0')
  .argument('<repository>', 'Git repository URL or shorthand (owner/repo)')
  .argument('[destination]', 'Destination directory path')
  .option('-b, --branch <branch>', 'Clone a specific branch')
  .option('--single-branch', 'Clone only the history leading to the tip of a single branch')
  .option('-d, --depth <depth>', 'Create a shallow clone with a history truncated to the specified number of commits')
  .action(async (repository, destination, options) => {
    try {
      // 检查是否安装了 git
      try {
        execSync('git --version', { stdio: 'pipe' });
      } catch (error) {
        console.error('Git is not installed or not in PATH. Please install Git before using this tool.');
        process.exit(1);
      }

      // 解析仓库 URL
      parseGitUrl(repository);

      // 执行克隆操作
      await cloneRepo(repository, destination, {
        branch: options.branch,
        singleBranch: options.singleBranch,
        depth: options.depth ? parseInt(options.depth) : undefined
      });
    } catch (error) {
      console.error(`Failed to clone repository: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();