/**
 * TODO List 应用主页面
 * 访问地址：/todo-v8
 */

'use client';

import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { Layout } from 'antd';
import { TopNav, SideBar } from '@/components/todo/Layout';
import { QuickAdd } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';
import { useTodo, useTheme } from '@/components/todo/hooks';
import type { Todo } from '@/components/todo/types';

const { Content } = Layout;

export default function TodoV8Page() {
  // 主题
  const { isDarkMode, toggleTheme } = useTheme();
  
  // TODO 数据
  const { 
    todos, 
    filteredTodos, 
    stats, 
    loading, 
    filter, 
    sort, 
    view, 
    search,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setFilter,
    setSort,
    setView,
    setSearch,
  } = useTodo();
  
  // 侧边栏折叠状态
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  
  // 编辑中的任务
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  // 处理添加任务
  const handleAdd = (
    content: string,
    priority?: number,
    due_date?: string | null,
    due_time?: string | null,
    tags?: string[],
    category?: string
  ) => {
    addTodo({
      content,
      priority: priority as 1 | 2 | 3 | undefined,
      due_date,
      due_time,
      tags,
      category,
    });
  };
  
  // 处理编辑任务
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    // TODO: 打开编辑对话框
  };
  
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* 顶部导航 */}
        <TopNav
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onMenuClick={() => setSideBarCollapsed(!sideBarCollapsed)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        
        <Layout>
          {/* 侧边栏 */}
          <SideBar
            isDarkMode={isDarkMode}
            currentView={view}
            onViewChange={setView}
            collapsed={sideBarCollapsed}
            onCollapse={setSideBarCollapsed}
            stats={stats || undefined}
          />
          
          {/* 主内容区 */}
          <Content
            style={{
              padding: 24,
              background: isDarkMode ? '#141414' : '#f0f2f5',
              minHeight: 'calc(100vh - 64px)',
            }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              {/* 页面标题 */}
              <h1 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                marginBottom: 24,
                color: isDarkMode ? '#fff' : '#000',
              }}>
                {view === 'all' && '全部任务'}
                {view === 'today' && '今天'}
                {view === 'week' && '本周'}
                {view === 'upcoming' && '即将到期'}
                {view === 'completed' && '已完成'}
                {view === 'no-date' && '无日期'}
              </h1>
              
              {/* 统计信息 */}
              {stats && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: 16, 
                  marginBottom: 24 
                }}>
                  <div style={{
                    padding: 16,
                    background: isDarkMode ? '#1f1f1f' : '#fff',
                    borderRadius: 8,
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>总任务</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
                      {stats.total}
                    </div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: isDarkMode ? '#1f1f1f' : '#fff',
                    borderRadius: 8,
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>未完成</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                      {stats.pending}
                    </div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: isDarkMode ? '#1f1f1f' : '#fff',
                    borderRadius: 8,
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>已完成</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                      {stats.completed}
                    </div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: isDarkMode ? '#1f1f1f' : '#fff',
                    borderRadius: 8,
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>逾期</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                      {stats.overdue}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 快速添加任务 */}
              <QuickAdd onAdd={handleAdd} isDarkMode={isDarkMode} />
              
              {/* 任务列表 */}
              <TodoList
                todos={filteredTodos}
                isDarkMode={isDarkMode}
                loading={loading}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={handleEdit}
              />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
