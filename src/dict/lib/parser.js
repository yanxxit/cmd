import * as cheerio from 'cheerio';
import chalk from 'chalk';
import player from 'play-sound';
const playerInstance = player({});
import download from 'download';
// console.log(chalk.blue('Hello world!'))

/**
 * 播放声音
 * https://dict.youdao.com/dictvoice?audio=about&type=1 英
 * @param {string} word 
 */
async function say(word = "") {
  let filename = `${word}.mp3`;
  await download(`https://dict.youdao.com/dictvoice?audio=${word}&type=1`, './voice', { filename: filename });
  playerInstance.play(`./voice/${filename}`, function (err) {
    if (err) throw err
  })
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

  say(word)
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
    console.log("\n", m1, "\n")

    $('div#webPhrase > p.wordGroup').each(function (i, elm) {
      let _str = $(this).text().replace(/\s+/g, ' ')
      console.log(_str)
      // console.log($(this).find("span.contentTitle > a").text())
      // console.log($(this).find("span.contentTitle > a").attr("href"))
      // console.log($(this).html())
    })

    // 词组短语
    console.log("\n词组短语\n")
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
