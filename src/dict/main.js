#!/usr/bin/env node

let { fetch } = require("undici")
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

  // #8c8c8c
  const ColorOutput = chalk.keyword(config.color)
  const result = await fetch(config.getURL(word) + urlencode(word), { method: "GET" })
  const body = await result.text()
  if (config.spinner) {
    spinner.stop(true)
  }

  let out = ColorOutput(Parser.parse(isCN, body, word))
  // console.log(out)

}

module.exports = {
  fanyi
}

