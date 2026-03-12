// ========== 番茄时钟应用 ==========

/**
 * 番茄时钟类
 */
class PomodoroTimer {
  constructor() {
    // 计时器状态
    this.timeLeft = 25 * 60; // 秒
    this.totalTime = 25 * 60; // 秒
    this.isRunning = false;
    this.timerId = null;
    this.currentMode = 'work'; // work, shortBreak, longBreak
    this.completedSessions = 0; // 当前周期完成的番茄数
    this.sessionsBeforeLongBreak = 4;

    // 设置
    this.settings = {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4
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
    await this.loadSettings();
    await this.loadStatistics();
    this.updateDisplay();
    this.updateProgressBar();
  }

  /**
   * 缓存 DOM 元素
   */
  cacheElements() {
    this.elements = {
      // 主题切换
      themeToggle: document.getElementById('themeToggle'),
      
      // 模式切换
      modeTabs: document.querySelectorAll('.mode-tab'),
      
      // 计时器
      timeDisplay: document.getElementById('timeDisplay'),
      timerStatus: document.getElementById('timerStatus'),
      progressBar: document.getElementById('progressBar'),
      timerCircle: document.querySelector('.timer-circle'),
      
      // 控制按钮
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      resetBtn: document.getElementById('resetBtn'),
      
      // 会话信息
      todaySessions: document.getElementById('todaySessions'),
      currentCycle: document.getElementById('currentCycle'),
      
      // 统计
      todayFocusTime: document.getElementById('todayFocusTime'),
      weekFocusTime: document.getElementById('weekFocusTime'),
      totalFocusTime: document.getElementById('totalFocusTime'),
      totalSessions: document.getElementById('totalSessions'),
      chartBars: document.getElementById('chartBars'),
      
      // 设置
      workDuration: document.getElementById('workDuration'),
      shortBreak: document.getElementById('shortBreak'),
      longBreak: document.getElementById('longBreak'),
      sessionsBeforeLongBreak: document.getElementById('sessionsBeforeLongBreak'),
      saveSettings: document.getElementById('saveSettings'),
      
      // 模态框
      modalOverlay: document.getElementById('modalOverlay'),
      modalIcon: document.getElementById('modalIcon'),
      modalTitle: document.getElementById('modalTitle'),
      modalMessage: document.getElementById('modalMessage'),
      modalConfirm: document.getElementById('modalConfirm'),
      
      // 音频
      alarmSound: document.getElementById('alarmSound')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 主题切换
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // 模式切换
    this.elements.modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });

    // 控制按钮
    this.elements.startBtn.addEventListener('click', () => this.start());
    this.elements.pauseBtn.addEventListener('click', () => this.pause());
    this.elements.resetBtn.addEventListener('click', () => this.reset());

    // 设置保存
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings());

