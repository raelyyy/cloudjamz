import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import { ChevronLeft } from "lucide-react";

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
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Loading playlist...</div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Playlist not found.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      {/* Spotify-like header with gradient background */}
      <div className={`relative rounded-tl-xl rounded-tr-xl p-8 mb-8 ${
        playlist.cover
          ? 'bg-gradient-to-b from-spotify-dark/80 to-spotify-black'
          : 'bg-gradient-to-b from-spotify-green to-spotify-black'
      }`}>
        {playlist.cover && (
          <div className="absolute inset-0 bg-black/40 rounded-tl-xl rounded-tr-xl"></div>
        )}
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center mb-6 text-spotify-lighter hover:text-spotify-white transition relative z-10"
        >
          <div className="w-10 h-10 rounded-full bg-spotify-light/20 flex items-center justify-center mr-2 hover:bg-spotify-light/40 transition">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back
        </button>
        <div className="flex items-end gap-6 relative z-10">
          {playlist.cover ? (
            <img
              src={playlist.cover}
              alt={playlist.name}
              className="w-48 h-48 object-cover rounded-lg shadow-2xl"
            />
          ) : (
            <div className="w-48 h-48 bg-gradient-to-br from-spotify-green to-spotify-black rounded-lg flex items-center justify-center shadow-2xl">
              <div className="w-24 h-24 bg-spotify-black/20 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-spotify-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-spotify-white">♪</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1">
            <p className="text-spotify-lighter text-sm uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-6xl font-bold text-spotify-white mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-spotify-lighter text-lg mb-4">{playlist.description}</p>
            )}
            <p className="text-spotify-lighter">{songs.length} songs</p>
          </div>
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
        <div className="text-spotify-lighter text-center">
          This playlist is empty. Add some songs to get started!
        </div>
      )}
    </main>
  );
}
