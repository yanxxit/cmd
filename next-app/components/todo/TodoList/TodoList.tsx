/**
 * 任务列表组件
 */

'use client';

import React, { useState } from 'react';
import { Empty, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { TodoItem } from './TodoItem';
import type { Todo } from '../types';

interface TodoListProps {
  todos: Todo[];
  isDarkMode: boolean;
  loading?: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  isDarkMode,
  loading = false,
  onToggle,
  onDelete,
  onEdit,
}) => {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  // 切换子任务展开状态
  const toggleExpand = (id: number) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // 空状态
  if (todos.length === 0 && !loading) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无任务"
        style={{ padding: '48px 0' }}
      />
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: isDarkMode ? '#666' : '#999' }}>
          加载任务中...
        </div>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {todos.map((todo, index) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeOut',
            }}
          >
            <TodoItem
              todo={todo}
              isDarkMode={isDarkMode}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              isExpanded={expandedIds.includes(todo.id)}
              onExpand={() => toggleExpand(todo.id)}
              showSubTasks={todo.subTodos && todo.subTodos.length > 0}
            />

            {/* 子任务列表 */}
            {expandedIds.includes(todo.id) && todo.subTodos && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  marginLeft: 48,
                  marginTop: 8,
                  paddingLeft: 16,
                  borderLeft: `2px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                }}
              >
                {todo.subTodos.map((subTodo) => (
                  <TodoItem
                    key={subTodo.id}
                    todo={subTodo}
                    isDarkMode={isDarkMode}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    showSubTasks={false}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
