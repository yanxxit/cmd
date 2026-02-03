import child_process from 'child_process'

/**
 * 打开 URL 或文件/目录
 * @param {string} url - 要打开的 URL 或文件/目录路径（为空时打开当前目录）
 * @returns {Promise<void>} - 一个 Promise，在成功打开后解析
 */
export const openURL = function (url) {
  // 当 url 为空时，打开当前目录
  if (!url) {
    url = process.cwd();
  }
  
  return new Promise((resolve, reject) => {
    var cmd = ''
    switch (process.platform) {
      case 'win32':
        cmd = 'start'
        child_process.exec(cmd + ' ' + url, (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
        break

      case 'darwin':
        cmd = 'open'
        child_process.exec(cmd + ' ' + url, (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
        break
    }
  })
}


