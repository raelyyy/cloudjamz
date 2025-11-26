import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, limit, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getItunesRecommendations } from "../utils/itunesApi";
import MusicCard from "../components/MusicCard";
import RecentlyPlayedCard from "../components/RecentlyPlayedCard";
import TextType from "../components/TextType";
import SpotlightCard from "../components/SpotlightCard";
import { Music } from "lucide-react";
import heroBg from "../assets/hero_bg.png";

export default function Home({ user, onPlaySong, onDelete, currentSong, isPlaying, onFavorite, favorites, onAddToPlaylist, onSetCurrentSongPaused }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const navigate = useNavigate();
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [myMusic, setMyMusic] = useState([]);
  const [spotifyRecommendations, setSpotifyRecommendations] = useState([]);
  const [suggestedPlaylists, setSuggestedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

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

          // Set a random song as current if none is playing
          // This will be overridden if user has recently played songs
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

    // Real-time listener for user's recently played songs
    const recentlyPlayedQuery = query(
      collection(db, "recentlyPlayed"),
      where("userId", "==", user.uid),
      orderBy("playedAt", "desc"),
      limit(8)
    );

    const unsubscribeRecentlyPlayed = onSnapshot(recentlyPlayedQuery, (snapshot) => {
      const recentlyPlayedSongs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        recentlyPlayedSongs.push({ id: doc.id, ...data.songData });
      });
      setRecentlyPlayed(recentlyPlayedSongs);

      // Set the most recent song as current if none is playing
      if (!currentSong && recentlyPlayedSongs.length > 0) {
        onSetCurrentSongPaused(recentlyPlayedSongs[0]);
      }
    }, (error) => {
      console.warn("Firestore access denied for recently played, using empty list:", error.message);
      setRecentlyPlayed([]);
    });

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
        const data = doc.data();
        recent.push({
          ...data,
          id: data.id ?? doc.id,
          docId: doc.id,
        });
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
        const data = doc.data();
        mySongs.push({
          ...data,
          id: data.id ?? doc.id,
          docId: doc.id,
        });
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
      unsubscribeRecentlyPlayed();
      unsubscribeRecent();
      unsubscribeMyMusic();
    };
  }, [user]);

  useEffect(() => {
    setImgError(false);
  }, [currentSong]);

  const handleEditMySong = async (updatedSong) => {
    if (!updatedSong) return;
    const documentId = updatedSong.docId || updatedSong.id;
    if (!documentId) {
      console.error("Missing song document id for update");
      return;
    }

    try {
      setEditLoading(true);
      const songRef = doc(db, "songs", documentId);
      await updateDoc(songRef, {
        title: updatedSong.title,
        artist: updatedSong.artist,
        cover: updatedSong.cover,
        album: updatedSong.album || '',
      });

      const applyUpdate = (list) =>
        list.map((song) => {
          const songDocId = song.docId || song.id;
          if (songDocId === documentId) {
            return {
              ...song,
              title: updatedSong.title,
              artist: updatedSong.artist,
              cover: updatedSong.cover,
              album: updatedSong.album || '',
            };
          }
          return song;
        });

      setMyMusic((prev) => applyUpdate(prev));
      setRecentSongs((prev) => applyUpdate(prev));
    } catch (error) {
      console.error("Failed to update song:", error);
    } finally {
      setEditLoading(false);
    }
  };

  // Removed handlePlaySpotifyTrack as Spotify tracks will now play directly like uploaded music

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <SpotlightCard className="hero bg-gradient-to-r from-yellow-300 to-yellow-500 px-8 rounded-lg mb-8 flex flex-col md:flex-row items-center justify-between relative" spotlightColor="rgba(255, 255, 255, 0.2)">
        <div className="absolute top-4 left-8 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-montserrat font-semibold px-3 py-1 rounded-full shadow-lg">
          ✨ New
        </div>
        <div className="flex-1 mb-4 md:mb-0">
          <div className="bg-white text-[#0019FF] px-3 py-1 rounded-md font-montserrat font-semibold text-sm inline-block mb-2">
            {getGreeting()}
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#001AFF] mb-4 font-montserrat leading-tight">
            Welcome back,
          </h1>
          <TextType
            text={[user ? user.displayName : 'Guest'] + '!'}
            typingSpeed={150}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="_"
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#001AFF] font-montserrat leading-tight mb-4"
          />
          <p className="text-black text-xs md:text-sm mb-4 font-montserrat">Stream millions of songs, discover new artists, and create the perfect playlist for every mood.</p>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                if (spotifyRecommendations.length > 0) {
                  onPlaySong(spotifyRecommendations[0], spotifyRecommendations);
                }
              }}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:bg-gradient-to-l hover:from-pink-500 hover:to-red-500 text-white px-8 py-3 rounded-lg font-montserrat hover:scale-105 transition-all duration-300"
            >
              Play Now
            </button>
            <button
              onClick={() => {
                navigate('/liked');
              }}
              className="bg-black/20 text-black p-3 rounded-lg hover:scale-105 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="#FF0039" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'CloudJamz',
                    text: 'Check out this awesome music app!',
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="bg-black/20 text-black p-3 rounded-lg hover:scale-105 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="#FF0039" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-shrink-0">
          <img src={heroBg} alt="Hero Background" className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] object-cover rounded-lg" />
        </div>
        <div className="absolute bottom-4 left-8 flex items-center gap-3">
          <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
            {!imgError && (currentSong ? currentSong.cover : (spotifyRecommendations.length > 0 ? spotifyRecommendations[0].cover : null)) ? (
              <img
                src={currentSong ? currentSong.cover : (spotifyRecommendations.length > 0 ? spotifyRecommendations[0].cover : '/placeholder-cover.png')}
                alt="Now Playing Cover"
                className="w-full h-full rounded-lg object-cover"
                onError={() => setImgError(true)}
              />
            ) : null}
            {(imgError || !(currentSong ? currentSong.cover : (spotifyRecommendations.length > 0 ? spotifyRecommendations[0].cover : null))) && (
              <div className="w-full h-full rounded-lg bg-black/20 flex items-center justify-center">
                <Music className="w-6 h-6 md:w-8 md:h-8 text-black" />
              </div>
            )}
          </div>
          <div>
            <p className="text-black text-xs font-montserrat font-semibold">Now Playing</p>
            <p className="text-black text-xs font-montserrat">
              {currentSong ? `${currentSong.title} by ${currentSong.artist}` : (spotifyRecommendations.length > 0 ? `${spotifyRecommendations[0].title} by ${spotifyRecommendations[0].artist}` : 'Loading...')}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {loading ? (
        <div className="text-spotify-lighter dark:text-light-lighter">Loading...</div>
      ) : (
        <>
          {user && recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Recently Played</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 lg:grid-cols-2 lg:grid-rows-4 gap-3">
                {recentlyPlayed.slice(0, 8).map((song) => (
                  <RecentlyPlayedCard
                    key={song.id}
                    song={song}
                    onPlay={() => onPlaySong(song, recentlyPlayed)}
                    isPlaying={song.id === currentSong?.id && isPlaying}
                  />
                ))}
              </div>
            </section>
          )}

          {user && myMusic.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-spotify-white dark:text-light-white mb-4">My Music</h2>
              <div id="my-music-scroll" className="overflow-x-auto overflow-y-visible pb-4 -mx-2">
                <div className="flex gap-4 px-2 pt-4 scroll-smooth snap-x snap-mandatory">
                  {myMusic.map((song) => (
                    <div key={song.docId || song.id} className="flex-shrink-0 w-44 sm:w-48 snap-start">
                      <MusicCard
                        className="w-full"
                        song={song}
                        onPlay={() => onPlaySong(song, myMusic)}
                        onFavorite={onFavorite}
                        onAddToPlaylist={onAddToPlaylist}
                        onDelete={onDelete}
                        onEdit={(updatedSong) => {
                          if (!editLoading) {
                            handleEditMySong(updatedSong);
                          }
                        }}
                        isPlaying={song.id === currentSong?.id && isPlaying}
                        isFavorite={favorites.has(song.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {recentSongs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Recently Added</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recentSongs.map((song) => (
                  <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song, recentSongs)} onFavorite={user ? () => {} : undefined} onAddToPlaylist={user ? () => {} : undefined} onDelete={onDelete} isPlaying={song.id === currentSong?.id && isPlaying} isFavorite={false} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 pt-4">
            <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Suggested Music</h2>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 pr-4 scroll-smooth" id="suggested-scroll">
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
                        onFavorite={onFavorite}
                        onAddToPlaylist={onAddToPlaylist}
                        isPlaying={track.id === currentSong?.id && isPlaying}
                        isFavorite={favorites.has(track.id)}
                      />
                    </div>
                  ))
                ) : (
                  // Placeholder cards
                  Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex-shrink-0 w-48 bg-spotify-dark dark:bg-light-dark rounded-lg p-4 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition">
                      <div className="w-full h-48 bg-spotify-light dark:bg-light-light rounded-lg mb-4"></div>
                      <h3 className="text-spotify-white dark:text-light-white font-semibold">Suggested Song {i + 1}</h3>
                      <p className="text-spotify-lighter dark:text-light-lighter text-sm">Discover new music</p>
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
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Suggested Playlists</h2>
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
                      isFavorite={false}
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
