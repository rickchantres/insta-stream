import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import logger from './utils/logger.js';
import uploadRouter from './routes/upload.js';
import playlistRouter from './routes/playlist.js';
import streamRouter from './routes/stream.js';
import { existsSync, mkdirSync } from 'fs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist
[config.uploadDir, config.streamDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/playlist', playlistRouter);
app.use('/api/stream', streamRouter);

// Serve HLS stream files
app.use('/stream', express.static(config.streamDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Insta-Stream Server',
    version: '1.0.0',
    description: 'Live streaming server with video upload and HLS streaming',
    endpoints: {
      upload: {
        'POST /api/upload': 'Upload a video to the playlist (multipart/form-data with field "video")',
      },
      playlist: {
        'GET /api/playlist': 'Get playlist and current status',
        'DELETE /api/playlist/:videoId': 'Remove video from playlist',
        'POST /api/playlist/reorder': 'Reorder playlist (body: { order: [id1, id2, ...] })',
        'DELETE /api/playlist': 'Clear entire playlist',
        'POST /api/playlist/current/:index': 'Set current video by index',
      },
      stream: {
        'POST /api/stream/start': 'Start streaming',
        'POST /api/stream/stop': 'Stop streaming',
        'POST /api/stream/pause': 'Pause streaming',
        'POST /api/stream/resume': 'Resume streaming',
        'GET /api/stream/status': 'Get stream status',
        'GET /stream/stream.m3u8': 'HLS stream playlist (use in video player)',
      },
      utility: {
        'GET /health': 'Health check endpoint',
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Upload directory: ${config.uploadDir}`);
  logger.info(`Stream directory: ${config.streamDir}`);
  logger.info(`HLS segment duration: ${config.hlsSegmentDuration}s`);
  logger.info(`Stream URL: http://localhost:${config.port}/stream/stream.m3u8`);
});

export default app;
