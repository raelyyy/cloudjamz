import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, limit, orderBy, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getItunesRecommendations, searchItunes } from "../utils/itunesApi";
import { searchJamendo } from "../utils/jamendoApi";
import MusicCard from "../components/MusicCard";
import RecentlyPlayedCard from "../components/RecentlyPlayedCard";
import TextType from "../components/TextType";
import SpotlightCard from "../components/SpotlightCard";
import CurvedLoop from "../components/CurvedLoop";
import SkeletonCard from "../components/SkeletonCard";
import { InfiniteMovingCards } from "../components/ui/infinite-moving-cards";
import PlayingAnimationOverlay from "../components/PlayingAnimationOverlay";
import { Music } from "lucide-react";
import heroBg from "../assets/hero_bg.png";
import guitar from "../assets/guitar.png";
import headphone from "../assets/headphone.png";
import nota from "../assets/nota.png";
import drums from "../assets/drums.png";
import note from "../assets/note.png";

export default function Home({ user, onPlaySong, onDelete, currentSong, isPlaying, onFavorite, favorites, onAddToPlaylist, onSetCurrentSongPaused, onUpdateCurrentSong, onEdit }) {
   const getGreeting = () => {
     const hour = new Date().getHours();
     if (hour < 12) return 'Good morning';
     if (hour < 18) return 'Good afternoon';
     return 'Good evening';
   };
   const navigate = useNavigate();
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [myMusic, setMyMusic] = useState([]);
  const [spotifyRecommendations, setSpotifyRecommendations] = useState([]);
  const [suggestedPlaylists, setSuggestedPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [topSongs] = useState([
    { id: '1', title: 'Die With a Smile', artist: 'Lady Gaga & Bruno Mars', cover: 'https://i.scdn.co/image/ab67616d0000b27382ea2e9e1858aa012c57cd45' },
    { id: '2', title: 'APT.', artist: 'ROSÉ & Bruno Mars', cover: 'https://i.scdn.co/image/ab67616d0000b27336032cb4acd9df050bc2e197' },
    { id: '3', title: 'Luther', artist: 'Kendrick Lamar & SZA', cover: 'https://images.genius.com/012d76f2f3aa2aa704958e9ad1abb7f6.1000x1000x1.png' },
    { id: '4', title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', cover: 'https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62' },
    { id: '5', title: 'DTMF', artist: 'Bad Bunny', cover: 'https://images.genius.com/66f08db4c1d9d323ab441ab6c04a034a.1000x1000x1.png' },
    { id: '6', title: 'Ordinary', artist: 'Alex Warren', cover: 'https://images.genius.com/30e72e090d74f195ddf3cd5d5f1e4b14.1000x1000x1.png' },
    { id: '7', title: 'Golden', artist: 'HUNTR/X (and collaborators)', cover: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Huntr-x_-_Golden.png' },
    { id: '8', title: 'Back to Friends', artist: 'sombr', cover: 'https://i.scdn.co/image/ab67616d0000b2739d24f74c1e2d8a12b1e591ec' },
    { id: '9', title: 'Man I Need', artist: 'Olivia Dean', cover: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Man_I_Need_by_Olivia_Dean.png/250px-Man_I_Need_by_Olivia_Dean.png' },
    { id: '10', title: 'The Fate of Ophelia', artist: 'Taylor Swift', cover: 'https://i.scdn.co/image/ab67616d0000b273d7812467811a7da6e6a44902' },
    { id: '11', title: 'Nokia', artist: 'Drake', cover: 'https://i.scdn.co/image/ab67616d0000b273b5a28a256eae6dc0424fef59' },
    { id: '11b', title: '陽光彩虹小白馬', artist: 'Wowkie Da', cover: 'https://i.ytimg.com/vi/dw7IGM2EO_s/maxresdefault.jpg' },
    { id: '12', title: '4x4', artist: 'Travis Scott', cover: 'https://upload.wikimedia.org/wikipedia/en/5/54/Travis_Scott_-_4X4.png ' },
    { id: '13', title: "I'm the Problem", artist: 'Morgan Wallen', cover: 'https://i.scdn.co/image/ab67616d0000b27335ea219ce47813b5e2dc3745' },
    { id: '14', title: 'Pink Pony Club', artist: 'Chappell Roan', cover: 'https://upload.wikimedia.org/wikipedia/en/e/ee/Chappell_Roan_-_Pink_Pony_Club.png ' },
    { id: '15', title: 'Espresso', artist: 'Sabrina Carpenter', cover: 'https://i.scdn.co/image/ab67616d0000b273659cd4673230913b3918e0d5' },
    { id: '16', title: 'like JENNIE', artist: 'Jennie', cover: 'https://i.scdn.co/image/ab67616d0000b273dcf27dec5e479b2e39c4c993' },
    { id: '17', title: 'Like Him', artist: 'Tyler, The Creator', cover: 'https://images.genius.com/4ae7a9503661df9498fc79a0cfd5cc09.1000x1000x1.png' },
    { id: '18', title: 'Daisies', artist: 'Justin Bieber', cover: 'https://i1.sndcdn.com/artworks-wI9TT7uoQxczMYSf-amxjIQ-t500x500.png' },
    { id: '19', title: 'Guess', artist: 'Charli XCX (ft. Billie Eilish)', cover: 'https://i1.sndcdn.com/artworks-9MEML5lS0HAmNVTM-Yqpq5g-t500x500.jpg' }
  ]);
  const [playableTopSongs, setPlayableTopSongs] = useState(topSongs);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showMyMusicLeft, setShowMyMusicLeft] = useState(false);
  const [showMyMusicRight, setShowMyMusicRight] = useState(true);
  const [showPlaylistsLeft, setShowPlaylistsLeft] = useState(false);
  const [showPlaylistsRight, setShowPlaylistsRight] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroes = [
    {
      bg: guitar,
      greeting: getGreeting(),
      title: "Welcome back,",
      name: user ? user.displayName : 'Guest',
      description: "Stream millions of songs, discover new artists, and create the playlist for every mood.",
      gradient: "from-yellow-300 to-yellow-500",
      textColor: "#001AFF",
      bgColor: "yellow-300",
      buttonColor: "from-red-500 to-pink-500",
      buttonHover: "from-pink-500 to-red-500"
    },
    {
      bg: heroBg,
      greeting: "Hello there,",
      title: "Discover new sounds,",
      name: user ? user.displayName : 'Guest',
      description: "Explore curated playlists, trending hits, and hidden gems from around the world.",
      gradient: "from-purple-400 to-pink-600",
      textColor: "#FFFFFF",
      bgColor: "purple-400",
      buttonColor: "from-blue-500 to-purple-600",
      buttonHover: "from-purple-600 to-blue-500"
    }
  ];

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

    const fetchPlayableTopSongs = async () => {
      try {
        const playable = await Promise.all(topSongs.map(async (song) => {
          // Clean the search query: replace & with 'and', remove extra spaces
          const cleanTitle = song.title.replace(/\s+/g, ' ').trim();
          const cleanArtist = song.artist.replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
          const query = `${cleanTitle} ${cleanArtist}`;

          let results = await searchItunes(query);

          // If no results, try with just the title
          if (results.length === 0) {
            results = await searchItunes(cleanTitle);
          }

          // If still no results, try with just the artist
          if (results.length === 0) {
            results = await searchItunes(cleanArtist);
          }

          let bestMatch = null;
          if (results.length > 0) {
            // Find the best match - prefer tracks with previewUrl
            bestMatch = results.find(r => r.url) || results[0];
          }

          // If no URL found, try searching with just the title
          if (!bestMatch || !bestMatch.url) {
            const titleResults = await searchItunes(cleanTitle);
            if (titleResults.length > 0) {
              const titleBest = titleResults.find(r => r.url) || titleResults[0];
              if (titleBest.url) {
                bestMatch = titleBest;
              }
            }
          }

          // If still no URL, try Jamendo as fallback
          if (!bestMatch || !bestMatch.url) {
            const jamendoResults = await searchJamendo(query);
            if (jamendoResults.length > 0) {
              bestMatch = jamendoResults[0]; // Jamendo tracks have full audio URLs
            }
          }

          if (bestMatch && bestMatch.url) {
            return {
              ...song,
              url: bestMatch.url,
              external_url: bestMatch.external_url,
              duration: bestMatch.duration,
              album: bestMatch.album || song.album,
            };
          } else {
            return song;
          }
        }));
        setPlayableTopSongs(playable);
      } catch (error) {
        console.error('Error fetching playable top songs:', error);
      }
    };

    fetchPlayableTopSongs();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecentlyPlayed([]);
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


    // Real-time listener for user's music
    const myMusicQuery = query(
      collection(db, "songs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
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
      unsubscribeMyMusic();
    };
  }, [user]);

  useEffect(() => {
    setImgError(false);
  }, [currentSong]);

  const handleScroll = (e) => {
    const container = e.target;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(container.scrollLeft + container.clientWidth < container.scrollWidth);
  };

  const getMaskClass = () => {
    if (showLeftArrow && showRightArrow) {
      return ' [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]';
    } else if (showLeftArrow) {
      // At right end, fade left
      return ' [mask-image:linear-gradient(to_left,white,white_80%,transparent)]';
    } else if (showRightArrow) {
      // At left end, fade right
      return ' [mask-image:linear-gradient(to_right,white,white_80%,transparent)]';
    } else {
      return '';
    }
  };

  const handleMyMusicScroll = (e) => {
    const container = e.target;
    setShowMyMusicLeft(container.scrollLeft > 0);
    setShowMyMusicRight(container.scrollLeft + container.clientWidth < container.scrollWidth);
  };

  const getMyMusicMaskClass = () => {
    if (showMyMusicLeft && showMyMusicRight) {
      return ' [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]';
    } else if (showMyMusicLeft) {
      return ' [mask-image:linear-gradient(to_left,white,white_80%,transparent)]';
    } else if (showMyMusicRight) {
      return ' [mask-image:linear-gradient(to_right,white,white_80%,transparent)]';
    } else {
      return '';
    }
  };

  const handlePlaylistsScroll = (e) => {
    const container = e.target;
    setShowPlaylistsLeft(container.scrollLeft > 0);
    setShowPlaylistsRight(container.scrollLeft + container.clientWidth < container.scrollWidth);
  };

  const getPlaylistsMaskClass = () => {
    if (showPlaylistsLeft && showPlaylistsRight) {
      return ' [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]';
    } else if (showPlaylistsLeft) {
      return ' [mask-image:linear-gradient(to_left,white,white_80%,transparent)]';
    } else if (showPlaylistsRight) {
      return ' [mask-image:linear-gradient(to_right,white,white_80%,transparent)]';
    } else {
      return '';
    }
  };


  // Removed handlePlaySpotifyTrack as Spotify tracks will now play directly like uploaded music

  const currentHero = heroes[currentHeroIndex];

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <div className="relative mb-8">
        <SpotlightCard className={`hero px-8 rounded-lg flex flex-col md:flex-row items-center justify-between relative overflow-hidden ${currentHeroIndex === 0 ? 'bg-yellow-400 rounded-3xl' : `bg-gradient-to-r ${currentHero.gradient}`}`} spotlightColor="rgba(255, 255, 255, 0.2)">
          <div className="absolute -top-8 left-0 w-full z-0">
            <CurvedLoop marqueeText="Harmony ✦ Pulse ✦ Echo ✦ Rhythm ✦ Wave ✦" curveAmount={0} />
          </div>
          <div className="flex-1 mb-4 md:mb-0">
            <div className="bg-white text-[#0019FF] px-3 py-1 rounded-md font-montserrat font-semibold text-sm inline-block mb-2">
              {currentHero.greeting}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 font-montserrat leading-tight" style={{ color: currentHero.textColor }}>
              {currentHero.title}
            </h1>
            <TextType
              text={[currentHero.name] + '!'}
              typingSpeed={150}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="_"
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-montserrat leading-tight mb-4"
              style={{ color: currentHero.textColor }}
            />
            <p className="text-black text-xs md:text-sm mb-4 font-montserrat">{currentHero.description}</p>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => {
                  if (spotifyRecommendations.length > 0) {
                    onPlaySong(spotifyRecommendations[0], spotifyRecommendations);
                  }
                }}
                className={`bg-gradient-to-r ${currentHero.buttonColor} hover:bg-gradient-to-l ${currentHero.buttonHover} text-white px-8 py-3 rounded-lg font-montserrat hover:scale-105 transition-all duration-300`}
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
          {currentHeroIndex === 0 ? (
            <div className="flex-shrink-0 relative z-10">
              <div className="relative w-64 md:w-80 lg:w-96 xl:w-[28rem] h-auto aspect-square bg-transparent rounded-lg flex items-center justify-center">
                <img
                  src={headphone}
                  alt="Headphone"
                  className="absolute top-20 left-[-40px] w-24 h-24 opacity-80 float-animation"
                  style={{ animationDelay: "0s" }}
                />  
                <img
                  src={nota}
                  alt="Nota"
                  className="absolute top-12 right-14 w-24 h-24 float-animation"
                  style={{ animationDelay: '0.5s' }}
                />
                <img
                  src={drums}
                  alt="Drums"
                  className="absolute bottom-24 right-4 w-24 h-24 float-animation"
                  style={{ animationDelay: '1s' }}
                />
                <img
                  src={note}
                  alt="Note"
                  className="absolute bottom-24 left-4 w-14 h-14 opacity-80 float-animation"
                  style={{ animationDelay: '1.5s' }}
                />
                <img
                  src={guitar}
                  alt="Guitar"
                  className="w-62 h-62 float-animation"
                  style={{ animationDelay: '2s' }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 relative z-10">
              <img src={currentHero.bg} alt="Hero Background" className="w-64 md:w-80 lg:w-96 xl:w-[28rem] h-auto object-cover rounded-lg" />
            </div>
          )}
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
              <p className="text-black text-xs font-montserrat font-medium">
                {currentSong ? `${currentSong.title} by ${currentSong.artist}` : (spotifyRecommendations.length > 0 ? `${spotifyRecommendations[0].title} by ${spotifyRecommendations[0].artist}` : 'Loading...')}
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* Pager */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-20">
          {heroes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${
                index === currentHeroIndex
                  ? 'bg-yellow-400 border-white scale-125'
                  : 'bg-white/30 border-black/50 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating 3D Card */}
      <div className="flex justify-center mb-10 mt-2">
        <div className="card-3d">
          {(playableTopSongs.length > 0 ? playableTopSongs : Array.from({ length: 20 }, (_, i) => ({ id: `placeholder-${i}`, title: 'Loading...', artist: 'Please wait', cover: '/placeholder-cover.png' }))).map((song) => (
            <div key={song.id} className={`music-card-3d relative cursor-pointer ${song.id === currentSong?.id && isPlaying ? 'playing' : ''}`} onClick={() => { if (song.url) { onPlaySong(song, playableTopSongs); } else { console.log('No preview URL for song:', song.title); } }}>
              <img src={song.cover || "/placeholder-cover.png"} alt="Cover" className="w-full h-full object-cover rounded-lg" />
              <PlayingAnimationOverlay isPlaying={song.id === currentSong?.id && isPlaying} />
              <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 rounded-b-lg">
                <h3 className="text-xs font-semibold text-white truncate text-center">{song.title}</h3>
                <p className="text-xs text-gray-300 truncate text-center">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          {/* Recently Played Skeleton */}
          {user && (
            <section className="mb-8">
              <div className="h-6 bg-spotify-light dark:bg-light-light rounded mb-4 animate-pulse w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 lg:grid-cols-2 lg:grid-rows-4 gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="bg-spotify-dark dark:bg-light-dark rounded-lg p-4 animate-pulse">
                    <div className="w-full h-24 bg-spotify-light dark:bg-light-light rounded-lg mb-4"></div>
                    <div className="h-4 bg-spotify-light dark:bg-light-light rounded mb-2"></div>
                    <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My Music Skeleton */}
          {user && (
            <section className="mb-8">
              <div className="h-6 bg-spotify-light dark:bg-light-light rounded mb-4 animate-pulse w-32"></div>
              <div className="overflow-x-auto overflow-y-visible pb-4 -mx-2">
                <div className="flex gap-4 px-2 pt-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex-shrink-0 w-44 sm:w-48">
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Suggested Music Skeleton */}
          <section className="mb-8 pt-4">
            <div className="h-6 bg-spotify-light dark:bg-light-light rounded mb-4 animate-pulse w-40"></div>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 pr-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex-shrink-0 w-48 pt-2">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Suggested Playlists Skeleton */}
          <section className="mb-8">
            <div className="h-6 bg-spotify-light dark:bg-light-light rounded mb-4 animate-pulse w-48"></div>
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex-shrink-0 w-48">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {user && recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Recently Played</h2>
              {(() => {
                const numSongs = recentlyPlayed.slice(0, 8).length;
                const numRows = Math.ceil(numSongs / 2);
                return (
                  <div className={`grid grid-cols-2 gap-3 grid-rows-[${numRows}]`}>
                    {recentlyPlayed.slice(0, 8).map((song) => (
                      <RecentlyPlayedCard
                        key={song.id}
                        song={song}
                        onPlay={() => onPlaySong(song, recentlyPlayed)}
                        isPlaying={song.id === currentSong?.id && isPlaying}
                      />
                    ))}
                  </div>
                );
              })()}
            </section>
          )}

          {user && myMusic.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-spotify-white dark:text-light-white mb-4">My Music</h2>
              <div className="relative">
                <div className={`overflow-x-auto overflow-y-visible pb-4 -mx-2${getMyMusicMaskClass()}`} id="my-music-scroll" onScroll={handleMyMusicScroll}>
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
                          onEdit={onEdit}
                          isPlaying={song.id === currentSong?.id && isPlaying}
                          isFavorite={favorites.has(song.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {showMyMusicLeft && (
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('my-music-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {showMyMusicRight && (
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('my-music-scroll');
                      if (scrollContainer) {
                        scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </section>
          )}


          <section className="mb-8 pt-4">
            <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Suggested Music</h2>
            <div className="relative">
              <div className={`flex space-x-4 overflow-x-auto pb-4 pr-4 scroll-smooth${getMaskClass()}`} id="suggested-scroll" onScroll={handleScroll}>
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
                  {showLeftArrow && (
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('suggested-scroll');
                        if (scrollContainer) {
                          scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
                        }
                      }}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {showRightArrow && (
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('suggested-scroll');
                        if (scrollContainer) {
                          scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
                        }
                      }}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Suggested Playlists</h2>
            <div className="relative">
              <div className={`flex space-x-4 overflow-x-auto pb-4 scroll-smooth${getPlaylistsMaskClass()}`} id="playlists-scroll" onScroll={handlePlaylistsScroll}>
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
              {showPlaylistsLeft && (
                <button
                  onClick={() => {
                    const scrollContainer = document.getElementById('playlists-scroll');
                    if (scrollContainer) {
                      scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {showPlaylistsRight && (
                <button
                  onClick={() => {
                    const scrollContainer = document.getElementById('playlists-scroll');
                    if (scrollContainer) {
                      scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-spotify-black/80 hover:bg-spotify-black text-spotify-white rounded-full p-2 shadow-lg z-10"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
