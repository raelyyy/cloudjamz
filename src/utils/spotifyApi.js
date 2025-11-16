import axios from 'axios';

const SPOTIFY_CLIENT_ID = '1531e788adb54dababb9ec2952d09d3f';
const SPOTIFY_CLIENT_SECRET = '86b47f445c264db6ae14890ba5f2657d';

let accessToken = null;
let tokenExpiration = null;

export const getSpotifyToken = async () => {
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken;
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'client_credentials',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
    });

    accessToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in * 1000);
    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw error;
  }
};

export const searchSpotify = async (query, type = 'track') => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        q: query,
        type: type,
        limit: 20,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw error;
  }
};

export const getSpotifyRecommendations = async () => {
  try {
    const token = await getSpotifyToken();
    console.log('Token obtained:', token ? 'Yes' : 'No');

    // Test token with a simple search first
    console.log('Testing token with search...');
    const testSearch = await searchSpotify('hello', 'track');
    console.log('Test search successful:', testSearch.tracks ? 'Yes' : 'No');

    // Try to get new releases, which should work with client credentials
    console.log('Trying to get new releases...');
    const newReleasesResponse = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        limit: 20,
        country: 'US'
      },
    });

    console.log('New releases response:', newReleasesResponse.data);
    if (newReleasesResponse.data.albums.items.length > 0) {
      // Try to get tracks from multiple albums until we have enough with previews
      let allTracks = [];
      for (let i = 0; i < Math.min(5, newReleasesResponse.data.albums.items.length); i++) {
        const albumId = newReleasesResponse.data.albums.items[i].id;
        console.log('Getting tracks from album:', albumId);

        const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            limit: 20,
          },
        });

        console.log(`Album ${albumId} tracks:`, albumResponse.data.items.length);
        allTracks = allTracks.concat(albumResponse.data.items);

        // If we have enough tracks, break
        if (allTracks.length >= 20) break;
      }

      // Filter tracks that have preview URLs
      const tracksWithPreviews = allTracks.filter(track => track.preview_url);
      console.log('Tracks with previews:', tracksWithPreviews.length);

      if (tracksWithPreviews.length > 0) {
        return tracksWithPreviews.slice(0, 20);
      } else {
        // If no previews, try searching for popular tracks with previews
        console.log('No previews found, trying search for popular tracks...');
        const searchResponse = await searchSpotify('pop', 'track');
        const searchTracksWithPreviews = searchResponse.tracks.items.filter(track => track.preview_url);
        console.log('Search tracks with previews:', searchTracksWithPreviews.length);
        if (searchTracksWithPreviews.length > 0) {
          return searchTracksWithPreviews.slice(0, 20);
        } else {
          // Return empty array if no tracks with previews found
          console.log('No tracks with previews found anywhere');
          return [];
        }
      }
    }

    // Fallback to search for popular tracks
    console.log('Falling back to search for popular tracks...');
    const searchResponse = await searchSpotify('pop', 'track');
    console.log('Search results:', searchResponse.tracks.items);
    const searchTracksWithPreviews = searchResponse.tracks.items.filter(track => track.preview_url);
    console.log('Fallback search tracks with previews:', searchTracksWithPreviews.length);
    return searchTracksWithPreviews.slice(0, 20);

  } catch (error) {
    console.error('Error getting Spotify recommendations:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const getTrackDetails = async (trackId) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting track details:', error);
    throw error;
  }
};

export const getArtistDetails = async (artistId) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting artist details:', error);
    throw error;
  }
};

export const getAlbumDetails = async (albumId) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting album details:', error);
    throw error;
  }
};
