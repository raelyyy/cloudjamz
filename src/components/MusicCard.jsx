import { Play, Pause, MoreHorizontal, Heart, Plus, Share, Download, Trash2, Music, RotateCcw, X, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import EditSongModal from "./EditSongModal";
import { auth } from "../firebase";
import { useTheme } from "../contexts/ThemeContext";
import GlareHover from "./GlareHover";
import PlayingAnimationOverlay from "./PlayingAnimationOverlay";

export default function MusicCard({ song, onPlay, onFavorite, onAddToPlaylist, onDelete, onRestore, onPermanentDelete, onRemoveFromPlaylist, onEdit, className = '', isPlaying = false, showAddToPlaylist = true, showLikeButton = true, isFavorite = false }) {
   const navigate = useNavigate();
   const { isDarkMode } = useTheme();
   const [showMenu, setShowMenu] = useState(false);
   const menuRef = useRef(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

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
    onPlay?.(song);
  };

  const handleArtistClick = (artist) => (e) => {
    e.stopPropagation();
    navigate(`/artist/${encodeURIComponent(artist.trim())}`);
  };

  const renderArtists = (artistString) => {
    if (!artistString) return null;
    const artists = artistString.split(/[,;&]|feat\.|ft\./i).map(a => a.trim()).filter(a => a);
    return artists.map((artist, index) => (
      <span key={artist}>
        <span
          className="cursor-pointer hover:underline hover:text-yellow-400 transition-colors"
          onClick={handleArtistClick(artist)}
        >
          {artist}
        </span>
        {index < artists.length - 1 && <span className="text-spotify-lighter dark:text-light-lighter">, </span>}
      </span>
    ));
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    navigate(`/song/${song.id}`);
  };

  const openEditModal = (song) => {
    setSongToEdit(song);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSongToEdit(null);
  };

  const handleSaveEdit = (updatedSong) => {
    onEdit?.(updatedSong);
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
      case 'edit':
        if (canEditSong) {
          openEditModal(song);
        }
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

  const currentUserId = auth?.currentUser?.uid;
  const canEditSong = Boolean(onEdit) && !!song?.userId && currentUserId === song.userId;

  return (
    <>
      <GlareHover background="transparent" borderColor="transparent" width="100%" height="auto" borderRadius="0.5rem" glareColor={isDarkMode ? '#DAA520' : '#F7E35A'} glareOpacity={0.3} glareAngle={-30} glareSize={300} transitionDuration={1200} playOnce={false}>
        <div onClick={handleCardClick} className={`bg-spotify-dark dark:bg-light-dark rounded-lg p-4 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition cursor-pointer group relative shadow-lg dark:shadow-xl ${isPlaying ? 'ring-2 ring-yellow-300' : ''} ${className || ''}`}>
        <div className="relative mb-4">
          <img
            src={song.cover || '/placeholder-cover.png'}
            alt={song.title}
            className="rounded-lg w-full aspect-square object-cover shadow-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="rounded-lg w-full aspect-square bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center shadow-lg hidden">
            <Music className="w-24 h-24 text-spotify-lighter dark:text-light-lighter" />
          </div>
          <PlayingAnimationOverlay isPlaying={isPlaying} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(song);
            }}
            className={`absolute bottom-2 right-2 p-3 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-full transition-opacity shadow-lg hover:from-yellow-300 hover:to-yellow-500 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-black" fill="currentColor" />
            )}
          </button>
          <button
            onClick={handleMenuClick}
            className="absolute top-2 right-2 p-2 bg-spotify-dark/80 dark:bg-light-dark/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-spotify-light/20 dark:hover:bg-light-light/20"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-spotify-white dark:text-light-white" />
          </button>

          {/* File Actions Menu */}
          {showMenu && (
            <div ref={menuRef} className="absolute top-12 right-2 bg-spotify-dark dark:bg-light-dark border border-spotify-light dark:border-light-light rounded-lg shadow-xl py-2 min-w-48 z-50">
              {onRestore && (
                <button
                  onClick={(e) => handleAction('restore', e)}
                  className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
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
                  className={`w-full px-4 py-2 text-left hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3 ${isFavorite ? 'text-yellow-500' : 'text-spotify-white dark:text-light-white'}`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {isFavorite ? 'Liked' : 'Add to Favorites'}
                </button>
              )}
              {showAddToPlaylist && !onRemoveFromPlaylist && (
                <button
                  onClick={(e) => handleAction('addToPlaylist', e)}
                  className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" />
                  Add to Playlist
                </button>
              )}
              {canEditSong && (
                <button
                  onClick={(e) => handleAction('edit', e)}
                  className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
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
                className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
              >
                <Share className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={(e) => handleAction('download', e)}
                className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
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
        <h3 onClick={handleTitleClick} className="text-spotify-white dark:text-light-white font-semibold truncate mb-1 hover:underline cursor-pointer">{song.title}</h3>
        <p className="text-spotify-lighter dark:text-light-lighter text-sm truncate">
          {renderArtists(song.artist)}
        </p>
        </div>
      </GlareHover>
      <EditSongModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        song={songToEdit}
        onSave={handleSaveEdit}
      />
    </>
  );
}
