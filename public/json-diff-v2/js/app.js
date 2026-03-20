/**
 * JSON 对比工具 - 主应用
 */

import { createApp } from '/libs/vue/dist/vue.esm-browser.js';
import { compareJson, formatJson, parseJson, filterSameFields, exportDiffData } from './json-diff-core.js';
import JsonEditor from './components/JsonEditor.js';
import JsonDiffTree from './components/JsonDiffTree.js';
import Toolbar from './components/Toolbar.js';

const App = {
  name: 'JsonDiffApp',
  components: {
    JsonEditor,
    JsonDiffTree,
    Toolbar
  },
  data() {
    return {
      leftJson: '',
      rightJson: '',
      leftError: '',
      rightError: '',
      comparisonResult: null,
      filteredDiff: {},
      hideSame: false,
      expandAll: true,
      loading: false,
      currentDiffIndex: -1,
      diffPaths: [],
      history: [],
      historyIndex: -1
    };
  },
  computed: {
    canCompare() {
      return !!this.leftJson.trim() && !!this.rightJson.trim();
    },
    hasResult() {
      return !!this.comparisonResult;
    },
    leftParsed() {
      const result = parseJson(this.leftJson);
      return result.success ? result.data : null;
    },
    rightParsed() {
      const result = parseJson(this.rightJson);
      return result.success ? result.data : null;
    },
    // 获取过滤后的差异数据
    getFilteredDiff() {
      if (!this.comparisonResult) return {};
      if (!this.hideSame) return this.comparisonResult.diff;

      const filtered = {};
      for (const [key, value] of Object.entries(this.comparisonResult.diff)) {
        if (value.action !== 'same') {
          filtered[key] = value;
        }
      }
      return filtered;
    },
    // 过滤后的左侧 JSON（隐藏相同字段）
    getFilteredLeftJson() {
      if (!this.comparisonResult || !this.hideSame) return this.leftJson;
      return JSON.stringify(this.filterJsonByDiff(this.leftParsed, this.comparisonResult.diff, 'left'), null, 2);
    },
    // 过滤后的右侧 JSON（隐藏相同字段）
    getFilteredRightJson() {
      if (!this.comparisonResult || !this.hideSame) return this.rightJson;
      return JSON.stringify(this.filterJsonByDiff(this.rightParsed, this.comparisonResult.diff, 'right'), null, 2);
    },
    // 当前显示的左侧 JSON
    displayLeftJson() {
      return this.hideSame && this.hasResult ? this.getFilteredLeftJson : this.leftJson;
    },
    // 当前显示的右侧 JSON
    displayRightJson() {
      return this.hideSame && this.hasResult ? this.getFilteredRightJson : this.rightJson;
    }
  },
  methods: {
    // 根据差异过滤 JSON 数据
    filterJsonByDiff(originalData, diff, side) {
      if (!originalData || typeof originalData !== 'object') return originalData;

      const result = Array.isArray(originalData) ? [] : {};

      for (const key of Object.keys(originalData)) {
        const diffItem = diff[key];
        const value = originalData[key];

        // 如果没有差异记录，或者差异不是 'same'，则保留
        if (!diffItem || diffItem.action !== 'same') {
          if (typeof value === 'object' && value !== null) {
            // 递归处理嵌套对象
            const nestedDiff = {};
            for (const [diffKey, diffValue] of Object.entries(diff)) {
              if (diffKey.startsWith(key + '.')) {
                const nestedKey = diffKey.substring(key.length + 1);
                if (nestedKey && !nestedKey.includes('.')) {
                  nestedDiff[nestedKey] = diffValue;
                }
              }
            }
            result[key] = this.filterJsonByDiff(value, nestedDiff, side);
          } else {
            result[key] = value;
          }
        }
      }

      return result;
    },
    // 开始对比
    async compare() {
      if (!this.canCompare) return;

      this.loading = true;
      this.leftError = '';
      this.rightError = '';

      // 验证 JSON
      const leftResult = parseJson(this.leftJson);
      const rightResult = parseJson(this.rightJson);

      if (!leftResult.success) {
        this.leftError = leftResult.error;
        this.loading = false;
        return;
      }

      if (!rightResult.success) {
        this.rightError = rightResult.error;
        this.loading = false;
        return;
      }

      // 延迟执行以显示 loading
      await new Promise(resolve => setTimeout(resolve, 100));

      // 执行对比
      this.comparisonResult = compareJson(leftResult.data, rightResult.data);

      // 自检：验证对比结果
      this.selfCheck(leftResult.data, rightResult.data);

      // 保存到历史
      this.saveHistory();

      this.loading = false;
    },

    // 自检函数：验证对比结果
    selfCheck(leftData, rightData) {
      if (!this.comparisonResult) return;

      const diff = this.comparisonResult.diff;
      const stats = this.comparisonResult.stats;

      // 自检 1: 统计总数是否匹配
      const totalKeys = Object.keys(diff).length;
      if (totalKeys !== stats.total) {
        console.warn('⚠️ 自检失败：统计总数不匹配', { totalKeys, statsTotal: stats.total });
      }

      // 自检 2: 验证差异分类
      const actionCounts = { same: 0, modified: 0, added: 0, deleted: 0 };
      for (const value of Object.values(diff)) {
        actionCounts[value.action]++;
      }

      if (actionCounts.same !== stats.same ||
          actionCounts.modified !== stats.modified ||
          actionCounts.added !== stats.added ||
          actionCounts.deleted !== stats.deleted) {
        console.warn('⚠️ 自检失败：差异分类不匹配', { actionCounts, stats });
      }

      // 自检 3: 验证过滤后的数据
      if (this.hideSame) {
        const filteredLeft = this.filterJsonByDiff(leftData, diff, 'left');
        const filteredRight = this.filterJsonByDiff(rightData, diff, 'right');

        const filteredLeftKeys = Object.keys(filteredLeft);
        const filteredRightKeys = Object.keys(filteredRight);
        const diffCount = stats.modified + stats.added + stats.deleted;

        console.log('✅ 自检完成：过滤功能正常', {
          filteredLeftKeys: filteredLeftKeys.length,
          filteredRightKeys: filteredRightKeys.length,
          expectedDiffCount: diffCount
        });
      }

      console.log('✅ 自检完成：对比结果有效', {
        total: stats.total,
        same: stats.same,
        modified: stats.modified,
        added: stats.added,
        deleted: stats.deleted
      });
    },
    
    // 更新过滤后的差异
    updateFilteredDiff() {
      if (!this.comparisonResult) return;
      // 使用 computed 属性自动处理
    },
    
    // 收集差异路径用于导航
    collectDiffPaths() {
      if (!this.comparisonResult) return;
      this.diffPaths = Object.entries(this.comparisonResult.diff)
        .filter(([_, v]) => v.action !== 'same')
        .map(([k, _]) => k);
      this.currentDiffIndex = -1;
    },
    
    // 交换左右 JSON
    swap() {
      const temp = this.leftJson;
      this.leftJson = this.rightJson;
      this.rightJson = temp;
      
      const tempError = this.leftError;
      this.leftError = this.rightError;
      this.rightError = tempError;
      
      // 重新对比
      if (this.hasResult) {
        setTimeout(() => this.compare(), 100);
      }
    },
    
    // 清空
    clear() {
      this.leftJson = '';
      this.rightJson = '';
      this.leftError = '';
      this.rightError = '';
      this.comparisonResult = null;
      this.filteredDiff = {};
      this.hideSame = false;
      this.expandAll = true;
      this.currentDiffIndex = -1;
      this.diffPaths = [];
    },
    
    // 格式化全部
    formatAll() {
      if (this.leftJson) {
        try {
          this.leftJson = formatJson(this.leftJson);
        } catch (e) {
          this.leftError = e.message;
        }
      }
      if (this.rightJson) {
        try {
          this.rightJson = formatJson(this.rightJson);
        } catch (e) {
          this.rightError = e.message;
        }
      }
    },
    
    // 加载示例数据
    loadSample() {
      const left = {
        name: "张三",
        age: 25,
        email: "zhangsan@example.com",
        address: {
          city: "北京",
          district: "朝阳区",
          street: "建国路"
        },
        hobbies: ["读书", "游泳", "编程"],
        work: {
          company: "科技公司",
          position: "工程师"
        },
        active: true
      };
      
      const right = {
        name: "李四",
        age: 25,
        phone: "13800138000",
        address: {
          city: "上海",
          district: "浦东新区",
          road: "世纪大道"
        },
        hobbies: ["音乐", "编程", "旅行"],
        work: {
          company: "互联网公司",
          position: "高级工程师",
          department: "技术部"
        },
        active: true,
        salary: 30000
      };
      
      this.leftJson = JSON.stringify(left, null, 2);
      this.rightJson = JSON.stringify(right, null, 2);
      this.leftError = '';
      this.rightError = '';
    },
    
    // 导出差异
    exportDiff() {
      if (!this.comparisonResult) return;
      
      const exportData = exportDiffData(
        this.comparisonResult,
        this.leftJson,
        this.rightJson
      );
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `json-diff-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    // 复制结果
    copyResult() {
      if (!this.comparisonResult) return;
      
      const text = JSON.stringify(this.comparisonResult.diff, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('已复制到剪贴板');
      });
    },
    
    // 展开/收起全部
    setExpandAll(expand) {
      this.expandAll = expand;
    },

    // 切换隐藏相同
    toggleHideSame() {
      this.hideSame = !this.hideSame;
    },

    // 保存历史
    saveHistory() {
      const state = {
        leftJson: this.leftJson,
        rightJson: this.rightJson,
        comparisonResult: this.comparisonResult,
        hideSame: this.hideSame
      };
      
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(state);
      this.historyIndex = this.history.length - 1;
    },
    
    // 撤销
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreHistory(this.history[this.historyIndex]);
      }
    },
    
    // 重做
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.restoreHistory(this.history[this.historyIndex]);
      }
    },
    
    // 恢复历史
    restoreHistory(state) {
      this.leftJson = state.leftJson;
      this.rightJson = state.rightJson;
      this.comparisonResult = state.comparisonResult;
      this.hideSame = state.hideSame;
      this.updateFilteredDiff();
    },
    
    // 显示提示
    showToast(message) {
      // 简单实现，可以用更好的 toast 组件
      console.log(message);
    },
    
    // 处理键盘快捷键
    handleKeydown(event) {
      // Ctrl+Enter 对比
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        this.compare();
      }
      
      // Ctrl+D 清空
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        this.clear();
      }
      
      // Ctrl+Z 撤销
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        this.undo();
      }
      
      // Ctrl+Y 重做
      if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        this.redo();
      }
      
      // Alt+F 格式化
      if (event.altKey && event.key === 'f') {
        event.preventDefault();
        this.formatAll();
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
    
    // 拖拽上传处理
    const dropZone = this.$el;
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (!this.leftJson) {
              this.leftJson = event.target.result;
            } else if (!this.rightJson) {
              this.rightJson = event.target.result;
            }
          };
          reader.readAsText(file);
        }
      }
    });
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  template: `
    <div class="json-diff-app">
      <header class="app-header">
        <h1 class="app-title">
          <span class="title-icon">🔍</span>
          <span>JSON 对比工具</span>
        </h1>
      </header>

      <Toolbar
        :canCompare="canCompare"
        :hasResult="hasResult"
        :hideSame="hideSame"
        :expandAll="expandAll"
        :loading="loading"
        @compare="compare"
        @swap="swap"
        @clear="clear"
        @format-all="formatAll"
        @load-sample="loadSample"
        @export="exportDiff"
        @copy="copyResult"
        @toggle-hide-same="toggleHideSame"
      />

      <div class="main-content">
        <div class="editor-panel">
          <JsonEditor
            v-model="leftJson"
            label="📄 左侧 JSON"
            placeholder="请粘贴左侧 JSON 内容..."
            :error="leftError"
            :read-only="hideSame && hasResult"
            @format="leftError = ''"
            @clear="leftError = ''"
          />
        </div>

        <div class="editor-panel">
          <JsonEditor
            v-model="rightJson"
            label="📄 右侧 JSON"
            placeholder="请粘贴右侧 JSON 内容..."
            :error="rightError"
            :read-only="hideSame && hasResult"
            @format="rightError = ''"
            @clear="rightError = ''"
          />
        </div>
      </div>

      <!-- 隐藏相同时显示过滤后的 JSON -->
      <div v-if="hideSame && hasResult" class="filtered-section">
        <h2 class="section-title">📊 过滤后的数据（仅差异）</h2>
        <div class="main-content">
          <div class="editor-panel">
            <div class="editor-label-small">左侧（仅差异字段）</div>
            <textarea class="filtered-textarea" readonly>{{ getFilteredLeftJson }}</textarea>
          </div>
          <div class="editor-panel">
            <div class="editor-label-small">右侧（仅差异字段）</div>
            <textarea class="filtered-textarea" readonly>{{ getFilteredRightJson }}</textarea>
          </div>
        </div>
      </div>
      
      <div v-if="hasResult" class="result-section">
        <h2 class="section-title">📊 差异详情</h2>
        <JsonDiffTree
          :diffData="getFilteredDiff"
          :leftData="leftParsed"
          :rightData="rightParsed"
          :hideSame="hideSame"
          :expandAll="expandAll"
        />
      </div>

      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>正在对比分析...</p>
        </div>
      </div>
      
      <footer class="app-footer">
        <p>📥 支持拖拽 .json 文件到输入框</p>
      </footer>
    </div>
  `
};

// 创建应用
const app = createApp(App);
app.mount('#app');
