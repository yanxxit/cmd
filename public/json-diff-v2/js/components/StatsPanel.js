/**
 * 统计面板组件
 * 展示差异统计信息和进度条
 */

export default {
  name: 'StatsPanel',
  props: {
    stats: {
      type: Object,
      default: () => ({
        total: 0,
        same: 0,
        modified: 0,
        added: 0,
        deleted: 0
      })
    },
    diffPercentage: {
      type: Number,
      default: 0
    }
  },
  emits: ['stat-click'],
  computed: {
    diffCount() {
      return this.stats.modified + this.stats.added + this.stats.deleted;
    },
    samePercentage() {
      if (this.stats.total === 0) return 0;
      return Math.round((this.stats.same / this.stats.total) * 100);
    }
  },
  methods: {
    getStatClass(type) {
      return `stat-${type}`;
    },
    getStatColor(type) {
      const colors = {
        'total': '#3b82f6',
        'same': '#10b981',
        'modified': '#3b82f6',
        'added': '#ef4444',
        'deleted': '#f59e0b'
      };
      return colors[type] || '#666';
    },
    getStatIcon(type) {
      const icons = {
        'total': '📊',
        'same': '✅',
        'modified': '✏️',
        'added': '➕',
        'deleted': '➖'
      };
      return icons[type] || '📊';
    },
    onStatClick(type) {
      this.$emit('stat-click', type);
    }
  },
  template: `
    <div class="stats-panel">
      <div class="stats-header">
        <h3 class="stats-title">📊 差异统计</h3>
        <span class="stats-summary">
          差异率：<strong :style="{ color: diffPercentage > 50 ? '#ef4444' : '#10b981' }">
            {{ diffPercentage }}%
          </strong>
        </span>
      </div>
      
      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div class="progress-segment stat-same" 
               :style="{ width: samePercentage + '%' }" 
               title="相同"></div>
          <div class="progress-segment stat-modified" 
               :style="{ width: (stats.modified / stats.total * 100) + '%' }" 
               title="修改"></div>
          <div class="progress-segment stat-added" 
               :style="{ width: (stats.added / stats.total * 100) + '%' }" 
               title="新增"></div>
          <div class="progress-segment stat-deleted" 
               :style="{ width: (stats.deleted / stats.total * 100) + '%' }" 
               title="删除"></div>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card stat-total" @click="onStatClick('total')">
          <span class="stat-icon">{{ getStatIcon('total') }}</span>
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">总节点数</span>
        </div>
        
        <div class="stat-card stat-same" @click="onStatClick('same')">
          <span class="stat-icon">{{ getStatIcon('same') }}</span>
          <span class="stat-number" :style="{ color: getStatColor('same') }">
            {{ stats.same }}
          </span>
          <span class="stat-label">相同</span>
        </div>
        
        <div class="stat-card stat-modified" @click="onStatClick('modified')">
          <span class="stat-icon">{{ getStatIcon('modified') }}</span>
          <span class="stat-number" :style="{ color: getStatColor('modified') }">
            {{ stats.modified }}
          </span>
          <span class="stat-label">修改</span>
        </div>
        
        <div class="stat-card stat-added" @click="onStatClick('added')">
          <span class="stat-icon">{{ getStatIcon('added') }}</span>
          <span class="stat-number" :style="{ color: getStatColor('added') }">
            {{ stats.added }}
          </span>
          <span class="stat-label">新增</span>
        </div>
        
        <div class="stat-card stat-deleted" @click="onStatClick('deleted')">
          <span class="stat-icon">{{ getStatIcon('deleted') }}</span>
          <span class="stat-number" :style="{ color: getStatColor('deleted') }">
            {{ stats.deleted }}
          </span>
          <span class="stat-label">删除</span>
        </div>
      </div>
    </div>
  `
};
