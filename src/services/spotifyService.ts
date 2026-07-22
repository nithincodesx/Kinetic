import axios from 'axios';
import { SpotifyTrack } from '../types';

export const spotifyService = {
  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    
    try {
      const apiUrl = `/api/spotify/search?q=${encodeURIComponent(trimmedQuery)}`;
      console.log('Frontend calling API:', apiUrl);
      const response = await axios.get(apiUrl);
      
      // Debugging Log: Add console.log for raw data
      console.log('Spotify Search Results:', response.data);

      return response.data.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        albumArt: track.album.images[0]?.url || 'https://picsum.photos/seed/music/200/200',
        previewUrl: track.preview_url || null,
        isFallback: track.isFallback || false
      }));
    } catch (error: any) {
      if (error.response) {
        console.error('Spotify Search Error Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Frontend Spotify search error:', error.message);
      }
      return [];
    }
  }
};
