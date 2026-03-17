// ========== 计算稿纸应用 - 以草稿为核心 ==========

/**
 * 草稿计算器类
 */
class DraftCalculator {
  constructor() {
    // 草稿行数组
    this.draftRows = [];
    // 当前活跃行索引
    this.activeRowIndex = 0;
    // 计算历史
    this.history = [];
    // 键盘展开状态
    this.isKeysExpanded = false;
    // 变量存储（用于草稿中的变量引用）
    this.variables = {};
    // 最后计算结果
    this.lastResult = null;

    // 常用公式
    this.formulas = {
      math: [
        { name: '一元二次方程求根公式', expression: 'x = (-b ± √(b²-4ac)) / 2a' },
        { name: '等差数列求和', expression: 'Sₙ = n(a₁ + aₙ) / 2' },
        { name: '等比数列求和', expression: 'Sₙ = a₁(1 - qⁿ) / (1 - q)' },
        { name: '三角恒等式', expression: 'sin²θ + cos²θ = 1' },
        { name: '对数换底公式', expression: 'logₐb = logₑb / logₑa' },
        { name: '阶乘公式', expression: 'n! = n × (n-1) × ... × 1' },
        { name: '平方差公式', expression: 'a² - b² = (a+b)(a-b)' },
        { name: '完全平方公式', expression: '(a+b)² = a² + 2ab + b²' }
      ],
      physics: [
        { name: '牛顿第二定律', expression: 'F = ma' },
        { name: '动能公式', expression: 'Eₖ = ½mv²' },
        { name: '重力势能', expression: 'Eₚ = mgh' },
        { name: '万有引力', expression: 'F = G(m₁m₂) / r²' },
        { name: '欧姆定律', expression: 'V = IR' },
        { name: '功率公式', expression: 'P = W/t' },
        { name: '速度公式', expression: 'v = s/t' },
        { name: '加速度公式', expression: 'a = Δv/Δt' }
      ],
      geometry: [
        { name: '圆面积', expression: 'S = πr²' },
        { name: '圆周长', expression: 'C = 2πr' },
        { name: '三角形面积', expression: 'S = ½bh' },
        { name: '矩形面积', expression: 'S = lw' },
        { name: '球体积', expression: 'V = ⁴/₃πr³' },
        { name: '圆柱体积', expression: 'V = πr²h' },
        { name: '圆锥体积', expression: 'V = ⅓πr²h' },
        { name: '勾股定理', expression: 'a² + b² = c²' }
      ]
    };

    // DOM 元素缓存
    this.elements = {};

    // 初始化
    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    this.cacheElements();
    this.bindEvents();
    this.loadTheme();
    this.loadKeysState();
    this.loadDraftState(); // 加载草稿状态
    await this.loadHistory();
    this.loadScratchPad();
    this.renderFormulas('math');
    this.renderDraftRows();
    this.updateStats();
  }

