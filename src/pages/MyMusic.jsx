import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import SkeletonCard from "../components/SkeletonCard";

export default function MyMusic({ user, onPlaySong, onFavorite, onAddToPlaylist, onDeleteSong, currentSong, isPlaying, onUpdateCurrentSong, onEdit }) {
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
        const data = doc.data();
        userSongs.push({
          ...data,
          id: data.id ?? doc.id,
          docId: doc.id,
        });
      });
      // Sort by createdAt when available, otherwise fallback to original id value
      userSongs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? a.createdAt ?? a.id ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? b.createdAt ?? b.id ?? 0;
        return bTime - aTime;
      });
      setSongs(userSongs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          Please log in to view your music.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <h1 className="text-3xl font-bold text-spotify-white dark:text-light-white mb-8">My Music</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <MusicCard
              key={song.id}
              song={song}
              onPlay={() => onPlaySong(song, songs)}
              onFavorite={onFavorite}
              onAddToPlaylist={onAddToPlaylist}
              onDelete={onDeleteSong ? () => onDeleteSong(song) : undefined}
              onEdit={onEdit}
              isPlaying={song.id === currentSong?.id && isPlaying}
              isFavorite={false} // We'll handle favorites separately if needed
            />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          You haven't uploaded any songs yet. Upload some music to get started!
        </div>
      )}
    </main>
  );
}
