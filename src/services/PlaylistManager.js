import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { config } from '../config.js';

class PlaylistManager {
  constructor() {
    this.playlistPath = join(config.uploadDir, 'playlist.json');
    this.currentIndex = 0;
    this.isPlaying = false;
    this.initPlaylist();
  }

  initPlaylist() {
    if (!existsSync(config.uploadDir)) {
      mkdirSync(config.uploadDir, { recursive: true });
    }

    if (!existsSync(this.playlistPath)) {
      this.savePlaylist([]);
    }
  }

  getPlaylist() {
    try {
      const data = readFileSync(this.playlistPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read playlist', error);
      return [];
    }
  }

  savePlaylist(playlist) {
    try {
      writeFileSync(this.playlistPath, JSON.stringify(playlist, null, 2));
      logger.info('Playlist saved successfully');
    } catch (error) {
      logger.error('Failed to save playlist', error);
    }
  }

  addVideo(videoData) {
    const playlist = this.getPlaylist();
    const video = {
      id: uuidv4(),
      filename: videoData.filename,
      originalName: videoData.originalName,
      path: videoData.path,
      size: videoData.size,
      duration: videoData.duration || null,
      addedAt: new Date().toISOString(),
    };
    
    playlist.push(video);
    this.savePlaylist(playlist);
    logger.info('Video added to playlist', { id: video.id, name: video.originalName });
    
    return video;
  }

  removeVideo(videoId) {
    const playlist = this.getPlaylist();
    const index = playlist.findIndex(v => v.id === videoId);
    
    if (index === -1) {
      return false;
    }
    
    playlist.splice(index, 1);
    this.savePlaylist(playlist);
    logger.info('Video removed from playlist', { id: videoId });
    
    // Adjust current index if needed
    if (this.currentIndex >= playlist.length && playlist.length > 0) {
      this.currentIndex = 0;
    }
    
    return true;
  }

  getCurrentVideo() {
    const playlist = this.getPlaylist();
    if (playlist.length === 0) {
      return null;
    }
    
    return playlist[this.currentIndex];
  }

  getNextVideo() {
    const playlist = this.getPlaylist();
    if (playlist.length === 0) {
      return null;
    }
    
    this.currentIndex = (this.currentIndex + 1) % playlist.length;
    logger.info('Moving to next video', { index: this.currentIndex });
    
    return playlist[this.currentIndex];
  }

  reorderPlaylist(newOrder) {
    const playlist = this.getPlaylist();
    const reordered = newOrder.map(id => playlist.find(v => v.id === id)).filter(Boolean);
    
    if (reordered.length !== playlist.length) {
      return false;
    }
    
    this.savePlaylist(reordered);
    logger.info('Playlist reordered');
    
    return true;
  }

  clearPlaylist() {
    this.savePlaylist([]);
    this.currentIndex = 0;
    this.isPlaying = false;
    logger.info('Playlist cleared');
  }

  setCurrentIndex(index) {
    const playlist = this.getPlaylist();
    if (index >= 0 && index < playlist.length) {
      this.currentIndex = index;
      logger.info('Current index set', { index });
      return true;
    }
    return false;
  }

  getStatus() {
    const playlist = this.getPlaylist();
    const currentVideo = this.getCurrentVideo();
    
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      totalVideos: playlist.length,
      currentVideo: currentVideo ? {
        id: currentVideo.id,
        name: currentVideo.originalName,
        duration: currentVideo.duration,
      } : null,
      playlist: playlist.map(v => ({
        id: v.id,
        name: v.originalName,
        duration: v.duration,
        addedAt: v.addedAt,
      })),
    };
  }

  play() {
    this.isPlaying = true;
    logger.info('Playback started');
  }

  pause() {
    this.isPlaying = false;
    logger.info('Playback paused');
  }

  stop() {
    this.isPlaying = false;
    this.currentIndex = 0;
    logger.info('Playback stopped');
  }
}

export default new PlaylistManager();
