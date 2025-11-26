import React from "react";
import { Music } from "lucide-react";

const PlayingViewPanel = ({
  currentSong,
  playlist,
  currentIndex,
  isPlaying,
  onPlaySong,
  showLyrics,
  lyrics,
  lyricsLoading,
  onNavigate,
}) => {
  if (!currentSong) {
    return (
      <div className="w-96 bg-spotify-dark dark:bg-light-dark p-4 flex flex-col items-center justify-center text-center h-full">
        <div className="text-spotify-lighter dark:text-light-lighter mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
        <p className="text-spotify-lighter dark:text-light-lighter">No song playing</p>
      </div>
    );
  }

  const upcomingSongs = playlist.slice(currentIndex + 1);

  return (
    <div className="w-96 bg-spotify-dark dark:bg-light-dark p-4 pb-2 flex flex-col h-full">
      {/* NOW PLAYING */}
      <div className="mb-4 pt-4">
        <h2 className="text-spotify-white dark:text-light-white text-lg font-semibold mb-4">Now Playing</h2>

        <div className="flex items-center space-x-3 mb-4">
          {/* COVER */}
          <CoverImage size={64} song={currentSong} />

          <div className="flex-1 min-w-0">
            <p
              className="text-spotify-white dark:text-light-white font-medium truncate cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => onNavigate && onNavigate(`/song/${currentSong.id}`)}
            >
              {currentSong.title}
            </p>
            <p
              className="text-spotify-lighter dark:text-light-lighter text-sm truncate cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => onNavigate && onNavigate(`/artist/${encodeURIComponent(currentSong.artist)}`)}
            >
              {currentSong.artist}
            </p>
            <p className="text-spotify-lighter dark:text-light-lighter text-xs truncate">
              {currentSong.album}
            </p>
          </div>

          <div
            className={`w-3 h-3 rounded-full ${
              isPlaying ? "bg-yellow-500" : "bg-gray-500"
            }`}
          ></div>
        </div>
      </div>

      {/* UP NEXT OR LYRICS */}
      <div className="flex-1 overflow-hidden">
        {showLyrics ? (
          <>
            <h3 className="text-spotify-white dark:text-light-white text-md font-semibold mb-3">Lyrics</h3>
            <div className="overflow-y-auto h-full pb-4">
              {lyricsLoading ? (
                <p className="text-spotify-lighter dark:text-light-lighter text-sm">Loading lyrics...</p>
              ) : lyrics ? (
                <pre className="text-spotify-white dark:text-light-white text-sm whitespace-pre-wrap leading-relaxed">
                  {lyrics}
                </pre>
              ) : (
                <p className="text-spotify-lighter dark:text-light-lighter text-sm">No lyrics available</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-spotify-white dark:text-light-white text-md font-semibold mb-3">Up Next</h3>
            <div className="overflow-y-auto h-full pb-8">
              {upcomingSongs.length > 0 ? (
                upcomingSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center space-x-3 p-2 rounded-md mb-1 hover:bg-spotify-light dark:hover:bg-light-light cursor-pointer"
                    onClick={() => onPlaySong(song, playlist)}
                  >
                    <CoverImage size={40} song={song} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-spotify-white dark:text-light-white">{song.title}</p>
                      <p className="text-spotify-lighter dark:text-light-lighter text-xs truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-spotify-lighter dark:text-light-lighter text-sm">No upcoming songs</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* 🔥 REUSABLE COVER IMAGE COMPONENT — FIXED LOGIC */
const CoverImage = ({ song, size }) => {
  const [error, setError] = React.useState(false);

  // 🔥 Reset error whenever a new song loads
  React.useEffect(() => {
    setError(false);
  }, [song.cover]);

  const hasValidCover = song.cover && !error;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {hasValidCover && (
        <img
          src={song.cover}
          alt={song.title}
          className="rounded-md object-cover w-full h-full"
          onError={() => setError(true)}
        />
      )}

      {!hasValidCover && (
        <div className="w-full h-full rounded-md bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center">
          <Music className="text-spotify-lighter dark:text-light-lighter" size={size / 2} />
        </div>
      )}
    </div>
  );
};


export default PlayingViewPanel;
