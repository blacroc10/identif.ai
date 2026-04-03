import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Mic, PenTool, Box,
  FolderOpen, History, ChevronLeft, Activity,
  Scan
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/investigate', icon: Activity, label: 'Investigate' },
  { to: '/narration', icon: Mic, label: 'Narration' },
  { to: '/sketch', icon: PenTool, label: '2D Sketch' },
  { to: '/model3d', icon: Box, label: '3D Model' },
  { to: '/history', icon: History, label: 'Audit Log' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useApp();
  const location = useLocation();

  return (
    <motion.aside
      className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
      animate={{ width: sidebarOpen ? 220 : 60 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Scan size={20} strokeWidth={1.5} />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="brand-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <span className="brand-name">IDENTIF<span className="brand-dot">.</span>AI</span>
              <span className="brand-sub">FORENSIC SYSTEM</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* System status */}
      <div className="sidebar-status">
        <Activity size={10} className="status-pulse" />
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              SYSTEM ONLINE
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!sidebarOpen ? label : undefined}
          >
            <span className="nav-icon"><Icon size={18} strokeWidth={1.5} /></span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="nav-label"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
            {location.pathname === to && (
              <motion.span className="nav-active-bar" layoutId="activeBar" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button className="sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
        <motion.span animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.25 }}>
          <ChevronLeft size={16} />
        </motion.span>
      </button>

      {/* Version */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-footer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <span className="mono">v1.0.0</span>
            <span>AY 2025–26 · GRP 55</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
