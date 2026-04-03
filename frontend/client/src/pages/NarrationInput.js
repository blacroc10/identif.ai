/* eslint-disable */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Upload, FileAudio, Check, X, ChevronRight,
  Volume2, Loader2, Tag as TagIcon, Wand2, Image, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { narrationsAPI } from '../services/api';
import { forensicAPI } from '../services/pythonApi';
import { useApp } from '../context/AppContext';
import { Panel, Btn, StatusBadge, SectionHeader, Spinner } from '../components/UI';
import './NarrationInput.css';

const ATTR_KEYS = [
  'gender', 'approx_age', 'ethnicity_complexion', 'skin_tone', 'facial_expression',
  'clothing', 'uniform', 'face_shape', 'jaw_strength', 'jaw_width', 'chin_shape',
  'cheekbones', 'eye_size', 'eye_shape', 'eye_spacing', 'eye_tilt', 'nose_length',
  'nose_width', 'nose_bridge', 'nose_tip', 'mouth_width', 'mouth_corners', 'lip_ratio',
  'ear_size', 'ear_position', 'earlobes', 'forehead_height', 'forehead_width',
  'hair_color', 'hair_length', 'hair_texture', 'hair_density', 'hair_parting', 'hairline',
  'facial_hair', 'beard_style', 'beard_density', 'eye_color', 'sideburns', 'lip_color',
  'skin_texture', 'wrinkles', 'freckles', 'moles', 'birthmarks', 'allow_beard',
  'allow_wrinkles', 'allow_parting', 'scars', 'tattoos', 'facial_injury', 'lazy_eye',
  'crooked_nose', 'missing_tooth', 'piercings',
];

const PLACEHOLDER = `"The suspect was a male, appeared to be in his mid-thirties. He had an oval face with high cheekbones. His nose was broad and slightly flat. He had bushy, dark eyebrows and deep-set brown eyes. His jaw was wide and square. He had a short beard, maybe three days of stubble. His skin tone was medium-brown. He had short, black hair that was neatly combed."`;

// Pipeline stages — updates as we progress
const STAGES = [
  { key: 'input',      label: 'Input received'       },
  { key: 'transcribe', label: 'Whisper STT'           },
  { key: 'extract',    label: 'spaCy NER extraction'  },
  { key: 'generate',   label: 'Stable Diffusion'      },
  { key: 'enhance',    label: 'GFPGAN enhancement'    },
  { key: 'done',       label: 'Face image ready'      },
];

