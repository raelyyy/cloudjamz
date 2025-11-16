import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, limit, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { getItunesRecommendations } from "../utils/itunesApi";
import MusicCard from "../components/MusicCard";

export default function Home({ user, onPlaySong, onDelete, currentSong, isPlaying }) {
  const navigate = useNavigate();
  const [recentSongs, setRecentSongs] = useState([]);
  const [myMusic, setMyMusic] = useState([]);
  const [spotifyRecommendations, setSpotifyRecommendations] = useState([]);
  const [suggestedPlaylists, setSuggestedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Spotify recommendations on mount
    const fetchRecommendations = async () => {
      try {
        console.log('Fetching Spotify recommendations...');
        // Get recommendations from featured playlists
        const recommendations = await getItunesRecommendations();
        console.log('Recommendations received:', recommendations);
        if (recommendations && recommendations.length > 0) {
          const formattedTracks = recommendations.map(track => ({
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              cover: track.cover,
              url: track.url,
              external_url: track.external_url,
              duration: track.duration,
            }));
          // Shuffle the tracks to randomize the order
          const shuffledTracks = formattedTracks.sort(() => Math.random() - 0.5);
          console.log('Formatted tracks:', shuffledTracks);
          setSpotifyRecommendations(shuffledTracks);
        } else {
          console.log('No recommendations received');
          setSpotifyRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching Spotify recommendations:', error);
        setSpotifyRecommendations([]);
      }
    };

    // Fetch suggested playlists from API
    const fetchSuggestedPlaylists = async () => {
      try {
        const genres = ['rock', 'pop', 'hip-hop', 'opm', 'kpop', 'metal', 'electronic', 'jazz', 'classical'];
        const playlists = [];

        for (const genre of genres) {
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

            playlists.push({
              id: genre,
              title: title,
              description: `Discover the best ${genre} tracks`,
              cover: cover,
              songs: tracks
            });
          }
        }

        setSuggestedPlaylists(playlists);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        // Fallback to static playlists
        const fallbackPlaylists = [
          {
            id: 'opm-hits',
            title: 'OPM Hits',
            description: 'The best of Original Pilipino Music',
            cover: 'https://i.scdn.co/image/ab67706f00000002b0fe40a6e1692822c5da3550',
            songs: [
              { title: 'Andalucia', artist: 'IV of Spades', album: 'CLAPCLAPCLAP!' },
              { title: 'Mundo', artist: 'IV of Spades', album: 'CLAPCLAPCLAP!' },
              { title: 'Hey Barbara', artist: 'IV of Spades', album: 'CLAPCLAPCLAP!' },
              { title: 'Come Inside of My Heart', artist: 'IV of Spades', album: 'CLAPCLAPCLAP!' },
              { title: 'Take That Man', artist: 'IV of Spades', album: 'CLAPCLAPCLAP!' },
            ]
          },
          {
            id: 'pinoy-pop',
            title: 'Pinoy Pop',
            description: 'Popular Filipino pop songs',
            cover: 'https://i.scdn.co/image/ab67706f00000002d73afb86a8b6c0b8b3b3b3b3',
            songs: [
              { title: 'Huling Sayaw', artist: 'Kamikazee', album: 'Romantico' },
              { title: 'Tsinelas', artist: 'Yeng Constantino', album: 'Salamat' },
              { title: 'Kung Wala Ka', artist: 'Hale', album: 'Hale' },
              { title: 'Buko', artist: 'Jireh Lim', album: 'Buko' },
              { title: 'Pauwi Nako', artist: 'Kina', album: 'Pauwi Nako' },
            ]
          }
        ];
        setSuggestedPlaylists(fallbackPlaylists);
      }
    };

    fetchRecommendations();
    fetchSuggestedPlaylists();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecentSongs([]);
      setMyMusic([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for user's recent songs
    const recentQuery = query(
      collection(db, "songs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const recent = [];
      snapshot.forEach((doc) => {
        recent.push({ id: doc.id, ...doc.data() });
      });
      setRecentSongs(recent);
    }, (error) => {
      console.warn("Firestore access denied for recent songs, using empty list:", error.message);
      setRecentSongs([]);
    });

    // Real-time listener for user's music
    const myMusicQuery = query(
      collection(db, "songs"),
      where("userId", "==", user.uid),
      limit(12)
    );

    const unsubscribeMyMusic = onSnapshot(myMusicQuery, (snapshot) => {
      const mySongs = [];
      snapshot.forEach((doc) => {
        mySongs.push({ id: doc.id, ...doc.data() });
      });
      setMyMusic(mySongs);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access denied for user music, using empty list:", error.message);
      setMyMusic([]);
      setLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRecent();
      unsubscribeMyMusic();
    };
  }, [user]);

  // Removed handlePlaySpotifyTrack as Spotify tracks will now play directly like uploaded music

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <h1 className="text-3xl font-bold text-spotify-white mb-8">
        Good afternoon{user ? `, ${user.displayName}` : ''}
      </h1>

      {loading ? (
        <div className="text-spotify-lighter">Loading...</div>
      ) : (
        <>
          {user && myMusic.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-spotify-white mb-4">My Music</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {myMusic.slice(0, 5).map((song) => (
                  <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song, myMusic)} onDelete={onDelete} isPlaying={song.id === currentSong?.id && isPlaying} />
                ))}
              </div>
            </section>
          )}

          {recentSongs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-spotify-white mb-4">Recently Added</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recentSongs.map((song) => (
                  <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song, recentSongs)} onDelete={onDelete} isPlaying={song.id === currentSong?.id && isPlaying} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 pt-4">
            <h2 className="text-2xl font-bold text-spotify-white mb-4">Suggested Music</h2>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth" id="suggested-scroll">
                {spotifyRecommendations.length > 0 ? (
                  spotifyRecommendations.slice(0, 20).map((track, index) => (
                    <div key={track.id} className={`flex-shrink-0 w-48 pt-2 ${index === 0 ? 'pl-2' : ''}`}>
                  <MusicCard
                        song={track}
                        onPlay={() => {
                          if (track.url) {
                            onPlaySong(track, spotifyRecommendations);
                          } else {
                            console.log('No preview URL for track:', track.title);
                          }
                        }}
                        isPlaying={track.id === currentSong?.id && isPlaying}
                      />
                    </div>
                  ))
                ) : (
                  // Placeholder cards
                  Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex-shrink-0 w-48 bg-spotify-dark rounded-lg p-4 hover:bg-spotify-light/20 transition">
                      <div className="w-full h-48 bg-spotify-light rounded-lg mb-4"></div>
                      <h3 className="text-spotify-white font-semibold">Suggested Song {i + 1}</h3>
                      <p className="text-spotify-lighter text-sm">Discover new music</p>
                    </div>
                  ))
                )}
              </div>
              {spotifyRecommendations.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('suggested-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('suggested-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-spotify-white mb-4">Suggested Playlists</h2>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth" id="playlists-scroll">
                {suggestedPlaylists.map((playlist) => (
                  <div key={playlist.id} className="flex-shrink-0 w-48">
                    <MusicCard
                      song={{
                        id: playlist.id,
                        title: playlist.title,
                        artist: playlist.description,
                        album: '',
                        cover: playlist.cover,
                        url: '',
                        external_url: '',
                        duration: ''
                      }}
                      onPlay={() => navigate(`/playlist/${playlist.id}`)}
                      disableNavigation={true}
                    />
                  </div>
                ))}
              </div>
              {suggestedPlaylists.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('playlists-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('playlists-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
