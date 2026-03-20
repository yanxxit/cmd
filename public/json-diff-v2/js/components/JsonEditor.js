/**
 * JSON 编辑器组件
 * 支持代码编辑、格式化、验证等功能
 */

export default {
  name: 'JsonEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'JSON 输入'
    },
    placeholder: {
      type: String,
      default: '请粘贴 JSON 内容...'
    },
    error: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'format', 'clear', 'error'],
  data() {
    return {
      localValue: this.modelValue,
      isFocused: false,
      cursorPosition: { line: 1, column: 1 }
    };
  },
  watch: {
    modelValue(val) {
      if (val !== this.localValue) {
        this.localValue = val;
      }
    }
  },
  computed: {
    lineCount() {
      return this.localValue.split('\n').length;
    },
    charCount() {
      return this.localValue.length;
    },
    hasError() {
      return !!this.error;
    }
  },
  methods: {
    handleInput(event) {
      this.localValue = event.target.value;
      this.$emit('update:modelValue', this.localValue);
      this.updateCursorPosition();
    },
    handleFocus() {
      this.isFocused = true;
    },
    handleBlur() {
      this.isFocused = false;
      this.$emit('blur');
    },
    updateCursorPosition() {
      const textarea = this.$refs.textarea;
      if (!textarea) return;
      
      const pos = textarea.selectionStart;
      const textBefore = this.localValue.substring(0, pos);
      const lines = textBefore.split('\n');
      
      this.cursorPosition = {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
      };
    },
    format() {
      try {
        const parsed = JSON.parse(this.localValue);
        const formatted = JSON.stringify(parsed, null, 2);
        this.localValue = formatted;
        this.$emit('update:modelValue', formatted);
        this.$emit('format');
      } catch (e) {
        this.$emit('error', e.message);
      }
    },
    clear() {
      this.localValue = '';
      this.$emit('update:modelValue', '');
      this.$emit('clear');
    },
    loadFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.localValue = e.target.result;
        this.$emit('update:modelValue', e.target.result);
      };
      reader.readAsText(file);
    },
    selectAll() {
      this.$refs.textarea?.select();
    },
    copy() {
      this.$refs.textarea?.select();
      document.execCommand('copy');
    }
  },
  template: `
    <div class="json-editor" :class="{ focused: isFocused, error: hasError }">
      <div class="editor-header">
        <span class="editor-label">{{ label }}</span>
        <div class="editor-actions">
          <button class="btn-icon" @click="format" title="格式化 (Alt+F)">
            ✨
          </button>
          <button class="btn-icon" @click="copy" title="复制">
            📋
          </button>
          <button class="btn-icon" @click="clear" title="清空">
            🗑️
          </button>
        </div>
      </div>
      
      <div class="editor-wrapper">
        <div class="line-numbers">
          <div v-for="i in lineCount" :key="i" class="line-number">{{ i }}</div>
        </div>
        
        <textarea
          ref="textarea"
          v-model="localValue"
          class="editor-textarea"
          :class="{ 'has-error': hasError }"
          :placeholder="placeholder"
          :readonly="readOnly"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @click="updateCursorPosition"
          @keyup="updateCursorPosition"
          spellcheck="false"
        ></textarea>
      </div>
      
      <div class="editor-footer">
        <span class="editor-info">
          {{ lineCount }} 行 · {{ charCount }} 字符 · 
          Ln {{ cursorPosition.line }}, Col {{ cursorPosition.column }}
        </span>
        <span v-if="error" class="editor-error">{{ error }}</span>
      </div>
    </div>
  `
};
