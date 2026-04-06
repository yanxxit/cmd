import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import https from 'https';

/**
 * 解析 Git URL 并提取仓库信息
 * @param {string} url - Git 仓库 URL
 * @returns {object} - 包含 owner 和 repo 名称的对象
 */
export function parseGitUrl(url) {
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
export async function validateRepo(repoPath) {
  try {
    parseGitUrl(repoPath);

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
export async function checkNetwork(url) {
  return new Promise((resolve) => {
    const timeout = 5000;
    
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
 * @param {string} mirror - 指定的镜像站点
 * @returns {Promise<string>} - 可用的仓库地址
 */
export async function getAvailableRepoUrl(repo, mirror) {
  try {
    const parsed = parseGitUrl(repo);
    
    if (mirror) {
      console.log(`使用指定的 ${mirror} 镜像...`);
      if (mirror === 'kkgithub') {
        return `https://kkgithub.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'ghproxy') {
        return `https://ghproxy.com/github.com/${parsed.owner}/${parsed.repo}`;
      } else if (mirror === 'gitee') {
        return `https://gitee.com/mirrors/${parsed.repo}`;
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
    
    const isGithubAccessible = await checkNetwork('https://github.com');
    
    if (isGithubAccessible) {
      return repo;
    }
    
    console.log('GitHub 不可访问，尝试使用镜像站点...');
    
    console.log('尝试使用 Gitee 镜像...');
    const giteeUrl = `https://gitee.com/mirrors/${parsed.repo}`;
    const isGiteeAccessible = await checkNetwork('https://gitee.com');
    if (isGiteeAccessible) {
      console.log('使用 Gitee 镜像...');
      return giteeUrl;
    }
    
    const kkgithubUrl = `https://kkgithub.com/${parsed.owner}/${parsed.repo}`;
    const ghproxyUrl = `https://ghproxy.com/github.com/${parsed.owner}/${parsed.repo}`;
    
    const isKkgithubAccessible = await checkNetwork('https://kkgithub.com');
    if (isKkgithubAccessible) {
      console.log('使用 kkgithub.com 镜像...');
      return kkgithubUrl;
    }
    
    const isGhproxyAccessible = await checkNetwork('https://ghproxy.com');
    if (isGhproxyAccessible) {
      console.log('使用 ghproxy.com 镜像...');
      return ghproxyUrl;
    }
    
    const ghApiUrl = `https://gh.api.99988866.xyz/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGhApiAccessible = await checkNetwork('https://gh.api.99988866.xyz');
    if (isGhApiAccessible) {
      console.log('使用 gh.api.99988866.xyz 镜像...');
      return ghApiUrl;
    }
    
    const gitcloneUrl = `https://gitclone.com/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGitcloneAccessible = await checkNetwork('https://gitclone.com');
    if (isGitcloneAccessible) {
      console.log('使用 gitclone.com 镜像...');
      return gitcloneUrl;
    }
     
    const yumenakaUrl = `https://git.yumenaka.net/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isYumenakaAccessible = await checkNetwork('https://git.yumenaka.net');
    if (isYumenakaAccessible) {
      console.log('使用 git.yumenaka.net 镜像...');
      return yumenakaUrl;
    }
    
    const ghproxyNetUrl = `https://ghproxy.net/https://github.com/${parsed.owner}/${parsed.repo}`;
    const isGhproxyNetAccessible = await checkNetwork('https://ghproxy.net');
    if (isGhproxyNetAccessible) {
      console.log('使用 ghproxy.net 镜像...');
      return ghproxyNetUrl;
    }
    
    console.log('所有镜像站点都不可访问，尝试使用原始 URL...');
    return repo;
  } catch (error) {
    return repo;
  }
}

/**
 * 克隆仓库到指定目录
 * @param {string} repo - 仓库地址
 * @param {string} dest - 目标目录
 * @param {object} options - 克隆选项
 */
export async function cloneRepo(repo, dest, options = {}) {
  const spinner = ora({
    text: `Cloning repository ${repo}...`,
    spinner: 'clock'
  });

  spinner.start();

  try {
    const targetDir = dest || path.basename(repo, '.git');

    try {
      await fs.access(targetDir);
      throw new Error(`Directory ${targetDir} already exists.`);
    } catch (accessError) {
      if (accessError.code !== 'ENOENT') {
        throw accessError;
      }
    }

    const availableRepoUrl = await getAvailableRepoUrl(repo, options.mirror);

    const depth = options.depth || 1;
    const cloneCommand = `git clone ${options.singleBranch ? '--single-branch' : ''} --depth ${depth} ${options.branch ? `-b ${options.branch}` : ''} ${availableRepoUrl} "${targetDir}"`;

    execSync(cloneCommand, { stdio: 'inherit' });

    spinner.succeed(`Repository cloned successfully to ${targetDir}`);
  } catch (error) {
    spinner.fail(`Clone failed: ${error.message}`);
    console.error(`Error details: ${error.stderr || error}`);
    throw error;
  }
}
