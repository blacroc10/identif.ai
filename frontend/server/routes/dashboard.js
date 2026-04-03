const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/stats', (req, res) => {
  const totalCases = db.prepare('SELECT COUNT(*) as count FROM cases').get().count;
  const activeCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status='active'").get().count;
  const closedCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status='closed'").get().count;
  const totalNarrations = db.prepare('SELECT COUNT(*) as count FROM narrations').get().count;
  const totalSketches = db.prepare('SELECT COUNT(*) as count FROM sketches').get().count;
  const totalMeshes = db.prepare('SELECT COUNT(*) as count FROM meshes').get().count;
  const recentCases = db.prepare('SELECT * FROM cases ORDER BY created_at DESC LIMIT 5').all();
  const recentNarrations = db.prepare('SELECT * FROM narrations ORDER BY created_at DESC LIMIT 5').all();

  // Activity over last 7 days
  const activity = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM narrations WHERE created_at >= DATE('now','-7 days')
    GROUP BY DATE(created_at)
  `).all();

  res.json({
    success: true,
    data: {
      stats: { totalCases, activeCases, closedCases, totalNarrations, totalSketches, totalMeshes },
      recentCases,
      recentNarrations,
      activity
    }
  });
});

module.exports = router;
