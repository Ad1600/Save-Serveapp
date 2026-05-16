const express = require('express');
const router = express.Router();
const { getDriveInfo } = require('../utils/driveService');

// GET /api/debug/drive-info
router.get('/drive-info', async (req, res) => {
  try {
    const info = await getDriveInfo();
    res.json({ success: true, data: { folderId: info.folderId || null, serviceAccountEmail: info.serviceAccountEmail || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
