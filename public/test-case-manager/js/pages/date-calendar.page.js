const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: DateCalendarManager } = await import(window.getModuleUrl('./js/components/DateCalendarManager.js'));

function DateCalendarPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '日历列表'),
      h(Text, { type: 'secondary' }, '按月查看日期格中的 TODO 任务与番茄记录，并支持同日混排与跨天任务展示')
    ),
    h(DateCalendarManager, { currentAdmin })
  );
}

export default DateCalendarPage;
