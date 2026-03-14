#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import startHttpSniffer, { printCertInstructions, createCertificate } from '../src/http-sniffer/index.js';

program
  .name('http-sniffer')
  .description('HTTP 请求监听工具 - 监听浏览器和系统的 HTTP/HTTPS 请求')
  .version('3.0.0')
  .option('-p, --port <number>', '代理服务器端口', '8080')
  .option('-s, --save', '保存请求记录到文件')
  .option('-m, --method <method>', '按 HTTP 方法过滤 (GET/POST/PUT/DELETE 等)')
  .option('-d, --domain <domain>', '按域名过滤')
  .option('-e, --exclude <domain>', '排除特定域名')
  .option('-f, --format <format>', '输出格式 (text/json)', 'text')
  .option('-H, --har', '导出为 HAR 格式')
  .option('-S, --stats', '显示统计信息')
  .option('-v, --verbose', '显示请求详细信息（请求头、响应头、请求体、响应体）')
  .option('--search <keyword>', '实时搜索关键词，匹配URL、方法、状态码等')
  .option('--min-time <ms>', '只显示响应时间大于指定毫秒的请求')
  .option('--max-time <ms>', '只显示响应时间小于指定毫秒的请求')
  .option('--status <code>', '按状态码过滤 (例如: 200, 404, 500)')
  .option('--status-range <range>', '按状态码范围过滤 (例如: 200-299, 400-499)')
  .option('--mitm', '启用 HTTPS MITM 代理（可以监听 HTTPS 的 Ajax/fetch 请求）')
  .option('--gen-cert', '生成并显示 HTTPS MITM 证书安装说明')
  .action(function () {
    program.params = program.opts();
  });

async function main() {
  program.parse(process.argv);
  const options = program.params || {};
  
  if (options.genCert) {
    (async () => {
      await createCertificate('example.com', true);
      printCertInstructions();
      process.exit(0);
    })();
  } else {
    startHttpSniffer(options);
  }
}

try {
  main();
} catch (err) {
  console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
  console.error(err);
  process.exit(1);
}
