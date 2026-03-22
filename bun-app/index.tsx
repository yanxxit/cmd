import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bun + React 开发模式</h1>
      <p>点击次数：{count}</p>
      <button onClick={() => setCount(count + 1)}>
        点我试试 (支持热更新)
      </button>
    </div>
  );
}