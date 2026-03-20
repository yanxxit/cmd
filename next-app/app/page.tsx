
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Next App 工具箱</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: 12 }}>
          <Link href="/json-diff" style={{ fontSize: 18 }}>
            🔀 JSON 对比工具
          </Link>
        </li>
        <li style={{ marginBottom: 12 }}>
          <Link href="/hello" style={{ fontSize: 18 }}>
            👋 Hello 页面
          </Link>
        </li>
        <li style={{ marginBottom: 12 }}>
          <Link href="/login" style={{ fontSize: 18 }}>
            🔐 登录页面
          </Link>
        </li>
      </ul>
    </div>
  );
}
