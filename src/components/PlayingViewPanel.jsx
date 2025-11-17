import React from "react";
import { Music } from "lucide-react";

const PlayingViewPanel = ({
  currentSong,
  playlist,
  currentIndex,
  isPlaying,
  onPlaySong,
}) => {
  if (!currentSong) {
    return (
      <div className="w-96 bg-spotify-darkgray p-4 flex flex-col items-center justify-center text-center h-full">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
        <p className="text-gray-400">No song playing</p>
      </div>
    );
  }

  const upcomingSongs = playlist.slice(currentIndex + 1);

  return (
    <div className="w-96 bg-spotify-darkgray p-4 flex flex-col h-full">
      {/* NOW PLAYING */}
      <div className="mb-4 pt-4">
        <h2 className="text-white text-lg font-semibold mb-4">Now Playing</h2>

        <div className="flex items-center space-x-3 mb-4">
          {/* COVER */}
          <CoverImage size={64} song={currentSong} />

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{currentSong.title}</p>
            <p className="text-gray-400 text-sm truncate">
              {currentSong.artist}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {currentSong.album}
            </p>
          </div>

          <div
            className={`w-3 h-3 rounded-full ${
              isPlaying ? "bg-green-500" : "bg-gray-500"
            }`}
          ></div>
        </div>
      </div>

      {/* UP NEXT */}
      <div className="flex-1 overflow-hidden">
        <h3 className="text-white text-md font-semibold mb-3">Up Next</h3>

        <div className="overflow-y-auto h-full">
          {upcomingSongs.length > 0 ? (
            upcomingSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center space-x-3 p-2 rounded-md mb-1 hover:bg-gray-700 cursor-pointer"
                onClick={() => onPlaySong(song, playlist)}
              >
                <CoverImage size={40} song={song} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-white">{song.title}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {song.artist}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No upcoming songs</p>
          )}
        </div>
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
        <div className="w-full h-full rounded-md bg-spotify-light/20 flex items-center justify-center">
          <Music className="text-spotify-lighter" size={size / 2} />
        </div>
      )}
    </div>
  );
};


export default PlayingViewPanel;
