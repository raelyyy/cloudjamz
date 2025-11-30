import axios from 'axios'; // Kept for future API integration
import demoLyrics from './lyricsData.json';

export const getLyrics = async (artist, title) => {
  // Clean up title for better matching
  const cleanTitle = title.toLowerCase().replace(/[^\w\s]/gi, '').trim();

  // Check for demo lyrics first - instant response
  const demoKey = cleanTitle.toLowerCase().split(' ').slice(0, 2).join(' '); // First 2 words, lowercase
  if (demoLyrics[demoKey]) {
    return demoLyrics[demoKey];
  }

  // Also check for exact title matches (for shorter titles)
  const exactKey = cleanTitle.toLowerCase();
  if (demoLyrics[exactKey]) {
    return demoLyrics[exactKey];
  }

  try {
    // In development, simulate the backend response since Vercel functions don't run locally
    if (import.meta.env.DEV) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return `🎵 Lyrics for "${title}" by ${artist}\n\n🔄 Backend lyrics fetching is active!\n\n📱 This song is now being processed through our server-side API.\n\n🎤 Demo songs with instant lyrics:\n• "Dynamite" by BTS\n• "Not Like Us" by Kendrick Lamar\n• "Sunflower" by Post Malone\n\n💡 Real lyrics will be available after deployment to Vercel!\n\n✅ CORS issues resolved with backend proxy implementation.`;
    }

    // Call our backend API to fetch lyrics
    const response = await axios.get('/api/lyrics', {
      params: {
        artist: artist,
        title: title
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data.lyrics;
  } catch (error) {
    console.error('Error fetching lyrics from backend:', error);

    // Fallback for any errors - user-friendly message
    return `No lyrics found for "${title}" by ${artist}. Please try again later.`;
  }
};