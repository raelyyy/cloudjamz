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
  MicVocal
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
  onNavigate
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
    <footer className="h-24 bg-spotify-dark dark:bg-light-dark border-t border-spotify-light dark:border-light-light flex items-center justify-between px-6 sticky bottom-0 z-50">
      {/* Song Info */}
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
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {onAddToPlaylist && (
              <button
                onClick={() => onAddToPlaylist(currentSong)}
                className="p-1 hover:text-yellow-500 text-spotify-lighter dark:text-light-lighter dark:hover:text-yellow-500 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="text-spotify-lighter dark:text-light-lighter">No song selected</div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onShuffleToggle}
            className={`p-1 transition ${shuffle ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={onPrev} className="p-2 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={onTogglePlayPause}
            className="p-3 bg-spotify-white dark:bg-light-white hover:bg-spotify-lighter dark:hover:bg-light-lighter rounded-full transition"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-spotify-black dark:text-light-black" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-spotify-black dark:text-light-black" fill="currentColor" />
            )}
          </button>
          <button onClick={onNext} className="p-2 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition">
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={handleLoopClick}
            className={`p-1 transition relative ${loop !== 'off' ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
          >
            <Repeat className="w-4 h-4" />
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
                backgroundImage: 'linear-gradient(to right, #FFD700, #4079FF)'
              }}
            ></div>
          </div>
          <span className="text-xs text-spotify-lighter dark:text-light-lighter">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={onToggleLyrics}
          className={`p-1 transition ${showLyrics ? 'text-yellow-500' : 'hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter'}`}
        >
          <MicVocal className="w-4 h-4" />
        </button>
        <button className="p-1 hover:text-spotify-white dark:hover:text-light-white text-spotify-lighter dark:text-light-lighter transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <Volume2 className="w-4 h-4 text-spotify-lighter dark:text-light-lighter" />
        <div onClick={handleVolumeClick} className="w-24 bg-spotify-light dark:bg-light-light rounded-full h-1 cursor-pointer">
          <div
            className="bg-spotify-white dark:bg-light-white h-1 rounded-full"
            style={{ width: `${volume * 100}%` }}
          ></div>
        </div>
      </div>
    </footer>
  );
}
