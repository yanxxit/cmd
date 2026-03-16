// ========== 计算稿纸应用 ==========

/**
 * 计算器类
 */
class CalculatorApp {
  constructor() {
    // 计算器状态
    this.currentInput = '0';
    this.previousInput = '';
    this.operator = null;
    this.shouldResetScreen = false;
    this.history = [];
    this.currentResult = '';
    this.isKeysExpanded = false; // 键盘展开状态

    // 常用公式
    this.formulas = {
      math: [
        { name: '一元二次方程求根公式', expression: 'x = (-b ± √(b²-4ac)) / 2a' },
        { name: '等差数列求和', expression: 'Sₙ = n(a₁ + aₙ) / 2' },
        { name: '等比数列求和', expression: 'Sₙ = a₁(1 - qⁿ) / (1 - q)' },
        { name: '三角恒等式', expression: 'sin²θ + cos²θ = 1' },
        { name: '对数换底公式', expression: 'logₐb = logₑb / logₑa' },
        { name: '阶乘公式', expression: 'n! = n × (n-1) × ... × 1' }
      ],
      physics: [
        { name: '牛顿第二定律', expression: 'F = ma' },
        { name: '动能公式', expression: 'Eₖ = ½mv²' },
        { name: '重力势能', expression: 'Eₚ = mgh' },
        { name: '万有引力', expression: 'F = G(m₁m₂) / r²' },
        { name: '欧姆定律', expression: 'V = IR' },
        { name: '功率公式', expression: 'P = W/t' }
      ],
      geometry: [
        { name: '圆面积', expression: 'S = πr²' },
        { name: '圆周长', expression: 'C = 2πr' },
        { name: '三角形面积', expression: 'S = ½bh' },
        { name: '矩形面积', expression: 'S = lw' },
        { name: '球体积', expression: 'V = ⁴/₃πr³' },
        { name: '圆柱体积', expression: 'V = πr²h' }
      ]
    };

    // DOM 元素
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
    await this.loadHistory();
    this.loadScratchPad();
    this.renderFormulas('math');
    this.updateDisplay();
    this.syncInputFromDisplay();
  }

  /**
   * 缓存 DOM 元素
   */
  cacheElements() {
    this.elements = {
      // 主题切换
      themeToggle: document.getElementById('themeToggle'),

      // 显示器
      displayHistory: document.getElementById('displayHistory'),
      displayInput: document.getElementById('displayInput'),
      displayResult: document.getElementById('displayResult'),

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

    // 输入框事件
    this.elements.displayInput.addEventListener('input', (e) => this.handleInput(e));
    this.elements.displayInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
    this.elements.displayInput.addEventListener('focus', () => this.selectInputText());

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
    this.elements.equalsKey.addEventListener('click', () => this.calculate());

    // 功能键
    this.elements.fnKeys.forEach(key => {
      key.addEventListener('click', () => this.handleFunction(key.dataset.fn));
    });

    // 草稿纸
    this.elements.clearScratch.addEventListener('click', () => this.clearScratch());
    this.elements.copyResult.addEventListener('click', () => this.copyToClipboard());
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

    // 键盘事件
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
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
    
    // 切换展开/收起状态
    this.elements.functionKeys.classList.toggle('collapsed', !this.isKeysExpanded);
    this.elements.calculatorKeys.classList.toggle('collapsed', !this.isKeysExpanded);
    this.elements.toggleKeysBtn.classList.toggle('active', this.isKeysExpanded);
    
    // 保存状态
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
   * 处理输入框输入
   */
  handleInput(e) {
    const value = e.target.value;
    // 只允许数字、运算符和括号
    const sanitized = value.replace(/[^0-9+\-*/%.()]/g, '');
    if (sanitized !== value) {
      e.target.value = sanitized;
    }
    this.currentInput = sanitized || '0';
    this.updateDisplay();
    
    // 自动计算
    this.autoCalculate();
  }

  /**
   * 处理输入框键盘事件
   */
  handleInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.calculate();
    }
  }

  /**
   * 聚焦时选中文本
   */
  selectInputText() {
    this.elements.displayInput.select();
  }

  /**
   * 同步输入框和显示
   */
  syncInputFromDisplay() {
    this.elements.displayInput.value = this.currentInput;
    this.updateResult();
  }

  /**
   * 输入数字
   */
  inputNumber(num) {
    if (this.shouldResetScreen) {
      this.currentInput = '0';
      this.shouldResetScreen = false;
    }

    if (num === '.' && this.currentInput.includes('.')) return;
    if (this.currentInput === '0' && num !== '.') {
      this.currentInput = num;
    } else {
      this.currentInput += num;
    }

    this.updateResult();
    this.syncInputFromDisplay();
  }

