import path from "path";
import fs from "fs";
import { exec } from 'child_process';
import iconv from 'iconv-lite';

let say_engine = `powershell.exe Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 3; $speak.Speak([Console]::In.ReadLine()); exit`;

/**
 * 阅读
 * @param {string} read_line 
 * @returns 
 */
const winSay = (read_line = "") => {
  return new Promise((resolve, reject) => {
    exec(say_engine, () => {
      resolve("ok")
    })
      .stdin.end(iconv.encode(read_line, 'gbk'));
  })
}

const macSay = (read_line = "") => {
  return new Promise((resolve, reject) => {
    exec(`say ${read_line}`, (err) => {
      if (err) return reject(err)
      resolve("ok")
    });
  })
}

const say = async (read_line) => {
  switch (process.platform) {
    case 'win32':
      return await winSay(read_line)
    case 'darwin':
      return await macSay(read_line)
  }
}


export default {
  say
}