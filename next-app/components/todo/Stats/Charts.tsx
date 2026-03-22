/**
 * 统计图表组件
 */

'use client';

import React from 'react';
import { Card, theme } from 'antd';
import type { Todo } from '../types';

interface ChartsProps {
  todos: Todo[];
  stats: any;
  isDarkMode: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ todos, stats, isDarkMode }) => {
  const { token } = theme.useToken();

  // 计算优先级分布
  const priorityData = [
    { name: '高', value: todos.filter(t => t.priority === 1).length, color: '#ff4d4f' },
    { name: '中', value: todos.filter(t => t.priority === 2).length, color: '#fa8c16' },
    { name: '低', value: todos.filter(t => t.priority === 3).length, color: '#52c41a' },
  ];

  // 计算状态分布
  const statusData = [
    { name: '未完成', value: stats?.pending || 0, color: '#1890ff' },
    { name: '已完成', value: stats?.completed || 0, color: '#52c41a' },
  ];

  const total = priorityData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      {/* 优先级分布 */}
      <div style={{
        padding: 16,
        background: isDarkMode ? '#1f1f1f' : '#fff',
        borderRadius: 12,
        boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 16,
          color: isDarkMode ? '#fff' : '#000',
        }}>
          优先级分布
        </h3>
        
        {/* 简易饼图 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* 环形图 */}
          <div style={{
            width: 120,
            height: 120,
            position: 'relative',
          }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {priorityData.reduce((acc, item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const offset = acc.offset;
                const circle = (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                    strokeDashoffset={-offset * 2.51}
                  />
                );
                return { circles: [...acc.circles, circle], offset: offset + percentage };
              }, { circles: [] as any[], offset: 0 }).circles}
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: isDarkMode ? '#fff' : '#000' }}>
                {total}
              </div>
              <div style={{ fontSize: 10, color: isDarkMode ? '#666' : '#999' }}>总计</div>
            </div>
          </div>
          
          {/* 图例 */}
          <div style={{ flex: 1 }}>
            {priorityData.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: index < priorityData.length - 1 ? `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: item.color,
                  }} />
                  <span style={{ fontSize: 12, color: isDarkMode ? '#fff' : '#000' }}>
                    {item.name}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 状态分布 */}
      <div style={{
        padding: 16,
        background: isDarkMode ? '#1f1f1f' : '#fff',
        borderRadius: 12,
        boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 16,
          color: isDarkMode ? '#fff' : '#000',
        }}>
          任务状态
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {statusData.map((item, index) => {
            const percentage = stats?.total ? (item.value / stats.total) * 100 : 0;
            return (
              <div key={index}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: item.color,
                    }} />
                    <span style={{ fontSize: 12, color: isDarkMode ? '#fff' : '#000' }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
                    {item.value} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div style={{
                  height: 8,
                  background: isDarkMode ? '#303030' : '#f5f5f5',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: item.color,
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
