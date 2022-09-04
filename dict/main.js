#!/usr/bin/env node

const request = require('request')
const chalk = require('chalk')
const Spinner = require('cli-spinner').Spinner
const isChinese = require('is-chinese')
const urlencode = require('urlencode')
const noCase = require('no-case')
const config = require('./lib/config')
const Parser = require('./lib/parser')

const fanyi = async function (word) {
  const spinner = new Spinner('努力查询中... %s')

  if (config.spinner) {
    spinner.setSpinnerString('|/-\\')
    spinner.start()
  }

  const isCN = isChinese(word)

  word = isCN ? word : noCase(word)

  const options = {
    'url': config.getURL(word) + urlencode(word),
    'proxy': config.proxy || null
  }

  console.log(options)
  // #8c8c8c

  const ColorOutput = chalk.keyword(config.color)
  request(options, (error, response, body) => {
    if (error) {
      console.error(error)
    }

    if (config.spinner) {
      spinner.stop(true)
    }

    let out = ColorOutput(Parser.parse(isCN, body, word))
    // console.log(out)
  })

}

module.exports = {
  fanyi
}

