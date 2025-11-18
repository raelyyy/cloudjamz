import { Play, Pause, MoreHorizontal, Heart, Plus, Share, Download, Trash2, Music, RotateCcw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function MusicCard({ song, onPlay, onFavorite, onAddToPlaylist, onDelete, onRestore, onPermanentDelete, onRemoveFromPlaylist, className = '', isPlaying = false, showAddToPlaylist = true, showLikeButton = true, isFavorite = false }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = () => {
    onPlay(song);
  };

  const handleArtistClick = (e) => {
    e.stopPropagation();
    navigate(`/artist/${encodeURIComponent(song.artist)}`);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    navigate(`/song/${song.id}`);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);

    switch (action) {
      case 'favorite':
        onFavorite?.(song);
        break;
      case 'addToPlaylist':
        onAddToPlaylist?.(song);
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: song.title,
            text: `Check out "${song.title}" by ${song.artist}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(`${song.title} - ${song.artist}`);
        }
        break;
      case 'download':
        {
          // Create a temporary link to download the song
          const link = document.createElement('a');
          link.href = song.url;
          link.download = `${song.title} - ${song.artist}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      case 'delete':
        onDelete?.(song);
        break;
      case 'restore':
        onRestore?.(song);
        break;
      case 'permanentDelete':
        onPermanentDelete?.(song);
        break;
      case 'removeFromPlaylist':
        onRemoveFromPlaylist?.(song);
        break;
    }
  };

  return (
    <div onClick={handleCardClick} className={`bg-spotify-dark rounded-lg p-4 hover:bg-spotify-light/20 transition cursor-pointer group relative ${isPlaying ? 'ring-2 ring-spotify-green' : ''} ${className || ''}`}>
      <div className="relative mb-4">
        <img
          src={song.cover || 'invalid'}
          alt={song.title}
          className="rounded-lg w-full h-48 object-cover shadow-lg"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="rounded-lg w-full h-48 bg-spotify-light/20 flex items-center justify-center shadow-lg hidden">
          <Music className="w-24 h-24 text-spotify-lighter" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(song);
          }}
          className={`absolute bottom-2 right-2 p-3 bg-spotify-green rounded-full transition-opacity shadow-lg hover:bg-spotify-green/80 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-spotify-black" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 text-spotify-black" fill="currentColor" />
          )}
        </button>
        <button
          onClick={handleMenuClick}
          className="absolute top-2 right-2 p-2 bg-spotify-dark/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-spotify-light/20"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4 text-spotify-white" />
        </button>

        {/* File Actions Menu */}
        {showMenu && (
          <div ref={menuRef} className="absolute top-12 right-2 bg-spotify-dark border border-spotify-light rounded-lg shadow-lg py-2 min-w-48 z-50">
            {onRestore && (
              <button
                onClick={(e) => handleAction('restore', e)}
                className="w-full px-4 py-2 text-left text-spotify-white hover:bg-spotify-light/20 transition flex items-center gap-3"
              >
                <RotateCcw className="w-4 h-4" />
                Restore
              </button>
            )}
            {onPermanentDelete && (
              <button
                onClick={(e) => handleAction('permanentDelete', e)}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-400/20 transition flex items-center gap-3"
              >
                <X className="w-4 h-4" />
                Delete Forever
              </button>
            )}
            {showLikeButton && (
              <button
                onClick={(e) => handleAction('favorite', e)}
                className={`w-full px-4 py-2 text-left hover:bg-spotify-light/20 transition flex items-center gap-3 ${isFavorite ? 'text-spotify-green' : 'text-spotify-white'}`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-spotify-green text-spotify-green' : ''}`} />
                {isFavorite ? 'Liked' : 'Add to Favorites'}
              </button>
            )}
            {showAddToPlaylist && !onRemoveFromPlaylist && (
              <button
                onClick={(e) => handleAction('addToPlaylist', e)}
                className="w-full px-4 py-2 text-left text-spotify-white hover:bg-spotify-light/20 transition flex items-center gap-3"
              >
                <Plus className="w-4 h-4" />
                Add to Playlist
              </button>
            )}
            {onRemoveFromPlaylist && (
              <button
                onClick={(e) => handleAction('removeFromPlaylist', e)}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-400/20 transition flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Remove from Playlist
              </button>
            )}
            <button
              onClick={(e) => handleAction('share', e)}
              className="w-full px-4 py-2 text-left text-spotify-white hover:bg-spotify-light/20 transition flex items-center gap-3"
            >
              <Share className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={(e) => handleAction('download', e)}
              className="w-full px-4 py-2 text-left text-spotify-white hover:bg-spotify-light/20 transition flex items-center gap-3"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {onDelete && (
              <button
                onClick={(e) => handleAction('delete', e)}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-400/20 transition flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <h3 onClick={handleTitleClick} className="text-spotify-white font-semibold truncate mb-1 hover:underline cursor-pointer">{song.title}</h3>
      <p onClick={handleArtistClick} className="text-spotify-lighter text-sm truncate hover:underline cursor-pointer">{song.artist}</p>
    </div>
  );
}
