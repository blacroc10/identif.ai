import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, Check, RefreshCw, Download, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, MessageSquare, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sketchesAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { Panel, Btn, SectionHeader, EmptyState, Textarea } from '../components/UI';
import './SketchViewer.css';

const MOCK_SKETCHES = [
  { id: 'sk1', version: 1, approved: 0, created_at: new Date().toISOString(), refinement_notes: 'Initial composite',      image_path: null },
  { id: 'sk2', version: 2, approved: 0, created_at: new Date().toISOString(), refinement_notes: 'Adjusted jaw width — wider', image_path: null },
];

const MOCK_ATTRS = {
  gender: 'male', approx_age: '30–45', ethnicity_complexion: 'medium', skin_tone: 'medium',
  facial_expression: 'calm', clothing: 'casual clothing', uniform: 'not wearing a uniform',
  face_shape: 'oval', jaw_strength: 'strong jawline', jaw_width: 'wide', chin_shape: 'rounded',
  cheekbones: 'high', eye_size: 'medium', eye_shape: 'deep-set', eye_spacing: 'close-set',
  eye_tilt: 'downward slanted', nose_length: 'medium', nose_width: 'broad', nose_bridge: 'straight',
  nose_tip: 'rounded', mouth_width: 'medium', mouth_corners: 'downturned', lip_ratio: 'balanced',
  ear_size: 'medium', ear_position: 'protruding', earlobes: 'detached', forehead_height: 'high',
  forehead_width: 'wide', hair_color: 'dark brown', hair_length: 'short', hair_texture: 'wavy',
  hair_density: 'normal', hair_parting: 'middle', hairline: 'widow\'s peak', facial_hair: 'stubble',
  beard_style: 'none', beard_density: 'sparse', eye_color: 'brown', sideburns: 'none',
  lip_color: 'pink', skin_texture: 'smooth', wrinkles: 'none', freckles: 'none', moles: 'none',
  birthmarks: 'none', allow_beard: 'False', allow_wrinkles: 'False', allow_parting: 'True',
  scars: 'no', tattoos: 'no', facial_injury: 'no', lazy_eye: 'no', crooked_nose: 'no',
  missing_tooth: 'no', piercings: 'no',
};

