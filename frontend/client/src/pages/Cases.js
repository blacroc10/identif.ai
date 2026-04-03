import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderOpen, Trash2, Edit3, X, Clock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { Btn, StatusBadge, EmptyState, Spinner, ErrorBox, SectionHeader, Input, Textarea, Select } from '../components/UI';
import { format } from 'date-fns';
import './Cases.css';

function CaseModal({ onClose, onSaved, editCase }) {
  const [form, setForm] = useState({
    title:        editCase?.title        || '',
    description:  editCase?.description  || '',
    investigator: editCase?.investigator || '',
    status:       editCase?.status       || 'active',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      const result = editCase
        ? await casesAPI.update(editCase.id, form)
        : await casesAPI.create(form);
      toast.success(editCase ? 'Case updated' : 'Case created');
      onSaved(result.data || result);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title display">{editCase ? 'Edit Case' : 'New Case'}</h2>
            <p className="modal-subtitle mono">Forensic Investigation Record</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <Input label="Case Title *" value={form.title} onChange={set('title')} placeholder="e.g. Bank Robbery — 14 Mar 2026" />
            <Input label="Investigator" value={form.investigator} onChange={set('investigator')} placeholder="Officer name or ID" />
          </div>
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Incident summary, location, context..." rows={3} />
          <Select label="Status" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <div className="modal-footer">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn loading={loading} onClick={submit}>{editCase ? 'Save Changes' : 'Create Case'}</Btn>
        </div>
      </motion.div>
    </div>
  );
}

export default function Cases() {
  const { setActiveCase } = useApp();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editCase, setEditCase]   = useState(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [expanded, setExpanded]   = useState(null);

  const { data: cases, loading, error, setData } = useApi(
    () => casesAPI.getAll({ search: search || undefined, status: statusFilter || undefined }),
    [search, statusFilter],
    { initialData: [] }
  );

  const handleSaved = (c) => {
    if (!c) return;
    setData(prev => {
      const exists = prev.find(p => p.id === c.id);
      return exists ? prev.map(p => p.id === c.id ? c : p) : [c, ...prev];
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case? All linked data will be removed.')) return;
    try {
      await casesAPI.delete(id);
      setData(prev => prev.filter(c => c.id !== id));
      toast.success('Case deleted');
    } catch (e) {
      toast.error(e.message || 'Failed to delete case');
    }
  };

  const openEdit = (c) => { setEditCase(c); setShowModal(true); };
  const openNew  = ()  => { setEditCase(null); setShowModal(true); };

  const goTo = (c, path) => {
    setActiveCase(c);
    navigate(path);
  };

  return (
    <div className="cases-page">
      <SectionHeader title="Cases" subtitle={`${cases?.length ?? 0} investigation records`}>
        <Btn icon={Plus} onClick={openNew}>New Case</Btn>
      </SectionHeader>

      <div className="cases-filters">
        <div className="filter-search">
          <Search size={13} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or case number…"
            className="mono"
          />
        </div>
        <select className="filter-select mono" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">ALL STATUS</option>
          <option value="active">ACTIVE</option>
          <option value="pending">PENDING</option>
          <option value="closed">CLOSED</option>
        </select>
      </div>

      {error && <ErrorBox message="Could not load cases. Make sure the server is running." />}

      {loading ? (
        <div className="center-pad"><Spinner size={32} /></div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases found"
          message="Start by creating a new investigation case."
          action={<Btn icon={Plus} size="sm" onClick={openNew}>Create Case</Btn>}
        />
      ) : (
        <div className="cases-list">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              className={`case-card ${expanded === c.id ? 'expanded' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="case-card-main" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="case-card-id mono">{c.case_number}</div>
                <div className="case-card-info">
                  <span className="case-card-title">{c.title}</span>
                  <span className="case-card-inv mono">{c.investigator || 'Unassigned'}</span>
                </div>
                <StatusBadge status={c.status} />
                <div className="case-card-date mono">
                  <Clock size={10} />
                  {c.created_at ? format(new Date(c.created_at), 'MMM dd, yyyy') : '—'}
                </div>
                <div className="case-card-actions" onClick={e => e.stopPropagation()}>
                  <Btn variant="ghost" size="sm" icon={Edit3} onClick={() => openEdit(c)} />
                  <Btn variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(c.id)} className="btn-delete" />
                </div>
                <ChevronDown size={14} className={`case-chevron ${expanded === c.id ? 'up' : ''}`} />
              </div>

              <AnimatePresence>
                {expanded === c.id && (
                  <motion.div
                    className="case-card-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="case-desc">{c.description || 'No description provided.'}</p>
                    <div className="case-detail-actions">
                      <Btn size="sm" variant="secondary" onClick={() => goTo(c, '/narration')}>
                        Add Narration
                      </Btn>
                      <Btn size="sm" variant="secondary" onClick={() => goTo(c, '/sketch')}>
                        View Sketches
                      </Btn>
                      <Btn size="sm" variant="secondary" onClick={() => goTo(c, '/model3d')}>
                        View 3D Models
                      </Btn>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CaseModal onClose={() => setShowModal(false)} onSaved={handleSaved} editCase={editCase} />
        )}
      </AnimatePresence>
    </div>
  );
}