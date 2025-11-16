import axios from 'axios';

export const getItunesRecommendations = async () => {
  try {
    console.log('Fetching iTunes recommendations from different genres...');

    // Define genres with their iTunes genre IDs
    const genres = [
      { name: 'Pop', id: 14 },
      { name: 'Rock', id: 21 },
      { name: 'Hip-Hop/Rap', id: 18 },
      { name: 'Electronic', id: 7 },
      { name: 'Country', id: 6 },
      { name: 'R&B/Soul', id: 15 },
      { name: 'Jazz', id: 11 },
      { name: 'Classical', id: 5 }
    ];

    const allTracks = [];

    // Fetch top songs from each genre
    for (const genre of genres) {
      try {
        const response = await axios.get(`https://itunes.apple.com/us/rss/topsongs/limit=5/genre=${genre.id}/json`);
        console.log(`iTunes response for ${genre.name}:`, response.data);

        if (response.data.feed && response.data.feed.entry && response.data.feed.entry.length > 0) {
          const formattedTracks = response.data.feed.entry.map((entry, index) => ({
            id: entry.id.attributes['im:id'] || `itunes-${genre.id}-${index}`,
            title: entry['im:name']?.label || 'Unknown Title',
            artist: entry['im:artist']?.label || 'Unknown Artist',
            album: entry['im:collection']?.['im:name']?.label || 'Unknown Album',
            cover: entry['im:image']?.[2]?.label || entry['im:image']?.[1]?.label || entry['im:image']?.[0]?.label || '',
            url: entry.link?.[1]?.attributes?.href || '', // Preview URL from links
            external_url: entry.link?.[0]?.attributes?.href || '',
            duration: 30, // iTunes previews are 30 seconds
            genre: genre.name,
          }));

          allTracks.push(...formattedTracks);
        }
      } catch (genreError) {
        console.warn(`Error fetching ${genre.name} tracks:`, genreError.message);
      }
    }

    // Shuffle the combined tracks to randomize order
    const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);

    console.log('Formatted iTunes tracks from multiple genres:', shuffledTracks);
    return shuffledTracks;

  } catch (error) {
    console.error('Error getting iTunes recommendations:', error);

    // Fallback to search API with multiple genres
    try {
      console.log('Trying iTunes search API as fallback...');
      const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'country', 'r&b', 'jazz', 'classical'];
      const allTracks = [];

      for (const genre of genres) {
        const searchResponse = await axios.get('https://itunes.apple.com/search', {
          params: {
            term: genre,
            media: 'music',
            entity: 'song',
            limit: 5,
            country: 'us'
          }
        });

        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          const formattedTracks = searchResponse.data.results.map(track => ({
            id: track.trackId?.toString() || `search-${track.collectionId}`,
            title: track.trackName || 'Unknown Title',
            artist: track.artistName || 'Unknown Artist',
            album: track.collectionName || 'Unknown Album',
            cover: track.artworkUrl100?.replace('100x100', '300x300') || '',
            url: track.previewUrl || '',
            external_url: track.trackViewUrl || '',
            duration: Math.floor(track.trackTimeMillis / 1000) || 30,
            genre: track.primaryGenreName || genre,
          }));

          allTracks.push(...formattedTracks);
        }
      }

      // Shuffle the combined tracks
      const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);
      console.log('Formatted search tracks from multiple genres:', shuffledTracks);
      return shuffledTracks;
    } catch (searchError) {
      console.error('Error with iTunes search fallback:', searchError);
    }

    return [];
  }
};

export const searchItunes = async (query) => {
  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 20,
        country: 'us'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(track => ({
        id: track.trackId?.toString() || `search-${track.collectionId}`,
        title: track.trackName || 'Unknown Title',
        artist: track.artistName || 'Unknown Artist',
        album: track.collectionName || 'Unknown Album',
        cover: track.artworkUrl100?.replace('100x100', '300x300') || '',
        url: track.previewUrl || '',
        external_url: track.trackViewUrl || '',
        duration: Math.floor(track.trackTimeMillis / 1000) || 30,
        genre: track.primaryGenreName || 'Unknown Genre',
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching iTunes:', error);
    return [];
  }
};
