const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: EnvVariableManager } = await import(window.getModuleUrl('./js/components/EnvVariableManager.js'));

function EnvsPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '环境变量管理'),
      h(Text, { type: 'secondary' }, '统一管理运行时环境变量，支持字符串、数字、布尔值、JSON、数据库对象与数组类型，保存后即时生效')
    ),
    h(EnvVariableManager, { currentAdmin })
  );
}

export default EnvsPage;
