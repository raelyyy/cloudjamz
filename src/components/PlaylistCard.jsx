import { Play, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PlaylistCard({ playlist, onDelete, onClick }) {
  const navigate = useNavigate();
  const handlePlay = () => {
    if (playlist.songs && playlist.songs.length > 0) {
      // For now, just play the first song. In a full implementation, you'd have playlist playback logic
      // onPlaySong(playlist.songs[0]);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(playlist);
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  return (
    <div onClick={handleCardClick} className="bg-spotify-dark rounded-lg p-4 hover:bg-spotify-light/20 transition cursor-pointer group relative">
      <div className="relative mb-4">
        <div className="w-full h-48 bg-gradient-to-br from-spotify-green to-spotify-black rounded-tl-lg rounded-tr-lg flex items-center justify-center">
          <Play className="w-12 h-12 text-spotify-white" />
        </div>
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 p-3 bg-spotify-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-spotify-green/80"
        >
          <Play className="w-6 h-6 text-spotify-black" fill="currentColor" />
        </button>
      </div>
      <h3 className="text-spotify-white font-semibold truncate mb-1">{playlist.name}</h3>
      <p className="text-spotify-lighter text-sm truncate">{playlist.songs?.length || 0} songs</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-4 h-4 text-spotify-lighter hover:text-spotify-white" />
      </button>
    </div>
  );
}
