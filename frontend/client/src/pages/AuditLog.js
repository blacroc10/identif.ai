import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  History, Mic, PenTool, Box, FolderOpen,
  Search, Download, ChevronDown, Clock
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { narrationsAPI, casesAPI, sketchesAPI, meshesAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Panel, Btn, StatusBadge, SectionHeader, EmptyState, Spinner } from '../components/UI';
import './AuditLog.css';

function buildTimeline(cases, narrations, sketches, meshes) {
  const events = [
    ...(cases      || []).map(c => ({ ...c, type: 'case',      icon: FolderOpen, label: `Case created: ${c.title}`,            time: c.created_at })),
    ...(narrations || []).map(n => ({ ...n, type: 'narration', icon: Mic,        label: `Narration submitted`,                  time: n.created_at })),
    ...(sketches   || []).map(s => ({ ...s, type: 'sketch',    icon: PenTool,    label: `Sketch v${s.version} generated`,       time: s.created_at })),
    ...(meshes     || []).map(m => ({ ...m, type: 'mesh',      icon: Box,        label: `3D mesh exported (${m.format||'obj'})`, time: m.timestamp  })),
  ];
  return events
    .filter(e => e.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

// Safe date formatter — never crashes on bad dates
function safeFormat(time) {
  try {
    const d = new Date(time);
    if (!isValid(d)) return '—';
    return format(d, 'MMM dd, HH:mm:ss');
  } catch {
    return '—';
  }
}

const TYPE_COLORS = {
  case:      'cyan',
  narration: 'green',
  sketch:    'amber',
  mesh:      'red',
};

export default function AuditLog() {
  const [typeFilter, setType] = useState('');
  const [search, setSearch]   = useState('');
  const [expanded, setEx]     = useState(null);

  const { data: cases,      loading: lc } = useApi(() => casesAPI.getAll(),      [], { initialData: [] });
  const { data: narrations, loading: ln } = useApi(() => narrationsAPI.getAll(), [], { initialData: [] });
  const { data: sketches,   loading: ls } = useApi(() => sketchesAPI.getAll(),   [], { initialData: [] });
  const { data: meshes,     loading: lm } = useApi(() => meshesAPI.getAll(),     [], { initialData: [] });

  const loading = lc || ln || ls || lm;

  let timeline = buildTimeline(cases, narrations, sketches, meshes);
  if (typeFilter) timeline = timeline.filter(e => e.type === typeFilter);
  if (search)     timeline = timeline.filter(e =>
    e.label?.toLowerCase().includes(search.toLowerCase()) ||
    e.id?.toLowerCase().includes(search.toLowerCase())
  );

  const exportLog = () => {
    try {
      const csv = [
        'ID,Type,Label,Status,Time',
        ...timeline.map(e => `${e.id},${e.type},"${e.label}",${e.status || ''},${e.time}`),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `identifai-audit-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url); // clean up memory
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="audit-page">
      <SectionHeader
        title="Audit Log"
        subtitle={`${timeline.length} events — Full forensic trail`}
      >
        <Btn variant="secondary" size="sm" icon={Download} onClick={exportLog}>Export CSV</Btn>
      </SectionHeader>

      {/* Stats row */}
      <div className="audit-stats">
        {[
          { label: 'CASES',      count: cases?.length      || 0, type: 'case',      color: 'cyan'  },
          { label: 'NARRATIONS', count: narrations?.length || 0, type: 'narration', color: 'green' },
          { label: 'SKETCHES',   count: sketches?.length   || 0, type: 'sketch',    color: 'amber' },
          { label: '3D MESHES',  count: meshes?.length     || 0, type: 'mesh',      color: 'red'   },
        ].map(s => (
          <button
            key={s.type}
            className={`audit-stat-btn ${typeFilter === s.type ? 'active' : ''} color-${s.color}`}
            onClick={() => setType(typeFilter === s.type ? '' : s.type)}
          >
            <span className="ast-count display">{s.count}</span>
            <span className="ast-label mono">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-search">
          <Search size={13} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by label or ID…"
            className="mono"
          />
        </div>
        <select className="filter-select mono" value={typeFilter} onChange={e => setType(e.target.value)}>
          <option value="">ALL TYPES</option>
          <option value="case">CASES</option>
          <option value="narration">NARRATIONS</option>
          <option value="sketch">SKETCHES</option>
          <option value="mesh">MESHES</option>
        </select>
      </div>

      {/* Timeline */}
      <Panel title="Event Timeline" subtitle="Chronological forensic activity log" noPad>
        {loading ? (
          <div className="center-pad"><Spinner size={28} /></div>
        ) : timeline.length === 0 ? (
          <EmptyState
            icon={History}
            title="No events recorded"
            message="Events appear here as you create cases, narrations, sketches and models."
          />
        ) : (
          <div className="timeline">
            {timeline.map((event, i) => {
              const Icon    = event.icon;
              const color   = TYPE_COLORS[event.type];
              const isOpen  = expanded === event.id;

              return (
                <motion.div
                  key={`${event.id}-${i}`}
                  className={`timeline-item ${isOpen ? 'open' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                >
                  <div className="timeline-spine">
                    <div className={`timeline-dot dot-${color}`}>
                      <Icon size={10} />
                    </div>
                    {i < timeline.length - 1 && <div className="timeline-line" />}
                  </div>

                  <div className="timeline-card" onClick={() => setEx(isOpen ? null : event.id)}>
                    <div className="tc-main">
                      <div className="tc-type-badge">
                        <span className={`type-pill mono ${color}`}>{event.type.toUpperCase()}</span>
                      </div>
                      <div className="tc-label">{event.label}</div>
                      {event.status && <StatusBadge status={event.status} />}
                      <div className="tc-time mono">
                        <Clock size={10} />
                        {safeFormat(event.time)}
                      </div>
                      <ChevronDown size={13} className={`tc-chevron ${isOpen ? 'up' : ''}`} />
                    </div>

                    {isOpen && (
                      <motion.div
                        className="tc-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="tc-detail-grid">
                          <div className="tc-detail-row">
                            <span className="mono">ID</span>
                            <span className="mono cyan">{event.id}</span>
                          </div>
                          {event.case_number && (
                            <div className="tc-detail-row">
                              <span className="mono">CASE NO.</span>
                              <span className="mono cyan">{event.case_number}</span>
                            </div>
                          )}
                          {event.investigator && (
                            <div className="tc-detail-row">
                              <span className="mono">INVESTIGATOR</span>
                              <span>{event.investigator}</span>
                            </div>
                          )}
                          {event.transcribed_text && (
                            <div className="tc-detail-row tc-detail-text">
                              <span className="mono">TRANSCRIPTION</span>
                              <span>{event.transcribed_text.slice(0, 120)}{event.transcribed_text.length > 120 ? '…' : ''}</span>
                            </div>
                          )}
                          {event.description && (
                            <div className="tc-detail-row tc-detail-text">
                              <span className="mono">DESCRIPTION</span>
                              <span>{event.description}</span>
                            </div>
                          )}
                          {event.mesh_path && (
                            <div className="tc-detail-row">
                              <span className="mono">MESH PATH</span>
                              <span className="mono cyan">{event.mesh_path}</span>
                            </div>
                          )}
                          {event.image_path && (
                            <div className="tc-detail-row">
                              <span className="mono">IMAGE PATH</span>
                              <span className="mono cyan">{event.image_path}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}