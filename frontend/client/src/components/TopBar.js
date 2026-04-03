import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './TopBar.css';

const BREADCRUMBS = {
  '/':           [{ label: 'Dashboard' }],
  '/cases':      [{ label: 'Cases' }],
  '/investigate':[{ label: 'Investigation Dashboard' }],
  '/narration':  [{ label: 'Narration Input' }],
  '/sketch':    [{ label: '2D Sketch Viewer' }],
  '/model3d':   [{ label: '3D Model Viewer' }],
  '/history':   [{ label: 'Audit Log' }],
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCase } = useApp();
  const [searchVal, setSearchVal] = useState('');
  const crumbs = BREADCRUMBS[location.pathname] || [{ label: 'Page' }];
  const now = new Date().toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <nav className="breadcrumb">
          <span className="breadcrumb-root" onClick={() => navigate('/')}>IDENTIF.AI</span>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-item">{c.label}</span>
            </React.Fragment>
          ))}
          {activeCase && (
            <>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-item breadcrumb-case">{activeCase.case_number}</span>
            </>
          )}
        </nav>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <Search size={13} />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search cases, narrations..."
            className="mono"
          />
          <span className="search-kbd mono">⌘K</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-time mono">
          <Clock size={11} />
          {now}
        </div>
        <motion.button
          className="topbar-notif"
          whileTap={{ scale: 0.9 }}
          title="Notifications"
        >
          <Bell size={16} strokeWidth={1.5} />
          <span className="notif-dot" />
        </motion.button>
        <div className="topbar-avatar">
          <span className="mono">INV</span>
        </div>
      </div>
    </header>
  );
}
