
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tool {
  icon: string;
  name: string;
  description: string;
  href: string;
  tags: string[];
}

interface Version {
  badge: string;
  name: string;
  tech: string;
  href: string;
  features: string[];
  recommended?: boolean;
  new?: boolean;
  color?: string;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toolCount, setToolCount] = useState(0);

  useEffect(() => {
    // 加载保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');

    // 动画计数
    const total = tools.length + versions.length;
    let current = 0;
    const increment = Math.ceil(total / 20);
    const timer = setInterval(() => {
      current += increment;
      if (current >= total) {
        setToolCount(total);
        clearInterval(timer);
      } else {
        setToolCount(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const tools: Tool[] = [
    {
      icon: '⚙️',
      name: '后台管理系统',
      description: '统一的后台管理界面，目前包含测试案例管理模块',
      href: '/admin',
      tags: ['Admin', '管理后台', '推荐'],
    },
    {
      icon: '📚',
      name: 'React + Ant Design 学习',
      description: '完整的学生管理系统案例，包含 CRUD 操作、表单处理、表格展示',
      href: '/react-antd-learning',
      tags: ['学习案例', '推荐', '入门必备'],
    },
    {
      icon: '🔀',
      name: 'JSON 对比工具',
      description: '对比两个 JSON 数据的差异，支持拼音排序、差异高亮、统计分析',
      href: '/json-diff-v3',
      tags: ['数据对比', 'JSON'],
    },
    {
      icon: '🔤',
      name: 'String to JSON',
      description: '将带有多层转义的字符串智能解析为格式化的 JSON，或将 JSON 压缩转义',
      href: '/string-to-json',
      tags: ['数据转换', 'JSON', '新'],
    },
    {
      icon: '🔄',
      name: 'JSON to YAML',
      description: 'JSON 和 YAML 格式数据双向互转，支持代码高亮与格式校验',
      href: '/json-to-yaml',
      tags: ['数据转换', 'YAML'],
    },
    {
      icon: '🍅',
      name: '番茄时钟',
      description: '专注工作学习的番茄钟，支持自定义时长与休息提醒',
      href: '/pomodoro',
      tags: ['时间管理', '生产力'],
    },
    {
      icon: '🎂',
      name: '年龄计算器',
      description: '支持公历/农历生日，精确计算年龄、总生存天数、生肖与星座',
      href: '/age-calculator',
      tags: ['生活工具', '新'],
    },
    {
      icon: '',
      name: '登录入口',
      description: '基于 Pico CSS 的登录页面，支持明暗主题切换',
      href: '/login',
      tags: ['认证', 'Pico CSS'],
    },
    {
      icon: '📝',
      name: 'Markdown 编辑器',
      description: '实时预览、复制 HTML、下载文件，支持代码高亮和表格',
      href: '/markdown-tool',
      tags: ['推荐', '编辑器', 'Markdown'],
    },
  ];

  const versions: Version[] = [
    {
      badge: 'v8',
      name: 'Next.js 16',
      tech: 'Next.js 16 + React 19',
      href: '/todo-v8',
      features: ['新', '推荐', '性能最优'],
      new: true,
      recommended: true,
      color: '#0ea5e9',
    },
  ];

  const cssVars = isDarkMode ? {
    '--primary': '#38bdf8',
    '--primary-dark': '#0284c7',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--danger': '#ef4444',
    '--bg-gradient-start': '#1f2937',
    '--bg-gradient-end': '#111827',
    '--card-bg': '#1f2937',
    '--text-primary': '#f9fafb',
    '--text-secondary': '#9ca3af',
    '--text-muted': '#6b7280',
    '--border-color': '#374151',
    '--tag-bg': '#374151',
    '--tag-text': '#d1d5db',
  } : {
    '--primary': '#0ea5e9',
    '--primary-dark': '#0284c7',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--danger': '#ef4444',
    '--bg-gradient-start': '#f5f7fa',
    '--bg-gradient-end': '#c3cfe2',
    '--card-bg': '#ffffff',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--tag-bg': '#f3f4f6',
    '--tag-text': '#4b5563',
  };

  return (
    <div style={{
      ...cssVars,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)',
      minHeight: '100vh',
      padding: '40px 20px',
      transition: 'all 0.3s ease',
    }}>
      {/* 主题切换按钮 */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--card-bg)',
          border: '2px solid var(--border-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        }}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 头部 */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '48px' }}>🧰</span>
            <span>Next.js 工具箱</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            本地开发工具集 · 高效 · 便捷 · 实用
          </p>
        </header>

        {/* 统计栏 */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>
              {toolCount}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>工具总数</span>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>9</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>核心工具</span>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>8</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>TODO 版本</span>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>100%</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>本地运行</span>
          </div>
        </div>

        {/* 核心工具 */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          margin: '40px 0 20px',
          paddingBottom: '12px',
          borderBottom: '2px solid var(--primary)',
          display: 'inline-block',
        }}>
          🔧 核心工具
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}>
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                border: '2px solid transparent',
                display: 'block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{tool.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {tool.name}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                {tool.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      background: tag === '推荐' ? '#d1fae5' : 'var(--tag-bg)',
                      color: tag === '推荐' ? '#065f46' : 'var(--tag-text)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* TODO 应用系列 */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          margin: '40px 0 20px',
          paddingBottom: '12px',
          borderBottom: '2px solid var(--primary)',
          display: 'inline-block',
        }}>
          ✅ TODO 应用系列
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {versions.map((version) => (
            <Link
              key={version.name}
              href={version.href}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
                borderLeft: `4px solid ${version.color || 'var(--primary)'}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 10px',
                  background: version.color || 'var(--primary)',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {version.badge}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {version.name}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {version.tech}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {version.features.map((feature) => (
                  <span
                    key={feature}
                    style={{
                      padding: '2px 8px',
                      background: feature === '推荐' || feature === '新'
                        ? (feature === '推荐' ? '#d1fae5' : '#dbeafe')
                        : 'var(--tag-bg)',
                      color: feature === '推荐'
                        ? '#065f46'
                        : feature === '新'
                        ? '#1d4ed8'
                        : 'var(--tag-text)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* 底部信息 */}
        <footer style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
        }}>
          <p>🚀 Next.js 工具箱 | 高效 · 便捷 · 实用</p>
          <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            所有工具均在本地运行，数据不会上传到服务器
          </p>
        </footer>
      </div>
    </div>
  );
}
