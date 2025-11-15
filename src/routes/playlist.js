import express from 'express';
import playlistManager from '../services/PlaylistManager.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get playlist
router.get('/', (req, res) => {
  try {
    const status = playlistManager.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get playlist', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get playlist'
    });
  }
});

// Remove video from playlist
router.delete('/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const removed = playlistManager.removeVideo(videoId);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Video removed from playlist'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
  } catch (error) {
    logger.error('Failed to remove video', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove video'
    });
  }
});

// Reorder playlist
router.post('/reorder', (req, res) => {
  try {
    const { order } = req.body;
    
    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be an array of video IDs'
      });
    }
    
    const reordered = playlistManager.reorderPlaylist(order);
    
    if (reordered) {
      res.json({
        success: true,
        message: 'Playlist reordered'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid order array'
      });
    }
  } catch (error) {
    logger.error('Failed to reorder playlist', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder playlist'
    });
  }
});

// Clear playlist
router.delete('/', (req, res) => {
  try {
    playlistManager.clearPlaylist();
    res.json({
      success: true,
      message: 'Playlist cleared'
    });
  } catch (error) {
    logger.error('Failed to clear playlist', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear playlist'
    });
  }
});

// Set current video
router.post('/current/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const success = playlistManager.setCurrentIndex(index);
    
    if (success) {
      res.json({
        success: true,
        message: 'Current video set'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid index'
      });
    }
  } catch (error) {
    logger.error('Failed to set current video', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set current video'
    });
  }
});

export default router;
