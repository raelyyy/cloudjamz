import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { searchItunes, getItunesTrackById } from "../utils/itunesApi";
import { Play, Heart, Plus, Share, Download, Music } from "lucide-react";

export default function SongPage({ songId, onPlaySong, user, onAddToPlaylist }) {
  const [song, setSong] = useState(null);
  const [itunesData, setItunesData] = useState(null);
  const [artistData, setArtistData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchSong();
  }, [songId]);

  useEffect(() => {
    if (song && user) {
      checkIfFavorite();
    }
  }, [song, user]);

  const fetchSong = async () => {
    try {
      const songDoc = await getDoc(doc(db, "songs", songId));
      if (songDoc.exists()) {
        const songData = { id: songDoc.id, ...songDoc.data() };
        setSong(songData);

        // Try to get iTunes data for additional info
        try {
          const itunesResults = await searchItunes(`${songData.title} ${songData.artist}`);
          if (itunesResults && itunesResults.length > 0) {
            // Find the best match
            const bestMatch = itunesResults.find(track =>
              track.title.toLowerCase().includes(songData.title.toLowerCase()) &&
              track.artist.toLowerCase().includes(songData.artist.toLowerCase())
            ) || itunesResults[0];
            setItunesData(bestMatch);

            // Get artist details by searching for artist
            const artistResults = await searchItunes(songData.artist);
            if (artistResults && artistResults.length > 0) {
              const artistInfo = {
                name: artistResults[0].artist,
                genres: [artistResults[0].genre],
                images: [{ url: artistResults[0].cover }]
              };
              setArtistData(artistInfo);
            }
          }
        } catch (error) {
          console.error("Error fetching iTunes data:", error);
        }
      } else {
        // Try to fetch from iTunes API using the songId as track ID
        try {
          const itunesTrack = await getItunesTrackById(songId);
          if (itunesTrack) {
            setSong(itunesTrack);
            setItunesData(itunesTrack);

            // Get artist details
            const artistResults = await searchItunes(itunesTrack.artist);
            if (artistResults && artistResults.length > 0) {
              const artistInfo = {
                name: artistResults[0].artist,
                genres: [artistResults[0].genre],
                images: [{ url: artistResults[0].cover }]
              };
              setArtistData(artistInfo);
            }
          } else {
            console.error("Song not found in Firestore or iTunes");
          }
        } catch (error) {
          console.error("Error fetching from iTunes:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching song:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !song) return;

    try {
      const favQuery = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid),
        where("songId", "==", song.id)
      );
      const querySnapshot = await getDocs(favQuery);
      setIsFavorite(!querySnapshot.empty);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !song) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        const favQuery = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("songId", "==", song.id)
        );
        const querySnapshot = await getDocs(favQuery);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addDoc(collection(db, "favorites"), {
          userId: user.uid,
          songId: song.id,
          addedAt: new Date(),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: `Check out "${song.title}" by ${song.artist}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${song.title} - ${song.artist}\n${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = song.url;
    link.download = `${song.title} - ${song.artist}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter">Loading song...</div>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter">Song not found.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <div className="flex items-end gap-8 mb-8">
        <img
          src={song.cover || itunesData?.cover || 'invalid'}
          alt={song.title}
          className="w-64 h-64 rounded-lg shadow-lg object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="w-64 h-64 rounded-lg bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center shadow-lg hidden">
          <Music className="w-32 h-32 text-spotify-lighter dark:text-light-lighter" />
        </div>
        <div className="flex-1">
          <h1 className="text-6xl font-bold text-spotify-white dark:text-light-white mb-4">{song.title}</h1>
          <p className="text-2xl text-spotify-lighter dark:text-light-lighter mb-2">
            <Link
              to={`/artist/${encodeURIComponent(song.artist)}`}
              className="hover:underline text-spotify-green"
            >
              {song.artist}
            </Link>
          </p>
          {(song.album || itunesData?.album) && (
            <p className="text-xl text-spotify-lighter dark:text-light-lighter mb-4">
              {song.album || itunesData?.album}
            </p>
          )}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => onPlaySong(song)}
              className="bg-spotify-green hover:bg-spotify-green/80 text-spotify-black px-8 py-3 rounded-full font-semibold text-lg transition"
            >
              <Play className="w-6 h-6 inline mr-2" fill="currentColor" />
              Play
            </button>
            {user && (
              <>
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full transition ${
                    isFavorite ? 'text-spotify-green bg-spotify-green/20' : 'text-spotify-lighter dark:text-light-lighter hover:text-spotify-green bg-spotify-dark dark:bg-light-dark'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onAddToPlaylist?.(song)}
                  className="p-3 rounded-full text-spotify-lighter dark:text-light-lighter hover:text-spotify-green bg-spotify-dark dark:bg-light-dark transition"
                >
                  <Plus className="w-6 h-6" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full text-spotify-lighter dark:text-light-lighter hover:text-spotify-green bg-spotify-dark dark:bg-light-dark transition"
                >
                  <Share className="w-6 h-6" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-3 rounded-full text-spotify-lighter dark:text-light-lighter hover:text-spotify-green bg-spotify-dark dark:bg-light-dark transition"
                >
                  <Download className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-4">Song Details</h2>
          <div className="space-y-2 text-spotify-lighter dark:text-light-lighter">
            <p><strong>Title:</strong> {song.title}</p>
            <p><strong>Artist:</strong> {song.artist}</p>
            {(song.album || itunesData?.album) && (
              <p><strong>Album:</strong> {song.album || itunesData?.album}</p>
            )}
            {song.year && (
              <p><strong>Year:</strong> {song.year}</p>
            )}
            {(song.genre || artistData?.genres?.[0] || itunesData?.genre) && (
              <p><strong>Genre:</strong> {song.genre || artistData?.genres?.[0] || itunesData?.genre}</p>
            )}
            {(song.duration || itunesData?.duration) && (
              <p><strong>Duration:</strong> {Math.floor((song.duration || itunesData?.duration) / 60)}:{Math.floor((song.duration || itunesData?.duration) % 60).toString().padStart(2, '0')}</p>
            )}
          </div>
        </div>


      </div>
    </main>
  );
}
