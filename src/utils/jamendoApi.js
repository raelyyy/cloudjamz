import axios from 'axios';

const JAMENDO_CLIENT_ID = '83ab7fb9';

export const getJamendoRecommendations = async () => {
  try {
    console.log('Fetching Jamendo recommendations...');

    // Get popular tracks from Jamendo - simplified parameters
    const response = await axios.get('https://api.jamendo.com/v3.0/tracks/', {
      params: {
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: 20,
        order: 'popularity_total',
        include: 'musicinfo',
        // Remove tags filter to get more results
      },
    });

    console.log('Jamendo response:', response.data);

    if (response.data.results && response.data.results.length > 0) {
      const formattedTracks = response.data.results.map(track => ({
        id: track.id.toString(),
        title: track.name,
        artist: track.artist_name,
        album: track.album_name || 'Unknown Album',
        cover: track.album_image || track.image || '',
        url: track.audio, // Full audio URL
        external_url: track.shareurl,
        duration: track.duration,
        license: track.license_ccurl, // Creative Commons license
      }));

      console.log('Formatted Jamendo tracks:', formattedTracks);
      return formattedTracks;
    } else {
      console.log('No Jamendo tracks found, trying alternative endpoint...');

      // Try alternative: get tracks from featured playlists
      try {
        const featuredResponse = await axios.get('https://api.jamendo.com/v3.0/playlists/tracks/', {
          params: {
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            limit: 20,
            order: 'popularity_total',
            include: 'musicinfo',
          },
        });

        console.log('Featured playlists response:', featuredResponse.data);

        if (featuredResponse.data.results && featuredResponse.data.results.length > 0) {
          const formattedTracks = featuredResponse.data.results.map(track => ({
            id: track.id.toString(),
            title: track.name,
            artist: track.artist_name,
            album: track.album_name || 'Unknown Album',
            cover: track.album_image || track.image || '',
            url: track.audio,
            external_url: track.shareurl,
            duration: track.duration,
            license: track.license_ccurl,
          }));

          console.log('Formatted featured tracks:', formattedTracks);
          return formattedTracks;
        }
      } catch (featuredError) {
        console.error('Error with featured playlists:', featuredError);
      }

      return [];
    }

  } catch (error) {
    console.error('Error getting Jamendo recommendations:', error);
    return [];
  }
};

export const searchJamendo = async (query) => {
  try {
    const response = await axios.get('https://api.jamendo.com/v3.0/tracks/', {
      params: {
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: 20,
        namesearch: query,
        include: 'musicinfo',
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(track => ({
        id: track.id.toString(),
        title: track.name,
        artist: track.artist_name,
        album: track.album_name || 'Unknown Album',
        cover: track.album_image || track.image || '',
        url: track.audio,
        external_url: track.shareurl,
        duration: track.duration,
        license: track.license_ccurl,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching Jamendo:', error);
    return [];
  }
};
