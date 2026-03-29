import { execSync } from 'child_process';
import dayjs from 'dayjs';

/**
 * 获取 Git 远程仓库信息
 * @returns {Promise<{platform: string, url: string, repoPath: string} | null>}
 */
export async function getRemoteRepoInfo() {
  try {
    // 获取远程 origin URL
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // 解析仓库信息
    let platform = 'github';
    let repoPath = '';
    let baseUrl = '';

    if (remoteUrl.includes('github.com')) {
      platform = 'github';
      baseUrl = 'https://github.com';
    } else if (remoteUrl.includes('gitlab.com')) {
      platform = 'gitlab';
      baseUrl = 'https://gitlab.com';
    } else if (remoteUrl.includes('gitee.com')) {
      platform = 'gitee';
      baseUrl = 'https://gitee.com';
    } else if (remoteUrl.includes('bitbucket.org')) {
      platform = 'bitbucket';
      baseUrl = 'https://bitbucket.org';
    } else {
      // 尝试从 URL 推断
      const match = remoteUrl.match(/@([\w.]+):(.+?)(?:\.git)?$/);
      if (match) {
        platform = match[1];
        repoPath = match[2];
      }
    }

    // 提取仓库路径 (user/repo)
    if (!repoPath) {
      const httpsMatch = remoteUrl.match(/https:\/\/[\w.]+\/(.+?)(?:\.git)?$/);
      const sshMatch = remoteUrl.match(/:(.+?)(?:\.git)?$/);
      repoPath = (httpsMatch || sshMatch || [])[1] || '';
    }

    // 移除 .git 后缀
    repoPath = repoPath.replace(/\.git$/, '');

    return {
      platform,
      url: baseUrl || `https://${platform}`,
      repoPath,
      fullUrl: `${baseUrl || `https://${platform}`}/${repoPath}`
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取 Git 仓库统计信息
 * @returns {Promise<{firstCommit: string, totalCommits: number, contributors: number, branches: number}>}
 */
export async function getRepoStats() {
  try {
    // 首次提交时间
    const firstCommitRaw = execSync('git log --reverse --format=%ci | head -n 1', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    const firstCommit = firstCommitRaw ? dayjs(firstCommitRaw).format('YYYY-MM-DD') : '未知';

    // 总提交数
    const totalCommits = parseInt(
      execSync('git rev-list --count HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 贡献者人数
    const contributors = parseInt(
      execSync('git log --format=%aN | sort -u | wc -l', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 分支数
    const branches = parseInt(
      execSync('git branch | wc -l', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 当前分支
    const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim() || 'main';

    return {
      firstCommit,
      totalCommits,
      contributors,
      branches,
      currentBranch
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取当前 Git 用户信息
 * @returns {{name: string, email: string}}
 */
export function getCurrentGitUser() {
  try {
    const name = execSync('git config user.name', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    const email = execSync('git config user.email', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    return { name, email };
  } catch (error) {
    return { name: '', email: '' };
  }
}

/**
 * 获取 Git 分支列表
 * @returns {Promise<Array>}
 */
export async function getBranches() {
  try {
    const branchesRaw = execSync('git branch -a', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    const branches = branchesRaw.split('\n').map(line => {
      const trimmed = line.trim();
      const isCurrent = trimmed.startsWith('*');
      const name = trimmed.replace(/^\*\s*/, '').replace(/^remotes\/origin\//, '');
      return {
        name,
        isCurrent,
        isRemote: line.includes('remotes/')
      };
    });
    
    return branches;
  } catch (error) {
    return [];
  }
}

/**
 * 获取 Git 标签列表
 * @returns {Promise<Array>}
 */
export async function getTags() {
  try {
    const tagsRaw = execSync('git tag', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    if (!tagsRaw) return [];

    return tagsRaw.split('\n').map(tag => ({ name: tag }));
  } catch (error) {
    return [];
  }
}

/**
 * 获取最近的提交用户列表（按提交次数排序）
 * @param {number} limit - 返回用户数量限制，默认 10
 * @returns {Promise<Array>} - 用户列表，包含 name、email、commitCount
 */
export async function getRecentGitUsers(limit = 10) {
  try {
    // 获取所有提交的作者信息，按出现次数排序
    const usersRaw = execSync(`git log --format='%an|%ae' | sort | uniq -c | sort -rn | head -n ${limit}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    if (!usersRaw) return [];

    const users = usersRaw.split('\n').map(line => {
      // 格式：count name|email
      const trimmed = line.trim();
      const match = trimmed.match(/^(\d+)\s+(.+)\|(.+)$/);
      if (match) {
        return {
          name: match[2],
          email: match[3],
          commitCount: parseInt(match[1])
        };
      }
      return null;
    }).filter(Boolean);

    return users;
  } catch (error) {
    return [];
  }
}