    // 模态框确认
    this.elements.modalConfirm.addEventListener('click', () => this.hideModal());

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return; // 输入框中不响应

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (this.isRunning) {
            this.pause();
          } else {
            this.start();
          }
          break;
        case 'KeyR':
          this.reset();
          break;
      }
    });
  }

  /**
   * 加载主题
   */
  loadTheme() {
    const savedTheme = localStorage.getItem('pomodoro-theme') || 'light';
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
    localStorage.setItem('pomodoro-theme', newTheme);
    this.updateThemeIcon(newTheme);
  }

  /**
   * 更新主题图标
   */
  updateThemeIcon(theme) {
    this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      const res = await fetch('/api/pomodoro/settings');
      const data = await res.json();
      
      if (data.success) {
        this.settings = data.data;
        this.sessionsBeforeLongBreak = data.data.sessionsBeforeLongBreak;
        
        // 更新表单
        this.elements.workDuration.value = this.settings.workDuration;
        this.elements.shortBreak.value = this.settings.shortBreak;
        this.elements.longBreak.value = this.settings.longBreak;
        this.elements.sessionsBeforeLongBreak.value = this.settings.sessionsBeforeLongBreak;
        
        // 更新当前时间
        if (this.currentMode === 'work') {
          this.totalTime = this.settings.workDuration * 60;
          this.timeLeft = this.totalTime;
        }
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      const newSettings = {
        workDuration: parseInt(this.elements.workDuration.value),
        shortBreak: parseInt(this.elements.shortBreak.value),
        longBreak: parseInt(this.elements.longBreak.value),
        sessionsBeforeLongBreak: parseInt(this.elements.sessionsBeforeLongBreak.value)
      };

      const res = await fetch('/api/pomodoro/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      const data = await res.json();
      
      if (data.success) {
        this.settings = data.data;
        this.sessionsBeforeLongBreak = data.data.sessionsBeforeLongBreak;
        
        // 重置计时器
        this.reset();
        
        // 显示成功提示
        this.showToast('设置已保存');
      }
    } catch (err) {
      console.error('保存设置失败:', err);
      this.showToast('保存失败', 'error');
    }
  }

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      const res = await fetch('/api/pomodoro/statistics');
      const data = await res.json();
      
      if (data.success) {
        this.updateStatistics(data.data);
      }

      // 加载历史记录
      await this.loadHistory();
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  }

  /**
   * 加载历史记录
   */
  async loadHistory() {
    try {
      const res = await fetch('/api/pomodoro/history?days=7');
      const data = await res.json();
      
      if (data.success) {
        this.renderHistoryChart(data.data);
      }
    } catch (err) {
      console.error('加载历史记录失败:', err);
    }
  }

  /**
   * 更新统计显示
   */
  updateStatistics(stats) {
    this.elements.todaySessions.textContent = stats.todaySessions || 0;
    this.elements.todayFocusTime.textContent = `${stats.todayFocusTime || 0} 分钟`;
    this.elements.weekFocusTime.textContent = `${stats.weekFocusTime || 0} 分钟`;
    this.elements.totalFocusTime.textContent = `${stats.totalFocusTime || 0} 分钟`;
    this.elements.totalSessions.textContent = stats.totalSessions || 0;
    this.elements.currentCycle.textContent = `${(this.completedSessions % this.sessionsBeforeLongBreak) + 1}/${this.sessionsBeforeLongBreak}`;
  }

  /**
   * 渲染历史图表
   */
  renderHistoryChart(history) {
    const days = Object.values(history).reverse(); // 从旧到新
    const maxTime = Math.max(...days.map(d => d.focusTime), 1);

    this.elements.chartBars.innerHTML = days.map(day => {
      const height = (day.focusTime / maxTime) * 100;
      return `
        <div class="chart-bar-item">
          <div class="chart-bar" style="height: ${height}%"></div>
          <div class="chart-bar-label">${day.dayOfWeek}</div>
          <div class="chart-bar-value">${day.focusTime}分钟</div>
        </div>
      `;
    }).join('');
  }

  /**
   * 切换模式
   */
  switchMode(mode) {
    if (this.isRunning) {
      this.pause();
    }

    this.currentMode = mode;
    
    // 更新标签页状态
    this.elements.modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // 设置时间
    switch(mode) {
      case 'work':
        this.totalTime = this.settings.workDuration * 60;
        this.elements.timerStatus.textContent = '专注时间';
        break;
      case 'shortBreak':
        this.totalTime = this.settings.shortBreak * 60;
        this.elements.timerStatus.textContent = '短休息';
        break;
      case 'longBreak':
        this.totalTime = this.settings.longBreak * 60;
        this.elements.timerStatus.textContent = '长休息';
        break;
    }

    this.timeLeft = this.totalTime;
    this.updateDisplay();
    this.updateProgressBar();
  }

  /**
   * 开始计时
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.elements.timerCircle.classList.add('timer-running');
    this.elements.startBtn.disabled = true;
    this.elements.pauseBtn.disabled = false;
    this.elements.timerStatus.textContent = this.currentMode === 'work' ? '专注中...' : '休息中...';

    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      this.updateProgressBar();

      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  /**
   * 暂停计时
   */
  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.timerId);
    this.elements.timerCircle.classList.remove('timer-running');
    this.elements.startBtn.disabled = false;
    this.elements.pauseBtn.disabled = true;
    this.elements.timerStatus.textContent = '已暂停';
  }

  /**
   * 重置计时
   */
  reset() {
    this.pause();
    
    switch(this.currentMode) {
      case 'work':
        this.timeLeft = this.settings.workDuration * 60;
        this.elements.timerStatus.textContent = '准备开始';
        break;
      case 'shortBreak':
        this.timeLeft = this.settings.shortBreak * 60;
        this.elements.timerStatus.textContent = '准备短休息';
        break;
      case 'longBreak':
        this.timeLeft = this.settings.longBreak * 60;
        this.elements.timerStatus.textContent = '准备长休息';
        break;
    }

    this.updateDisplay();
    this.updateProgressBar();
  }

  /**
   * 完成计时
   */
  complete() {
    this.pause();
    
    // 播放提示音
    this.playAlarm();

    // 如果是专注模式完成
    if (this.currentMode === 'work') {
      this.completedSessions++;
      this.saveSession();
      
      // 检查是否该长休息
      if (this.completedSessions % this.sessionsBeforeLongBreak === 0) {
        this.showModal('🎉', '长休息时刻！', `已完成${this.sessionsBeforeLongBreak}个番茄，休息一下吧~`);
        this.switchMode('longBreak');
      } else {
        this.showModal('🎉', '番茄完成！', '太棒了，休息一下吧~');
        this.switchMode('shortBreak');
      }
      
      // 刷新统计
      this.loadStatistics();
    } else {
      // 休息结束
      this.showModal('☕', '休息结束！', '准备好继续专注了吗？');
      this.switchMode('work');
    }
  }

  /**
   * 保存番茄记录
   */
  async saveSession() {
    try {
      const session = {
        date: new Date().toISOString().split('T')[0],
        duration: this.settings.workDuration,
        startTime: new Date(Date.now() - this.settings.workDuration * 60 * 1000).toISOString(),
        mode: 'work'
      };

      await fetch('/api/pomodoro/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
    } catch (err) {
      console.error('保存记录失败:', err);
    }
  }

  /**
   * 更新显示
   */
  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.elements.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 更新页面标题
    document.title = `${this.elements.timeDisplay.textContent} - 🍅 番茄时钟`;
  }

  /**
   * 更新进度条
   */
  updateProgressBar() {
    const circumference = 2 * Math.PI * 130; // 圆的周长
    const offset = circumference - (this.timeLeft / this.totalTime) * circumference;
    this.elements.progressBar.style.strokeDashoffset = offset;
  }

  /**
   * 播放提示音
   */
  playAlarm() {
    // 使用 Web Audio API 生成提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // 播放两次
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 600);
  }

  /**
   * 显示模态框
   */
  showModal(icon, title, message) {
    this.elements.modalIcon.textContent = icon;
    this.elements.modalTitle.textContent = title;
    this.elements.modalMessage.textContent = message;
    this.elements.modalOverlay.classList.add('active');
  }

  /**
   * 隐藏模态框
   */
  hideModal() {
    this.elements.modalOverlay.classList.remove('active');
  }

  /**
   * 显示提示
   */
  showToast(message, type = 'success') {
    // 简单的 console 提示，可以扩展为 UI 提示
    console.log(message);
  }
}

// ========== 启动应用 ==========
document.addEventListener('DOMContentLoaded', () => {
  window.pomodoroTimer = new PomodoroTimer();
});
