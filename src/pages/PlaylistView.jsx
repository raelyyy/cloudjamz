import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import SkeletonCard from "../components/SkeletonCard";
import { ArrowLeft } from "lucide-react";

export default function PlaylistView({ playlistId, user, onPlaySong }) {
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    const playlistRef = doc(db, "playlists", playlistId);
    const unsubscribe = onSnapshot(playlistRef, (doc) => {
      if (doc.exists()) {
        const playlistData = { id: doc.id, ...doc.data() };
        setPlaylist(playlistData);
        setSongs(playlistData.songs || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching playlist:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [playlistId]);

  const removeSongFromPlaylist = async (songId) => {
    try {
      const filteredSongs = songs.filter(song => song.id !== songId);
      await updateDoc(doc(db, "playlists", playlistId), {
        songs: filteredSongs,
      });
      setSongs(filteredSongs);
    } catch (error) {
      console.error("Error removing song from playlist:", error);
    }
  };

  const handlePlaySong = (song) => {
    setCurrentlyPlaying(song.id === currentlyPlaying ? null : song.id);
    onPlaySong(song);
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-6 h-6 bg-spotify-light dark:bg-light-light rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-spotify-light dark:bg-light-light rounded mb-2 animate-pulse w-64"></div>
            <div className="h-4 bg-spotify-light dark:bg-light-light rounded animate-pulse w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter">Playlist not found.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-spotify-white dark:text-light-white">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-spotify-lighter dark:text-light-lighter text-lg mt-2">{playlist.description}</p>
          )}
          <p className="text-spotify-lighter dark:text-light-lighter mt-1">{songs.length} songs</p>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <div key={song.id} className="relative group">
              <MusicCard
                song={song}
                isFavorite={false}
                onPlay={() => handlePlaySong(song)}
                isPlaying={currentlyPlaying === song.id}
                showAddToPlaylist={false}
                showLikeButton={false}
              />
              {user && playlist.userId === user.uid && (
                <button
                  onClick={() => removeSongFromPlaylist(song.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          This playlist is empty. Add some songs to get started!
        </div>
      )}
    </main>
  );
}
