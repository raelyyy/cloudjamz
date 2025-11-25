import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, deleteDoc, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Music } from "lucide-react";
import { auth, db } from "./firebase";
import { extractMetadata } from "./utils/metadataExtractor";
import { uploadToCloudinary } from "./utils/cloudinary";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import PlayingViewPanel from "./components/PlayingViewPanel";
import Home from "./pages/Home";

import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Playlists from "./pages/Playlists";
import PlaylistView from "./pages/PlaylistView";
import ArtistPage from "./pages/ArtistPage";
import AlbumPage from "./pages/AlbumPage";
import SongPage from "./pages/SongPage";
import SettingsPage from "./pages/SettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import TrashPage from "./pages/TrashPage";
import PlaylistPage from "./pages/PlaylistPage";
import LikedSongs from "./pages/LikedSongs";
import MyMusic from "./pages/MyMusic";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState('off');
  const [playlist, setPlaylist] = useState([]);
  const [originalPlaylist, setOriginalPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [favorites, setFavorites] = useState(new Set());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // stop loading after checking auth
    });
    return () => unsubscribe();
  }, []);

  // Detect small screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateProgress = () => {
        setProgress(audio.currentTime);
        setDuration(audio.duration || 0);
      };
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', updateProgress);
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', updateProgress);
      };
    }
  }, [currentSong]);

  // Spacebar control for play/pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle spacebar if not in an input/textarea
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentSong]);

  const playSong = async (song, songList = []) => {
    if (song.url) {
      setCurrentSong(song);
      setIsPlaying(true);
      if (songList.length > 0) {
        setPlaylist(songList);
        setOriginalPlaylist([...songList]); // Store original order
        setCurrentIndex(songList.findIndex(s => s.id === song.id));
      }

      // Record recently played song (avoid duplicates)
      if (user && song.id) {
        try {
          // Check if song already exists in recently played
          const existingQuery = query(
            collection(db, "recentlyPlayed"),
            where("userId", "==", user.uid),
            where("songId", "==", song.id)
          );
          const existingSnapshot = await getDocs(existingQuery);

          if (!existingSnapshot.empty) {
            // Update existing entry with new timestamp
            const existingDoc = existingSnapshot.docs[0];
            await updateDoc(existingDoc.ref, {
              playedAt: new Date(),
            });
          } else {
            // Add new entry
            await addDoc(collection(db, "recentlyPlayed"), {
              userId: user.uid,
              songId: song.id,
              songData: song,
              playedAt: new Date(),
            });
          }
        } catch (error) {
          console.warn("Error recording recently played:", error);
        }
      }

      if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.load(); // Load the audio first
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const pauseSong = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else if (currentSong) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const handlePlayFromCard = (song, songList = []) => {
    if (currentSong && currentSong.id === song.id) {
      // Toggle play/pause for current song
      togglePlayPause();
    } else {
      // Play different song
      playSong(song, songList);
    }
  };



  const handleSongEnd = () => {
    if (loop === 'one') {
      // Repeat current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setIsPlaying(true);
        audioRef.current.play().catch(error => {
          console.error("Error replaying song:", error);
          setIsPlaying(false);
        });
      }
    } else {
      nextSong();
    }
  };

  const nextSong = () => {
    if (playlist.length > 0 && currentIndex >= 0) {
      let nextIndex = (currentIndex + 1) % playlist.length;

      // Check if we've reached the end and loop is not 'all'
      if (nextIndex === 0 && loop !== 'all') {
        // End of playlist, stop playback
        setIsPlaying(false);
        setCurrentSong(null);
        setCurrentIndex(-1);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return;
      }

      const nextSong = playlist[nextIndex];
      setCurrentIndex(nextIndex);
      playSong(nextSong, playlist);
    } else {
      // No playlist, stop playback
      setIsPlaying(false);
      setCurrentSong(null);
      setCurrentIndex(-1);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const prevSong = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevSong = playlist[prevIndex];
      setCurrentIndex(prevIndex);
      playSong(prevSong, playlist);
    } else {
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  const handleUpload = async (files) => {
    if (!user) {
      alert("Please log in to upload songs.");
      return;
    }

    // Supported audio formats for HTML5 audio
    const supportedFormats = [
      'audio/mpeg', // MP3
      'audio/mp3',  // MP3
      'audio/aac',  // AAC
      'audio/ogg',  // OGG
      'audio/webm', // WebM
      'audio/wav',  // WAV
      'audio/wave', // WAV
      'audio/flac'  // FLAC (limited browser support)
    ];

    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/')) {
        // Check if format is supported
        if (!supportedFormats.includes(file.type.toLowerCase())) {
          alert(`Unsupported audio format: ${file.type}. Please use MP3, AAC, OGG, WebM, or WAV files.`);
          continue;
        }

        try {
          // Extract metadata
          const metadata = await extractMetadata(file);

          // Upload file to Cloudinary
          const uploadResult = await uploadToCloudinary(file, `songs/${user.uid}`);

          // Upload cover to Cloudinary if available
          let coverUrl = null;
          if (metadata.cover) {
            try {
              // Convert blob URL to File object for upload
              const coverResponse = await fetch(metadata.cover);
              const coverBlob = await coverResponse.blob();
              const coverFile = new File([coverBlob], 'cover.jpg', { type: 'image/jpeg' });
              const coverUploadResult = await uploadToCloudinary(coverFile, `covers/${user.uid}`);
              coverUrl = coverUploadResult.url;
            } catch (error) {
              console.warn('Failed to upload cover image:', error);
              coverUrl = null;
            }
          }

          const newSong = {
            id: Date.now() + Math.random(),
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            year: metadata.year,
            genre: metadata.genre,
            duration: metadata.duration,
            cover: coverUrl,
            url: uploadResult.url,
            userId: user.uid,
            cloudinaryPublicId: uploadResult.publicId,
            isUploaded: true,
          };

          // Save to Firestore
          await addDoc(collection(db, "songs"), newSong);
        } catch (error) {
          console.error("Upload failed:", error);
          alert("Upload failed. Check console for details.");
        }
      } else {
        alert("Please select audio files only.");
      }
    }
  };

  const deleteSong = async (song) => {
    if (!user || song.userId !== user.uid) return;

    try {
      // Move song to trash collection instead of deleting permanently
      await addDoc(collection(db, "trash"), {
        ...song,
        deletedAt: new Date(),
      });

      // Remove from songs collection
      const songQuery = query(
        collection(db, "songs"),
        where("userId", "==", user.uid),
        where("id", "==", song.id)
      );
      const querySnapshot = await getDocs(songQuery);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    } catch (error) {
      console.error("Error deleting song:", error);
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const toggleShuffle = () => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);

    if (newShuffle && originalPlaylist.length > 0) {
      // Shuffle the playlist
      const shuffled = [...originalPlaylist].sort(() => Math.random() - 0.5);
      setPlaylist(shuffled);
      // Update current index to match the new position of current song
      if (currentSong) {
        const newIndex = shuffled.findIndex(s => s.id === currentSong.id);
        setCurrentIndex(newIndex);
      }
    } else if (!newShuffle && originalPlaylist.length > 0) {
      // Restore original order
      setPlaylist([...originalPlaylist]);
      // Update current index to match the original position
      if (currentSong) {
        const newIndex = originalPlaylist.findIndex(s => s.id === currentSong.id);
        setCurrentIndex(newIndex);
      }
    }
  };

  const toggleLoop = (mode) => {
    setLoop(mode);
  };

  const toggleFavorite = async (song) => {
    if (!user) return;

    const isFav = favorites.has(song.id);
    const newFavorites = new Set(favorites);

    if (isFav) {
      newFavorites.delete(song.id);
      // Remove from favorites collection
      try {
        const favQuery = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("songId", "==", song.id)
        );
        const querySnapshot = await getDocs(favQuery);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } catch (error) {
        console.error("Error removing favorite:", error);
      }
    } else {
      newFavorites.add(song.id);
      // Add to favorites collection
      try {
        await addDoc(collection(db, "favorites"), {
          userId: user.uid,
          songId: song.id,
          songData: song, // Store song data for API songs
          addedAt: new Date(),
        });
      } catch (error) {
        console.error("Error adding favorite:", error);
      }
    }

    setFavorites(newFavorites);
  };

  // Load favorites on user login with real-time updates
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    const favQuery = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(favQuery, (querySnapshot) => {
      const favSet = new Set();
      querySnapshot.forEach((doc) => {
        favSet.add(doc.data().songId);
      });
      setFavorites(favSet);
    });

    return () => unsubscribe();
  }, [user]);

  // Load playlists on user login
  useEffect(() => {
    const loadPlaylists = async () => {
      if (!user) {
        setPlaylists([]);
        return;
      }

      try {
        const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(playlistsQuery);
        const userPlaylists = [];
        querySnapshot.forEach((doc) => {
          userPlaylists.push({ id: doc.id, ...doc.data() });
        });
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error("Error loading playlists:", error);
      }
    };

    loadPlaylists();
  }, [user]);

  const addToPlaylist = (song) => {
    setSongToAdd(song);
    setShowPlaylistModal(true);
  };

  // Global function for playlist page to trigger add to playlist
  window.handleAddToPlaylist = addToPlaylist;

  const handleCoverUpload = async (file) => {
    if (!file) return null;
    setUploadingCover(true);
    try {
      const result = await uploadToCloudinary(file, `playlist-covers/${user.uid}`);
      return result.url;
    } catch (error) {
      console.error("Error uploading cover:", error);
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;

    try {
      // Check if playlist with same name already exists
      const existingQuery = query(
        collection(db, "playlists"),
        where("userId", "==", user.uid),
        where("name", "==", newPlaylistName.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        alert("A playlist with this name already exists. Please choose a different name.");
        return;
      }

      // Generate a unique gradient color for this playlist
      const gradients = [
        'from-red-500',
        'from-pink-500',
        'from-purple-500',
        'from-blue-500',
        'from-yellow-500',
        'from-gray-500',
        'from-green-500',
        'from-orange-500',
        'from-indigo-500',
        'from-teal-500',
        'from-cyan-500',
        'from-lime-500',
        'from-emerald-500',
        'from-violet-500',
        'from-fuchsia-500',
        'from-rose-500'
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      let coverUrl = null;
      if (newPlaylistCover) {
        coverUrl = await handleCoverUpload(newPlaylistCover);
      }

      const playlistData = {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription,
        cover: coverUrl,
        userId: user.uid,
        songs: [],
        gradientColor: randomGradient,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "playlists"), playlistData);
      const newPlaylist = {
        id: docRef.id,
        ...playlistData,
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setNewPlaylistCover(null);
      setShowCreatePlaylistModal(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!songToAdd || !user) return;

    try {
      const playlistRef = doc(db, "playlists", playlistId);
      const playlistDoc = await getDoc(playlistRef);
      if (playlistDoc.exists()) {
        const playlistData = playlistDoc.data();
        const existingSongs = playlistData.songs || [];
        // Check for duplicates
        if (existingSongs.some(s => s.id === songToAdd.id)) {
          console.log("Song already in playlist");
          setShowPlaylistModal(false);
          setSongToAdd(null);
          return;
        }
        const updatedSongs = [...existingSongs, songToAdd];
        await updateDoc(playlistRef, { songs: updatedSongs });
        // Update local state
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, songs: updatedSongs } : p));
      }
    } catch (error) {
      console.error("Error adding song to playlist:", error);
    } finally {
      setShowPlaylistModal(false);
      setSongToAdd(null);
    }
  };

  const handleRemoveFromPlaylist = async (song, playlistId) => {
    if (!user) return;

    try {
      const playlistRef = doc(db, "playlists", playlistId);
      const playlistDoc = await getDoc(playlistRef);
      if (playlistDoc.exists()) {
        const playlistData = playlistDoc.data();
        const updatedSongs = (playlistData.songs || []).filter(s => s.id !== song.id);
        await updateDoc(playlistRef, { songs: updatedSongs });
        // Update local state
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, songs: updatedSongs } : p));
      }
    } catch (error) {
      console.error("Error removing song from playlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-spotify-black dark:bg-light-black">
        <div className="flex items-center mb-4">
          <Music className="w-12 h-12 text-spotify-green mr-3" />
          
        </div>
        <h1 className="text-spotify-white text-3xl font-bold">CloudJamz</h1>
        <div className="text-spotify-lighter text-3xl font-bold">•••</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => navigate('/')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-spotify-black dark:bg-light-black">
      <audio ref={audioRef} onEnded={handleSongEnd} />
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} onSearchResult={(result) => {
        if (result.type === 'track' && result.url) {
          // Create a song object for local playback
          const songForPlayback = {
            id: result.id,
            title: result.title,
            artist: result.artist,
            album: result.album,
            cover: result.cover,
            url: result.url,
            duration: 30, // Preview tracks are 30 seconds
            userId: null, // Not a user-uploaded song
            isSpotifyTrack: true
          };
          playSong(songForPlayback);
        } else {
          // For artists and albums, open in Spotify
          window.open(result.external_url, '_blank');
        }
      }} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar onNavigate={handleNavigate} onUpload={handleUpload} onCreatePlaylist={() => setShowCreatePlaylistModal(true)} user={user} isMobileOpen={isMobileSidebarOpen} onToggleMobile={() => setIsMobileSidebarOpen(false)} />

        <div className="flex flex-1 overflow-hidden">
          <Routes className="flex-1">
            <Route path="/" element={<Home user={user} onPlaySong={handlePlayFromCard} onDelete={deleteSong} currentSong={currentSong} isPlaying={isPlaying} onFavorite={toggleFavorite} favorites={favorites} onAddToPlaylist={addToPlaylist} />} />
            <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
            <Route path="/auth" element={<Auth onLogin={() => navigate('/')} />} />
            <Route path="/playlists" element={<Playlists user={user} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} onCreatePlaylist={() => setShowCreatePlaylistModal(true)} />} />
            <Route path="/playlist/:id" element={<PlaylistPage onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} favorites={favorites} onFavorite={toggleFavorite} onRemoveFromPlaylist={handleRemoveFromPlaylist} />} />
            <Route path="/liked" element={<LikedSongs user={user} onPlaySong={handlePlayFromCard} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} currentSong={currentSong} isPlaying={isPlaying} />} />
            <Route path="/my-music" element={<MyMusic user={user} onPlaySong={handlePlayFromCard} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} onDeleteSong={deleteSong} currentSong={currentSong} isPlaying={isPlaying} />} />
            <Route path="/artist/:name" element={<ArtistPage artistName={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} />} />
            <Route path="/album/:name" element={<AlbumPage albumName={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} />} />
            <Route path="/song/:id" element={<SongPage songId={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account-settings" element={<AccountSettingsPage />} />
            <Route path="/trash" element={<TrashPage user={user} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} />} />
            <Route path="/search" element={<Home user={user} onPlaySong={handlePlayFromCard} onDelete={deleteSong} currentSong={currentSong} isPlaying={isPlaying} />} />
          </Routes>
        </div>

      {/* Only show PlayingViewPanel if not on settings or account-settings pages and not on small screens */}
      {location.pathname !== '/settings' && location.pathname !== '/account-settings' && !isSmallScreen && (
        <PlayingViewPanel
          currentSong={currentSong}
          playlist={playlist}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onPlaySong={handlePlayFromCard}
        />
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-spotify-dark dark:bg-light-dark p-6 rounded-lg w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Select a Playlist</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setSelectedPlaylist(playlist)}
                  className={`w-full text-left p-3 rounded text-spotify-white dark:text-light-white transition border-2 ${
                    selectedPlaylist?.id === playlist.id
                      ? 'border-spotify-green text-spotify-green bg-transparent'
                      : 'border-gray-600 hover:border-spotify-green/50'
                  }`}
                >
                  {playlist.name}
                </button>
              ))}
            </div>
      <div className="flex gap-4 mt-4 justify-end">
        <button
          onClick={() => {
            if (selectedPlaylist && songToAdd) {
              handleAddToPlaylist(selectedPlaylist.id);
            }
            setShowPlaylistModal(false);
            setSelectedPlaylist(null);
          }}
          disabled={!selectedPlaylist}
          className="px-4 py-2 bg-spotify-green hover:bg-spotify-green/80 disabled:bg-spotify-green/50 disabled:cursor-not-allowed text-spotify-black rounded transition"
        >
          OK
        </button>
        <button
          onClick={() => {
            setShowPlaylistModal(false);
            setSelectedPlaylist(null);
          }}
          className="px-4 py-2 bg-spotify-light text-white rounded hover:bg-spotify-green/20 transition"
        >
          Cancel
        </button>
      </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-spotify-dark dark:bg-light-dark p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white mb-4">Create New Playlist</h2>
            <form onSubmit={createPlaylist} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-spotify-green"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-spotify-green resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-spotify-lighter dark:text-light-lighter text-sm mb-2">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPlaylistCover(e.target.files[0])}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white file:bg-spotify-green file:text-spotify-black file:border-none file:px-3 file:py-1 file:rounded file:mr-3 file:cursor-pointer hover:border-spotify-green transition"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="bg-spotify-green hover:bg-spotify-green/80 text-spotify-black px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingCover ? "Uploading..." : "Create Playlist"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePlaylistModal(false);
                    setNewPlaylistName("");
                    setNewPlaylistDescription("");
                    setNewPlaylistCover(null);
                  }}
                  className="px-4 py-2 border border-spotify-light dark:border-light-light text-spotify-white dark:text-light-white rounded hover:border-spotify-white dark:hover:border-light-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        progress={progress}
        duration={duration}
        onTogglePlayPause={togglePlayPause}
        onNext={nextSong}
        onPrev={prevSong}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        formatTime={formatTime}
        shuffle={shuffle}
        loop={loop}
        onShuffleToggle={toggleShuffle}
        onLoopToggle={toggleLoop}
        onFavoriteToggle={() => currentSong && toggleFavorite(currentSong)}
        isFavorite={currentSong && favorites.has(currentSong.id)}
        onAddToPlaylist={addToPlaylist}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
