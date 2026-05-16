const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: PomodoroManager } = await import(window.getModuleUrl('./js/components/PomodoroManager.js'));

function PomodoroPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '番茄时钟'),
      h(Text, { type: 'secondary' }, '集中查看番茄记录、最近 7 天趋势与专注设置，并支持手动补录记录')
    ),
    h(PomodoroManager, { currentAdmin })
  );
}

export default PomodoroPage;

