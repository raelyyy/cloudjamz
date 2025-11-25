import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";

export default function AlbumPage({ albumName, onPlaySong }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbumSongs();
  }, [albumName]);

  const fetchAlbumSongs = async () => {
    try {
      const q = query(collection(db, "songs"), where("album", "==", albumName));
      const querySnapshot = await getDocs(q);
      const albumSongs = [];
      querySnapshot.forEach((doc) => {
        albumSongs.push({ id: doc.id, ...doc.data() });
      });
      setSongs(albumSongs);
    } catch (error) {
      console.error("Error fetching album songs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter">Loading album...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spotify-white dark:text-light-white mb-2">{albumName}</h1>
        <p className="text-spotify-lighter dark:text-light-lighter">{songs.length} songs</p>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song)} isFavorite={false} />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          No songs found for this album.
        </div>
      )}
    </main>
  );
}