  /**
   * 缓存 DOM 元素
   */
  cacheElements() {
    this.elements = {
      // 主题切换
      themeToggle: document.getElementById('themeToggle'),

      // 草稿区域
      draftRows: document.getElementById('draftRows'),
      draftStats: document.getElementById('draftStats'),

      // 键盘切换
      toggleKeysBtn: document.getElementById('toggleKeysBtn'),
      functionKeys: document.getElementById('functionKeys'),
      calculatorKeys: document.getElementById('calculatorKeys'),

      // 计算器按键
      numberKeys: document.querySelectorAll('.number-key'),
      operatorKeys: document.querySelectorAll('.operator-key'),
      controlKeys: document.querySelectorAll('.control-key'),
      equalsKey: document.querySelector('.equals-key'),
      fnKeys: document.querySelectorAll('.fn-key'),

      // 草稿纸
      scratchPad: document.getElementById('scratchPad'),
      clearScratch: document.getElementById('clearScratch'),
      copyResult: document.getElementById('copyResult'),

      // 历史记录
      historyList: document.getElementById('historyList'),
      clearHistory: document.getElementById('clearHistory'),

      // 公式
      formulaTabs: document.querySelectorAll('.formula-tab'),
      formulaList: document.getElementById('formulaList'),

      // 快捷操作
      sendToScratch: document.getElementById('sendToScratch'),
      exportHistory: document.getElementById('exportHistory'),
      clearAllDraft: document.getElementById('clearAllDraft'),
      copyAllResults: document.getElementById('copyAllResults'),

      // Toast
      toast: document.getElementById('toast')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 主题切换
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // 键盘切换
    this.elements.toggleKeysBtn.addEventListener('click', () => this.toggleKeys());

    // 数字键
    this.elements.numberKeys.forEach(key => {
      key.addEventListener('click', () => this.inputNumber(key.dataset.key));
    });

    // 运算符
    this.elements.operatorKeys.forEach(key => {
      key.addEventListener('click', () => this.inputOperator(key.dataset.key));
    });

    // 控制键
    this.elements.controlKeys.forEach(key => {
      key.addEventListener('click', () => this.handleControl(key.dataset.key));
    });

    // 等号
    this.elements.equalsKey.addEventListener('click', () => this.calculateCurrentRow());

    // 功能键
    this.elements.fnKeys.forEach(key => {
      key.addEventListener('click', () => this.handleFunction(key.dataset.fn));
    });

    // 草稿纸
    this.elements.clearScratch.addEventListener('click', () => this.clearScratch());
    this.elements.copyResult.addEventListener('click', () => this.copyLastResult());
    this.elements.scratchPad.addEventListener('input', () => this.saveScratchPad());

    // 历史
    this.elements.clearHistory.addEventListener('click', () => this.clearHistory());

    // 公式标签
    this.elements.formulaTabs.forEach(tab => {
      tab.addEventListener('click', () => this.renderFormulas(tab.dataset.category));
    });

    // 快捷操作
    this.elements.sendToScratch.addEventListener('click', () => this.sendToScratch());
    this.elements.exportHistory.addEventListener('click', () => this.exportHistory());
    this.elements.clearAllDraft.addEventListener('click', () => this.clearAllDraftRows());
    this.elements.copyAllResults.addEventListener('click', () => this.copyAllResults());

    // 键盘事件
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // 添加 Vimium 排除类名
    document.body.classList.add('vimiumExcluded');
  }

  /**
   * 加载主题
   */
  loadTheme() {
    const savedTheme = localStorage.getItem('calculator-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('calculator-theme', newTheme);
    this.updateThemeIcon(newTheme);
  }

  /**
   * 更新主题图标
   */
  updateThemeIcon(theme) {
    this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  /**
   * 切换键盘显示
   */
  toggleKeys() {
    this.isKeysExpanded = !this.isKeysExpanded;
    
    this.elements.functionKeys.classList.toggle('collapsed', !this.isKeysExpanded);
    this.elements.calculatorKeys.classList.toggle('collapsed', !this.isKeysExpanded);
    this.elements.toggleKeysBtn.classList.toggle('active', this.isKeysExpanded);
    
    localStorage.setItem('calculator-keys-expanded', this.isKeysExpanded.toString());
  }

  /**
   * 加载键盘状态
   */
  loadKeysState() {
    const saved = localStorage.getItem('calculator-keys-expanded');
    if (saved === 'true') {
      this.isKeysExpanded = true;
      this.elements.functionKeys.classList.remove('collapsed');
      this.elements.calculatorKeys.classList.remove('collapsed');
      this.elements.toggleKeysBtn.classList.add('active');
    }
  }

  /**
   * 加载草稿状态
   */
  loadDraftState() {
    const saved = localStorage.getItem('calculator-draft-rows');
    if (saved) {
      try {
        this.draftRows = JSON.parse(saved);
        const savedActive = localStorage.getItem('calculator-active-row');
        if (savedActive) {
          this.activeRowIndex = parseInt(savedActive);
        }
      } catch (e) {
        // 解析失败，创建默认行
        this.createDefaultDraftRows();
      }
    } else {
      this.createDefaultDraftRows();
    }
  }

  /**
   * 创建默认草稿行
   */
  createDefaultDraftRows() {
    this.draftRows = [];
    for (let i = 0; i < 5; i++) {
      this.draftRows.push({
        id: `row-${Date.now()}-${i}`,
        expression: '',
        result: '',
        note: '',
        createdAt: Date.now()
      });
    }
    this.activeRowIndex = 0;
  }

  /**
   * 保存草稿状态
   */
  saveDraftState() {
    localStorage.setItem('calculator-draft-rows', JSON.stringify(this.draftRows));
    localStorage.setItem('calculator-active-row', this.activeRowIndex.toString());
  }

  /**
   * 创建草稿行
   */
  createDraftRow(expression = '', note = '') {
    const newRow = {
      id: `row-${Date.now()}-${this.draftRows.length}`,
      expression: expression,
      result: '',
      note: note,
      createdAt: Date.now()
    };
    this.draftRows.push(newRow);
    this.activeRowIndex = this.draftRows.length - 1;
    this.renderDraftRows();
    this.saveDraftState();
    this.scrollToBottom();
    return newRow;
  }

  /**
   * 删除草稿行
   */
  deleteDraftRow(index) {
    if (this.draftRows.length <= 1) {
      this.showToast('至少保留一行', 'error');
      return;
    }
    this.draftRows.splice(index, 1);
    if (this.activeRowIndex >= this.draftRows.length) {
      this.activeRowIndex = this.draftRows.length - 1;
    }
    this.renderDraftRows();
    this.saveDraftState();
  }

  /**
   * 清空所有草稿行
   */
  clearAllDraftRows() {
    if (confirm('确定要清空所有草稿行吗？此操作不可恢复。')) {
      this.draftRows = [];
      this.createDefaultDraftRows();
      this.renderDraftRows(); // 重新渲染
      this.showToast('草稿行已清空');
    }
  }

  /**
   * 渲染草稿行
   */
  renderDraftRows() {
    this.elements.draftRows.innerHTML = this.draftRows.map((row, index) => `
      <div class="draft-row ${index === this.activeRowIndex ? 'active' : ''}" data-index="${index}">
        <div class="draft-row-header">
          <span class="row-number">${index + 1}</span>
          <button class="delete-row-btn" data-index="${index}" title="删除此行">×</button>
        </div>
        <div class="draft-row-content">
          <div class="draft-expression-wrapper">
            <input type="text"
                   class="draft-input ${row.result ? 'has-result' : ''}"
                   value="${row.expression}"
                   placeholder="输入表达式，支持引用其他行：#1+#2..."
                   data-index="${index}"
                   autocomplete="off" />
            ${row.note ? `<span class="draft-note">${row.note}</span>` : ''}
          </div>
          <div class="draft-result-wrapper">
            <span class="draft-result ${row.result ? '' : 'empty'}">
              ${row.result ? '= ' + row.result : '等待计算'}
            </span>
            <button class="copy-result-btn" data-index="${index}" title="复制结果">📋</button>
          </div>
        </div>
      </div>
    `).join('');

    // 绑定输入框事件
    this.elements.draftRows.querySelectorAll('.draft-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleDraftInput(e));
      input.addEventListener('keydown', (e) => this.handleDraftKeydown(e));
      input.addEventListener('focus', () => this.focusRow(parseInt(input.dataset.index)));
    });

    // 绑定删除按钮事件
    this.elements.draftRows.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteDraftRow(parseInt(btn.dataset.index));
      });
    });

    // 绑定复制结果按钮事件
    this.elements.draftRows.querySelectorAll('.copy-result-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const row = this.draftRows[index];
        if (row.result) {
          this.copyToClipboard(row.result, '结果已复制');
        }
      });
    });

    // 更新统计
    this.updateStats();
  }

  /**
   * 更新单行结果（不重新渲染整个 DOM）
   */
  updateRowResult(index) {
    const row = this.draftRows[index];
    const rowElement = this.elements.draftRows.querySelector(`.draft-row[data-index="${index}"]`);
    if (!rowElement) return;

    // 更新输入框样式
    const input = rowElement.querySelector('.draft-input');
    if (input) {
      input.classList.toggle('has-result', !!row.result);
    }

    // 更新结果显示
    const resultElement = rowElement.querySelector('.draft-result');
    if (resultElement) {
      if (row.result) {
        resultElement.textContent = '= ' + row.result;
        resultElement.classList.remove('empty');
      } else {
        resultElement.textContent = '等待计算';
        resultElement.classList.add('empty');
      }
    }

    // 更新统计
    this.updateStats();
  }

  /**
   * 聚焦行
   */
  focusRow(index) {
    this.activeRowIndex = index;
    // 只更新行的激活状态，不重新渲染
    this.elements.draftRows.querySelectorAll('.draft-row').forEach((row, i) => {
      row.classList.toggle('active', i === index);
    });
    this.saveDraftState();
  }

  /**
   * 处理草稿行输入
   */
  handleDraftInput(e) {
    const index = parseInt(e.target.dataset.index);
    const value = e.target.value;
    const sanitized = value.replace(/[^0-9+\-*/%.()#_a-zA-Z\s]/g, '');

    if (sanitized !== value) {
      e.target.value = sanitized;
    }

    this.draftRows[index].expression = sanitized || '';
    this.calculateRow(index, false, false); // 不添加到历史，不重新渲染
    this.saveDraftState();
  }

  /**
   * 处理草稿行键盘事件
   */
  handleDraftKeydown(e) {
    const index = parseInt(e.target.dataset.index);

    // 只处理特殊键，其他所有键都让输入框正常处理
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // 计算当前行并添加到历史
      this.calculateRow(index, true, true);
      // 切换到下一个输入框
      this.focusNextRow(index);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      e.stopPropagation();
      this.focusRow(index - 1);
      const prevInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'ArrowDown' && index < this.draftRows.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      this.focusRow(index + 1);
      const nextInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.clearRow(index);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      // Tab 键在行间切换
      if (e.shiftKey && index > 0) {
        this.focusRow(index - 1);
      } else if (!e.shiftKey && index < this.draftRows.length - 1) {
        this.focusRow(index + 1);
      }
      const targetInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.activeRowIndex}"]`);
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
    // 其他所有键（数字、字母、符号等）都不处理，让输入框正常接收
  }

  /**
   * 聚焦下一行
   */
  focusNextRow(currentIndex) {
    let nextIndex;
    
    if (currentIndex < this.draftRows.length - 1) {
      // 还有下一行，聚焦下一行
      nextIndex = currentIndex + 1;
    } else {
      // 已经是最后一行，创建新行并聚焦
      this.createDraftRow();
      nextIndex = this.draftRows.length - 1;
    }
    
    this.focusRow(nextIndex);
    
    // 聚焦到新输入框
    setTimeout(() => {
      const nextInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${nextIndex}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }, 50);
  }

  /**
   * 计算行结果
   */
  calculateRow(index, addToHistory = false, shouldRender = true) {
    const row = this.draftRows[index];
    const expression = row.expression;

    if (!expression) {
      row.result = '';
      if (shouldRender) {
        this.updateRowResult(index);
      } else {
        // 只更新 DOM，不重新渲染
        this.updateRowResult(index);
      }
      return;
    }

    // 解析表达式中的行引用（如 #1, #2）
    const parsedExpression = this.parseRowReferences(expression);

    const result = this.safeEvaluate(parsedExpression);

    if (result !== null && !isNaN(result) && isFinite(result)) {
      const formattedResult = this.formatResult(result);
      row.result = formattedResult;
      this.lastResult = formattedResult;

      // 如果按了回车，添加到历史
      if (addToHistory) {
        this.addToHistory(expression, formattedResult);
      }
    } else {
      row.result = '';
    }

    // 更新显示（不重新渲染整个 DOM）
    this.updateRowResult(index);
  }

  /**
   * 计算当前行
   */
  calculateCurrentRow() {
    this.calculateRow(this.activeRowIndex, true);
  }

  /**
   * 解析行引用（如 #1, #2）
   */
  parseRowReferences(expression) {
    return expression.replace(/#(\d+)/g, (match, rowNum) => {
      const index = parseInt(rowNum) - 1;
      if (index >= 0 && index < this.draftRows.length) {
        const row = this.draftRows[index];
        return row.result || '0';
      }
      return '0';
    });
  }

  /**
   * 清空行
   */
  clearRow(index) {
    this.draftRows[index].expression = '';
    this.draftRows[index].result = '';
    this.updateRowResult(index);
    this.saveDraftState();
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      this.elements.draftRows.scrollTop = this.elements.draftRows.scrollHeight;
    }, 50);
  }

  /**
   * 更新统计
   */
  updateStats() {
    const totalRows = this.draftRows.length;
    const calculatedRows = this.draftRows.filter(r => r.result).length;
    const totalExpressions = this.draftRows.filter(r => r.expression).length;
    
    if (this.elements.draftStats) {
      this.elements.draftStats.innerHTML = `
        <span class="stat-item">📊 共 ${totalRows} 行</span>
        <span class="stat-item">✅ 已计算 ${calculatedRows} 行</span>
        <span class="stat-item">📝 最后结果：${this.lastResult || '-'}</span>
      `;
    }
  }

  /**
   * 复制所有结果
   */
  copyAllResults() {
    const results = this.draftRows
      .filter(r => r.result)
      .map((r, i) => `${i + 1}. ${r.expression} = ${r.result}`)
      .join('\n');
    
    if (!results) {
      this.showToast('暂无计算结果', 'error');
      return;
    }
    
    this.copyToClipboard(results, '所有结果已复制');
  }

  /**
   * 输入数字
   */
  inputNumber(num) {
    const row = this.draftRows[this.activeRowIndex];

    if (row.expression === '0' && num !== '.') {
      row.expression = num;
    } else {
      row.expression += num;
    }

    this.calculateRow(this.activeRowIndex, false, true);
    this.saveDraftState();

    // 保持输入框聚焦
    setTimeout(() => {
      const input = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.activeRowIndex}"]`);
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 50);
  }

  /**
   * 输入运算符
   */
  inputOperator(op) {
    const row = this.draftRows[this.activeRowIndex];
    if (!row.expression) {
      row.expression = op === '-' ? '-' : '';
    } else {
      row.expression += op;
    }
    this.calculateRow(this.activeRowIndex, false, true);
    this.saveDraftState();
  }

  /**
   * 处理控制键
   */
  handleControl(key) {
    switch (key) {
      case 'clear':
        this.clearRow(this.activeRowIndex);
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'clearAll':
        this.clearAllDraftRows();
        break;
    }
  }

  /**
   * 退格
   */
  backspace() {
    const row = this.draftRows[this.activeRowIndex];
    if (row.expression.length <= 1) {
      row.expression = '';
      row.result = '';
    } else {
      row.expression = row.expression.slice(0, -1);
    }
    this.calculateRow(this.activeRowIndex, false, true);
    this.saveDraftState();
  }

  /**
   * 处理函数
   */
  handleFunction(fn) {
    const row = this.draftRows[this.activeRowIndex];
    const currentValue = row.expression || '0';
    let result;

    switch (fn) {
      case 'sin':
        row.expression = `sin(${currentValue})`;
        break;
      case 'cos':
        row.expression = `cos(${currentValue})`;
        break;
      case 'tan':
        row.expression = `tan(${currentValue})`;
        break;
      case 'log':
        row.expression = `log(${currentValue})`;
        break;
      case 'ln':
        row.expression = `ln(${currentValue})`;
        break;
      case 'sqrt':
        row.expression = `√(${currentValue})`;
        break;
      case 'pow':
        row.expression = `${currentValue}^`;
        break;
      case 'exp':
        row.expression = `exp(${currentValue})`;
        break;
      case 'pi':
        row.expression += Math.PI.toString();
        break;
      case 'e':
        row.expression += Math.E.toString();
        break;
      case 'abs':
        row.expression = `|${currentValue}|`;
        break;
      case 'factorial':
        row.expression = `${currentValue}!`;
        break;
      case 'ans':
        // 引用上一次计算结果
        if (this.lastResult) {
          row.expression += this.lastResult;
        }
        break;
    }

    this.calculateRow(this.activeRowIndex, false, true);
    this.saveDraftState();
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    if (isNaN(result) || !isFinite(result)) {
      return 'Error';
    }

    const str = result.toString();
    if (str.length > 12) {
      return result.toPrecision(10);
    }
    // 处理浮点数精度
    return parseFloat(result.toFixed(10)).toString();
  }

  /**
   * 安全地评估表达式
   */
  safeEvaluate(expression) {
    if (!expression) return null;
    
    // 只允许数字、运算符、括号、小数点和数学函数
    if (!/^[\d+\-*/%.()#_\s]+$|^[\w\s()]+$/.test(expression)) {
      // 检查是否包含允许的数学函数
      const allowedFns = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp', 'abs', 'pow', 'PI', 'E'];
      let testExpr = expression;
      for (const fn of allowedFns) {
        testExpr = testExpr.replace(new RegExp(fn, 'g'), '');
      }
      if (!/^[\d+\-*/%.()#\s]+$/.test(testExpr)) {
        return null;
      }
    }
    
    // 替换符号
    let evalExpr = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
      .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
      .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)')
      .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
      .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
      .replace(/exp\(([^)]+)\)/g, 'Math.exp($1)')
      .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
      .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
      .replace(/(\d+)!/g, (m, n) => this.factorial(parseInt(n)).toString())
      .replace(/\^/g, '**')
      .replace(/PI/g, Math.PI.toString())
      .replace(/E/g, Math.E.toString());
    
    try {
      return Function('"use strict";return (' + evalExpr + ')')();
    } catch (e) {
      return null;
    }
  }

  /**
   * 计算阶乘
   */
  factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * 添加到历史
   */
  addToHistory(expression, result) {
    this.history.unshift({ 
      expression, 
      result, 
      createdAt: new Date().toISOString() 
    });

    if (this.history.length > 50) {
      this.history.pop();
    }

    localStorage.setItem('calculator-history', JSON.stringify(this.history));
    this.renderHistory();
  }

  /**
   * 加载历史
   */
  async loadHistory() {
    try {
      const saved = localStorage.getItem('calculator-history');
      if (saved) {
        this.history = JSON.parse(saved);
        this.renderHistory();
      }
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  }

  /**
   * 渲染历史
   */
  renderHistory() {
    if (this.history.length === 0) {
      this.elements.historyList.innerHTML = '<div class="history-empty">暂无计算记录</div>';
      return;
    }

    this.elements.historyList.innerHTML = this.history.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-time">${this.formatTime(item.createdAt)}</div>
        <div class="history-content">
          <span class="history-expression">${item.expression}</span>
          <span class="history-result">= ${item.result}</span>
        </div>
      </div>
    `).join('');

    // 绑定点击事件 - 点击历史创建新草稿行
    this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        const result = this.history[index].result;
        const expression = this.history[index].expression;
        this.createDraftRow(expression, `历史：${this.formatTime(this.history[index].createdAt)}`);
        setTimeout(() => {
          const newInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.draftRows.length - 1}"]`);
          if (newInput) {
            newInput.focus();
            newInput.select();
          }
        }, 50);
      });
    });
  }

  /**
   * 格式化时间
   */
  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (diff < 48 * 60 * 60 * 1000 && date.getDate() === yesterday.getDate()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * 清空历史
   */
  clearHistory() {
    this.history = [];
    localStorage.removeItem('calculator-history');
    this.renderHistory();
    this.showToast('历史记录已清空');
  }

  /**
   * 导出历史
   */
  exportHistory() {
    if (this.history.length === 0) {
      this.showToast('暂无历史记录', 'error');
      return;
    }

    const content = this.history.map(item =>
      `[${this.formatTime(item.createdAt)}] ${item.expression} = ${item.result}`
    ).join('\n');

    this.copyToClipboard(content, '历史记录已导出');
  }

  /**
   * 渲染公式
   */
  renderFormulas(category) {
    this.elements.formulaTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    const formulas = this.formulas[category] || [];
    this.elements.formulaList.innerHTML = formulas.map(formula => `
      <div class="formula-item" data-expression="${formula.expression}">
        <div class="formula-name">${formula.name}</div>
        <div class="formula-expression">${formula.expression}</div>
      </div>
    `).join('');

    this.elements.formulaList.querySelectorAll('.formula-item').forEach(item => {
      item.addEventListener('click', () => {
        const expression = item.dataset.expression;
        this.createDraftRow('', expression);
        setTimeout(() => {
          const newInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.draftRows.length - 1}"]`);
          if (newInput) {
            newInput.focus();
          }
        }, 50);
        this.showToast('公式已添加到草稿');
      });
    });
  }

  /**
   * 清空草稿纸
   */
  clearScratch() {
    if (confirm('确定要清空草稿纸吗？')) {
      this.elements.scratchPad.value = '';
      this.saveScratchPad();
      this.showToast('草稿纸已清空');
    }
  }

  /**
   * 保存草稿纸
   */
  saveScratchPad() {
    localStorage.setItem('calculator-scratch', this.elements.scratchPad.value);
  }

  /**
   * 加载草稿纸
   */
  loadScratchPad() {
    const saved = localStorage.getItem('calculator-scratch');
    if (saved) {
      this.elements.scratchPad.value = saved;
    }
  }

  /**
   * 发送最后结果到草稿纸
   */
  sendToScratch() {
    if (!this.lastResult) {
      this.showToast('暂无计算结果', 'error');
      return;
    }

    const currentText = this.elements.scratchPad.value;
    const newText = currentText 
      ? `${currentText}\n\n💡 计算结果：${this.lastResult}`
      : `💡 计算结果：${this.lastResult}`;
    
    this.elements.scratchPad.value = newText;
    this.saveScratchPad();
    this.showToast('结果已发送到草稿纸');
  }

  /**
   * 复制最后结果
   */
  copyLastResult() {
    if (!this.lastResult) {
      this.showToast('暂无计算结果', 'error');
      return;
    }
    this.copyToClipboard(this.lastResult, '结果已复制');
  }

  /**
   * 复制到剪贴板
   */
  copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(message || '已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      this.showToast('复制失败', 'error');
    });
  }

  /**
   * 处理键盘事件
   */
  handleKeyboard(e) {
    // 在输入框或文本框中时，完全允许正常输入，不拦截任何键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // 在草稿行输入框中
      if (e.target.classList.contains('draft-input')) {
        // 只处理 Enter 和 Escape，其他所有键都允许正常输入
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(e.target.dataset.index);
          this.calculateRow(index, true, true);
          this.focusNextRow(index);
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(e.target.dataset.index);
          this.clearRow(index);
          return;
        }

        // 其他所有键（包括数字、字母、符号）都不拦截，让输入框正常处理
        return;
      }

      // 其他输入框（如 textarea）完全不受影响
      return;
    }

    // 非输入框时，阻止默认行为并处理快捷键
    e.preventDefault();
    e.stopPropagation();

    const key = e.key;

    if (/^[0-9.]$/.test(key)) {
      this.inputNumber(key);
    } else if (['+', '-', '*', '/', '%'].includes(key)) {
      this.inputOperator(key);
    } else if (key === 'Enter') {
      this.calculateCurrentRow();
      this.createDraftRow();
      setTimeout(() => {
        const newInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.draftRows.length - 1}"]`);
        if (newInput) {
          newInput.focus();
          newInput.select();
        }
      }, 50);
    } else if (key === 'Backspace') {
      this.backspace();
    } else if (key === 'Escape') {
      this.clearRow(this.activeRowIndex);
    } else if (key === 'ArrowUp' && this.activeRowIndex > 0) {
      this.focusRow(this.activeRowIndex - 1);
      const prevInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.activeRowIndex}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (key === 'ArrowDown' && this.activeRowIndex < this.draftRows.length - 1) {
      this.focusRow(this.activeRowIndex + 1);
      const nextInput = this.elements.draftRows.querySelector(`.draft-input[data-index="${this.activeRowIndex}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
      this.sendToScratch();
    } else if (key.toLowerCase() === 'k' && !e.ctrlKey && !e.metaKey) {
      this.toggleKeys();
    } else if (key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
      this.copyLastResult();
    }
  }

  /**
   * 显示提示
   */
  showToast(message, type = 'success') {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast show ${type}`;

    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, 2000);
  }
}

// ========== 启动应用 ==========
document.addEventListener('DOMContentLoaded', () => {
  window.draftCalculator = new DraftCalculator();
});
