/**
 * 工具栏组件
 * 包含所有操作按钮和开关
 */

export default {
  name: 'Toolbar',
  props: {
    canCompare: {
      type: Boolean,
      default: false
    },
    hasResult: {
      type: Boolean,
      default: false
    },
    hideSame: {
      type: Boolean,
      default: false
    },
    expandAll: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'compare',
    'swap',
    'clear',
    'format-all',
    'load-sample',
    'export',
    'copy',
    'toggle-hide-same'
  ],
  methods: {
    handleCompare() {
      this.$emit('compare');
    },
    handleSwap() {
      this.$emit('swap');
    },
    handleClear() {
      this.$emit('clear');
    },
    handleFormatAll() {
      this.$emit('format-all');
    },
    handleLoadSample() {
      this.$emit('load-sample');
    },
    handleExport() {
      this.$emit('export');
    },
    handleCopy() {
      this.$emit('copy');
    },
    handleToggleHideSame() {
      this.$emit('toggle-hide-same');
    }
  },
  template: `
    <div class="toolbar">
      <div class="toolbar-section">
        <button class="btn btn-primary"
                @click="handleCompare"
                :disabled="!canCompare || loading">
          <span class="btn-icon">🔍</span>
          <span>{{ loading ? '对比中...' : '开始对比' }}</span>
        </button>

        <button class="btn btn-secondary"
                @click="handleSwap"
                :disabled="!canCompare">
          <span class="btn-icon">🔄</span>
          <span>交换</span>
        </button>

        <button class="btn btn-secondary"
                @click="handleFormatAll"
                :disabled="!canCompare">
          <span class="btn-icon">✨</span>
          <span>格式化</span>
        </button>

        <button class="btn btn-secondary"
                @click="handleLoadSample">
          <span class="btn-icon">📝</span>
          <span>示例</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <label class="toggle-switch" :class="{ active: hideSame }">
          <input type="checkbox"
                 :checked="hideSame"
                 @change="handleToggleHideSame" />
          <span class="toggle-slider"></span>
          <span class="toggle-label">隐藏相同</span>
        </label>

        <button class="btn btn-secondary"
                @click="handleCopy"
                :disabled="!hasResult">
          <span class="btn-icon">📋</span>
          <span>复制</span>
        </button>

        <button class="btn btn-success"
                @click="handleExport"
                :disabled="!hasResult">
          <span class="btn-icon">📥</span>
          <span>导出</span>
        </button>

        <button class="btn btn-danger"
                @click="handleClear"
                :disabled="!canCompare">
          <span class="btn-icon">🗑️</span>
          <span>清空</span>
        </button>
      </div>
    </div>
  `
};
