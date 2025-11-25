import { Play, MoreHorizontal, Trash2, Share, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getPlaceholderCover } from "../utils/placeholderCovers";

export default function PlaylistCard({ playlist, onDelete, onClick, onPlaySong, onEdit }) {
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

  const handlePlay = (e) => {
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      // Play the first song in the playlist
      onPlaySong(playlist.songs[0], playlist.songs);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(playlist);
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!playlist.isMyMusic) {
      onDelete();
    }
    setShowMenu(false);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // For now, just copy the playlist URL to clipboard
    const url = `${window.location.origin}/playlist/${playlist.id}`;
    navigator.clipboard.writeText(url);
    alert("Playlist link copied to clipboard!");
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    // Pass the edit action to parent component
    if (onEdit) {
      onEdit(playlist);
    }
    setShowMenu(false);
  };

  return (
    <div onClick={handleCardClick} className="bg-spotify-dark dark:bg-light-dark rounded-lg p-4 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition cursor-pointer group relative">
      <div className="relative mb-4">
        {playlist.cover ? (
          <img
            src={playlist.cover}
            alt={playlist.name}
            className="w-full h-48 object-cover rounded-tl-lg rounded-tr-lg"
            onError={(e) => {
              e.target.src = getPlaceholderCover();
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-spotify-green to-spotify-black rounded-tl-lg rounded-tr-lg flex items-center justify-center">
            <Play className="w-12 h-12 text-spotify-white" />
          </div>
        )}
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 p-3 bg-spotify-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-spotify-green/80"
        >
          <Play className="w-6 h-6 text-spotify-black" fill="currentColor" />
        </button>
      </div>
      <h3 className="text-spotify-white dark:text-light-white font-semibold truncate mb-1">{playlist.name}</h3>
      <p className="text-spotify-lighter dark:text-light-lighter text-sm truncate">{playlist.songs?.length || 0} songs</p>

      {/* More Options Menu */}
      <button
        onClick={handleMenuClick}
        className="absolute top-5 right-5 p-2 bg-spotify-dark/80 dark:bg-light-dark/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-spotify-light/20 dark:hover:bg-light-light/20"
        aria-label="More options"
      >
        <MoreHorizontal className="w-4 h-4 text-spotify-white dark:text-light-white" />
      </button>

      {showMenu && (
        <div ref={menuRef} className="absolute top-12 right-2 bg-spotify-dark dark:bg-light-dark border border-spotify-light dark:border-light-light rounded-lg shadow-lg py-2 min-w-48 z-50">
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleShare}
            className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
          >
            <Share className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-400/20 transition flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
