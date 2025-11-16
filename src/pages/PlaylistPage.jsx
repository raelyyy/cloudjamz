import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MusicCard from "../components/MusicCard";

export default function PlaylistPage({ onPlaySong, currentSong, isPlaying }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  const genreColors = {
    rock: 'from-red-500',
    pop: 'from-pink-500',
    'hip-hop': 'from-purple-500',
    opm: 'from-blue-500',
    kpop: 'from-yellow-500',
    metal: 'from-gray-500',
    electronic: 'from-green-500',
    jazz: 'from-orange-500',
    classical: 'from-indigo-500'
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        // For now, recreate the playlist data based on id
        // In a real app, you'd fetch from an API or pass via state
        const genres = ['rock', 'pop', 'hip-hop', 'opm', 'kpop', 'metal', 'electronic', 'jazz', 'classical'];
        const genre = genres.find(g => g === id);

        if (genre) {
          const response = await fetch(`https://itunes.apple.com/search?term=${genre}&media=music&limit=200&country=US`);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            let tracks = data.results
              .filter(track => genre !== 'pop' || track.artistName !== 'The 1975') // Exclude The 1975 from general pop search to avoid duplicates
              .map(track => ({
                id: track.trackId,
                title: track.trackName,
                artist: track.artistName,
                album: track.collectionName,
                cover: track.artworkUrl100.replace('100x100', '600x600'),
                url: track.previewUrl,
                external_url: track.trackViewUrl,
                duration: track.trackTimeMillis
              }));

            // Add The 1975 songs from iTunes API to the Pop playlist
            if (genre === 'pop') {
              const the1975Response = await fetch(`https://itunes.apple.com/search?term=The+1975&media=music&limit=20&country=US`);
              const the1975Data = await the1975Response.json();
              const the1975Tracks = the1975Data.results
                .filter(track => track.previewUrl) // Only include tracks with preview URLs
                .map(track => ({
                  id: track.trackId,
                  title: track.trackName,
                  artist: track.artistName,
                  album: track.collectionName,
                  cover: track.artworkUrl100.replace('100x100', '600x600'),
                  url: track.previewUrl,
                  external_url: track.trackViewUrl,
                  duration: track.trackTimeMillis
                }));
              tracks = [...the1975Tracks, ...tracks]; // Add The 1975 songs first
            }

            // Shuffle the tracks to randomize the order for all playlists
            tracks = tracks.sort(() => Math.random() - 0.5);

            let cover = tracks[0]?.cover || 'https://via.placeholder.com/192x192/1DB954/FFFFFF?text=' + encodeURIComponent(genre);
            if (genre === 'opm') {
              cover = 'https://i.scdn.co/image/ab67616d0000b27314708b669227cf0b2c458946';
            } else if (genre === 'electronic') {
              cover = 'https://d2rd7etdn93tqb.cloudfront.net/wp-content/uploads/2022/03/spotify-playlist-cover-woman-listeningt-to-headphones-purple-music-032322.jpg';
            } else if (genre === 'jazz') {
              cover = 'https://external-preview.redd.it/qnrcglcd_DBgSPmq35qcoBb29Qu2qSEGwJiKoVfTl_U.jpg?auto=webp&s=51f0bece12746e43502f075977d55f282947ed28';
            } else if (genre === 'classical') {
              cover = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSlRPNFUMGEYetuQkpf25F70mKjO-4Akyg2w&s';
            }

            let title = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Mix`;
            if (genre === 'opm') {
              title = 'OPM Mix';
            }

            setPlaylist({
              id: genre,
              title: title,
              description: `Discover the best ${genre} tracks`,
              cover: cover,
              songs: tracks
            });
          }
        }
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Loading playlist...</div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Playlist not found</div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-8 pb-8 px-8 overflow-y-auto bg-spotify-black">
      <div className={`flex items-center mb-8 sticky -top-4 bg-gradient-to-b ${genreColors[id] || 'from-spotify-black'} to-transparent z-10 pb-4 pt-4 pl-4 pr-8`}>
        <button
          onClick={() => navigate('/')}
          className="rounded-full w-12 h-12 flex items-center justify-center bg-spotify-gray hover:bg-spotify-dark text-spotify-lighter hover:text-spotify-white transition mr-2 text-2xl font-bold"
        >
          {"<"}
        </button>
        <div>
          <h1 className="text-3xl font-bold text-spotify-white mb-1">{playlist.title}</h1>
          <p className="text-spotify-lighter">{playlist.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {playlist.songs.map((song) => (
          <MusicCard
            key={song.id}
            song={song}
            onPlay={() => {
              if (song.url) {
                onPlaySong(song, playlist.songs);
              } else {
                console.log('No preview URL for track:', song.title);
              }
            }}
            disableNavigation={true}
            isPlaying={song.id === currentSong?.id && isPlaying}
          />
        ))}
      </div>
    </main>
  );
}
