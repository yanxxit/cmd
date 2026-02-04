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
import History from './lib/history.js'

const fanyi = async function (word, noCache = false) {
  const spinner = new Spinner('努力查询中... %s')

  if (config.spinner) {
    spinner.setSpinnerString('|/-\\')
    spinner.start()
  }

  const isCN = isChinese(word)

  word = isCN ? word : noCase(word)

  // #8c8c8c
  const ColorOutput = chalk.keyword(config.color)

  // 构建请求 URL 针对中文的处理，页面元素发生了变化
  const url = config.getURL(word) + urlencode(word)

  // 先尝试从缓存中读取数据
  let body = null;
  const cachedData = noCache ? null : await Cache.readFromCache(url)

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

  let result = Parser.parse(isCN, body, word)
  let out = ColorOutput(result)
  // console.log(out)

  // 记录历史查询
  await History.writeHistory({ word, result })

  return result
}

async function getHistory(days = 7) {
  const history = await History.readHistory();
  const now = Date.now();
  const daysInMs = days * 24 * 60 * 60 * 1000;
  
  // 过滤出最近几天的记录
  const recentHistory = history.filter(item => now - item.updateTime <= daysInMs);
  
  if (recentHistory.length === 0) {
    console.log('最近', days, '天没有查询记录');
    return;
  }
  
  console.log('\n最近', days, '天的查询记录：\n');
  
  recentHistory.forEach((item, index) => {
    const createDate = new Date(item.timestamp).toLocaleString();
    const updateDate = new Date(item.updateTime).toLocaleString();
    
    console.log(chalk.white.bold(`${index + 1}. ${item.word}`));
    console.log(chalk.gray(`   创建时间: ${createDate}`));
    console.log(chalk.gray(`   更新时间: ${updateDate}`));
    console.log(chalk.gray(`   查询次数: ${item.count || 1}`));
    console.log(chalk.gray(`   结果: ${item.result.substring(0, 50)}...`));
    console.log('');
  });
}

async function exportHistory(outputPath) {
  try {
    const exportPath = await History.exportToJSON(outputPath);
    console.log(`\n历史记录已成功导出到：${exportPath}`);
  } catch (error) {
    console.error('导出历史记录失败:', error.message);
  }
}

async function generateLearningHistory(outputPath) {
  try {
    const exportPath = await History.generateMarkdown(outputPath);
    console.log(`\n学习记录已成功生成为 Markdown 文件：${exportPath}`);
  } catch (error) {
    console.error('生成学习记录失败:', error.message);
  }
}

async function generateLearningHTML(outputPath) {
  try {
    const exportPath = await History.generateHTML(outputPath);
    console.log(`\n学习记录已成功生成为 HTML 文件：${exportPath}`);
  } catch (error) {
    console.error('生成 HTML 学习记录失败:', error.message);
  }
}

async function generateLearningHTMLWithEJS(templatePath) {
  try {
    const exportPath = await History.generateHTMLWithEJS(undefined, templatePath);
    console.log(`\n使用 EJS 模板学习记录已成功生成为 HTML 文件：${exportPath}`);
  } catch (error) {
    console.error('使用 EJS 模板生成 HTML 学习记录失败:', error.message);
  }
}

export default {
  fanyi,
  getHistory,
  exportHistory,
  generateLearningHistory,
  generateLearningHTML,
  generateLearningHTMLWithEJS
}

