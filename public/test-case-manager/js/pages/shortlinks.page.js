const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: ShortLinkManager } = await import(window.getModuleUrl('./js/components/ShortLinkManager.js'));

function ShortLinksPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '短链接管理'),
      h(Text, { type: 'secondary' }, '集中查看系统短链接，支持按点击数排序、启停控制、复制和删除')
    ),
    h(ShortLinkManager, { currentAdmin })
  );
}

export default ShortLinksPage;

