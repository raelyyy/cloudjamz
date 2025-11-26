import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { searchItunes } from "../utils/itunesApi";
import { Play, Clock } from "lucide-react";

export default function ArtistPage({ artistName, onPlaySong, currentSong, isPlaying }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artistInfo, setArtistInfo] = useState(null);

  useEffect(() => {
    fetchArtistSongs();
  }, [artistName]);

  const fetchArtistSongs = async () => {
    setLoading(true);

    try {
      // Fetch songs from iTunes API
      const itunesSongs = await searchItunes(artistName);
      if (itunesSongs && itunesSongs.length > 0) {
        setSongs(itunesSongs);

        const firstSong = itunesSongs[0];
        const extractedArtistInfo = {
          name: firstSong.artist || artistName,
          genre: firstSong.genre || "Unknown",
          artworkUrl: firstSong.cover || null,
          // Additional fields could be added here if available in iTunes API
        };
        setArtistInfo(extractedArtistInfo);
      } else {
        // Fallback to Firestore if no iTunes results
        const q = query(collection(db, "songs"), where("artist", "==", artistName));
        const querySnapshot = await getDocs(q);
        const artistSongsFirestore = [];
        querySnapshot.forEach((doc) => {
          artistSongsFirestore.push({ id: doc.id, ...doc.data() });
        });
        setSongs(artistSongsFirestore);
        setArtistInfo(null);
      }
    } catch (error) {
      console.error("Error fetching artist songs or info:", error);
      setArtistInfo(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      onPlaySong(songs[0], songs);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter">Loading artist...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      {artistInfo && (
        <div className="mb-8 flex items-center gap-6">
          {artistInfo.artworkUrl ? (
            <img
              src={artistInfo.artworkUrl}
              alt={artistInfo.name}
              className="w-48 h-48 rounded-lg shadow-lg object-cover"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center shadow-lg text-3xl text-spotify-lighter dark:text-light-lighter">
              {artistInfo.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-spotify-white dark:text-light-white">{decodeURIComponent(artistInfo.name)}</h1>
            <p className="text-spotify-lighter dark:text-light-lighter mt-2 text-lg">{artistInfo.genre}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-spotify-white dark:text-light-white mb-2">{decodeURIComponent(artistName)}</h2>
            <p className="text-spotify-lighter dark:text-light-lighter">{songs.length} songs</p>
          </div>
          {songs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-black px-6 py-3 rounded-full font-semibold text-lg transition flex items-center gap-2"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Play All
            </button>
          )}
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="bg-spotify-dark dark:bg-light-dark rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-spotify-light/20 dark:border-light-light/20">
            <div className="grid grid-cols-12 gap-2 text-spotify-lighter dark:text-light-lighter text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-1"></div>
              <div className="col-span-6">Title</div>
              <div className="col-span-3">Album</div>
              <div className="col-span-1 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-spotify-light/10 dark:divide-light-light/10">
            {songs.map((song, index) => {
              const isCurrentlyPlaying = currentSong && currentSong.id === song.id && isPlaying;
              return (
                <div
                  key={song.id}
                  className={`px-6 py-3 hover:bg-spotify-light/10 dark:hover:bg-light-light/10 transition cursor-pointer group ${
                    isCurrentlyPlaying ? 'bg-yellow-400/10' : ''
                  }`}
                  onClick={() => onPlaySong(song)}
                >
                  <div className="grid grid-cols-12 gap-2 items-center text-spotify-white dark:text-light-white">
                    <div className={`col-span-1 ${isCurrentlyPlaying ? 'text-yellow-400' : 'text-spotify-lighter dark:text-light-lighter group-hover:text-yellow-400'}`}>
                      {isCurrentlyPlaying ? (
                        <span>{index + 1}</span>
                      ) : (
                        <>
                          <span className="group-hover:hidden">{index + 1}</span>
                          <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                        </>
                      )}
                    </div>
                    <div className="col-span-1">
                      <img
                        src={song.cover || 'invalid'}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-10 h-10 rounded bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center hidden">
                        <Play className="w-4 h-4 text-spotify-lighter dark:text-light-lighter" />
                      </div>
                    </div>
                    <div className="col-span-6">
                      <div className={`font-medium truncate ${isCurrentlyPlaying ? 'text-yellow-400' : ''}`}>{song.title}</div>
                    </div>
                    <div className="col-span-3 text-spotify-lighter dark:text-light-lighter truncate">
                      {song.album}
                    </div>
                    <div className="col-span-1 text-spotify-lighter dark:text-light-lighter text-sm">
                      {song.duration ? `${Math.floor(song.duration / 60)}:${Math.floor(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          No songs found for this artist.
        </div>
      )}
    </main>
  );
}
