import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mic, PenTool, Box, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Circle, Loader, FileText,
  Activity, TrendingUp, Shield, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { casesAPI, narrationsAPI, sketchesAPI, meshesAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Panel, Btn, StatusBadge, SectionHeader, Spinner, EmptyState, Tag } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './InvestigationDashboard.css';

// Pipeline progress indicator per case
function PipelineProgress({ narrations, sketches, meshes }) {
  const hasNarration = narrations?.length > 0;
  const hasSketch    = sketches?.length > 0;
  const hasApproved  = sketches?.some(s => s.approved);
  const hasMesh      = meshes?.length > 0;

  const steps = [
    { label: 'Narration',    done: hasNarration, icon: Mic },
    { label: '2D Sketch',    done: hasSketch,    icon: PenTool },
    { label: 'Approved',     done: hasApproved,  icon: CheckCircle },
    { label: '3D Model',     done: hasMesh,      icon: Box },
  ];

  const pct = Math.round((steps.filter(s => s.done).length / steps.length) * 100);

  return (
    <div className="pipeline-prog">
      <div className="prog-bar-wrap">
        <div className="prog-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="prog-steps">
        {steps.map((s, i) => (
          <div key={i} className={`prog-step ${s.done ? 'done' : 'pending'}`}>
            {s.done
              ? <CheckCircle size={11} />
              : <Circle size={11} />}
            <span className="mono">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Confidence meter
function ConfidenceMeter({ value = 0 }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="conf-meter">
      <div className="conf-arc-wrap">
        <svg viewBox="0 0 60 36" className="conf-arc-svg">
          <path d="M5 30 A25 25 0 0 1 55 30" fill="none" stroke="var(--border-subtle)" strokeWidth="4" strokeLinecap="round"/>
          <path
            d="M5 30 A25 25 0 0 1 55 30"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 78.5} 78.5`}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <span className="conf-val mono" style={{ color }}>{pct}%</span>
      </div>
      <span className="conf-label mono">NLP CONF.</span>
    </div>
  );
}

// Single case investigation card
function CaseInvestigationCard({ cas, onClick }) {
  const { data: narrations } = useApi(() => narrationsAPI.getAll({ case_id: cas.id }), [cas.id], { initialData: [] });
  const { data: sketches   } = useApi(() => sketchesAPI.getAll({ case_id: cas.id }),   [cas.id], { initialData: [] });
  const { data: meshes     } = useApi(() => meshesAPI.getAll({ case_id: cas.id }),     [cas.id], { initialData: [] });

  const lastNarration = narrations?.[0];
  const avgConf = narrations?.length
    ? narrations.reduce((a, n) => a + (n.confidence_score || 0.72), 0) / narrations.length
    : 0.72;

  return (
    <motion.div
      className="inv-card"
      whileHover={{ y: -3, borderColor: 'rgba(0,200,255,0.4)' }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
    >
      {/* Card header */}
      <div className="inv-card-header">
        <div>
          <span className="inv-case-num mono">{cas.case_number}</span>
          <h3 className="inv-case-title">{cas.title}</h3>
        </div>
        <StatusBadge status={cas.status} />
      </div>

      {/* Investigator + date */}
      <div className="inv-card-meta">
        <div className="inv-meta-item">
          <Shield size={11} />
          <span className="mono">{cas.investigator || 'Unassigned'}</span>
        </div>
        <div className="inv-meta-item">
          <Clock size={11} />
          <span className="mono">{cas.created_at ? format(new Date(cas.created_at), 'dd MMM yyyy') : '—'}</span>
        </div>
      </div>

      {/* Evidence counts */}
      <div className="inv-evidence">
        <div className="inv-ev-item">
          <Mic size={13} style={{ color: 'var(--green)' }} />
          <span className="mono">{narrations?.length || 0}</span>
          <span>Narrations</span>
        </div>
        <div className="inv-ev-item">
          <PenTool size={13} style={{ color: 'var(--amber)' }} />
          <span className="mono">{sketches?.length || 0}</span>
          <span>Sketches</span>
        </div>
        <div className="inv-ev-item">
          <Box size={13} style={{ color: 'var(--cyan)' }} />
          <span className="mono">{meshes?.length || 0}</span>
          <span>3D Models</span>
        </div>
      </div>

      {/* Pipeline progress */}
      <PipelineProgress narrations={narrations} sketches={sketches} meshes={meshes} />

      {/* Confidence + arrow */}
      <div className="inv-card-footer">
        <ConfidenceMeter value={avgConf} />
        <div className="inv-open-btn">
          <span className="mono">INVESTIGATE</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}

// Activity feed item
function ActivityItem({ type, message, time, status }) {
  const icons = { narration: Mic, sketch: PenTool, mesh: Box, case: FileText };
  const colors = { narration: 'var(--green)', sketch: 'var(--amber)', mesh: 'var(--cyan)', case: 'var(--text-muted)' };
  const Icon = icons[type] || Activity;
  return (
    <div className="activity-item">
      <div className="activity-icon" style={{ color: colors[type] || 'var(--text-muted)' }}>
        <Icon size={12} />
      </div>
      <div className="activity-content">
        <span className="activity-msg">{message}</span>
        <span className="activity-time mono">{time}</span>
      </div>
      {status && <StatusBadge status={status} />}
    </div>
  );
}

export default function InvestigationDashboard() {
  const navigate = useNavigate();
  const { setActiveCase } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('active');

  const { data: cases, loading } = useApi(
    () => casesAPI.getAll({ status: statusFilter || undefined }),
    [statusFilter],
    { initialData: [] }
  );

  const { data: narrations } = useApi(() => narrationsAPI.getAll(), [], { initialData: [] });
  const { data: sketches   } = useApi(() => sketchesAPI.getAll(),   [], { initialData: [] });

  const filtered = (cases || []).filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(search.toLowerCase())
  );

  // Build unified activity feed
  const recentActivity = [
    ...(narrations || []).slice(0, 4).map(n => ({
      type: 'narration', message: `Narration submitted`, time: n.created_at, status: n.status
    })),
    ...(sketches || []).slice(0, 3).map(s => ({
      type: 'sketch', message: `Sketch v${s.version} generated`, time: s.created_at, status: s.approved ? 'completed' : 'pending'
    })),
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 8);

  return (
    <div className="inv-dashboard">
      <SectionHeader
        title="Investigation Dashboard"
        subtitle="Active forensic cases and pipeline status at a glance"
      >
        <Btn icon={Zap} size="sm" variant="secondary" onClick={() => navigate('/narration')}>
          Quick Narration
        </Btn>
        <Btn icon={ChevronRight} size="sm" onClick={() => navigate('/cases')}>
          All Cases
        </Btn>
      </SectionHeader>

      <div className="inv-layout">
        {/* Main cases column */}
        <div className="inv-main">
          {/* Filters */}
          <div className="inv-filters">
            <div className="filter-search-inv">
              <Search size={13} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases…"
                className="mono"
              />
            </div>
            <div className="status-tabs">
              {['active', 'pending', 'closed', ''].map(s => (
                <button
                  key={s}
                  className={`status-tab mono ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s || 'ALL'}
                </button>
              ))}
            </div>
          </div>

          {/* Cases grid */}
          {loading ? (
            <div className="center-pad"><Spinner size={28} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No cases found" message="Adjust the filter or create a new case." />
          ) : (
            <motion.div
              className="inv-cards-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.06 }}
            >
              {filtered.map(c => (
                <CaseInvestigationCard
                  key={c.id}
                  cas={c}
                  onClick={() => {
                    setActiveCase(c);
                    navigate('/narration');
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="inv-sidebar">
          {/* Quick actions */}
          <Panel title="Quick Actions" subtitle="Jump into workflow">
            <div className="quick-actions">
              {[
                { label: 'New Narration',  icon: Mic,      path: '/narration', color: 'green', desc: 'SPM · Whisper STT' },
                { label: 'View Sketches',  icon: PenTool,  path: '/sketch',    color: 'amber', desc: 'FGVM · OpenCV' },
                { label: 'Open 3D Viewer', icon: Box,      path: '/model3d',   color: 'cyan',  desc: '3DRM · 3DDFA' },
                { label: 'Audit Log',      icon: Activity, path: '/history',   color: 'muted', desc: 'Full trace log' },
              ].map(q => (
                <motion.button
                  key={q.path}
                  className={`qa-btn qa-${q.color}`}
                  onClick={() => navigate(q.path)}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className={`qa-icon qa-icon-${q.color}`}><q.icon size={14} /></div>
                  <div className="qa-info">
                    <span className="qa-label">{q.label}</span>
                    <span className="qa-desc mono">{q.desc}</span>
                  </div>
                  <ChevronRight size={13} className="qa-arrow" />
                </motion.button>
              ))}
            </div>
          </Panel>

          {/* Live activity feed */}
          <Panel title="Activity Feed" subtitle="Recent pipeline events" className="mt-12">
            {recentActivity.length === 0 ? (
              <p className="no-activity mono">No recent activity</p>
            ) : (
              <div className="activity-feed">
                {recentActivity.map((a, i) => (
                  <ActivityItem
                    key={i}
                    type={a.type}
                    message={a.message}
                    time={a.time ? format(new Date(a.time), 'HH:mm, MMM dd') : '—'}
                    status={a.status}
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* System health */}
          <Panel title="System Health" subtitle="Module status" className="mt-12">
            <div className="health-list">
              {[
                { label: 'Whisper STT',      ok: true,  latency: '1.2s' },
                { label: 'spaCy NLP',        ok: true,  latency: '0.4s' },
                { label: 'ArcFace Embed.',   ok: true,  latency: '0.8s' },
                { label: 'FAISS Index',      ok: true,  latency: '0.1s' },
                { label: '3DDFA Renderer',   ok: false, latency: 'GPU req.' },
                { label: 'SQLite DB',        ok: true,  latency: '<1ms' },
              ].map(m => (
                <div key={m.label} className="health-item">
                  <div className={`health-dot ${m.ok ? 'ok' : 'warn'}`} />
                  <span className="health-label">{m.label}</span>
                  <span className="health-latency mono">{m.latency}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
