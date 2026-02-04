import * as cheerio from 'cheerio';
import chalk from 'chalk';
import player from 'play-sound';
import logger from '../../util/logger.js';
import sayLib from '../../say.js';
import fs from 'fs/promises';
import path from 'path';
const playerInstance = player({});
import download from 'download';

/**
 * 播放声音
 * https://dict.youdao.com/dictvoice?audio=about&type=1 英
 * @param {string} word
 */
async function say(word = "", isChinese) {
  if (isChinese) {
    sayLib.say(word)
    return
  }
  let filename = `${word}.mp3`;
  const audioPath = `./logs/dict/voice/${filename}`;

  // 检查音频文件是否已经存在
  try {
    await fs.access(audioPath);
    // 如果文件存在，直接播放
    playerInstance.play(audioPath, function (err) {
      if (err) throw err
    });
  } catch (error) {
    // 文件不存在，需要下载
    logger.info(`Downloading audio ${filename} file...`)
    await download(`https://dict.youdao.com/dictvoice?audio=${word}&type=1`, './logs/dict/voice', { filename: filename });
    playerInstance.play(audioPath, function (err) {
      if (err) throw err
    });
  }
}

let parser = {}
parser.parse = function (isChinese, body, word) {
  // 文字：

  const $ = cheerio.load(body)
  console.log()
  let result = ''
  let sentenceSample = ''
  // let st1 = $('div#phrsListTab > h2 > div > span.pronounce > span.phonetic').text().trim()
  // 语法集合
  let phonetics = [];
  // 语音语法
  let phonetic = "";
  let st1 = $('div#phrsListTab > h2 > div > span.pronounce > span.phonetic').each(function (i, elm) {
    let _str = $(this).text().trim();
    phonetics.push(_str)
  })
  phonetics = phonetics.map((str, i) => {
    let lang = "英"
    if (i === 0) phonetic = str
    if (i > 0) lang = "美";
    lang = chalk.hex('#666666').bold(lang)
    return `${lang} ${chalk.hex('#a0a0a0')(str)}`
  })
  // 第一行
  console.log(`™  ${chalk.white(word)}  ${chalk.hex('#bc3fbc')(phonetic)}  ${chalk.hex('#8c8c8c')(` ~  fanyi.youdao.com`)}`)

  say(word, isChinese)

  // 第二行
  console.log(phonetics.join(" "))
  if (isChinese) {
    $('div.trans-container > ul').find('p.wordGroup').each(function (i, elm) {
      let _str = $(this).text().replace(/\s+/g, ' ')
      result += _str
    })
  } else {
    console.log()
    $('div#phrsListTab > div.trans-container > ul').find('li').each(function (i, elm) {
      let _str = $(this).text().replace(/\s+/g, ' ')
      result += _str + '\n'
      console.log(chalk.hex("#0dbc79")(`- ${_str}`))// adv. 大约；几乎；到处，各处；无所事事；周围，在……附近；无序地，凌乱地；朝相反方向
    })
    console.log()
    // phrase 短语
    let m1 = $('div#webPhrase > div.title').text();
    console.log("\n")
    console.log(chalk.hex('#bc3fbc').bold(m1))
    console.log("\n")

    $('div#webPhrase > p.wordGroup').each(function (i, elm) {
      let _str = $(this).text().replace(/\s+/g, ' ').trim()
      console.log(chalk.blue(_str).trim())
      // console.log($(this).find("span.contentTitle > a").text())
      // console.log($(this).find("span.contentTitle > a").attr("href"))
      // console.log($(this).html())
    })

    // 词组短语
    console.log('\n')
    console.log(chalk.hex('#bc3fbc').bold("词组短语"))
    console.log('\n')
    $('#bilingual ul li').find('p').each(function (i, elm) {
      if ($(this).attr('class') !== 'example-via') {
        sentenceSample += $(this).text().trim() + '\n'
        console.log(chalk.blue($(this).text().trim()))// I'm definite about this
      }
    })
  }
  // phrase or sentence
  if (result === '') {
    result = $('div#webPhrase > p.wordGroup').text() !== '' ? $('div#webPhrase > p.wordGroup').text() : $('div#fanyiToggle > div.trans-container > p:nth-child(2)').text()
  }
  // phonetic
  result = $('div#phrsListTab > h2.wordbook-js > div.baav > span').text().replace(/\s+/g, ' ') +
    '\n\n' + result + '\n' + sentenceSample
  return result
}
export default parser
