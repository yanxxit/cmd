import express from 'express';
import AIHarness from '../harness/index.js';

const router = express.Router();

function buildDevSystemPrompt() {
  return [
    '你是一个资深开发助手，正在协助用户在本地 Web IDE 中进行开发。',
    '请优先给出可直接执行的建议，聚焦当前文件、当前项目上下文和下一步改造方案。',
    '输出要求：',
    '1. 先给结论和建议。',
    '2. 如果发现风险，明确指出。',
    '3. 如果可以，给出简短可执行步骤。',
    '4. 保持中文，避免空话。'
  ].join('\n');
}

function buildDevUserPrompt(payload = {}) {
  const {
    prompt = '',
    rootDirectory = '',
    openTabs = [],
    currentFile = null,
  } = payload;

  const fileSection = currentFile
    ? [
        `当前文件: ${currentFile.name || 'unknown'}`,
        `语言: ${currentFile.language || 'plaintext'}`,
        '文件内容:',
        '```',
        String(currentFile.content || '').slice(0, 12000),
        '```'
      ].join('\n')
    : '当前暂无打开文件。';

  return [
    '请基于以下 IDE 上下文提供开发支持。',
    `项目根目录: ${rootDirectory || 'unknown'}`,
    `已打开标签: ${(openTabs || []).map((tab) => tab.name).join(', ') || '无'}`,
    fileSection,
    '',
    '用户请求:',
    prompt || '请分析当前上下文，并给出下一步开发建议。'
  ].join('\n');
}

router.get('/health', async (_req, res) => {
  try {
    const harness = new AIHarness();
    await harness.init();
    res.json({ success: true, message: 'Harness 已就绪' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Harness 初始化失败'
    });
  }
});

router.post('/dev', async (req, res) => {
  try {
    const payload = req.body || {};
    const harness = new AIHarness({
      model: payload.model || 'hunyuan-lite',
      temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.4,
      maxTokens: Number.isInteger(payload.maxTokens) ? payload.maxTokens : 2048
    });

    const answer = await harness.ask(
      buildDevUserPrompt(payload),
      payload.systemPrompt || buildDevSystemPrompt()
    );

    res.json({
      success: true,
      data: {
        answer
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Harness 调用失败'
    });
  }
});

export default router;
