/**
 * Web IDE Lite v2 - 主入口
 */
import { createApp } from 'vue';
import { state } from './state.js';
import { createComputed } from './computed.js';
import { actions } from './actions.js';
import { useComposables } from './composables.js';

export function createWebIDE() {
  const app = createApp({
    setup() {
      const stateObj = state();
      const computedObj = createComputed(stateObj);
      const actionsObj = actions(stateObj);
      const composables = useComposables(stateObj, actionsObj);
      
      return {
        ...stateObj,
        ...computedObj,
        ...actionsObj,
        ...composables
      };
    }
  });
  
  return app;
}

// 挂载应用
const app = createWebIDE();
app.mount('#app');
