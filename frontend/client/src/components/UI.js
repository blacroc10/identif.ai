import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import './UI.css';

/* ── Panel ─────────────────────────────────────────────── */
export function Panel({ title, subtitle, badge, children, className = '', actions, noPad }) {
  return (
    <motion.div
      className={`panel ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || actions) && (
        <div className="panel-header">
          <div>
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
          <div className="panel-header-right">
            {badge && <span className={`badge badge-${badge.type || 'default'}`}>{badge.label}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className={noPad ? '' : 'panel-body'}>{children}</div>
    </motion.div>
  );
}

/* ── StatCard ───────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, accent = 'cyan', delta }) {
  return (
    <motion.div
      className={`stat-card stat-card-${accent}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <div className="stat-top">
        <span className="stat-label mono">{label}</span>
        {Icon && <div className="stat-icon"><Icon size={16} strokeWidth={1.5} /></div>}
      </div>
      <div className="stat-value display">{value ?? '—'}</div>
      {delta !== undefined && (
        <span className={`stat-delta ${delta >= 0 ? 'pos' : 'neg'}`}>
          {delta >= 0 ? '+' : ''}{delta}% this week
        </span>
      )}
    </motion.div>
  );
}

/* ── Button ─────────────────────────────────────────────── */
export function Btn({ children, variant = 'primary', size = 'md', icon: Icon, loading, onClick, disabled, type = 'button', className = '' }) {
  return (
    <motion.button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
    >
      {loading ? <Loader2 size={14} className="spin" /> : Icon && <Icon size={14} strokeWidth={2} />}
      {children}
    </motion.button>
  );
}

/* ── Badge ──────────────────────────────────────────────── */
export function Badge({ label, type = 'default' }) {
  return <span className={`badge badge-${type}`}>{label}</span>;
}

/* ── Status badge map ───────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    active:     { type: 'green',  label: 'ACTIVE' },
    closed:     { type: 'muted',  label: 'CLOSED' },
    pending:    { type: 'amber',  label: 'PENDING' },
    processing: { type: 'cyan',   label: 'PROCESSING' },
    completed:  { type: 'green',  label: 'COMPLETED' },
    failed:     { type: 'red',    label: 'FAILED' },
    ready:      { type: 'green',  label: 'READY' },
  };
  const s = map[status] || { type: 'default', label: status?.toUpperCase() };
  return <Badge label={s.label} type={s.type} />;
}

/* ── Tag ────────────────────────────────────────────────── */
export function Tag({ label, value }) {
  return (
    <span className="attr-tag">
      <span className="attr-tag-key mono">{label}</span>
      <span className="attr-tag-val">{value}</span>
    </span>
  );
}

/* ── Spinner ────────────────────────────────────────────── */
export function Spinner({ size = 24 }) {
  return <Loader2 size={size} className="spin" style={{ color: 'var(--cyan)' }} />;
}

/* ── EmptyState ─────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-icon"><Icon size={28} strokeWidth={1} /></div>}
      <p className="empty-title">{title}</p>
      {message && <p className="empty-message">{message}</p>}
      {action}
    </div>
  );
}

/* ── ErrorBox ───────────────────────────────────────────── */
export function ErrorBox({ message }) {
  return (
    <div className="error-box">
      <AlertTriangle size={15} />
      <span>{message}</span>
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────── */
export function Input({ label, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label mono">{label}</label>}
      <input className="field-input" {...props} />
    </div>
  );
}

/* ── Textarea ───────────────────────────────────────────── */
export function Textarea({ label, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label mono">{label}</label>}
      <textarea className="field-input field-textarea" {...props} />
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────── */
export function Select({ label, children, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label mono">{label}</label>}
      <select className="field-input field-select" {...props}>{children}</select>
    </div>
  );
}

/* ── SectionHeader ──────────────────────────────────────── */
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="section-header">
      <div>
        <h1 className="section-title display">{title}</h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="section-actions">{children}</div>}
    </div>
  );
}

/* ── Divider ────────────────────────────────────────────── */
export function Divider({ label }) {
  return (
    <div className="divider">
      {label && <span className="divider-label mono">{label}</span>}
    </div>
  );
}
