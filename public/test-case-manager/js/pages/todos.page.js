const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: TodoManager } = await import(window.getModuleUrl('./js/components/TodoManager.js'));

function TodosPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, 'TODO 列表'),
      h(Text, { type: 'secondary' }, '复用现有 TODO 能力并补齐跨天时间范围，用统一后台视图管理任务、标签和完成状态')
    ),
    h(TodoManager, { currentAdmin })
  );
}

export default TodosPage;