  /**
   * 输入运算符
   */
  inputOperator(op) {
    if (this.operator && !this.shouldResetScreen) {
      this.calculate();
    }

    this.previousInput = this.currentInput;
    this.operator = op;
    this.shouldResetScreen = true;

    this.elements.displayHistory.textContent = `${this.previousInput} ${this.getOperatorSymbol(op)}`;
    this.updateResult();
    this.syncInputFromDisplay();
  }

  /**
   * 获取运算符符号
   */
  getOperatorSymbol(op) {
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%' };
    return symbols[op] || op;
  }

  /**
   * 处理控制键
   */
  handleControl(key) {
    switch (key) {
      case 'clear':
        this.clear();
        break;
      case 'backspace':
        this.backspace();
        break;
    }
  }

  /**
   * 清空
   */
  clear() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operator = null;
    this.shouldResetScreen = false;
    this.elements.displayHistory.textContent = '';
    this.updateResult();
    this.syncInputFromDisplay();
  }

  /**
   * 退格
   */
  backspace() {
    if (this.currentInput.length === 1 || (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
      this.currentInput = '0';
    } else {
      this.currentInput = this.currentInput.slice(0, -1);
    }
    this.updateResult();
    this.syncInputFromDisplay();
  }

  /**
   * 处理函数
   */
  handleFunction(fn) {
    const num = parseFloat(this.currentInput);
    let result;

    switch (fn) {
      case 'sin':
        result = Math.sin(num * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(num * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(num * Math.PI / 180);
        break;
      case 'log':
        result = Math.log10(num);
        break;
      case 'ln':
        result = Math.log(num);
        break;
      case 'sqrt':
        result = Math.sqrt(num);
        break;
      case 'pow':
        this.operator = '**';
        this.previousInput = this.currentInput;
        this.shouldResetScreen = true;
        this.elements.displayHistory.textContent = `${this.previousInput}^`;
        this.updateResult();
        this.syncInputFromDisplay();
        return;
      case 'exp':
        result = Math.exp(num);
        break;
      case 'pi':
        this.currentInput = Math.PI.toString();
        break;
      case 'e':
        this.currentInput = Math.E.toString();
        break;
      case 'abs':
        result = Math.abs(num);
        break;
      case 'factorial':
        result = this.factorial(num);
        break;
    }

    if (result !== undefined) {
      this.currentInput = this.formatResult(result);
      this.updateResult();
      this.syncInputFromDisplay();
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
   * 计算
   */
  calculate() {
    if (!this.operator && this.currentInput) {
      // 支持直接从输入框解析表达式计算
      this.calculateFromInput();
      return;
    }
    
    if (this.shouldResetScreen) return;

    const prev = parseFloat(this.previousInput);
    const current = parseFloat(this.currentInput);
    let result;

    switch (this.operator) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        if (current === 0) {
          this.showToast('除数不能为零', 'error');
          this.clear();
          return;
        }
        result = prev / current;
        break;
      case '%':
        result = prev % current;
        break;
      case '**':
        result = Math.pow(prev, current);
        break;
      default:
        return;
    }

    const formattedResult = this.formatResult(result);
    const expression = `${this.previousInput} ${this.getOperatorSymbol(this.operator)} ${this.currentInput}`;

    // 添加到历史
    this.addToHistory(expression, formattedResult);

    // 更新显示
    this.elements.displayHistory.textContent = `${expression} =`;
    this.currentInput = formattedResult;
    this.currentResult = formattedResult;
    this.operator = null;
    this.previousInput = '';
    this.shouldResetScreen = true;

    this.updateResult();
    this.syncInputFromDisplay();
    
    // 闪烁结果
    this.flashResult();
  }

  /**
   * 从输入框解析表达式计算
   */
  calculateFromInput() {
    try {
      const expression = this.currentInput;
      // 安全的表达式求值
      const result = this.safeEvaluate(expression);
      
      if (result !== null && !isNaN(result) && isFinite(result)) {
        const formattedResult = this.formatResult(result);
        
        // 添加到历史
        this.addToHistory(expression, formattedResult);
        
        // 更新显示
        this.elements.displayHistory.textContent = `${expression} =`;
        this.currentInput = formattedResult;
        this.currentResult = formattedResult;
        this.shouldResetScreen = true;
        
        this.updateDisplay();
        this.syncInputFromDisplay();
      } else {
        this.showToast('无效的表达式', 'error');
      }
    } catch (err) {
      console.error('计算失败:', err);
      this.showToast('表达式错误', 'error');
    }
  }

  /**
   * 安全地评估表达式（只允许数学运算）
   */
  safeEvaluate(expression) {
    // 只允许数字、运算符、括号和小数点
    if (!/^[\d+\-*/%.() ]+$/.test(expression)) {
      return null;
    }
    
    // 替换中文符号
    expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
    
    try {
      // 使用 Function 代替 eval 更安全
      return Function('"use strict";return (' + expression + ')')();
    } catch (e) {
      return null;
    }
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    if (isNaN(result) || !isFinite(result)) {
      return 'Error';
    }

    // 处理精度问题
    const str = result.toString();
    if (str.length > 12) {
      return result.toPrecision(10);
    }
    return str;
  }

  /**
   * 更新显示
   */
  updateDisplay() {
    this.updateResult();
    document.title = `${this.currentInput} - 🧮 计算稿纸`;
  }

  /**
   * 更新结果显示
   */
  updateResult() {
    const result = this.safeEvaluate(this.currentInput);
    if (result !== null && !isNaN(result) && isFinite(result)) {
      this.elements.displayResult.textContent = `= ${this.formatResult(result)}`;
    } else {
      this.elements.displayResult.textContent = '= ';
    }
  }

  /**
   * 自动计算
   */
  autoCalculate() {
    this.updateResult();
  }

  /**
   * 闪烁结果提示
   */
  flashResult() {
    this.elements.displayResult.style.transform = 'scale(1.05)';
    this.elements.displayResult.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
      this.elements.displayResult.style.transform = 'scale(1)';
    }, 200);
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

    // 限制历史记录数量
    if (this.history.length > 50) {
      this.history.pop();
    }

    // 保存到 localStorage
    localStorage.setItem('calculator-history', JSON.stringify(this.history));

    // 更新显示
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
        <div class="history-expression">${item.expression}</div>
        <div class="history-result">= ${item.result}</div>
      </div>
    `).join('');

    // 绑定点击事件
    this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.currentInput = this.history[index].result;
        this.updateDisplay();
        this.syncInputFromDisplay();
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
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (diff < 48 * 60 * 60 * 1000 && date.getDate() === yesterday.getDate()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 其他日期
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
    // 更新标签状态
    this.elements.formulaTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    // 渲染公式列表
    const formulas = this.formulas[category] || [];
    this.elements.formulaList.innerHTML = formulas.map(formula => `
      <div class="formula-item" data-expression="${formula.expression}">
        <div class="formula-name">${formula.name}</div>
        <div class="formula-expression">${formula.expression}</div>
      </div>
    `).join('');

    // 绑定点击事件
    this.elements.formulaList.querySelectorAll('.formula-item').forEach(item => {
      item.addEventListener('click', () => {
        const expression = item.dataset.expression;
        // 将公式发送到草稿纸
        const currentText = this.elements.scratchPad.value;
        const newText = currentText ? `${currentText}\n\n📐 ${expression}` : `📐 ${expression}`;
        this.elements.scratchPad.value = newText;
        this.saveScratchPad();
        this.showToast('公式已发送到草稿纸');
      });
    });
  }

  /**
   * 清空草稿
   */
  clearScratch() {
    if (confirm('确定要清空草稿纸吗？')) {
      this.elements.scratchPad.value = '';
      this.saveScratchPad();
      this.showToast('草稿纸已清空');
    }
  }

  /**
   * 保存草稿
   */
  saveScratchPad() {
    localStorage.setItem('calculator-scratch', this.elements.scratchPad.value);
  }

  /**
   * 加载草稿
   */
  loadScratchPad() {
    const saved = localStorage.getItem('calculator-scratch');
    if (saved) {
      this.elements.scratchPad.value = saved;
    }
  }

  /**
   * 发送到草稿纸
   */
  sendToScratch() {
    if (!this.currentResult) {
      this.showToast('暂无计算结果', 'error');
      return;
    }

    const currentText = this.elements.scratchPad.value;
    const newText = currentText 
      ? `${currentText}\n\n💡 计算结果：${this.currentResult}`
      : `💡 计算结果：${this.currentResult}`;
    
    this.elements.scratchPad.value = newText;
    this.saveScratchPad();
    this.showToast('结果已发送到草稿纸');
  }

  /**
   * 复制结果
   */
  copyToClipboard(text, message) {
    const content = text || this.currentResult || this.elements.scratchPad.value;
    
    navigator.clipboard.writeText(content).then(() => {
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
    // 输入框中不响应快捷键
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      // 但在输入框中按 Enter 要计算
      if (e.key === 'Enter' && e.target === this.elements.displayInput) {
        e.preventDefault();
        this.calculate();
      }
      return;
    }

    const key = e.key;

    // 数字和运算符
    if (/^[0-9.]$/.test(key)) {
      e.preventDefault();
      this.inputNumber(key);
    } else if (['+', '-', '*', '/', '%'].includes(key)) {
      e.preventDefault();
      this.inputOperator(key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.calculate();
    } else if (key === 'Backspace') {
      e.preventDefault();
      this.backspace();
    } else if (key === 'Escape') {
      e.preventDefault();
      this.clear();
    } else if (key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.sendToScratch();
    } else if (key.toLowerCase() === 'k' && !e.ctrlKey && !e.metaKey) {
      // K 键切换键盘显示
      e.preventDefault();
      this.toggleKeys();
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
  window.calculatorApp = new CalculatorApp();
});
