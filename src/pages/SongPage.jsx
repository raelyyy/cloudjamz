import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getTrackDetails, getArtistDetails } from "../utils/spotifyApi";
import { Play, Heart, Plus, Share, Download, Music } from "lucide-react";

export default function SongPage({ songId, onPlaySong, user, onAddToPlaylist }) {
  const [song, setSong] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
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

        // Try to get Spotify data for additional info
        try {
          const spotifyResults = await getTrackDetails(songData.title, songData.artist);
          if (spotifyResults) {
            setSpotifyData(spotifyResults);

            // Get artist details
            if (spotifyResults.artists?.[0]?.id) {
              const artistInfo = await getArtistDetails(spotifyResults.artists[0].id);
              setArtistData(artistInfo);
            }
          }
        } catch (error) {
          console.error("Error fetching Spotify data:", error);
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
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Loading song...</div>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Song not found.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <div className="flex items-end gap-8 mb-8">
        <img
          src={song.cover || spotifyData?.album?.images[0]?.url || 'invalid'}
          alt={song.title}
          className="w-64 h-64 rounded-lg shadow-lg object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="w-64 h-64 rounded-lg bg-spotify-light/20 flex items-center justify-center shadow-lg hidden">
          <Music className="w-32 h-32 text-spotify-lighter" />
        </div>
        <div className="flex-1">
          <h1 className="text-6xl font-bold text-spotify-white mb-4">{song.title}</h1>
          <p className="text-2xl text-spotify-lighter mb-2">{song.artist}</p>
          {(song.album || spotifyData?.album?.name) && (
            <p className="text-xl text-spotify-lighter mb-4">
              {song.album || spotifyData?.album?.name}
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
                    isFavorite ? 'text-spotify-green bg-spotify-green/20' : 'text-spotify-lighter hover:text-spotify-green bg-spotify-dark'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onAddToPlaylist?.(song)}
                  className="p-3 rounded-full text-spotify-lighter hover:text-spotify-green bg-spotify-dark transition"
                >
                  <Plus className="w-6 h-6" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full text-spotify-lighter hover:text-spotify-green bg-spotify-dark transition"
                >
                  <Share className="w-6 h-6" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-3 rounded-full text-spotify-lighter hover:text-spotify-green bg-spotify-dark transition"
                >
                  <Download className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          {spotifyData?.popularity && (
            <p className="text-spotify-lighter">
              Popularity: {spotifyData.popularity}/100
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-spotify-white mb-4">Song Details</h2>
          <div className="space-y-2 text-spotify-lighter">
            <p><strong>Title:</strong> {song.title}</p>
            <p><strong>Artist:</strong> {song.artist}</p>
            {(song.album || spotifyData?.album?.name) && (
              <p><strong>Album:</strong> {song.album || spotifyData?.album?.name}</p>
            )}
            {(song.year || spotifyData?.album?.release_date) && (
              <p><strong>Year:</strong> {song.year || spotifyData?.album?.release_date?.split('-')[0]}</p>
            )}
            {(song.genre || artistData?.genres?.[0]) && (
              <p><strong>Genre:</strong> {song.genre || artistData?.genres?.[0]}</p>
            )}
            {song.duration && (
              <p><strong>Duration:</strong> {Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}</p>
            )}
            {spotifyData?.popularity && (
              <p><strong>Popularity:</strong> {spotifyData.popularity}/100</p>
            )}
          </div>
        </div>


      </div>
    </main>
  );
}