export default function SketchViewer() {
  const { activeCase } = useApp();
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom]         = useState(1);
  const [refineText, setRefine] = useState('');
  const [showRefine, setShowRef] = useState(false);
  const [submitting, setSub]    = useState(false);

  const { data: sketches, setData } = useApi(
    () => sketchesAPI.getAll({ case_id: activeCase?.id }),
    [activeCase?.id],
    { initialData: MOCK_SKETCHES }
  );

  const current = sketches?.[selected];

  const approve = async () => {
    if (!current?.id || current.id.startsWith('sk')) {
      toast.success('Sketch approved (demo)');
      return;
    }
    try {
      await sketchesAPI.approve(current.id);
      setData(prev => prev.map((s, i) => i === selected ? { ...s, approved: 1 } : s));
      toast.success('Sketch approved — ready for 3D reconstruction');
    } catch (e) {
      toast.error(e.message || 'Failed to approve sketch');
    }
  };

  const submitRefinement = async () => {
    if (!refineText.trim()) return toast.error('Enter refinement instructions');
    if (!current?.id || current.id.startsWith('sk')) {
      toast.success(`Refinement submitted (demo): "${refineText}"`);
      setRefine('');
      setShowRef(false);
      return;
    }
    setSub(true);
    try {
      const res = await sketchesAPI.refine(current.id, { refinement_notes: refineText });
      const newSketch = res?.data || res;
      setData(prev => [newSketch, ...prev]);
      setSelected(0);
      setRefine('');
      setShowRef(false);
      toast.success('Refinement submitted — regenerating sketch…');
    } catch (e) {
      toast.error(e.message || 'Failed to submit refinement');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="sketch-page">
      <SectionHeader
        title="2D Sketch Viewer"
        subtitle="Component-based facial composite with iterative witness refinement"
      >
        {activeCase && (
          <span className="active-case-badge mono">
            <Tag size={11} /> {activeCase.case_number}
          </span>
        )}
      </SectionHeader>

      <div className="sketch-layout">
        {/* Sketch list */}
        <div className="sketch-sidebar-list">
          <Panel title="Versions" subtitle={`${sketches?.length || 0} iterations`} noPad>
            {sketches?.map((sk, i) => (
              <motion.div
                key={sk.id}
                className={`sketch-thumb ${i === selected ? 'active' : ''}`}
                onClick={() => setSelected(i)}
                whileHover={{ backgroundColor: 'var(--bg-hover)' }}
              >
                <div className="sketch-thumb-img">
                  {sk.image_path ? (
                    <img src={sk.image_path} alt={`v${sk.version}`} />
                  ) : (
                    <div className="sketch-placeholder-sm">
                      <PenTool size={16} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="sketch-thumb-info">
                  <span className="mono">V{sk.version}</span>
                  <span className="sketch-thumb-note">{sk.refinement_notes || 'Initial composite'}</span>
                  {sk.approved === 1 && (
                    <span className="approved-dot"><Check size={9} /> Approved</span>
                  )}
                </div>
              </motion.div>
            ))}
            {(!sketches || sketches.length === 0) && (
              <EmptyState icon={PenTool} title="No sketches" message="Submit a narration to generate the first composite." />
            )}
          </Panel>
        </div>

        {/* Main viewer */}
        <div className="sketch-main">
          <Panel
            title={current ? `Composite v${current.version}` : 'No Sketch Selected'}
            subtitle="FGVM — OpenCV Landmark Morphing"
            badge={current?.approved ? { label: 'APPROVED', type: 'green' } : { label: 'PENDING REVIEW', type: 'amber' }}
            actions={
              <div className="zoom-controls">
                <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut size={14} /></button>
                <span className="mono">{Math.round(zoom * 100)}%</span>
                <button className="zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn size={14} /></button>
              </div>
            }
          >
            <div className="sketch-canvas-wrap">
              {current ? (
                <div className="sketch-canvas" style={{ transform: `scale(${zoom})` }}>
                  {current.image_path ? (
                    <img src={current.image_path} alt="composite" className="sketch-img" />
                  ) : (
                    <div className="sketch-svg-placeholder">
                      <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className="face-svg">
                        <ellipse cx="140" cy="160" rx="95" ry="115" fill="none" stroke="#00c8ff" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5"/>
                        <ellipse cx="105" cy="135" rx="18" ry="10" fill="none" stroke="#00c8ff" strokeWidth="1.5"/>
                        <circle cx="105" cy="135" r="5" fill="#00c8ff" opacity="0.6"/>
                        <ellipse cx="175" cy="135" rx="18" ry="10" fill="none" stroke="#00c8ff" strokeWidth="1.5"/>
                        <circle cx="175" cy="135" r="5" fill="#00c8ff" opacity="0.6"/>
                        <path d="M87 120 Q105 112 123 120" fill="none" stroke="#00c8ff" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M157 120 Q175 112 193 120" fill="none" stroke="#00c8ff" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M140 148 L132 175 Q140 180 148 175 Z" fill="none" stroke="#00c8ff" strokeWidth="1.5" opacity="0.7"/>
                        <path d="M118 197 Q140 210 162 197" fill="none" stroke="#00c8ff" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M120 197 Q140 193 160 197" fill="none" stroke="#00c8ff" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
                        <path d="M45 145 Q38 160 45 175" fill="none" stroke="#00c8ff" strokeWidth="1.5" opacity="0.5"/>
                        <path d="M235 145 Q242 160 235 175" fill="none" stroke="#00c8ff" strokeWidth="1.5" opacity="0.5"/>
                        <path d="M50 130 Q80 55 140 50 Q200 55 230 130" fill="none" stroke="#00c8ff" strokeWidth="1.5" opacity="0.6"/>
                        {[...Array(20)].map((_, i) => (
                          <line key={i}
                            x1={110 + (i % 7) * 10} y1={210 + Math.floor(i / 7) * 6}
                            x2={110 + (i % 7) * 10} y2={214 + Math.floor(i / 7) * 6}
                            stroke="#00c8ff" strokeWidth="0.8" opacity="0.35"
                          />
                        ))}
                        <line x1="140" y1="45" x2="140" y2="275" stroke="#00c8ff" strokeWidth="0.3" opacity="0.15"/>
                        <line x1="45" y1="160" x2="235" y2="160" stroke="#00c8ff" strokeWidth="0.3" opacity="0.15"/>
                        {[[105,135],[175,135],[140,175],[118,197],[162,197],[140,120],[88,152],[192,152]].map(([x, y], i) => (
                          <circle key={i} cx={x} cy={y} r="2.5" fill="none" stroke="#00c8ff" strokeWidth="0.8" opacity="0.4"/>
                        ))}
                      </svg>
                      <div className="sketch-svg-label mono">COMPOSITE V{current.version} · LANDMARK MODEL</div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={PenTool} title="No sketch selected" message="Select a version from the left panel." />
              )}
            </div>
          </Panel>

          {/* Actions row */}
          {current && (
            <div className="sketch-actions-row">
              <Btn variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setSelected(s => Math.max(0, s - 1))} disabled={selected === 0}>Prev</Btn>
              <Btn variant="secondary" size="sm" icon={ChevronRight} onClick={() => setSelected(s => Math.min((sketches?.length || 1) - 1, s + 1))} disabled={selected >= (sketches?.length || 1) - 1}>Next</Btn>
              <Btn variant="secondary" size="sm" icon={MessageSquare} onClick={() => setShowRef(!showRefine)}>Refine</Btn>
              <Btn variant="secondary" size="sm" icon={Download} onClick={() => toast('Export will trigger download in production')}>Export PNG</Btn>
              {!current.approved && (
                <Btn size="sm" icon={Check} variant="success" onClick={approve}>Approve &amp; Proceed to 3D</Btn>
              )}
              {current.approved === 1 && (
                <span className="approved-label mono"><Check size={12} /> APPROVED</span>
              )}
            </div>
          )}

          {/* Refinement input */}
          <AnimatePresence>
            {showRefine && (
              <motion.div
                className="refine-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Panel title="Witness Refinement" subtitle="Describe adjustments in natural language">
                  <Textarea
                    value={refineText}
                    onChange={e => setRefine(e.target.value)}
                    placeholder='e.g. "Make the nose wider, add a beard, the eyes should be closer together"'
                    rows={3}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <Btn variant="secondary" size="sm" onClick={() => setShowRef(false)}>Cancel</Btn>
                    <Btn size="sm" icon={RefreshCw} loading={submitting} onClick={submitRefinement}>Submit Refinement</Btn>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Attribute sidebar */}
        <div className="sketch-attrs-panel">
          <Panel title="Active Attributes" subtitle="Current face vector">
            <div className="sketch-attr-list">
              {Object.entries(MOCK_ATTRS).map(([k, v]) => (
                <div key={k} className="sketch-attr-row">
                  <span className="mono sketch-attr-key">{k.replace(/_/g, ' ')}</span>
                  <span className="sketch-attr-val">{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Version History" subtitle="Iteration audit trail" className="mt-12">
            <div className="version-trail">
              {(sketches || []).map((sk, i) => (
                <div key={sk.id} className={`version-item ${i === selected ? 'active' : ''}`}>
                  <div className="version-dot" />
                  <div className="version-info">
                    <span className="mono version-num">V{sk.version}</span>
                    <span className="version-note">{sk.refinement_notes || 'Initial'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}