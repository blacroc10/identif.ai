import React, { useState } from 'react';
import {
  Box, Download, RotateCcw, Sun, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { Panel, Btn, SectionHeader } from '../components/UI';
import './Model3D.css';

function WireframePlaceholder({ rotating }) {
  return (
    <div className={`wireframe-scene ${rotating ? 'rotating' : ''}`}>
      <div className="cube-wrapper">
        <div className="face-3d">
          <svg viewBox="0 0 340 400" xmlns="http://www.w3.org/2000/svg" className="face-3d-svg">
            <ellipse cx="170" cy="200" rx="120" ry="145" fill="none" stroke="#00c8ff" strokeWidth="0.8" opacity="0.4"/>
            {[0.2, 0.35, 0.5, 0.65, 0.78, 0.9].map((t, i) => {
              const cy = 55 + t * 290;
              const ry = Math.sin(t * Math.PI) * 120;
              return <ellipse key={i} cx="170" cy={cy} rx={ry} ry={ry * 0.18} fill="none" stroke="#00c8ff" strokeWidth="0.5" opacity="0.25"/>;
            })}
            {[-60, -30, 0, 30, 60].map((dx, i) => (
              <ellipse key={i} cx={170 + dx * 0.7} cy="200" rx={Math.sqrt(Math.max(0, 120*120 - dx*dx*0.5)) * 0.18} ry="145" fill="none" stroke="#00c8ff" strokeWidth="0.5" opacity="0.2"/>
            ))}
            <ellipse cx="130" cy="170" rx="22" ry="12" fill="none" stroke="#00c8ff" strokeWidth="1.2" opacity="0.7"/>
            <circle cx="130" cy="170" r="6" fill="#00c8ff" opacity="0.5"/>
            <ellipse cx="210" cy="170" rx="22" ry="12" fill="none" stroke="#00c8ff" strokeWidth="1.2" opacity="0.7"/>
            <circle cx="210" cy="170" r="6" fill="#00c8ff" opacity="0.5"/>
            <path d="M170 185 L158 218 Q170 225 182 218 Z" fill="none" stroke="#00c8ff" strokeWidth="1" opacity="0.6"/>
            <path d="M145 242 Q170 258 195 242" fill="none" stroke="#00c8ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
            <path d="M50 175 Q42 200 50 220" fill="none" stroke="#00c8ff" strokeWidth="1" opacity="0.4"/>
            <path d="M290 175 Q298 200 290 220" fill="none" stroke="#00c8ff" strokeWidth="1" opacity="0.4"/>
            <path d="M110 300 Q170 345 230 300" fill="none" stroke="#00c8ff" strokeWidth="0.8" opacity="0.3"/>
            <circle cx="170" cy="200" r="3" fill="#00c8ff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite"/>
            </circle>
            <line x1="50" y1="150" x2="290" y2="150" stroke="#00c8ff" strokeWidth="0.5" opacity="0.6" strokeDasharray="4 3">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,200;0,0" dur="4s" repeatCount="indefinite"/>
            </line>
          </svg>
        </div>
      </div>
      <div className="wireframe-label mono">3D MESH — BASEL FACE MODEL · 3DDFA</div>
      <div className="wireframe-specs mono">
        <span>VERTICES: 53,215</span>
        <span>FACES: 105,840</span>
        <span>FORMAT: .OBJ</span>
      </div>
    </div>
  );
}

const VIEW_ANGLES = [
  { label: 'Front',     icon: '⬛', angle: 'front'    },
  { label: 'Left 45°',  icon: '◧',  angle: 'left45'  },
  { label: 'Right 45°', icon: '◨',  angle: 'right45' },
  { label: 'Profile L', icon: '▣',  angle: 'profileL' },
  { label: 'Profile R', icon: '▣',  angle: 'profileR' },
  { label: 'Top Down',  icon: '⬒',  angle: 'top'     },
];

export default function Model3D() {
  const { activeCase } = useApp();
  const [rotating, setRotating] = useState(false);
  const [viewAngle, setAngle]   = useState('front');
  const [renderMode, setRender] = useState('wireframe');
  const [lighting, setLighting] = useState(1);

  return (
    <div className="model-page">
      <SectionHeader
        title="3D Model Viewer"
        subtitle="Rotatable forensic face mesh — multi-angle visualization"
      >
        <Btn variant="secondary" size="sm" icon={Download} onClick={() => toast('Export .obj/.ply in production')}>Export .OBJ</Btn>
        <Btn variant="secondary" size="sm" icon={Download} onClick={() => toast('Export .ply in production')}>Export .PLY</Btn>
      </SectionHeader>

      <div className="model-layout">
        {/* Controls sidebar */}
        <div className="model-controls">
          <Panel title="View Angles" subtitle="Select perspective">
            <div className="angle-grid">
              {VIEW_ANGLES.map(v => (
                <button
                  key={v.angle}
                  className={`angle-btn ${viewAngle === v.angle ? 'active' : ''}`}
                  onClick={() => setAngle(v.angle)}
                >
                  <span className="angle-icon">{v.icon}</span>
                  <span className="mono">{v.label}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Render Mode" className="mt-12">
            <div className="render-modes">
              {['wireframe', 'solid', 'textured'].map(m => (
                <button
                  key={m}
                  className={`render-btn ${renderMode === m ? 'active' : ''}`}
                  onClick={() => setRender(m)}
                >
                  <span className="mono">{m.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Lighting" className="mt-12">
            <div className="lighting-control">
              <Sun size={13} style={{ color: 'var(--amber)' }} />
              <input
                type="range" min="0" max="2" step="0.1"
                value={lighting}
                onChange={e => setLighting(parseFloat(e.target.value))}
                className="lighting-slider"
              />
              <span className="mono lighting-val">{lighting.toFixed(1)}x</span>
            </div>
          </Panel>

          <Panel title="Auto-Rotate" className="mt-12">
            <button
              className={`rotate-toggle ${rotating ? 'on' : ''}`}
              onClick={() => setRotating(!rotating)}
            >
              <RotateCcw size={14} />
              <span className="mono">{rotating ? 'STOP ROTATION' : 'START ROTATION'}</span>
            </button>
          </Panel>

          <Panel title="Mesh Info" className="mt-12">
            <div className="mesh-info">
              {[
                { k: 'MODEL',  v: '3DDFA'       },
                { k: 'PARAMS', v: 'Basel 3DMM'  },
                { k: 'GPU',    v: 'RTX A2000'   },
                { k: 'STATUS', v: 'RENDERED'    },
                { k: 'FORMAT', v: '.OBJ / .PLY' },
              ].map(r => (
                <div key={r.k} className="mesh-info-row">
                  <span className="mono mesh-k">{r.k}</span>
                  <span className="mono mesh-v">{r.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* 3D Viewport */}
        <div className="model-viewport-wrap">
          <Panel
            title={`3D Reconstruction — ${viewAngle.toUpperCase()} VIEW`}
            subtitle={`Render: ${renderMode} · Light: ${lighting}x`}
            badge={{ label: 'READY', type: 'green' }}
            noPad
          >
            <div className="model-viewport">
              <WireframePlaceholder rotating={rotating} />
              <div className="viewport-corner tl mono">IDENTIF.AI · 3DRM</div>
              <div className="viewport-corner tr mono">PHASE 6 · v1.0</div>
              <div className="viewport-corner bl mono">CASE: {activeCase?.case_number || '—'}</div>
              <div className="viewport-corner br mono">
                {new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
              </div>
            </div>

            <div className="view-strip">
              {VIEW_ANGLES.map(v => (
                <button
                  key={v.angle}
                  className={`view-strip-btn ${viewAngle === v.angle ? 'active' : ''}`}
                  onClick={() => setAngle(v.angle)}
                >
                  <div className="view-strip-thumb">
                    <Box size={12} strokeWidth={1} />
                  </div>
                  <span className="mono">{v.label}</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Attributes sidebar */}
        <div className="model-attrs">
          <Panel title="Face Attributes" subtitle="Applied to mesh">
            <div className="model-attr-list">
              {Object.entries({
                gender: 'male', age_group: '30–45', face_shape: 'oval',
                nose_size: 'broad', jaw_width: 'wide', facial_hair: 'stubble',
                eye_shape: 'deep-set', skin_tone: 'medium', expression: 'calm',
              }).map(([k, v]) => (
                <div key={k} className="model-attr-row">
                  <span className="mono model-attr-k">{k.replace(/_/g, ' ')}</span>
                  <span className="model-attr-v">{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Export Options" className="mt-12">
            <div className="export-opts">
              {[
                { label: '.OBJ',   desc: '3D Wavefront',       icon: '⬡' },
                { label: '.PLY',   desc: 'Polygon mesh',        icon: '⬡' },
                { label: 'PNG ×6', desc: 'Multi-angle renders', icon: '⬜' },
                { label: 'PDF',    desc: 'Forensic report',     icon: '📄' },
              ].map(o => (
                <button
                  key={o.label}
                  className="export-opt-btn"
                  onClick={() => toast(`Export ${o.label} will work in production`)}
                >
                  <span className="export-icon mono">{o.icon}</span>
                  <div>
                    <span className="mono export-label">{o.label}</span>
                    <span className="export-desc">{o.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <div className="note-box mt-12">
            <Info size={12} />
            <span>
              In production, connect the Python 3DDFA pipeline output to{' '}
              <code>/api/meshes/upload</code> to load real mesh files here.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}