#!/usr/bin/env node

import { fetch } from "undici"
import chalk from 'chalk'
import { Spinner } from 'cli-spinner'
import isChinese from 'is-chinese'
import urlencode from 'urlencode'
import noCase from 'no-case'
import config from './lib/config.js'
import Parser from './lib/parser.js'
import Cache from './lib/cache.js'

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

  // 构建请求 URL
  const url = config.getURL(word) + urlencode(word)

  // 先尝试从缓存中读取数据
  let body = null;
  const cachedData = await Cache.readFromCache(url)

  if (cachedData) {
    // 使用缓存的数据
    body = cachedData.data.body
    console.log(`从缓存读取: ${cachedData.word}`)
  } else {
    // 网络请求获取数据
    const result = await fetch(url, { method: "GET" })
    body = await result.text()

    // 将数据写入缓存
    await Cache.writeToCache(url, { body }, word)
    console.log(`缓存已保存: ${word}`)
  }

  if (config.spinner) {
    spinner.stop(true)
  }

  let out = ColorOutput(Parser.parse(isCN, body, word))
  // console.log(out)

}

export default {
  fanyi
}

