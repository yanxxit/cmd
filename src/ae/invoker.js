/**
 * 云函数调用器
 * 负责执行云函数并处理结果
 */
import { spawn } from 'child_process';
import { writeDebugParams, writeResult } from './cache.js';

/**
 * 调用云函数
 * @param {string} functionName - 函数名称
 * @param {object} params - 参数对象
 * @param {string} [command='ae'] - 执行命令，默认为 'ae'
 * @returns {Promise<object>} 执行结果
 */
export function invokeCloudFunction(functionName, params = {}, command = 'ae') {
  return new Promise(async (resolve, reject) => {
    try {
      // 写入参数文件
      const paramFilePath = await writeDebugParams(functionName, params);

      const args = ['function', 'dev', functionName];

      // 设置环境变量，传递参数文件路径
      const env = {
        ...process.env,
        MOCKED_PARAMS_PATH: paramFilePath
      };

      const child = spawn(command, args, { env });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', async (code) => {
        if (code !== 0) {
          console.error('命令执行失败，退出码:', code);
          console.error('stderr:', stderr);
          return reject(new Error(`命令执行失败，退出码：${code}`));
        }

        const output = stdout;

        const outputMatch = output.match(/local_cloud_function.result\s*(\{[\s\S]*?\})\s*(?:\n|$)/);

        if (outputMatch) {
          try {
            const jsonStr = outputMatch[1].trim();
            const jsonData = JSON.parse(jsonStr);

            // 写入结果文件
            await writeResult(functionName, params, jsonData);

            resolve(jsonData);
          } catch (parseError) {
            console.error('解析 JSON 失败，原始内容:', outputMatch[1]);
            reject(parseError);
          }
        } else {
          console.error('未找到 local_cloud_function.result 标记，完整输出:', output);
          reject(new Error('未找到 local_cloud_function.result 标记'));
        }
      });

      child.on('error', (error) => {
        console.error('执行命令出错:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  invokeCloudFunction
};
