import express from 'express';
import streamManager from '../services/StreamManager.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Start stream
router.post('/start', async (req, res) => {
  try {
    const result = await streamManager.startStream();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: streamManager.getStreamStatus()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Failed to start stream', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start stream'
    });
  }
});

// Stop stream
router.post('/stop', (req, res) => {
  try {
    const result = streamManager.stopStream();
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to stop stream', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop stream'
    });
  }
});

// Pause stream
router.post('/pause', (req, res) => {
  try {
    const result = streamManager.pauseStream();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Failed to pause stream', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause stream'
    });
  }
});

// Resume stream
router.post('/resume', (req, res) => {
  try {
    const result = streamManager.resumeStream();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Failed to resume stream', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume stream'
    });
  }
});

// Get stream status
router.get('/status', (req, res) => {
  try {
    const status = streamManager.getStreamStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get stream status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stream status'
    });
  }
});

export default router;
