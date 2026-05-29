// Mock data service: replace with real fetch logic when cloning the template.
export async function fetchTemplateSummary() {
  return {
    cards: [
      {
        title: '推荐目录',
        description: '让页面逻辑按职责分层，而不是继续膨胀单 HTML。',
        items: ['index.html 只保留入口与挂载点', 'components/ 放视图片段', 'services/ 放数据与 API 调用']
      },
      {
        title: 'ImportMaps 用法',
        description: '第三方依赖走 ImportMaps，本地业务模块走带版本号的动态导入。',
        items: ['稳定依赖可静态 import', '本地模块优先 ?v=window.G_VER', '避免 alias + query 的错误写法']
      },
      {
        title: '样式拆分',
        description: '基础样式与页面样式分离，按需再扩展组件样式。',
        items: ['base.css 提供全局变量', 'page.css 管理页面布局', '组件重样式时可再新增 component.css']
      }
    ]
  };
}
