/**
 * 统计面板组件
 */

'use client';

import React from 'react';
import { Card, Statistic, Progress, theme } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { TodoStats } from '../types';

interface StatsPanelProps {
  stats: TodoStats;
  isDarkMode: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isDarkMode }) => {
  const { token } = theme.useToken();

  const statCards = [
    {
      title: '总任务',
      value: stats.total,
      icon: <InboxOutlined />,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
    },
    {
      title: '未完成',
      value: stats.pending,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)',
    },
    {
      title: '逾期',
      value: stats.overdue,
      icon: <ExclamationCircleOutlined />,
      color: '#ff4d4f',
      gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    },
    {
      title: '今天到期',
      value: stats.today,
      icon: <CalendarOutlined />,
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 16,
      }}>
        {statCards.map((item, index) => (
          <div
            key={index}
            style={{
              padding: 16,
              background: isDarkMode ? '#1f1f1f' : '#fff',
              borderRadius: 12,
              boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            {/* 渐变背景装饰 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: item.gradient,
              opacity: 0.1,
              borderRadius: '0 0 0 100%',
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>
                {item.title}
              </span>
              <span style={{
                fontSize: 16,
                color: item.color,
              }}>
                {item.icon}
              </span>
            </div>
            
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: isDarkMode ? '#fff' : '#000',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* 完成率进度条 */}
      {stats.total > 0 && (
        <div style={{
          padding: 16,
          background: isDarkMode ? '#1f1f1f' : '#fff',
          borderRadius: 12,
          boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: isDarkMode ? '#fff' : '#000' }}>
              完成率
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>
              {stats.completionRate.toFixed(1)}%
            </span>
          </div>
          <Progress
            percent={stats.completionRate}
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#95de64',
            }}
            trailColor={isDarkMode ? '#303030' : '#f5f5f5'}
            showInfo={false}
            size="small"
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 12,
            color: isDarkMode ? '#666' : '#999',
          }}>
            <span>已完成 {stats.completed} 个</span>
            <span>剩余 {stats.pending} 个</span>
          </div>
        </div>
      )}
    </div>
  );
};
