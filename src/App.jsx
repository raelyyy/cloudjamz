import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, deleteDoc, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { AudioWaveform } from "lucide-react";
import { auth, db } from "./firebase";
import { extractMetadata } from "./utils/metadataExtractor";
import { uploadToCloudinary } from "./utils/cloudinary";
import { getLyrics } from "./utils/lyricsApi";
import { searchItunes } from "./utils/itunesApi";
import { useTheme } from "./contexts/ThemeContext";
import Snowfall from 'react-snowfall';
import snowflakePng from './assets/snowflake.png';
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import PlayingViewPanel from "./components/PlayingViewPanel";
import ClickSpark from "./components/ClickSpark";
import LoadingSpinner from "./components/LoadingSpinner";
import LoadingModal from "./components/LoadingModal";
import Chatbot from "./components/Chatbot";
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
import AboutDevs from "./pages/AboutDevs";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
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
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPlayingViewVisible, setIsPlayingViewVisible] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingModalMessage, setLoadingModalMessage] = useState("");

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

  // Fetch lyrics when current song changes
  useEffect(() => {
    const fetchLyrics = async () => {
      if (currentSong && currentSong.artist && currentSong.title) {
        setLyricsLoading(true);
        try {
          const fetchedLyrics = await getLyrics(currentSong.artist, currentSong.title);
          setLyrics(fetchedLyrics);
        } catch (error) {
          console.error('Error fetching lyrics:', error);
          setLyrics(null);
        } finally {
          setLyricsLoading(false);
        }
      } else {
        setLyrics(null);
        setLyricsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong]);


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
          // Ignore AbortError as it's expected when changing songs
          if (error.name !== 'AbortError') {
            console.error("Error playing audio:", error);
            // Keep isPlaying as true so the panel remains visible
          }
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

  const getRelatedSongs = async (artist) => {
    try {
      const results = await searchItunes(artist);
      // Filter out the current song if it's in the results
      return results.filter(song => song.title !== currentSong?.title || song.album !== currentSong?.album);
    } catch (error) {
      console.error("Error fetching related songs:", error);
      return [];
    }
  };

  const nextSong = async () => {
    if (playlist.length > 0 && currentIndex >= 0) {
      let nextIndex = (currentIndex + 1) % playlist.length;

      // Check if we've reached the end and loop is not 'all'
      if (nextIndex === 0 && loop !== 'all') {
        // End of playlist, try to play related songs
        if (currentSong && currentSong.artist) {
          try {
            const relatedSongs = await getRelatedSongs(currentSong.artist);
            if (relatedSongs.length > 0) {
              // Set related songs as new playlist
              setPlaylist(relatedSongs);
              setOriginalPlaylist(relatedSongs);
              setCurrentIndex(0);
              playSong(relatedSongs[0], relatedSongs);
              return true;
            }
          } catch (error) {
            console.error("Error fetching related songs:", error);
          }
        }
        // If no related songs or error, stop playback
        setIsPlaying(false);
        setCurrentSong(null);
        setCurrentIndex(-1);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return false;
      }

      const nextSong = playlist[nextIndex];
      // Check if the next song has a valid URL
      if (nextSong && nextSong.url) {
        setCurrentIndex(nextIndex);
        playSong(nextSong, playlist);
        return true;
      } else {
        // If the next song doesn't have a URL, try to find one that does
        let validIndex = -1;
        for (let i = 1; i < playlist.length; i++) {
          const checkIndex = (nextIndex + i) % playlist.length;
          if (playlist[checkIndex] && playlist[checkIndex].url) {
            validIndex = checkIndex;
            break;
          }
        }

        if (validIndex !== -1) {
          setCurrentIndex(validIndex);
          playSong(playlist[validIndex], playlist);
          return true;
        } else {
          // No valid songs found, stop playback
          setIsPlaying(false);
          setCurrentSong(null);
          setCurrentIndex(-1);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          return false;
        }
      }
    } else {
      // No playlist, stop playback
      setIsPlaying(false);
      setCurrentSong(null);
      setCurrentIndex(-1);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      return false;
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
      'audio/mpeg',  // MP3
      'audio/mp3',   // MP3
      'audio/aac',   // AAC
      'audio/ogg',   // OGG
      'audio/webm',  // WebM
      'audio/wav',   // WAV
      'audio/wave',  // WAV
      'audio/flac',  // FLAC
      'audio/mp4',   // M4A / MP4
      'audio/x-m4a', // M4A alternative MIME type
      'audio/aiff',  // AIFF
      'audio/x-aiff',// AIFF alternative
      'audio/matroska', // MKV audio-only
      'audio/opus'   // Opus
    ];

    setShowLoadingModal(true);
    setLoadingModalMessage("Uploading songs...");

    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('audio/')) {
          // Check if format is supported
          if (!supportedFormats.includes(file.type.toLowerCase())) {
            alert(`Unsupported audio format: ${file.type}. Please use MP3, AAC, OGG, WebM, or WAV files.`);
            continue;
          }

          setLoadingModalMessage(`Processing ${file.name}...`);

          // Extract metadata
          const metadata = await extractMetadata(file);

          // Check for duplicate song names and handle numbering
          let finalTitle = metadata.title || file.name.replace(/\.[^/.]+$/, ""); // Remove extension if no title

          // Query existing songs by this user
          const existingSongsQuery = query(collection(db, "songs"), where("userId", "==", user.uid));
          const existingSongsSnapshot = await getDocs(existingSongsQuery);
          const existingTitles = existingSongsSnapshot.docs.map(doc => doc.data().title);

          // Find duplicates and determine the next number
          const baseTitle = finalTitle.replace(/\s*\(\d+\)$/, ""); // Remove existing numbering
          const duplicates = existingTitles.filter(title =>
            title === baseTitle || title.startsWith(baseTitle + " (")
          );

          if (duplicates.length > 0) {
            // Find the highest number used among numbered duplicates
            let maxNumber = 0;
            duplicates.forEach(title => {
              const match = title.match(/\((\d+)\)$/);
              if (match) {
                const num = parseInt(match[1]);
                if (num > maxNumber) maxNumber = num;
              }
            });

            // Always increment from the highest number found
            // If only the base title exists (no numbered versions), start from (1)
            // If numbered versions exist, increment the highest
            finalTitle = baseTitle + ` (${maxNumber + 1})`;
          }

          setLoadingModalMessage(`Uploading ${finalTitle}...`);

          // Upload file to Cloudinary
          const uploadResult = await uploadToCloudinary(file);

          // Upload cover to Cloudinary if available
          let coverUrl = null;
          if (metadata.cover) {
            try {
              setLoadingModalMessage(`Uploading cover for ${finalTitle}...`);
              // Convert blob URL to File object for upload
              const coverResponse = await fetch(metadata.cover);
              const coverBlob = await coverResponse.blob();
              const coverFile = new File([coverBlob], 'cover.jpg', { type: 'image/jpeg' });
              const coverUploadResult = await uploadToCloudinary(coverFile);
              coverUrl = coverUploadResult.url;
            } catch (error) {
              console.warn('Failed to upload cover image:', error);
              coverUrl = null;
            }
          }

          setLoadingModalMessage(`Saving ${finalTitle}...`);

          const newSong = {
            id: Date.now() + Math.random(),
            title: finalTitle,
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
            createdAt: new Date(),
          };

          // Save to Firestore
          await addDoc(collection(db, "songs"), newSong);
        } else {
          alert("Please select audio files only.");
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setShowLoadingModal(false);
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

      // Remove from recently played
      const recentlyPlayedQuery = query(
        collection(db, "recentlyPlayed"),
        where("userId", "==", user.uid),
        where("songId", "==", song.id)
      );
      const recentlyPlayedSnapshot = await getDocs(recentlyPlayedQuery);
      recentlyPlayedSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // If the deleted song is currently playing, stop it and clear current song
      if (currentSong && currentSong.id === song.id) {
        setCurrentSong(null);
        setIsPlaying(false);
        setCurrentIndex(-1);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }

      // Remove from current playlist if present
      if (playlist.length > 0) {
        const updatedPlaylist = playlist.filter(s => s.id !== song.id);
        setPlaylist(updatedPlaylist);
        setOriginalPlaylist(updatedPlaylist);

        // Update current index if necessary
        if (currentIndex >= updatedPlaylist.length) {
          setCurrentIndex(updatedPlaylist.length - 1);
        } else if (currentIndex > 0) {
          // Find the new index of the current song
          const currentSongIndex = updatedPlaylist.findIndex(s => currentSong && s.id === currentSong.id);
          setCurrentIndex(currentSongIndex >= 0 ? currentSongIndex : currentIndex);
        }
      }

      // Remove from favorites
      if (favorites.has(song.id)) {
        const newFavorites = new Set(favorites);
        newFavorites.delete(song.id);
        setFavorites(newFavorites);

        // Also remove from favorites collection
        const favQuery = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("songId", "==", song.id)
        );
        const favSnapshot = await getDocs(favQuery);
        favSnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }

      // Remove from all playlists
      const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", user.uid));
      const playlistsSnapshot = await getDocs(playlistsQuery);
      playlistsSnapshot.forEach(async (playlistDoc) => {
        const playlistData = playlistDoc.data();
        const songs = playlistData.songs || [];
        const updatedSongs = songs.filter(s => s.id !== song.id);

        if (updatedSongs.length !== songs.length) {
          // Song was removed from this playlist
          await updateDoc(playlistDoc.ref, { songs: updatedSongs });

          // Update local state
          setPlaylists(prev => prev.map(p =>
            p.id === playlistDoc.id ? { ...p, songs: updatedSongs } : p
          ));
        }
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

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  const setCurrentSongPaused = (song) => {
    setCurrentSong(song);
    // Don't set isPlaying to true, keep it paused
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
    setShowLoadingModal(true);
    setLoadingModalMessage("Uploading cover image...");
    try {
      const result = await uploadToCloudinary(file);
      return result.url;
    } catch (error) {
      console.error("Error uploading cover:", error);
      return null;
    } finally {
      setUploadingCover(false);
      setShowLoadingModal(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;

    setShowLoadingModal(true);
    setLoadingModalMessage("Creating playlist...");

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
        setShowLoadingModal(false);
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

      setLoadingModalMessage("Saving playlist...");

      const playlistData = {
        name: newPlaylistName.trim(),
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
      setNewPlaylistCover(null);
      setShowCreatePlaylistModal(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setShowLoadingModal(false);
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
          <AudioWaveform className="w-12 h-12 mr-3" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }} />

        </div>
        <h1 className="text-spotify-white dark:text-light-white text-3xl font-bold">CloudJamz</h1>
        <div className="loader mt-1" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }}>
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
              <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
              <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
            </svg>
          </span>
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
              <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
              <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
            </svg>
          </span>
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
              <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
              <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
            </svg>
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => navigate('/')} />;
  }

  return (
    <ClickSpark sparkColor={isDarkMode ? '#DAA520' : '#F7E35A'}>
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
          } else if (result.type === 'artist') {
            // Navigate to artist page
            navigate(`/artist/${encodeURIComponent(result.artist)}`);
          } else if (result.type === 'album') {
            // Navigate to album page
            navigate(`/album/${encodeURIComponent(result.album)}`);
          } else {
            // For others, open external
            window.open(result.external_url, '_blank');
          }
        }} onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} onTogglePlayingView={() => setIsPlayingViewVisible(!isPlayingViewVisible)} isSidebarVisible={isSidebarVisible} isPlayingViewVisible={isPlayingViewVisible} />

        <div className="flex flex-1 overflow-hidden pt-16">
          <Sidebar onNavigate={handleNavigate} onUpload={handleUpload} onCreatePlaylist={() => setShowCreatePlaylistModal(true)} user={user} isMobileOpen={isMobileSidebarOpen} onToggleMobile={() => setIsMobileSidebarOpen(false)} currentPath={location.pathname} isVisible={isSidebarVisible} />

          <div className="flex flex-1 overflow-hidden">
            <Routes className="flex-1">
              <Route path="/" element={<Home user={user} onPlaySong={handlePlayFromCard} onDelete={deleteSong} currentSong={currentSong} isPlaying={isPlaying} onFavorite={toggleFavorite} favorites={favorites} onAddToPlaylist={addToPlaylist} onSetCurrentSongPaused={setCurrentSongPaused} onUpdateCurrentSong={setCurrentSong} />} />
              <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
              <Route path="/auth" element={<Auth onLogin={() => navigate('/')} />} />
              <Route path="/playlists" element={<Playlists user={user} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} onCreatePlaylist={() => setShowCreatePlaylistModal(true)} />} />
              <Route path="/playlist/:id" element={<PlaylistPage onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} favorites={favorites} onFavorite={toggleFavorite} onRemoveFromPlaylist={handleRemoveFromPlaylist} />} />
              <Route path="/liked" element={<LikedSongs user={user} onPlaySong={handlePlayFromCard} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} currentSong={currentSong} isPlaying={isPlaying} />} />
              <Route path="/my-music" element={<MyMusic user={user} onPlaySong={handlePlayFromCard} onFavorite={toggleFavorite} onAddToPlaylist={addToPlaylist} onDeleteSong={deleteSong} currentSong={currentSong} isPlaying={isPlaying} onUpdateCurrentSong={setCurrentSong} />} />
              <Route path="/artist/:name" element={<ArtistPage artistName={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} />} />
              <Route path="/album/:name" element={<AlbumPage albumName={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} currentSong={currentSong} isPlaying={isPlaying} />} />
              <Route path="/song/:id" element={<SongPage songId={window.location.pathname.split('/').pop()} onPlaySong={handlePlayFromCard} />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/account-settings" element={<AccountSettingsPage />} />
              <Route path="/trash" element={<TrashPage user={user} />} />
              <Route path="/about-devs" element={<AboutDevs />} />
              <Route path="/search" element={<Home user={user} onPlaySong={handlePlayFromCard} onDelete={deleteSong} currentSong={currentSong} isPlaying={isPlaying} />} />
            </Routes>
          </div>

        {/* Only show PlayingViewPanel if not on settings or account-settings pages and not on small screens */}
        {location.pathname !== '/settings' && location.pathname !== '/account-settings' && !isSmallScreen && isPlayingViewVisible && (currentSong || playlist.length > 0) && (
          <PlayingViewPanel
            currentSong={currentSong}
            playlist={playlist}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            onPlaySong={handlePlayFromCard}
            showLyrics={showLyrics}
            lyrics={lyrics}
            lyricsLoading={lyricsLoading}
            onNavigate={handleNavigate}
            isVisible={isPlayingViewVisible}
          />
        )}

        {/* Playlist Modal */}
        {showPlaylistModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-spotify-dark dark:bg-light-dark p-6 rounded-lg w-full max-w-md">
              <h3 className="text-spotify-white dark:text-light-white text-lg font-semibold mb-4">Select a Playlist</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className={`w-full text-left p-3 rounded text-spotify-white dark:text-light-white transition border-2 ${
                      selectedPlaylist?.id === playlist.id
                        ? 'border-yellow-300 text-yellow-300 bg-yellow-300/10'
                        : 'border-gray-600 hover:border-yellow-300/50'
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
            className="px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(to right, #F7E35A, #DAA520)', color: 'black' }}
          >
            OK
          </button>
          <button
            onClick={() => {
              setShowPlaylistModal(false);
              setSelectedPlaylist(null);
            }}
            className="px-4 py-2 border border-spotify-light dark:border-light-light text-spotify-white dark:text-light-white rounded hover:border-spotify-white dark:hover:border-light-white transition"
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
                    className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400 "
                    required
                  />
                </div>
                <div>
                  <label className="block text-spotify-lighter dark:text-light-lighter text-sm mb-2">Cover Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewPlaylistCover(e.target.files[0])}
                    className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white file:bg-gradient-to-r file:from-[#F7E35A] file:to-[#DAA520] file:text-black file:border-none file:px-3 file:py-1 file:rounded file:mr-3 file:cursor-pointer hover:border-yellow-400 transition"
                  />
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    type="submit"
                    disabled={uploadingCover}
                    className="px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(to right, #F7E35A, #DAA520)', color: 'black' }}
                  >
                    {uploadingCover ? "Uploading..." : "Create Playlist"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePlaylistModal(false);
                      setNewPlaylistName("");
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

        {/* Loading Modal */}
        <LoadingModal
          isOpen={showLoadingModal}
          message={loadingModalMessage}
        />

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
          showLyrics={showLyrics}
          onToggleLyrics={toggleLyrics}
          onNavigate={handleNavigate}
          onToggleChatbot={toggleChatbot}
          isChatbotOpen={isChatbotOpen}
        />

        <Chatbot
          isOpen={isChatbotOpen}
          onClose={toggleChatbot}
          onPlaySong={handlePlayFromCard}
          currentSong={currentSong}
          onTogglePlayPause={togglePlayPause}
          onNext={nextSong}
          onPrev={prevSong}
          onShuffleToggle={toggleShuffle}
          shuffle={shuffle}
          onLoopToggle={toggleLoop}
          loop={loop}
          onSearchResult={(result) => {
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
            } else if (result.type === 'artist') {
              // Navigate to artist page
              navigate(`/artist/${encodeURIComponent(result.artist)}`);
            } else if (result.type === 'album') {
              // Navigate to album page
              navigate(`/album/${encodeURIComponent(result.album)}`);
            } else {
              // For others, open external
              window.open(result.external_url, '_blank');
            }
          }}
        />
      </div>
    </ClickSpark>
  );
}

export default function App() {
  const [snowflakeImages, setSnowflakeImages] = useState([]);

  useEffect(() => {
    const img = new Image();
    img.src = snowflakePng;
    setSnowflakeImages([img]);
  }, []);

  return (
    <>
      <Snowfall images={snowflakeImages} snowflakeCount={200} size={[40, 80]} style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: -1 }} />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}
