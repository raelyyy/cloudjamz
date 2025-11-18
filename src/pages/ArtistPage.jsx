import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";

export default function ArtistPage({ artistName, onPlaySong }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistSongs();
  }, [artistName]);

  const fetchArtistSongs = async () => {
    try {
      const q = query(collection(db, "songs"), where("artist", "==", artistName));
      const querySnapshot = await getDocs(q);
      const artistSongs = [];
      querySnapshot.forEach((doc) => {
        artistSongs.push({ id: doc.id, ...doc.data() });
      });
      setSongs(artistSongs);
    } catch (error) {
      console.error("Error fetching artist songs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Loading artist...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spotify-white mb-2">{artistName}</h1>
        <p className="text-spotify-lighter">{songs.length} songs</p>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song) => (
            <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song)} isFavorite={false} />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter text-center">
          No songs found for this artist.
        </div>
      )}
    </main>
  );
}
