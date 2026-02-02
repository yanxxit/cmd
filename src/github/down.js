import { promisify } from 'util';
import downloadGitRepo from 'download-git-repo';
import ora from 'ora';

const down = promisify(downloadGitRepo);

export const clone = async function (repo, desc) {
  const progress = ora(`下载中...${repo}`);
  progress.start();
  await down(repo, desc).then(() => {
    progress.succeed("项目创建成功")
  }).catch(error => {
    console.error(error);
    progress.failed()
  });
}