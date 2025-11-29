import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Heart,
  MoreHorizontal,
  Music,
  Plus,
  MicVocal,
  BotMessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";

export default function PlayerBar({
  currentSong,
  isPlaying,
  volume,
  progress,
  duration,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  formatTime,
  shuffle = false,
  loop = 'off',
  onShuffleToggle,
  onLoopToggle,
  onFavoriteToggle,
  isFavorite = false,
  onAddToPlaylist,
  showLyrics = false,
  onToggleLyrics,
  onNavigate,
  onToggleChatbot,
  isChatbotOpen
}) {
  // 🔥 Track image errors
  const [imgError, setImgError] = useState(false);

  // Reset imgError whenever the song changes
  useEffect(() => {
    setImgError(false);
  }, [currentSong?.cover]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: progress,
      });
    }
  }, [progress, duration]);

  useEffect(() => {
    if ('mediaSession' in navigator && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('play', onTogglePlayPause);
      navigator.mediaSession.setActionHandler('pause', onTogglePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    }
  }, [onTogglePlayPause, onNext, onPrev]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const newVolume = Math.min(1, volume + 0.1);
          onVolumeChange(newVolume);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newVolume = Math.max(0, volume - 0.1);
          onVolumeChange(newVolume);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, onVolumeChange]);

  useEffect(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      const handleVolumeChange = () => onVolumeChange(audio.volume);
      audio.addEventListener('volumechange', handleVolumeChange);
      return () => audio.removeEventListener('volumechange', handleVolumeChange);
    }
  }, [onVolumeChange]);

  const handleProgressClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newProgress = (clickX / width) * duration;
    onSeek(newProgress);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = clickX / width;
    onVolumeChange(newVolume);
  };

  const handleLoopClick = () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(loop);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onLoopToggle(nextMode);
  };

  return (
    <footer className="h-20 sm:h-24 bg-spotify-dark dark:bg-light-dark border-t border-spotify-light dark:border-light-light flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 sticky bottom-0 z-50">
      {/* Mobile: Song Info and Controls in one row */}
      <div className="flex items-center justify-between w-full sm:hidden px-2 py-2">
        {/* Song Info - Mobile */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentSong ? (
            <>
              <div className="relative w-10 h-10 flex-shrink-0">
                {!imgError && currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt="Album cover"
                    className="w-10 h-10 rounded object-cover absolute inset-0"
                    onError={() => setImgError(true)}
                  />
                ) : null}

                {(imgError || !currentSong.cover) && (
                  <div className="w-10 h-10 rounded bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center absolute inset-0">
                    <Music className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className="text-spotify-white dark:text-light-white font-medium text-sm truncate cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => onNavigate && onNavigate(`/song/${currentSong.id}`)}
                >
                  {currentSong.title}
                </h4>
                <p
                  className="text-spotify-lighter dark:text-light-lighter text-xs truncate cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => onNavigate && onNavigate(`/artist/${encodeURIComponent(currentSong.artist)}`)}
                >
                  {currentSong.artist}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-10 h-10 bg-spotify-light dark:bg-light-light rounded"></div>
              <div className="min-w-0 flex-1">
                <div className="h-3 bg-spotify-light dark:bg-light-light rounded mb-1 w-24"></div>
                <div className="h-2 bg-spotify-light dark:bg-light-light rounded w-20"></div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1">
          <button onClick={onPrev} disabled={!currentSong} className="p-1 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition disabled:opacity-50 disabled:cursor-not-allowed">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={onTogglePlayPause}
            disabled={!currentSong}
            className="p-2 bg-spotify-white dark:bg-light-white hover:bg-spotify-lighter dark:hover:bg-light-lighter rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed mx-1"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-spotify-black dark:text-light-black" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 text-spotify-black dark:text-light-black" fill="currentColor" />
            )}
          </button>
          <button onClick={onNext} disabled={!currentSong} className="p-1 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition disabled:opacity-50 disabled:cursor-not-allowed">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="flex items-center gap-2 w-full px-3 pb-2 sm:hidden">
        <span className="text-xs text-spotify-lighter dark:text-light-lighter">{formatTime(progress)}</span>
        <div onClick={handleProgressClick} className="flex-1 bg-spotify-light dark:bg-light-light rounded-full h-2 cursor-pointer">
          <div
            className="h-2 rounded-full"
            style={{
              width: duration ? `${(progress / duration) * 100}%` : '0%',
              backgroundImage: 'linear-gradient(to right, #FFD700, #FFC107)'
            }}
          ></div>
        </div>
        <span className="text-xs text-spotify-lighter dark:text-light-lighter">{formatTime(duration)}</span>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Song Info - Desktop */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentSong ? (
            <>
              {/* COVER IMAGE WITH PLACEHOLDER */}
              <div className="relative w-14 h-14">
                {!imgError && currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt="Album cover"
                    className="w-14 h-14 rounded object-cover absolute inset-0"
                    onError={() => setImgError(true)}
                  />
                ) : null}

                {(imgError || !currentSong.cover) && (
                  <div className="w-14 h-14 rounded bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center absolute inset-0">
                    <Music className="w-8 h-8 text-spotify-lighter dark:text-light-lighter" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h4
                  className="text-spotify-white dark:text-light-white font-medium truncate cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => onNavigate && onNavigate(`/song/${currentSong.id}`)}
                >
                  {currentSong.title}
                </h4>
                <p
                  className="text-spotify-lighter dark:text-light-lighter text-sm truncate cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => onNavigate && onNavigate(`/artist/${encodeURIComponent(currentSong.artist)}`)}
                >
                  {currentSong.artist}
                </p>
              </div>

              <button
                onClick={onFavoriteToggle}
                className={`p-1 transition ${isFavorite ? 'text-yellow-500' : 'hover:text-yellow-500 text-spotify-lighter dark:text-light-lighter dark:hover:text-yellow-500'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {onAddToPlaylist && (
                <button
                  onClick={() => onAddToPlaylist(currentSong)}
                  className="p-1 hover:text-yellow-500 text-spotify-lighter dark:text-light-lighter dark:hover:text-yellow-500 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              {/* Cover skeleton */}
              <div className="w-14 h-14 bg-spotify-light dark:bg-light-light rounded"></div>

              <div className="min-w-0">
                {/* Title skeleton */}
                <div className="h-4 bg-spotify-light dark:bg-light-light rounded mb-1 w-32"></div>
                {/* Artist skeleton */}
                <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-24"></div>
              </div>

              {/* Favorite button skeleton */}
              <div className="w-4 h-4 bg-spotify-light dark:bg-light-light rounded"></div>

              {/* Add to playlist button skeleton */}
              <div className="w-4 h-4 bg-spotify-light dark:bg-light-light rounded"></div>
            </div>
          )}
        </div>

        {/* Player Controls - Desktop */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-4">
            <button
              onClick={onShuffleToggle}
              className={`p-1 transition ${shuffle ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={onPrev} disabled={!currentSong} className="p-2 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={onTogglePlayPause}
              disabled={!currentSong}
              className="p-3 bg-spotify-white dark:bg-light-white hover:bg-spotify-lighter dark:hover:bg-light-lighter rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-spotify-black dark:text-light-black" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 text-spotify-black dark:text-light-black" fill="currentColor" />
              )}
            </button>
            <button onClick={onNext} disabled={!currentSong} className="p-2 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipForward className="w-6 h-6" />
            </button>
            <button
              onClick={handleLoopClick}
              className={`p-1 transition relative ${loop !== 'off' ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
            >
              <Repeat className="w-5 h-5" />
              {loop === 'one' && <span className="absolute -top-1 -right-1 text-xs text-yellow-500 font-bold">1</span>}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-spotify-lighter dark:text-light-lighter">{formatTime(progress)}</span>
            <div onClick={handleProgressClick} className="flex-1 bg-spotify-light dark:bg-light-light rounded-full h-1 cursor-pointer">
              <div
                className="h-1 rounded-full"
                style={{
                  width: duration ? `${(progress / duration) * 100}%` : '0%',
                  backgroundImage: 'linear-gradient(to right, #FFD700, #FFC107)'
                }}
              ></div>
            </div>
            <span className="text-xs text-spotify-lighter dark:text-light-lighter">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Controls - Desktop */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={onFavoriteToggle}
            className={`p-1 transition ${isFavorite ? 'text-yellow-500' : 'hover:text-yellow-500 text-spotify-lighter dark:text-light-lighter dark:hover:text-yellow-500'} sm:hidden`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {onAddToPlaylist && (
            <button
              onClick={() => onAddToPlaylist(currentSong)}
              className="p-1 hover:text-yellow-500 text-spotify-lighter dark:text-light-lighter dark:hover:text-yellow-500 transition sm:hidden"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onToggleLyrics}
            className={`p-1 transition ${showLyrics ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
          >
            <MicVocal className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleChatbot}
            className={`p-1 transition ${isChatbotOpen ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
            title={isChatbotOpen ? "Close Music Assistant" : "Open Music Assistant"}
          >
            <BotMessageSquare className="w-5 h-5" />
          </button>
          <button className="p-1 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <Volume2 className="w-5 h-5 text-spotify-lighter dark:text-light-lighter hidden sm:block" />
          <div onClick={handleVolumeClick} className="w-20 sm:w-24 bg-spotify-light dark:bg-light-light rounded-full h-2 cursor-pointer hidden sm:block">
            <div
              className="bg-spotify-white dark:bg-light-white h-2 rounded-full"
              style={{ width: `${volume * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
