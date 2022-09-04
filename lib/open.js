const child_process = require('child_process')

const open = function (url) {
  var cmd = ''
  switch (process.platform) {
    case 'win32':
      cmd = 'start'
      child_process.exec(cmd + ' ' + url)
      break

    case 'darwin':
      cmd = 'open'
      child_process.exec(cmd + ' ' + url)
      break
  }
}

module.exports = {
  open
}