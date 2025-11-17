import { useState, useEffect } from "react";  
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import { ChevronLeft } from "lucide-react"; // <-- import ChevronLeft

export default function PlaylistView({ playlistId, user, onPlaySong }) {
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      const playlistDoc = await getDoc(doc(db, "playlists", playlistId));
      if (playlistDoc.exists()) {
        const playlistData = { id: playlistDoc.id, ...playlistDoc.data() };
        setPlaylist(playlistData);

        const songPromises = playlistData.songs.map(songId =>
          getDoc(doc(db, "songs", songId))
        );
        const songDocs = await Promise.all(songPromises);
        const fetchedSongs = songDocs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSongs(fetchedSongs);
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeSongFromPlaylist = async (songId) => {
    try {
      await updateDoc(doc(db, "playlists", playlistId), {
        songs: arrayRemove(songId),
      });
      setSongs(prev => prev.filter(song => song.id !== songId));
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
      {/* Header with gradient background and rounded top corners */}
      <div className="bg-spotify-dark border border-spotify-light/20 rounded-tl-xl rounded-tr-xl p-6 mb-8">
        {/* Back button with ChevronLeft */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center mb-4 text-spotify-lighter hover:text-spotify-white transition"
        >
          <div className="w-10 h-10 rounded-full bg-spotify-light/20 flex items-center justify-center mr-2 hover:bg-spotify-light/40 transition">
            <ChevronLeft className="w-5 h-5" />
          </div>
          Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-spotify-white mb-2">{playlist.name}</h1>
          <p className="text-spotify-lighter">{songs.length} songs</p>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <div key={song.id} className="relative group">
              <MusicCard song={song} onPlay={() => handlePlaySong(song)} isPlaying={currentlyPlaying === song.id} />
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
