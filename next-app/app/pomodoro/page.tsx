'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Typography, Button, Card, Space, Progress, Statistic, Row, Col, Modal, Form, InputNumber, notification, App, Input, List, Checkbox } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined, 
  SettingOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

type Mode = 'work' | 'shortBreak' | 'longBreak';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface PomodoroSettings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
};

export default function PomodoroWrapper() {
  return (
    <App>
      <PomodoroApp />
    </App>
  );
}

function PomodoroApp() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [form] = Form.useForm();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { notification } = App.useApp();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setTimeLeft(parsed.workTime * 60);
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse tasks');
      }
    }
  }, []);

  // Save tasks to state and localStorage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('pomodoroTasks', JSON.stringify(newTasks));
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(newTasks);
  };

  const handleDeleteTask = (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    saveTasks(newTasks);
  };

  const playNotificationSound = () => {
    try {
      // 浏览器安全策略可能会拦截无用户交互的音频播放
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch (error) {
      // ignore
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playNotificationSound();
    
    if (mode === 'work') {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);
      
      const isLongBreak = newCompleted % settings.longBreakInterval === 0;
      
      notification.success({
        message: '番茄钟完成！',
        description: isLongBreak 
          ? `干得漂亮！你已经完成了 ${settings.longBreakInterval} 个番茄钟，现在开始一个长休息吧。` 
          : '一个专注周期结束，休息一下吧。',
        duration: 0,
      });

      if (isLongBreak) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakTime * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakTime * 60);
      }
    } else {
      notification.info({
        message: '休息结束',
        description: '准备好开始下一个专注周期了吗？',
        duration: 0,
      });
      setMode('work');
      setTimeLeft(settings.workTime * 60);
    }
  }, [mode, completedPomodoros, settings, notification]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  // Update document title with remaining time
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeString = mode === 'work' ? '专注' : '休息';
    
    document.title = isRunning ? `[${timeString}] ${modeString} - 番茄时钟` : '番茄时钟';
  }, [timeLeft, isRunning, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    switch (mode) {
      case 'work':
        setTimeLeft(settings.workTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
    }
  };

  const switchMode = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case 'work':
        setTimeLeft(settings.workTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
    }
  };

  const saveSettings = (values: PomodoroSettings) => {
    setSettings(values);
    localStorage.setItem('pomodoroSettings', JSON.stringify(values));
    setIsSettingsOpen(false);
    
    // 如果没有在运行，就根据新设置更新当前时间
    if (!isRunning) {
      if (mode === 'work') setTimeLeft(values.workTime * 60);
      else if (mode === 'shortBreak') setTimeLeft(values.shortBreakTime * 60);
      else if (mode === 'longBreak') setTimeLeft(values.longBreakTime * 60);
    }
    
    notification.success({ message: '设置已保存' });
  };

  // 计算进度条百分比
  const getProgressPercent = () => {
    let totalTime = 0;
    switch (mode) {
      case 'work':
        totalTime = settings.workTime * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakTime * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakTime * 60;
        break;
    }
    return totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return '#ef4444'; // red
      case 'shortBreak': return '#10b981'; // emerald
      case 'longBreak': return '#3b82f6'; // blue
      default: return '#ef4444';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/">
            <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0 }}>返回</Button>
          </Link>
          <Title level={4} style={{ margin: 0 }}>🍅 番茄时钟</Title>
        </div>
        <Button 
          type="text" 
          icon={<SettingOutlined />} 
          onClick={() => {
            form.setFieldsValue(settings);
            setIsSettingsOpen(true);
          }}
        >
          设置
        </Button>
      </Header>
      
      <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 800, width: '100%', marginTop: 40 }}>
          
          <Card 
            variant="borderless" 
            style={{ 
              borderRadius: 16, 
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              textAlign: 'center',
              padding: '20px 0'
            }}
          >
            <Space size="large" style={{ marginBottom: 32 }}>
              <Button 
                type={mode === 'work' ? 'primary' : 'default'} 
                danger={mode === 'work'}
                size="large"
                onClick={() => switchMode('work')}
              >
                专注
              </Button>
              <Button 
                type={mode === 'shortBreak' ? 'primary' : 'default'} 
                style={{ backgroundColor: mode === 'shortBreak' ? '#10b981' : undefined }}
                size="large"
                onClick={() => switchMode('shortBreak')}
              >
                短休息
              </Button>
              <Button 
                type={mode === 'longBreak' ? 'primary' : 'default'} 
                style={{ backgroundColor: mode === 'longBreak' ? '#3b82f6' : undefined }}
                size="large"
                onClick={() => switchMode('longBreak')}
              >
                长休息
              </Button>
            </Space>

            <div style={{ margin: '40px 0', position: 'relative' }}>
              <Progress 
                type="circle" 
                percent={getProgressPercent()} 
                size={300}
                strokeColor={getModeColor()}
                strokeWidth={4}
                trailColor="#f3f4f6"
                format={() => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '72px', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>
                      {formatTime(timeLeft)}
                    </span>
                    <span style={{ fontSize: '16px', color: '#6b7280', marginTop: 8 }}>
                      {mode === 'work' ? '保持专注' : '放松一下'}
                    </span>
                  </div>
                )}
              />
            </div>

            <Space size="large">
              <Button 
                type="primary" 
                shape="round" 
                size="large" 
                icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={toggleTimer}
                style={{ 
                  height: 64, 
                  padding: '0 48px', 
                  fontSize: 20, 
                  backgroundColor: getModeColor() 
                }}
              >
                {isRunning ? '暂停' : '开始'}
              </Button>
              <Button 
                shape="circle" 
                size="large" 
                icon={<ReloadOutlined />}
                onClick={resetTimer}
                style={{ height: 64, width: 64, fontSize: 24 }}
                title="重置"
              />
            </Space>
          </Card>

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={12}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Statistic 
                  title="今日完成番茄数" 
                  value={completedPomodoros} 
                  valueStyle={{ color: '#ef4444', fontWeight: 'bold' }} 
                  prefix="🍅" 
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Statistic 
                  title="距离长休息还需" 
                  value={settings.longBreakInterval - (completedPomodoros % settings.longBreakInterval)} 
                  suffix={`/ ${settings.longBreakInterval}`}
                />
              </Card>
            </Col>
          </Row>

          <Card 
            title="今日任务" 
            variant="borderless" 
            style={{ marginTop: 24, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <Input
                size="large"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onPressEnter={handleAddTask}
                placeholder="添加新任务，按回车保存"
                style={{ borderRadius: '8px 0 0 8px' }}
              />
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />} 
                onClick={handleAddTask} 
                style={{ borderRadius: '0 8px 8px 0', backgroundColor: getModeColor(), borderColor: getModeColor() }}
              >
                添加
              </Button>
            </div>
            
            <List
              dataSource={tasks}
              locale={{ emptyText: '当前没有任务，开始添加吧！' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      key="delete"
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteTask(item.id)} 
                    />
                  ]}
                  style={{
                    backgroundColor: item.completed ? '#f9fafb' : 'transparent',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 8,
                    border: '1px solid #f3f4f6',
                    transition: 'all 0.3s'
                  }}
                >
                  <Checkbox
                    checked={item.completed}
                    onChange={() => handleToggleTask(item.id)}
                    style={{ width: '100%' }}
                  >
                    <span style={{ 
                      textDecoration: item.completed ? 'line-through' : 'none', 
                      color: item.completed ? '#9ca3af' : '#1f2937',
                      fontSize: 16,
                      marginLeft: 8,
                      transition: 'all 0.3s'
                    }}>
                      {item.text}
                    </span>
                  </Checkbox>
                </List.Item>
              )}
            />
          </Card>

        </div>
      </Content>

      <Modal
        title="番茄钟设置"
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={null}
        destroyOnClose={false}
        afterClose={() => form.resetFields()}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={saveSettings}
          initialValues={settings}
        >
          <Form.Item label="专注时长 (分钟)" name="workTime" rules={[{ required: true, type: 'number', min: 1, max: 60 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="短休息时长 (分钟)" name="shortBreakTime" rules={[{ required: true, type: 'number', min: 1, max: 30 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="长休息时长 (分钟)" name="longBreakTime" rules={[{ required: true, type: 'number', min: 1, max: 60 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="长休息间隔 (番茄数)" name="longBreakInterval" rules={[{ required: true, type: 'number', min: 1, max: 10 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsSettingsOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
