import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart, MoreHorizontal, Music } from "lucide-react";
import { useState, useEffect } from "react";

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
  isFavorite = false
}) {
  const [deviceVolume, setDeviceVolume] = useState(volume);

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
    // Sync with device volume if available
    if ('mediaSession' in navigator && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('play', onTogglePlayPause);
      navigator.mediaSession.setActionHandler('pause', onTogglePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    }
  }, [onTogglePlayPause, onNext, onPrev]);

  const handleProgressClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newProgress = (clickX / width) * duration;
    onSeek(newProgress);
  };

  const handleVolumeClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = clickX / width;
    setDeviceVolume(newVolume);
    onVolumeChange(newVolume);
  };

  const handleLoopClick = () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(loop);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onLoopToggle(nextMode);
  };

  return (
    <footer className="h-24 bg-spotify-dark border-t border-spotify-light flex items-center justify-between px-6 sticky bottom-0 z-50">
      {/* Song Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {currentSong ? (
          <>
            {currentSong.cover ? (
              <img
                src={currentSong.cover}
                alt="Album cover"
                className="w-14 h-14 rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-14 h-14 rounded bg-spotify-light/20 flex items-center justify-center ${currentSong.cover ? 'hidden' : ''}`}>
              <Music className="w-8 h-8 text-spotify-lighter" />
            </div>
            <div className="min-w-0">
              <h4 className="text-spotify-white font-medium truncate">{currentSong.title}</h4>
              <p className="text-spotify-lighter text-sm truncate">{currentSong.artist}</p>
            </div>
            <button
              onClick={onFavoriteToggle}
              className={`p-1 transition ${isFavorite ? 'text-spotify-green' : 'hover:text-spotify-green text-spotify-lighter'}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="text-spotify-lighter">No song selected</div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onShuffleToggle}
            className={`p-1 transition ${shuffle ? 'text-spotify-green' : 'hover:text-spotify-white text-spotify-lighter'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={onPrev} className="p-2 hover:text-spotify-white text-spotify-lighter transition">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={onTogglePlayPause}
            className="p-3 bg-spotify-white hover:bg-spotify-lighter rounded-full transition"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-spotify-black" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-spotify-black" fill="currentColor" />
            )}
          </button>

          <button onClick={onNext} className="p-2 hover:text-spotify-white text-spotify-lighter transition">
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={handleLoopClick}
            className={`p-1 transition ${loop !== 'off' ? 'text-spotify-green' : 'hover:text-spotify-white text-spotify-lighter'}`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-spotify-lighter">{formatTime(progress)}</span>
          <div onClick={handleProgressClick} className="flex-1 bg-spotify-light rounded-full h-1 cursor-pointer">
            <div
              className="bg-spotify-white h-1 rounded-full"
              style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
            ></div>
          </div>
          <span className="text-xs text-spotify-lighter">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <button className="p-1 hover:text-spotify-white text-spotify-lighter transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <Volume2 className="w-4 h-4 text-spotify-lighter" />
        <div onClick={handleVolumeClick} className="w-24 bg-spotify-light rounded-full h-1 cursor-pointer">
          <div
            className="bg-spotify-white h-1 rounded-full"
            style={{ width: `${deviceVolume * 100}%` }}
          ></div>
        </div>
      </div>
    </footer>
  );
}
