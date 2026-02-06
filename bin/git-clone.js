#!/usr/bin/env node

import ora from 'ora';
import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import https from 'https';

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
 * 检查网络是否可访问
 * @param {string} url - 要检查的 URL
 * @returns {Promise<boolean>} - 是否可访问
 */
async function checkNetwork(url) {
  return new Promise((resolve) => {
    const timeout = 5000; // 5秒超时
    
    const req = https.get(url, {
      timeout: timeout
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}



/**
 * 获取可用的仓库 URL
 * @param {string} repo - 原始仓库地址
 * @param {string} mirror - 指定的镜像站点 (kgithub 或 ghproxy)
 * @returns {Promise<string>} - 可用的仓库地址
 */
async function getAvailableRepoUrl(repo, mirror) {
  try {
    // 解析仓库 URL
    const parsed = parseGitUrl(repo);
    
    // 如果用户指定了镜像站点，直接使用
    if (mirror) {
      console.log(`使用指定的 ${mirror} 镜像...`);
      if (mirror === 'kkgithub') {
        return `https://kkgithub.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'ghproxy') {
        return `https://ghproxy.com/github.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'ghapi') {
        return `https://gh.api.99988866.xyz/https://github.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'gitclone') {
        return `https://gitclone.com/https://github.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'yumenaka') {
        return `https://git.yumenaka.net/https://github.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'ghproxynet') {
        return `https://ghproxy.net/https://github.com/${parsed.owner}/${parsed.repo}`;
      }
    }
    
    // 检查 GitHub 是否可访问
    const isGithubAccessible = await checkNetwork('https://github.com');
    
    if (isGithubAccessible) {
      return repo;
    }
    
    // GitHub 不可访问，尝试镜像站点
    console.log('GitHub 不可访问，尝试使用镜像站点...');
    
    // 构建镜像站点 URL
    const kkgithubUrl = `https://kkgithub.com/${parsed.owner}/${parsed.repo}`;
    const ghproxyUrl = `https://ghproxy.com/github.com/${parsed.owner}/${parsed.repo}`;
    
    // 检查 kkgithub.com 是否可访问
    const isKkgithubAccessible = await checkNetwork('https://kkgithub.com');
    if (isKkgithubAccessible) {
      console.log('使用 kkgithub.com 镜像...');
      return kkgithubUrl;
    }
    
    // 检查 ghproxy.com 是否可访问
    const isGhproxyAccessible = await checkNetwork('https://ghproxy.com');
    if (isGhproxyAccessible) {
      console.log('使用 ghproxy.com 镜像...');
      return ghproxyUrl;
    }
    
    // 尝试 gh.api.99988866.xyz 镜像
    const ghApiUrl = `https://gh.api.99988866.xyz/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGhApiAccessible = await checkNetwork('https://gh.api.99988866.xyz');
    if (isGhApiAccessible) {
      console.log('使用 gh.api.99988866.xyz 镜像...');
      return ghApiUrl;
    }
    
    // 尝试 gitclone.com 镜像
    const gitcloneUrl = `https://gitclone.com/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGitcloneAccessible = await checkNetwork('https://gitclone.com');
    if (isGitcloneAccessible) {
      console.log('使用 gitclone.com 镜像...');
      return gitcloneUrl;
    }
    
    // 尝试 git.yumenaka.net 镜像
    const yumenakaUrl = `https://git.yumenaka.net/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isYumenakaAccessible = await checkNetwork('https://git.yumenaka.net');
    if (isYumenakaAccessible) {
      console.log('使用 git.yumenaka.net 镜像...');
      return yumenakaUrl;
    }
    
    // 尝试 ghproxy.net 镜像
    const ghproxyNetUrl = `https://ghproxy.net/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGhproxyNetAccessible = await checkNetwork('https://ghproxy.net');
    if (isGhproxyNetAccessible) {
      console.log('使用 ghproxy.net 镜像...');
      return ghproxyNetUrl;
    }
    
    // 所有镜像站点都不可访问，返回原始 URL
    console.log('所有镜像站点都不可访问，尝试使用原始 URL...');
    return repo;
  } catch (error) {
    // 解析失败，返回原始 URL
    return repo;
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

    // 获取可用的仓库 URL
    const availableRepoUrl = await getAvailableRepoUrl(repo, options.mirror);

    // 使用 child_process 执行真实的 git clone 命令
    // 默认使用 --depth 1 只克隆最新的提交
    const depth = options.depth || 1;
    const cloneCommand = `git clone ${options.singleBranch ? '--single-branch' : ''} --depth ${depth} ${options.branch ? `-b ${options.branch}` : ''} ${availableRepoUrl} "${targetDir}"`;

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
  .option('--mirror <mirror>', 'Specify mirror site to use (kkgithub, ghproxy, ghapi, gitclone, yumenaka or ghproxynet)', ['kkgithub', 'ghproxy', 'ghapi', 'gitclone', 'yumenaka', 'ghproxynet'])
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
        depth: options.depth ? parseInt(options.depth) : undefined,
        mirror: options.mirror
      });
    } catch (error) {
      console.error(`Failed to clone repository: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();