/**
 * Web IDE Lite v2 - Harness 开发模式操作
 */

function createMessage(role, content, meta = {}) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    meta,
    createdAt: new Date().toISOString()
  };
}

function getHarnessParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    enabled: params.get('harness') === '1',
    autoRun: params.get('autoHarness') === '1',
    prompt: params.get('prompt') || ''
  };
}

function getOpenTabs(state) {
  return (state.openTabs.value || []).map((tab) => ({
    id: tab.id,
    name: tab.name
  }));
}

function getCurrentFilePayload(state) {
  const currentFile = state.currentFile.value;
  if (!currentFile) {
    return null;
  }

  return {
    id: currentFile.id,
    name: currentFile.name,
    language: state.currentLanguage.value || currentFile.language || 'plaintext',
    content: state.editorContent.value || currentFile.content || ''
  };
}

export function createHarnessActions(state, showToast) {
  const initHarnessMode = () => {
    if (state.harnessBootstrapped.value) {
      return;
    }

    const params = getHarnessParams();
    state.harnessEnabled.value = params.enabled;
    state.harnessVisible.value = params.enabled;
    state.harnessAutoRun.value = params.autoRun;
    if (params.prompt) {
      state.harnessPrompt.value = params.prompt;
    }

    if (params.enabled) {
      state.harnessMessages.value = [
        createMessage(
          'assistant',
          'Harness 开发模式已开启。打开文件后可立即分析，也可以直接输入你的开发目标。'
        )
      ];
    }

    state.harnessBootstrapped.value = true;
  };

  const toggleHarnessPanel = () => {
    if (!state.harnessEnabled.value) {
      state.harnessEnabled.value = true;
    }
    state.harnessVisible.value = !state.harnessVisible.value;
  };

  const appendHarnessMessage = (role, content, meta = {}) => {
    state.harnessMessages.value.push(createMessage(role, content, meta));
  };

  const runHarness = async (promptOverride = '', options = {}) => {
    const prompt = (promptOverride || state.harnessPrompt.value || '').trim();
    if (!prompt) {
      showToast('⚠️ 请输入 Harness 提示词', 'warning');
      return;
    }

    state.harnessVisible.value = true;
    state.harnessLoading.value = true;

    appendHarnessMessage('user', prompt, {
      auto: Boolean(options.auto),
      fileName: state.currentFile.value?.name || ''
    });

    try {
      const response = await fetch('/api/harness/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          rootDirectory: state.rootDirectory.value,
          openTabs: getOpenTabs(state),
          currentFile: getCurrentFilePayload(state)
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Harness 调用失败');
      }

      appendHarnessMessage('assistant', result.data.answer, {
        auto: Boolean(options.auto)
      });
    } catch (error) {
      appendHarnessMessage('assistant', `调用失败：${error.message}`, {
        error: true
      });
      showToast(`❌ ${error.message}`, 'error');
    } finally {
      state.harnessLoading.value = false;
    }
  };

  const runHarnessFromPrompt = async () => {
    await runHarness();
  };

  const handleFileOpened = async (file) => {
    if (!state.harnessAutoRun.value || !file) {
      return;
    }

    if (state.harnessLastAutoFileId.value === file.id) {
      return;
    }

    state.harnessLastAutoFileId.value = file.id;
    const prompt = `请进入开发模式，分析当前打开的文件 "${file.name}"，给出改造建议、风险点和最推荐的下一步。`;
    await runHarness(prompt, { auto: true });
  };

  const autoRunHarnessOnReady = async () => {
    if (!state.harnessEnabled.value || !state.harnessAutoRun.value) {
      return;
    }

    if (state.currentFile.value) {
      await handleFileOpened(state.currentFile.value);
      return;
    }

    if (state.harnessMessages.value.length <= 1) {
      await runHarness('请进入开发模式，基于当前项目上下文先给出启动建议和推荐操作顺序。', {
        auto: true
      });
    }
  };

  return {
    initHarnessMode,
    toggleHarnessPanel,
    runHarness,
    runHarnessFromPrompt,
    handleFileOpened,
    autoRunHarnessOnReady
  };
}
