import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Mic, PenTool, Box, TrendingUp,
  AlertTriangle, Plus, ArrowRight, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import { StatCard, Panel, Btn, StatusBadge, EmptyState, Spinner, ErrorBox, SectionHeader } from '../components/UI';
import { format, parseISO } from 'date-fns';
import './Dashboard.css';

const MOCK_ACTIVITY = [
  { date: '03/11', count: 2 }, { date: '03/12', count: 5 }, { date: '03/13', count: 3 },
  { date: '03/14', count: 8 }, { date: '03/15', count: 4 }, { date: '03/16', count: 7 },
  { date: '03/17', count: 6 },
];

const PIPELINE_STAGES = [
  { id: 1, label: 'Audio Narration',   icon: Mic,        status: 'active',  desc: 'SPM — Whisper STT' },
  { id: 2, label: 'NLP Extraction',    icon: TrendingUp, status: 'active',  desc: 'FAEM — spaCy NER' },
  { id: 3, label: '2D Sketch',         icon: PenTool,    status: 'active',  desc: 'FGVM — OpenCV Morph' },
  { id: 4, label: '3D Reconstruction', icon: Box,        status: 'pending', desc: '3DDFA — Mesh Gen' },
];

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(dashboardAPI.getStats, [], { immediate: true, initialData: null });

  const stats       = data?.stats       || {};
  const recentCases = data?.recentCases || [];

  // Use real activity data if available, otherwise fall back to mock
  const activity = (data?.activity?.length)
    ? data.activity.map(a => {
        try {
          return { date: format(parseISO(a.date), 'MM/dd'), count: a.count };
        } catch {
          return { date: a.date, count: a.count };
        }
      })
    : MOCK_ACTIVITY;

  return (
    <div className="dashboard">
      <SectionHeader
        title="Dashboard"
        subtitle="Forensic Intelligence Overview — System Status: ONLINE"
      >
        <Btn icon={Plus} onClick={() => navigate('/cases')}>New Case</Btn>
      </SectionHeader>

      {/* Show error but don't crash — app still usable with mock data */}
      {error && (
        <ErrorBox message="Could not reach server. Showing cached data. Make sure the server is running." />
      )}

      {/* Stats row */}
      <motion.div className="grid-4 mb-24" variants={stagger} initial="initial" animate="animate">
        {[
          { label: 'TOTAL CASES',  value: loading ? '…' : stats.totalCases      ?? 0, icon: FolderOpen,   accent: 'cyan'  },
          { label: 'ACTIVE',       value: loading ? '…' : stats.activeCases     ?? 0, icon: AlertTriangle, accent: 'amber' },
          { label: 'NARRATIONS',   value: loading ? '…' : stats.totalNarrations ?? 0, icon: Mic,           accent: 'green' },
          { label: '3D MODELS',    value: loading ? '…' : stats.totalMeshes     ?? 0, icon: Box,           accent: 'cyan'  },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts + pipeline */}
      <div className="dashboard-mid">
        <Panel title="Narration Activity" subtitle="Last 7 days" className="chart-panel">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#3d6070', fontSize: 10, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3d6070', fontSize: 10, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0a1118', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 6, fontFamily: 'Share Tech Mono', fontSize: 11 }}
                  labelStyle={{ color: '#7fa8bc' }}
                  itemStyle={{ color: '#00c8ff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00c8ff" strokeWidth={2} fill="url(#cyanGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Pipeline Status" subtitle="Module health">
          <div className="pipeline-steps">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.id} className={`pipeline-step ${stage.status}`}>
                <div className="step-num mono">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-info">
                  <span className="step-label"><stage.icon size={13} />{stage.label}</span>
                  <span className="step-desc mono">{stage.desc}</span>
                </div>
                <span className={`step-dot ${stage.status}`} />
                {i < PIPELINE_STAGES.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent cases */}
      <Panel
        title="Recent Cases"
        subtitle="Latest investigation activity"
        actions={<Btn variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/cases')}>View All</Btn>}
        className="mt-16"
      >
        {loading ? (
          <div className="center-spinner"><Spinner /></div>
        ) : recentCases.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No cases yet"
            message="Create your first forensic case to get started."
            action={<Btn icon={Plus} size="sm" onClick={() => navigate('/cases')}>Create Case</Btn>}
          />
        ) : (
          <div className="cases-table">
            <div className="table-head">
              <span className="mono">CASE NO.</span>
              <span className="mono">TITLE</span>
              <span className="mono">INVESTIGATOR</span>
              <span className="mono">STATUS</span>
              <span className="mono">CREATED</span>
            </div>
            {recentCases.map(c => (
              <motion.div
                key={c.id}
                className="table-row"
                whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                onClick={() => navigate('/cases')}
              >
                <span className="mono case-num">{c.case_number}</span>
                <span className="case-title">{c.title}</span>
                <span className="case-inv">{c.investigator || '—'}</span>
                <StatusBadge status={c.status} />
                <span className="mono case-date">
                  <Clock size={10} />
                  {c.created_at ? format(new Date(c.created_at), 'MMM dd, HH:mm') : '—'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}