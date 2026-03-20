/**
 * JSON 差异树组件
 * 递归展示 JSON 差异，支持展开/收起、高亮显示
 */

export default {
  name: 'JsonDiffTree',
  props: {
    diffData: {
      type: Object,
      default: () => ({})
    },
    leftData: {
      type: Object,
      default: () => ({})
    },
    rightData: {
      type: Object,
      default: () => ({})
    },
    hideSame: {
      type: Boolean,
      default: false
    },
    expandAll: {
      type: Boolean,
      default: true
    }
  },
  emits: ['node-click'],
  data() {
    return {
      expandedPaths: new Set()
    };
  },
  watch: {
    expandAll(val) {
      if (val) {
        this.expandedPaths.clear();
        this.collectAllPaths(this.diffData);
      } else {
        this.expandedPaths.clear();
      }
    },
    diffData: {
      handler() {
        this.expandedPaths.clear();
        if (this.expandAll) {
          this.collectAllPaths(this.diffData);
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.expandAll) {
      this.collectAllPaths(this.diffData);
    }
  },
  methods: {
    collectAllPaths(obj, prefix = '') {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        this.expandedPaths.add(path);
        const value = obj[key];
        if (value && typeof value === 'object' && value.leftValue && typeof value.leftValue === 'object') {
          this.collectAllPaths(value.leftValue, path);
        } else if (value && typeof value === 'object' && value.rightValue && typeof value.rightValue === 'object') {
          this.collectAllPaths(value.rightValue, path);
        }
      });
    },
    isExpandable(value) {
      return value && typeof value === 'object' && (typeof value.leftValue === 'object' || typeof value.rightValue === 'object');
    },
    isExpanded(path) {
      return this.expandedPaths.has(path);
    },
    toggleExpand(path, event) {
      event.stopPropagation();
      if (this.expandedPaths.has(path)) {
        this.expandedPaths.delete(path);
      } else {
        this.expandedPaths.add(path);
      }
    },
    expandAllPaths() {
      this.expandedPaths.clear();
      this.collectAllPaths(this.diffData);
    },
    collapseAllPaths() {
      this.expandedPaths.clear();
    },
    getActionClass(action) {
      return `diff-${action}`;
    },
    renderValue(value) {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      const type = typeof value;
      if (type === 'string') return `"${value}"`;
      if (type === 'object') {
        if (Array.isArray(value)) return `[Array(${value.length})]`;
        return `{${Object.keys(value).length} keys}`;
      }
      return String(value);
    },
    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    getActionLabel(action) {
      const labels = { 'same': '相同', 'modified': '修改', 'added': '新增', 'deleted': '删除' };
      return labels[action] || action;
    },
    getNodeStyle(action) {
      const styles = {
        'same': { opacity: 0.7 },
        'modified': { background: 'rgba(59, 130, 246, 0.15)', borderLeft: '3px solid #3b82f6' },
        'added': { background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444' },
        'deleted': { background: 'rgba(245, 158, 11, 0.15)', borderLeft: '3px solid #f59e0b' }
      };
      return styles[action] || {};
    }
  },
  computed: {
    filteredDiffData() {
      if (!this.hideSame) return this.diffData;
      const filtered = {};
      for (const [key, value] of Object.entries(this.diffData)) {
        if (value.action !== 'same') filtered[key] = value;
      }
      return filtered;
    },
    isEmpty() {
      return Object.keys(this.filteredDiffData).length === 0;
    },
    emptyMessage() {
      return this.hideSame ? '🎉 没有差异！' : '暂无数据';
    }
  },
  template: `
    <div class="json-diff-tree">
      <div v-if="isEmpty" class="empty-message">{{ emptyMessage }}</div>
      <div v-else>
        <div v-for="(value, key) in filteredDiffData" :key="key" class="diff-node" :class="'diff-' + (value.action || 'same')" :style="getNodeStyle(value.action)">
          <div class="node-content">
            <span v-if="isExpandable(value)" class="expand-icon" @click.stop="toggleExpand(key, $event)">
              {{ isExpanded(key) ? '▼' : '▶' }}
            </span>
            <span v-else class="expand-icon-empty"></span>
            <span class="node-key">{{ key }}</span>
            <span class="node-separator">: </span>
            
            <div v-if="value.action === 'modified'" class="diff-values">
              <div class="diff-value left">
                <span class="value-label">左:</span> {{ renderValue(value.leftValue) }}
              </div>
              <div class="diff-value right">
                <span class="value-label">右:</span> {{ renderValue(value.rightValue) }}
              </div>
            </div>
            <span v-else class="node-value">{{ renderValue(value.action === 'deleted' ? value.leftValue : value.rightValue) }}</span>
            
            <span class="action-badge" :class="value.action">{{ getActionLabel(value.action) }}</span>
          </div>
          
          <div v-if="isExpandable(value) && isExpanded(key)" class="node-children">
            <div v-for="(childVal, childKey) in (value.action === 'deleted' ? value.leftValue : value.rightValue)" 
                 :key="childKey" 
                 class="diff-node diff-same"
                 style="padding-left: 20px">
              <div class="node-content">
                <span class="expand-icon-empty"></span>
                <span class="node-key">{{ childKey }}</span>
                <span class="node-separator">: </span>
                <span class="node-value">{{ renderValue(childVal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
