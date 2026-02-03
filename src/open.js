import child_process from 'child_process'

/**
 * 打开 URL
 * @param {string} url - 要打开的 URL
 * @returns {Promise<void>} - 一个 Promise，在 URL 成功打开后解析
 */
export const openURL = function (url) {
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

/**
 * 打开文件或目录
 * @param {string} url - 要打开的文件或目录路径
 * @returns {Promise<void>} - 一个 Promise，在文件或目录成功打开后解析
 */
export const openFiles = function (url) {
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
