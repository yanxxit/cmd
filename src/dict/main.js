#!/usr/bin/env node

import { fetch } from "undici"
import chalk from 'chalk'
import { Spinner } from 'cli-spinner'
import isChinese from 'is-chinese'
import urlencode from 'urlencode'
import noCase from 'no-case'
import config from './lib/config.js'
import Parser from './lib/parser.js'

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

export default {
  fanyi
}

