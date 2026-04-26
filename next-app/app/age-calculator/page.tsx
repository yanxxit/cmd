'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, DatePicker, Button, Space, Statistic, Divider, Row, Col, Alert, InputNumber, Switch, Input, Segmented } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, HeartFilled } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import { Solar, Lunar } from 'lunar-javascript';

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

type CalendarType = 'solar' | 'lunar';

interface AgeInfo {
  solarDateStr: string;
  lunarDateStr: string;
  zodiac: string;
  constellation: string;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthdayDays: number;
}

const ZODIAC_EMOJIS: Record<string, string> = {
  '鼠': '🐭', '牛': '🐮', '虎': '🐯', '兔': '🐰',
  '龙': '🐲', '蛇': '🐍', '马': '🐴', '羊': '🐏',
  '猴': '🐵', '鸡': '🐔', '狗': '🐔', '猪': '🐷'
};

const CONSTELLATION_EMOJIS: Record<string, string> = {
  '白羊': '♈', '金牛': '♉', '双子': '♊', '巨蟹': '♋',
  '狮子': '♌', '处女': '♍', '天秤': '♎', '天蝎': '♏',
  '射手': '♐', '摩羯': '♑', '水瓶': '♒', '双鱼': '♓'
};

export default function AgeCalculator() {
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  // 公历生日状态
  const [solarDate, setSolarDate] = useState<Dayjs | null>(dayjs('1995-01-01'));
  // 农历生日状态
  const [lunarYear, setLunarYear] = useState<number>(1995);
  const [lunarMonth, setLunarMonth] = useState<number>(1);
  const [lunarDay, setLunarDay] = useState<number>(1);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(false);

  const [ageInfo, setAgeInfo] = useState<AgeInfo | null>(null);

  // 计算核心逻辑
  const calculateAge = () => {
    let targetSolar: Solar | null = null;
    let targetLunar: Lunar | null = null;

    try {
      if (calendarType === 'solar') {
        if (!solarDate) return;
        targetSolar = Solar.fromYmd(solarDate.year(), solarDate.month() + 1, solarDate.date());
        targetLunar = targetSolar.getLunar();
      } else {
        if (!lunarYear || !lunarMonth || !lunarDay) return;
        targetLunar = Lunar.fromYmd(lunarYear, isLeapMonth ? -lunarMonth : lunarMonth, lunarDay);
        targetSolar = targetLunar.getSolar();
      }

      if (!targetSolar || !targetLunar) return;

      const birthDayjs = dayjs(`${targetSolar.getYear()}-${targetSolar.getMonth()}-${targetSolar.getDay()}`);
      const today = dayjs().startOf('day');

      if (birthDayjs.isAfter(today)) {
        setAgeInfo(null);
        return; // 出生日期在未来
      }

      // 计算精确年龄
      let years = today.year() - birthDayjs.year();
      let months = today.month() - birthDayjs.month();
      let days = today.date() - birthDayjs.date();

      if (days < 0) {
        months -= 1;
        // 借上个月的天数
        const prevMonth = today.subtract(1, 'month');
        days += prevMonth.daysInMonth();
      }

      if (months < 0) {
        years -= 1;
        months += 12;
      }

      // 计算总存活天数
      const totalDays = today.diff(birthDayjs, 'day');

      // 计算下一次公历生日距离天数
      let nextBirthday = dayjs(`${today.year()}-${birthDayjs.format('MM-DD')}`);
      if (nextBirthday.isBefore(today)) {
        nextBirthday = nextBirthday.add(1, 'year');
      }
      const nextBirthdayDays = nextBirthday.diff(today, 'day');

      setAgeInfo({
        solarDateStr: `${targetSolar.getYear()}年${targetSolar.getMonth()}月${targetSolar.getDay()}日`,
        lunarDateStr: `${targetLunar.getYearInGanZhi()}年${targetLunar.getMonthInChinese()}月${targetLunar.getDayInChinese()}`,
        zodiac: targetLunar.getYearShengXiao(), // 生肖
        constellation: targetSolar.getXingZuo(), // 星座
        years,
        months,
        days,
        totalDays,
        nextBirthdayDays,
      });
    } catch (e) {
      console.error(e);
      setAgeInfo(null);
    }
  };

  useEffect(() => {
    calculateAge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarType, solarDate, lunarYear, lunarMonth, lunarDay, isLeapMonth]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 }}>
        <Link href="/">
          <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginRight: 16 }}>返回</Button>
        </Link>
        <Title level={4} style={{ margin: 0 }}>🎂 年龄计算器</Title>
      </Header>

      <Content style={{ padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          
          <Card 
            variant="borderless" 
            style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginBottom: 32 }}
            styles={{ body: { padding: '32px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 24, color: '#4b5563' }}>请选择出生日期</Title>
              <Segmented 
                options={[
                  { label: '公历 (阳历)', value: 'solar' },
                  { label: '农历 (阴历)', value: 'lunar' },
                ]}
                value={calendarType} 
                onChange={(value) => setCalendarType(value as CalendarType)}
                size="large"
                style={{ padding: 4, background: '#f1f5f9' }}
              />
            </div>

            {calendarType === 'solar' ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <DatePicker 
                  value={solarDate} 
                  onChange={setSolarDate} 
                  size="large" 
                  allowClear={false}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  style={{ width: 300, borderRadius: 8 }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Space wrap align="center" size="middle">
                  <Space.Compact>
                    <InputNumber min={1900} max={2100} value={lunarYear} onChange={(v) => setLunarYear(v || 1990)} size="large" style={{ width: 100 }} />
                    <Input style={{ width: 44, pointerEvents: 'none', background: '#f9fafb', color: '#4b5563', borderLeft: 0 }} size="large" defaultValue="年" disabled />
                  </Space.Compact>
                  
                  <Space.Compact>
                    <InputNumber min={1} max={12} value={lunarMonth} onChange={(v) => setLunarMonth(v || 1)} size="large" style={{ width: 80 }} />
                    <Input style={{ width: 44, pointerEvents: 'none', background: '#f9fafb', color: '#4b5563', borderLeft: 0 }} size="large" defaultValue="月" disabled />
                  </Space.Compact>
                  
                  <Space.Compact>
                    <InputNumber min={1} max={30} value={lunarDay} onChange={(v) => setLunarDay(v || 1)} size="large" style={{ width: 80 }} />
                    <Input style={{ width: 44, pointerEvents: 'none', background: '#f9fafb', color: '#4b5563', borderLeft: 0 }} size="large" defaultValue="日" disabled />
                  </Space.Compact>
                  
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '0 16px', height: 40, borderRadius: 8, border: '1px solid #d9d9d9' }}>
                    <Switch checked={isLeapMonth} onChange={setIsLeapMonth} size="small" />
                    <Text style={{ marginLeft: 8, color: '#4b5563' }}>闰月</Text>
                  </div>
                </Space>
              </div>
            )}
          </Card>

          {ageInfo ? (
            <Card 
              variant="borderless" 
              style={{ borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #fbcfe8 100%)', padding: '64px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, fontSize: 200, opacity: 0.1, transform: 'rotate(15deg)', pointerEvents: 'none' }}>🎂</div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Title level={5} style={{ color: '#831843', margin: '0 0 20px 0', fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase' }}>
                    YOUR LIFE JOURNEY
                  </Title>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16 }}>
                    <Text style={{ fontSize: 84, fontWeight: 900, color: '#be185d', lineHeight: 1, textShadow: '3px 3px 6px rgba(190, 24, 93, 0.15)' }}>{ageInfo.years}</Text>
                    <Text style={{ fontSize: 24, color: '#9d174d', fontWeight: 600 }}>岁</Text>
                    
                    <Text style={{ fontSize: 84, fontWeight: 900, color: '#be185d', lineHeight: 1, marginLeft: 24, textShadow: '3px 3px 6px rgba(190, 24, 93, 0.15)' }}>{ageInfo.months}</Text>
                    <Text style={{ fontSize: 24, color: '#9d174d', fontWeight: 600 }}>月</Text>
                    
                    <Text style={{ fontSize: 84, fontWeight: 900, color: '#be185d', lineHeight: 1, marginLeft: 24, textShadow: '3px 3px 6px rgba(190, 24, 93, 0.15)' }}>{ageInfo.days}</Text>
                    <Text style={{ fontSize: 24, color: '#9d174d', fontWeight: 600 }}>天</Text>
                  </div>
                </div>
              </div>

              <div style={{ padding: '40px 32px', background: '#fff' }}>
                <Row gutter={[48, 48]}>
                  <Col span={12}>
                    <Statistic 
                      title={<span style={{ fontSize: 16, color: '#6b7280' }}>总生存天数</span>} 
                      value={ageInfo.totalDays} 
                      suffix="天" 
                      valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: 36 }} 
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title={<span style={{ fontSize: 16, color: '#6b7280' }}>距离下一次生日 (公历)</span>} 
                      value={ageInfo.nextBirthdayDays} 
                      suffix="天" 
                      prefix={ageInfo.nextBirthdayDays === 0 ? <HeartFilled style={{ color: '#ef4444' }} /> : undefined}
                      valueStyle={{ color: ageInfo.nextBirthdayDays === 0 ? '#ef4444' : '#3b82f6', fontWeight: 700, fontSize: 36 }} 
                    />
                  </Col>
                  
                  <Col span={24}>
                    <Divider dashed style={{ margin: '8px 0', borderColor: '#e5e7eb' }} />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 24, background: '#f8fafc', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>公历生日</Text>
                      <Text strong style={{ fontSize: 20, color: '#1f2937' }}>{ageInfo.solarDateStr}</Text>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>星座</Text>
                      <Space>
                        <span style={{ fontSize: 24 }}>{CONSTELLATION_EMOJIS[ageInfo.constellation] || '✨'}</span>
                        <Text strong style={{ fontSize: 20, color: '#8b5cf6' }}>{ageInfo.constellation}座</Text>
                      </Space>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 24, background: '#f8fafc', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>农历生日</Text>
                      <Text strong style={{ fontSize: 20, color: '#1f2937' }}>{ageInfo.lunarDateStr}</Text>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>生肖</Text>
                      <Space>
                        <span style={{ fontSize: 24 }}>{ZODIAC_EMOJIS[ageInfo.zodiac] || '🐾'}</span>
                        <Text strong style={{ fontSize: 20, color: '#f59e0b' }}>{ageInfo.zodiac}</Text>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          ) : (
            <Alert 
              message="未知的出生日期" 
              description="出生日期不能在未来，或者您输入的农历日期不存在，请检查后重新输入。" 
              type="warning" 
              showIcon 
              style={{ borderRadius: 12 }}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}
