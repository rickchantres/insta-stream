import express from 'express';
import { upload } from '../middleware/upload.js';
import playlistManager from '../services/PlaylistManager.js';
import streamManager from '../services/StreamManager.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Upload video
router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    // Get video metadata
    let duration = null;
    try {
      const info = await streamManager.getVideoInfo(req.file.path);
      duration = info.duration;
    } catch (error) {
      logger.warn('Could not get video duration', error);
    }

    const videoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      duration
    };

    const video = playlistManager.addVideo(videoData);

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        id: video.id,
        name: video.originalName,
        duration: video.duration,
        addedAt: video.addedAt
      }
    });
  } catch (error) {
    logger.error('Failed to upload video', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video'
    });
  }
});

export default router;
