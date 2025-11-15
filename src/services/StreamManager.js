import ffmpeg from 'fluent-ffmpeg';
import { existsSync, mkdirSync, readdirSync, unlinkSync, createWriteStream } from 'fs';
import { join } from 'path';
import logger from '../utils/logger.js';
import { config } from '../config.js';
import playlistManager from './PlaylistManager.js';

class StreamManager {
  constructor() {
    this.ffmpegProcess = null;
    this.isStreaming = false;
    this.currentVideoPath = null;
    this.streamPlaylistPath = join(config.streamDir, 'stream.m3u8');
    this.initStreamDir();
  }

  initStreamDir() {
    if (!existsSync(config.streamDir)) {
      mkdirSync(config.streamDir, { recursive: true });
      logger.info('Stream directory created');
    }
  }

  cleanStreamDir() {
    try {
      const files = readdirSync(config.streamDir);
      files.forEach(file => {
        const filePath = join(config.streamDir, file);
        unlinkSync(filePath);
      });
      logger.info('Stream directory cleaned');
    } catch (error) {
      logger.error('Failed to clean stream directory', error);
    }
  }

  async startStream() {
    if (this.isStreaming) {
      logger.warn('Stream already active');
      return { success: false, message: 'Stream already active' };
    }

    const video = playlistManager.getCurrentVideo();
    if (!video) {
      logger.warn('No videos in playlist');
      return { success: false, message: 'No videos in playlist' };
    }

    playlistManager.play();
    await this.streamVideo(video);
    
    return { success: true, message: 'Stream started' };
  }

  async streamVideo(video) {
    if (!video || !existsSync(video.path)) {
      logger.error('Video file not found', { path: video?.path });
      this.moveToNextVideo();
      return;
    }

    this.currentVideoPath = video.path;
    this.isStreaming = true;

    logger.info('Starting video stream', { 
      name: video.originalName, 
      path: video.path 
    });

    // Create continuous stream using concat protocol
    const playlist = playlistManager.getPlaylist();
    const concatFile = join(config.streamDir, 'concat.txt');
    const concatContent = playlist.map(v => `file '${v.path}'`).join('\n');
    
    const stream = createWriteStream(concatFile);
    stream.write(concatContent);
    stream.end();

    this.ffmpegProcess = ffmpeg()
      .input(concatFile)
      .inputOptions([
        '-f concat',
        '-safe 0',
        '-stream_loop -1', // Loop infinitely
        '-re' // Read input at native frame rate
      ])
      .outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-tune zerolatency',
        '-c:a aac',
        '-b:a 128k',
        '-ar 44100',
        '-f hls',
        `-hls_time ${config.hlsSegmentDuration}`,
        '-hls_list_size 10',
        '-hls_flags delete_segments+append_list',
        '-hls_segment_filename', join(config.streamDir, 'segment_%03d.ts')
      ])
      .output(this.streamPlaylistPath)
      .on('start', (commandLine) => {
        logger.info('FFmpeg process started', { command: commandLine });
      })
      .on('progress', (progress) => {
        if (progress.timemark) {
          logger.debug('Stream progress', { timemark: progress.timemark });
        }
      })
      .on('error', (err, stdout, stderr) => {
        logger.error('FFmpeg error', { 
          error: err.message,
          stderr: stderr 
        });
        this.isStreaming = false;
        
        // Restart stream if playlist is still playing
        if (playlistManager.isPlaying) {
          logger.info('Restarting stream...');
          setTimeout(() => this.moveToNextVideo(), 2000);
        }
      })
      .on('end', () => {
        logger.info('Video stream ended');
        this.isStreaming = false;
        
        if (playlistManager.isPlaying) {
          this.moveToNextVideo();
        }
      });

    this.ffmpegProcess.run();
  }

  moveToNextVideo() {
    const nextVideo = playlistManager.getNextVideo();
    if (nextVideo && playlistManager.isPlaying) {
      logger.info('Moving to next video in playlist');
      setTimeout(() => this.streamVideo(nextVideo), 1000);
    }
  }

  stopStream() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGKILL');
      this.ffmpegProcess = null;
      logger.info('FFmpeg process killed');
    }

    this.isStreaming = false;
    playlistManager.pause();
    
    return { success: true, message: 'Stream stopped' };
  }

  pauseStream() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGSTOP');
      playlistManager.pause();
      logger.info('Stream paused');
      return { success: true, message: 'Stream paused' };
    }
    
    return { success: false, message: 'No active stream' };
  }

  resumeStream() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGCONT');
      playlistManager.play();
      logger.info('Stream resumed');
      return { success: true, message: 'Stream resumed' };
    }
    
    return { success: false, message: 'No active stream' };
  }

  getStreamStatus() {
    return {
      isStreaming: this.isStreaming,
      streamUrl: this.isStreaming ? `/stream/stream.m3u8` : null,
      currentVideo: this.currentVideoPath,
      playlistStatus: playlistManager.getStatus(),
    };
  }

  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve({ duration });
        }
      });
    });
  }
}

export default new StreamManager();
