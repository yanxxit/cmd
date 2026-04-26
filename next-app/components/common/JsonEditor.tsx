import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

interface JsonEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value = '',
  onChange,
  height = '200px',
  readOnly = false,
}) => {
  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <CodeMirror
        value={value}
        height={height}
        extensions={[json()]}
        onChange={onChange}
        readOnly={readOnly}
        theme="light"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
        }}
      />
    </div>
  );
};
