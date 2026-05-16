const { createElement: h, useEffect, useRef, useState } = React;
const { Alert, Spin } = antd;

function RichTextEditor({ value, onChange, placeholder = '请输入内容...', height = 320 }) {
  const editorElRef = useRef(null);
  const quillRef = useRef(null);
  const syncingRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!editorElRef.current || quillRef.current) return;
    if (typeof window.Quill === 'undefined') return;

    const quill = new window.Quill(editorElRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block', 'link', 'image'],
          ['clean'],
        ],
      },
    });

    quill.root.innerHTML = value || '';
    quill.on('text-change', () => {
      if (syncingRef.current) return;
      if (typeof onChange === 'function') {
        onChange(quill.root.innerHTML);
      }
    });

    quillRef.current = quill;
    setReady(true);
  }, [onChange, placeholder, value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const nextHTML = value || '';
    if (quill.root.innerHTML === nextHTML) return;
    syncingRef.current = true;
    quill.root.innerHTML = nextHTML;
    syncingRef.current = false;
  }, [value]);

  if (typeof window.Quill === 'undefined') {
    return h(Alert, {
      type: 'warning',
      showIcon: true,
      message: '富文本编辑器资源未加载，请刷新页面后重试',
    });
  }

  return h(
    'div',
    { className: 'rich-editor-shell' },
    !ready
      ? h(
          'div',
          { className: 'rich-editor-loading' },
          h(Spin, { size: 'small', tip: '正在初始化编辑器...' })
        )
      : null,
    h('div', {
      ref: editorElRef,
      className: 'rich-editor',
      style: { minHeight: `${height}px` },
    })
  );
}

export default RichTextEditor;