export default function NarrationInput() {
  const { activeCase } = useApp();
  const navigate = useNavigate();

  const [mode, setMode]               = useState('text');
  const [text, setText]               = useState('');
  const [audioFile, setAudio]         = useState(null);

  // Pipeline state
  const [stage, setStage]             = useState(null); // current pipeline stage key
  const [loading, setLoading]         = useState(false);

  // Results
  const [transcription, setTranscription] = useState('');
  const [attrs, setAttrs]             = useState({});
  const [editingAttrs, setEditing]    = useState(false);
  const [faceImageUrl, setFaceImage]  = useState(null);
  const [narrationId, setNarrationId] = useState(null);

  // Error
  const [apiError, setApiError]       = useState(null);

  // ── Dropzone ───────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setAudio(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3', '.m4a', '.ogg', '.webm'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  // ── Helpers ────────────────────────────────────────────────────
  const blobToFile = (blob, name) => new File([blob], name, { type: blob.type });

  const blobToUrl = (blob) => URL.createObjectURL(blob);

  // ── Main submit ────────────────────────────────────────────────
  const submit = async () => {
    if (mode === 'text' && !text.trim()) return toast.error('Please enter a description');
    if (mode === 'audio' && !audioFile)  return toast.error('Please upload an audio file');

    setLoading(true);
    setApiError(null);
    setFaceImage(null);
    setAttrs({});
    setTranscription('');

    try {
      // ── Step 1: Save narration to Node API ──────────────────
      setStage('input');
      let nodeRes;
      if (mode === 'text') {
        nodeRes = await narrationsAPI.submitText({
          case_id: activeCase?.id,
          transcribed_text: text,
        });
      } else {
        const fd = new FormData();
        fd.append('audio', audioFile);
        if (activeCase?.id) fd.append('case_id', activeCase.id);
        nodeRes = await narrationsAPI.uploadAudio(fd);
      }
      const savedId = nodeRes?.data?.id || nodeRes?.id;
      setNarrationId(savedId);

      // ── Step 2: Transcribe / extract attributes via FastAPI ──
      setStage('transcribe');
      let extractedAttrs = {};
      let rawTranscription = text;

      if (mode === 'audio') {
        const res = await forensicAPI.transcribe(audioFile);
        rawTranscription = res.data?.transcription || '';
        extractedAttrs   = res.data?.attributes    || {};
        setTranscription(rawTranscription);
        setStage('extract');
        setAttrs(extractedAttrs);
      } else {
        // Text mode — extract attributes from typed text
        setStage('extract');
        const res = await forensicAPI.attributesFromText(text);
        extractedAttrs = res.data?.attributes || {};
        setAttrs(extractedAttrs);
      }

      // ── Step 3: Update Node API with extracted attributes ────
      if (savedId) {
        await narrationsAPI.process(savedId, {
          transcribed_text: rawTranscription || text,
          extracted_attributes: extractedAttrs,
          confidence_score: 0.85,
        });
      }

      toast.success('Attributes extracted — generating face image…');

      // ── Step 4: Generate face image via Stable Diffusion ─────
      setStage('generate');
      const imageRes = await forensicAPI.generateFromAttributes(extractedAttrs);
      setStage('enhance');

      // imageRes.data is a Blob (binary PNG)
      const imageBlob = imageRes.data;
      const imageUrl  = blobToUrl(imageBlob);
      setFaceImage(imageUrl);
      setStage('done');

      toast.success('Face image generated successfully!');

    } catch (e) {
      const msg = e.message || 'Something went wrong';
      setApiError(msg);

      // Friendly messages for common errors
      if (msg.includes('unreachable') || msg.includes('Network')) {
        toast.error('Python API is offline. Start FastAPI first.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Regenerate with edited attributes ─────────────────────────
  const regenerate = async () => {
    if (Object.keys(attrs).length === 0) return toast.error('No attributes to generate from');
    setLoading(true);
    setApiError(null);
    setStage('generate');
    try {
      const imageRes = await forensicAPI.generateFromAttributes(attrs);
      setStage('enhance');
      const imageUrl = blobToUrl(imageRes.data);
      setFaceImage(imageUrl);
      setStage('done');
      toast.success('Face regenerated with updated attributes');
    } catch (e) {
      setApiError(e.message);
      toast.error(e.message || 'Regeneration failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText('');
    setAudio(null);
    setAttrs({});
    setFaceImage(null);
    setTranscription('');
    setStage(null);
    setApiError(null);
    setNarrationId(null);
  };

  const currentStageIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div className="narration-page">
      <SectionHeader
        title="Narration Input"
        subtitle="Eyewitness description → AI face generation pipeline"
      >
        {activeCase && (
          <span className="active-case-badge mono">
            <TagIcon size={11} /> {activeCase.case_number}
          </span>
        )}
      </SectionHeader>

      <div className="narration-layout">
        {/* ── Left: Input ──────────────────────────────────────── */}
        <div className="narration-left">
          <Panel title="Input Method" subtitle="Choose audio upload or text entry">
            <div className="mode-tabs">
              <button className={`mode-tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>
                <Mic size={14} /> Text Entry
              </button>
              <button className={`mode-tab ${mode === 'audio' ? 'active' : ''}`} onClick={() => setMode('audio')}>
                <Volume2 size={14} /> Audio Upload
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'text' ? (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="narration-text-area">
                    <label className="field-label mono">Eyewitness Description</label>
                    <textarea
                      className="narration-textarea"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={PLACEHOLDER}
                      rows={10}
                      disabled={loading}
                    />
                    <div className="text-meta mono">
                      {text.length} chars · {text.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${audioFile ? 'has-file' : ''}`}>
                    <input {...getInputProps()} />
                    {audioFile ? (
                      <div className="dropzone-file">
                        <FileAudio size={28} />
                        <span className="dz-filename">{audioFile.name}</span>
                        <span className="dz-size mono">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button className="dz-remove" onClick={e => { e.stopPropagation(); setAudio(null); }}>
                          <X size={14} /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-empty">
                        <Upload size={28} />
                        <p>Drop audio file here or click to browse</p>
                        <span className="mono">.wav .mp3 .m4a .ogg — Max 50MB</span>
                      </div>
                    )}
                  </div>
                  <p className="audio-note mono">
                    Audio → Whisper STT → spaCy NER → Stable Diffusion → GFPGAN
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error box */}
            {apiError && (
              <div className="api-error-box">
                <AlertTriangle size={13} />
                <span>{apiError}</span>
              </div>
            )}

            <div className="narration-submit-row">
              <Btn variant="secondary" onClick={reset} disabled={loading}>Clear</Btn>
              <Btn icon={loading ? undefined : Wand2} loading={loading} onClick={submit}>
                {loading ? 'Processing…' : 'Generate Face'}
              </Btn>
            </div>
          </Panel>

          {/* Generated face image */}
          {faceImageUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="generated-face-panel">
              <Panel
                title="Generated Face"
                subtitle="Stable Diffusion + GFPGAN"
                badge={{ label: 'READY', type: 'green' }}
                actions={
                  <a href={faceImageUrl} download="identifai-composite.png">
                    <Btn variant="secondary" size="sm">Download PNG</Btn>
                  </a>
                }
              >
                <div className="generated-face-wrap">
                  <img src={faceImageUrl} alt="Generated composite" className="generated-face-img" />
                  <div className="generated-face-overlay mono">
                    COMPOSITE · AI GENERATED · {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="generated-face-actions">
                  <Btn variant="secondary" size="sm" icon={Wand2} onClick={regenerate} disabled={loading}>
                    Regenerate
                  </Btn>
                  <Btn size="sm" icon={ChevronRight} onClick={() => navigate('/sketch')}>
                    View in Sketch Viewer
                  </Btn>
                </div>
              </Panel>
            </motion.div>
          )}
        </div>

        {/* ── Right: Output ─────────────────────────────────────── */}
        <div className="narration-right">
          {/* Attributes panel */}
          <Panel
            title="Extracted Attributes"
            subtitle="spaCy NLP pipeline output"
            badge={
              stage === 'done'  ? { label: 'COMPLETED', type: 'green'  } :
              loading           ? { label: 'PROCESSING', type: 'cyan'  } :
                                  { label: 'AWAITING INPUT', type: 'muted' }
            }
          >
            {!stage && !loading && (
              <div className="attr-placeholder">
                <div className="attr-placeholder-icon"><Wand2 size={24} strokeWidth={1} /></div>
                <p>Submit a narration to extract facial attributes</p>
                <span className="mono">AI will extract the full face attribute set</span>
              </div>
            )}

            {loading && Object.keys(attrs).length === 0 && (
              <div className="attr-loading">
                <Spinner />
                <span className="mono">Extracting attributes…</span>
              </div>
            )}

            {Object.keys(attrs).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {narrationId && (
                  <div className="attr-meta mono">
                    <span>ID: {narrationId?.slice(0, 8)}…</span>
                    <StatusBadge status={stage === 'done' ? 'completed' : 'processing'} />
                  </div>
                )}

                <div className="attr-grid">
                  {ATTR_KEYS.map(key => (
                    <div key={key} className="attr-row">
                      <span className="attr-key mono">{key.replace(/_/g, ' ')}</span>
                      {editingAttrs ? (
                        <input
                          className="attr-edit-input mono"
                          value={attrs[key] || ''}
                          onChange={e => setAttrs(a => ({ ...a, [key]: e.target.value }))}
                        />
                      ) : (
                        <span className={`attr-val ${!attrs[key] ? 'attr-val-empty' : ''}`}>
                          {attrs[key] || 'not detected'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="attr-actions">
                  <Btn variant="ghost" size="sm" onClick={() => setEditing(!editingAttrs)}>
                    {editingAttrs
                      ? <><Check size={12} /> Save Edits</>
                      : <><TagIcon size={12} /> Edit Attributes</>
                    }
                  </Btn>
                  {editingAttrs && (
                    <Btn size="sm" icon={Wand2} onClick={regenerate} loading={loading}>
                      Regenerate Face
                    </Btn>
                  )}
                </div>
              </motion.div>
            )}

            {/* Transcription preview */}
            {transcription && (
              <div className="transcription-box">
                <span className="mono transcription-label">TRANSCRIPTION</span>
                <p className="transcription-text">{transcription}</p>
              </div>
            )}
          </Panel>

          {/* Pipeline tracker */}
          <Panel title="Pipeline Progress" subtitle={`${STAGES.length} stage AI pipeline`} className="pipeline-ctx">
            <div className="pipeline-ctx-steps">
              {STAGES.map((s, i) => {
                const isDone   = currentStageIndex > i || stage === 'done';
                const isActive = STAGES[currentStageIndex]?.key === s.key && loading;
                return (
                  <div key={s.key} className={`ctx-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                    <span className="ctx-dot">
                      {isDone    ? <Check   size={9} /> :
                       isActive  ? <Loader2 size={9} className="spin" /> :
                       i + 1}
                    </span>
                    <span className="ctx-label mono">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}