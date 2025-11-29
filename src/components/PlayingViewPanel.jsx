import React from "react";
import { Music } from "lucide-react";
import SkeletonCard from "./SkeletonCard";

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
  isVisible = true,
}) => {
  const handleArtistClick = (artist) => (e) => {
    e.stopPropagation();
    onNavigate && onNavigate(`/artist/${encodeURIComponent(artist.trim())}`);
  };

  const renderArtists = (artistString) => {
    if (!artistString) return null;
    const artists = artistString.split(/[,;&]|feat\.|ft\./i).map(a => a.trim()).filter(a => a);
    return artists.map((artist, index) => (
      <span key={artist}>
        <span
          className="cursor-pointer hover:text-yellow-400 transition-colors"
          onClick={handleArtistClick(artist)}
        >
          {artist}
        </span>
        {index < artists.length - 1 && <span className="text-spotify-lighter dark:text-light-lighter">, </span>}
      </span>
    ));
  };
  if (!currentSong) {
    return (
      <div className="w-96 bg-spotify-dark dark:bg-light-dark p-4 flex flex-col h-full">
        {/* NOW PLAYING SKELETON */}
        <div className="mb-4 pt-4">
          <h2 className="text-spotify-white dark:text-light-white text-lg font-semibold mb-4">Now Playing</h2>
          <div className="flex items-center space-x-3 mb-4 animate-pulse">
            {/* Cover skeleton */}
            <div className="w-16 h-16 bg-spotify-light dark:bg-light-light rounded-md"></div>
            <div className="flex-1 min-w-0">
              {/* Title skeleton */}
              <div className="h-4 bg-spotify-light dark:bg-light-light rounded mb-2"></div>
              {/* Artist skeleton */}
              <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-3/4 mb-1"></div>
              {/* Album skeleton */}
              <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-1/2"></div>
            </div>
            {/* Status indicator skeleton */}
            <div className="w-3 h-3 bg-spotify-light dark:bg-light-light rounded-full"></div>
          </div>
        </div>

        {/* UP NEXT SKELETON */}
        <div className="flex-1 overflow-hidden">
          <h3 className="text-spotify-white dark:text-light-white text-md font-semibold mb-3">Up Next</h3>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                {/* Cover skeleton */}
                <div className="w-10 h-10 bg-spotify-light dark:bg-light-light rounded-md"></div>
                <div className="flex-1 min-w-0">
                  {/* Title skeleton */}
                  <div className="h-3 bg-spotify-light dark:bg-light-light rounded mb-1"></div>
                  {/* Artist skeleton */}
                  <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingSongs = playlist.slice(currentIndex + 1);

  if (!isVisible) return null;

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
            <p className="text-spotify-lighter dark:text-light-lighter text-sm truncate">
              {renderArtists(currentSong.artist)}
            </p>
            <p className="text-spotify-lighter dark:text-light-lighter text-xs truncate">
              {currentSong.album}
            </p>
          </div>

          {isPlaying ? (
            <div className="loading">
              <div className="load"></div>
              <div className="load"></div>
              <div className="load"></div>
              <div className="load"></div>
            </div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          )}
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
                      <p
                        className="text-sm truncate text-spotify-white dark:text-light-white cursor-pointer hover:text-yellow-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate && onNavigate(`/song/${song.id}`);
                        }}
                      >
                        {song.title}
                      </p>
                      <p className="text-spotify-lighter dark:text-light-lighter text-xs truncate">
                        {renderArtists(song.artist)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                      {/* Cover skeleton */}
                      <div className="w-10 h-10 bg-spotify-light dark:bg-light-light rounded-md"></div>
                      <div className="flex-1 min-w-0">
                        {/* Title skeleton */}
                        <div className="h-3 bg-spotify-light dark:bg-light-light rounded mb-1"></div>
                        {/* Artist skeleton */}
                        <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
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
