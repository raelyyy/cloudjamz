import axios from 'axios';

export const getItunesRecommendations = async () => {
  try {
    console.log('Fetching current hits from Pop, K-Pop, Hip-Hop, and Rock genres...');

    // Define specific genres with their iTunes genre IDs and search terms
    const genres = [
      { name: 'Pop', id: 14, searchTerms: ['pop hits 2024', 'current pop songs', 'top pop music'] },
      { name: 'K-Pop', id: 51, searchTerms: ['kpop hits 2024', 'korean pop music', 'bts', 'blackpink', 'twice', 'stray kids'] },
      { name: 'Hip-Hop/Rap', id: 18, searchTerms: ['hip hop hits 2024', 'rap music 2024', 'drake', 'kendrick lamar', 'travis scott'] },
      { name: 'Rock', id: 21, searchTerms: ['rock hits 2024', 'current rock songs', 'alternative rock 2024'] }
    ];

    const allTracks = [];

    // Fetch top songs from each genre using RSS feeds
    for (const genre of genres) {
      try {
        const response = await axios.get(`https://itunes.apple.com/us/rss/topsongs/limit=15/genre=${genre.id}/json`);
        console.log(`iTunes RSS response for ${genre.name}:`, response.data);

        if (response.data.feed && response.data.feed.entry && response.data.feed.entry.length > 0) {
          const formattedTracks = response.data.feed.entry.map((entry, index) => ({
            id: entry.id.attributes['im:id'] || `genre-${genre.id}-${index}`,
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
        console.warn(`Error fetching RSS for ${genre.name}:`, genreError.message);
      }
    }

    // Additional search for current hits in these genres
    for (const genre of genres) {
      for (const term of genre.searchTerms) {
        try {
          const searchResponse = await axios.get('https://itunes.apple.com/search', {
            params: {
              term: term,
              media: 'music',
              entity: 'song',
              limit: 5,
              country: 'us'
            }
          });

          if (searchResponse.data.results && searchResponse.data.results.length > 0) {
            const formattedTracks = searchResponse.data.results.map(track => ({
              id: track.trackId?.toString() || `search-${genre.name}-${track.collectionId}`,
              title: track.trackName || 'Unknown Title',
              artist: track.artistName || 'Unknown Artist',
              album: track.collectionName || 'Unknown Album',
              cover: track.artworkUrl100?.replace('100x100', '300x300') || '',
              url: track.previewUrl || '',
              external_url: track.trackViewUrl || '',
              duration: Math.floor(track.trackTimeMillis / 1000) || 30,
              genre: genre.name,
            }));

            allTracks.push(...formattedTracks);
          }
        } catch (termError) {
          console.warn(`Error searching for "${term}":`, termError.message);
        }
      }
    }

    // Shuffle the combined tracks and remove duplicates
    const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);
    const uniqueTracks = shuffledTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    );

    // Limit to 50 tracks to keep it manageable
    const limitedTracks = uniqueTracks.slice(0, 50);

    console.log('Formatted Pop/K-Pop/Hip-Hop/Rock tracks:', limitedTracks);
    return limitedTracks;

  } catch (error) {
    console.error('Error getting genre recommendations:', error);

    // Fallback to basic genre searches
    try {
      console.log('Trying basic genre search as fallback...');
      const fallbackGenres = ['pop', 'kpop', 'hip hop', 'rock'];
      const allTracks = [];

      for (const genre of fallbackGenres) {
        const searchResponse = await axios.get('https://itunes.apple.com/search', {
          params: {
            term: genre,
            media: 'music',
            entity: 'song',
            limit: 10,
            country: 'us'
          }
        });

        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          const formattedTracks = searchResponse.data.results.map(track => ({
            id: track.trackId?.toString() || `fallback-${genre}-${track.collectionId}`,
            title: track.trackName || 'Unknown Title',
            artist: track.artistName || 'Unknown Artist',
            album: track.collectionName || 'Unknown Album',
            cover: track.artworkUrl100?.replace('100x100', '300x300') || '',
            url: track.previewUrl || '',
            external_url: track.trackViewUrl || '',
            duration: Math.floor(track.trackTimeMillis / 1000) || 30,
            genre: genre.charAt(0).toUpperCase() + genre.slice(1),
          }));

          allTracks.push(...formattedTracks);
        }
      }

      // Shuffle and deduplicate
      const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);
      const uniqueTracks = shuffledTracks.filter((track, index, self) =>
        index === self.findIndex(t => t.id === track.id)
      ).slice(0, 40);

      console.log('Formatted fallback genre tracks:', uniqueTracks);
      return uniqueTracks;
    } catch (searchError) {
      console.error('Error with fallback search:', searchError);
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

export const getItunesTrackById = async (trackId) => {
  try {
    const response = await axios.get('https://itunes.apple.com/lookup', {
      params: {
        id: trackId,
        media: 'music',
        entity: 'song',
        country: 'us'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const track = response.data.results[0];
      return {
        id: track.trackId?.toString() || `lookup-${track.collectionId}`,
        title: track.trackName || 'Unknown Title',
        artist: track.artistName || 'Unknown Artist',
        album: track.collectionName || 'Unknown Album',
        cover: track.artworkUrl100?.replace('100x100', '300x300') || '',
        url: track.previewUrl || '',
        external_url: track.trackViewUrl || '',
        duration: Math.floor(track.trackTimeMillis / 1000) || 30,
        genre: track.primaryGenreName || 'Unknown Genre',
      };
    }
    return null;
  } catch (error) {
    console.error('Error looking up iTunes track:', error);
    return null;
  }
};
