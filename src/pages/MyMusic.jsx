import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";

export default function MyMusic({ user, onPlaySong, onFavorite, onAddToPlaylist, currentSong, isPlaying }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSongs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen for real-time updates to user's songs
    const songsQuery = query(collection(db, "songs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(songsQuery, (snapshot) => {
      const userSongs = [];
      snapshot.forEach((doc) => {
        userSongs.push({ id: doc.id, ...doc.data() });
      });
      // Sort by upload date (assuming id is timestamp-based, sort descending for latest first)
      userSongs.sort((a, b) => b.id - a.id);
      setSongs(userSongs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter text-center">
          Please log in to view your music.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <h1 className="text-3xl font-bold text-spotify-white mb-8">My Music</h1>
      {loading ? (
        <div className="text-spotify-lighter">Loading your music...</div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <MusicCard
              key={song.id}
              song={song}
              onPlay={() => onPlaySong(song, songs)}
              onFavorite={onFavorite}
              onAddToPlaylist={onAddToPlaylist}
              onDelete={undefined}
              isPlaying={song.id === currentSong?.id && isPlaying}
              isFavorite={false} // We'll handle favorites separately if needed
            />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter text-center">
          You haven't uploaded any songs yet. Upload some music to get started!
        </div>
      )}
    </main>
  );
}
