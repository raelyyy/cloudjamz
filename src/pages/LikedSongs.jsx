import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import { RefreshCw } from "lucide-react";

export default function LikedSongs({ user, onPlaySong, onFavorite, onAddToPlaylist, currentSong, isPlaying }) {
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLikedSongs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen for real-time updates to favorites, ordered by addedAt descending
    const favQuery = query(collection(db, "favorites"), where("userId", "==", user.uid), orderBy("addedAt", "desc"));
    const unsubscribeFav = onSnapshot(favQuery, async (favSnapshot) => {
      try {
        const liked = [];
        const favSongIds = new Set();
        const favMap = new Map(); // Map to store favorite data with timestamps

        // First, collect all favorite data in order
        favSnapshot.forEach((doc) => {
          const favData = doc.data();
          favSongIds.add(favData.songId);
          favMap.set(favData.songId, { addedAt: favData.addedAt, songData: favData.songData });
        });

        // Get all user-uploaded songs
        const songsQuery = query(collection(db, "songs"), where("userId", "==", user.uid));
        const songsSnapshot = await getDocs(songsQuery);
        const songsMap = new Map();
        songsSnapshot.forEach((doc) => {
          const song = { id: doc.id, ...doc.data() };
          songsMap.set(song.id, song);
        });

        // Build the liked songs list in the order of favorites (most recent first)
        favSongIds.forEach(songId => {
          const favData = favMap.get(songId);
          if (favData.songData) {
            // API song
            liked.push({ ...favData.songData, addedAt: favData.addedAt });
          } else if (songsMap.has(songId)) {
            // User-uploaded song
            liked.push({ ...songsMap.get(songId), addedAt: favData.addedAt });
          }
        });

        setLikedSongs(liked);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching liked songs:", error);
        setLoading(false);
      }
    });

    return () => unsubscribeFav();
  }, [user]);

  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter text-center">
          Please log in to view your liked songs.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <h1 className="text-3xl font-bold text-spotify-white mb-8">Liked Songs</h1>
      {loading ? (
        <div className="text-spotify-lighter">Loading liked songs...</div>
      ) : likedSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {likedSongs.map((song) => (
            <MusicCard
              key={song.id}
              song={song}
              onPlay={() => onPlaySong(song, likedSongs)}
              onFavorite={onFavorite}
              onAddToPlaylist={onAddToPlaylist}
              onDelete={() => {}}
              isPlaying={song.id === currentSong?.id && isPlaying}
            />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter text-center">
          You haven't liked any songs yet.
        </div>
      )}
    </main>
  );
}
