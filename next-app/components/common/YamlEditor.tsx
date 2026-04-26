import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';

interface YamlEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({
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
        extensions={[yaml()]}
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
