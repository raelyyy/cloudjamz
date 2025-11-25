import { Play, Pause, Music } from "lucide-react";

export default function RecentlyPlayedCard({ song, onPlay, isPlaying }) {
  return (
    <div
      onClick={() => onPlay(song)}
      className="flex items-center bg-spotify-dark dark:bg-light-dark hover:bg-spotify-light/10 dark:hover:bg-light-light/10 rounded-lg p-3 transition cursor-pointer group shadow-md dark:shadow-lg"
    >
      {/* Cover or Placeholder */}
      <img
        src={song.cover || 'invalid'}
        alt={song.title}
        className="w-12 h-12 rounded object-cover mr-3"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div className="w-12 h-12 rounded bg-spotify-light/20 dark:bg-light-light/20 flex items-center justify-center mr-3 hidden">
        <Music className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-spotify-white dark:text-light-white font-medium text-sm truncate">{song.title}</h4>
        <p className="text-spotify-lighter dark:text-light-lighter text-xs truncate">{song.artist}</p>
      </div>

      {/* Play/Pause Button (hover only) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay(song);
        }}
        className={`ml-2 p-2 rounded-full bg-spotify-green hover:bg-spotify-green/80 text-spotify-black transition-opacity opacity-0 group-hover:opacity-100`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-spotify-black" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 text-spotify-black" fill="currentColor" />
        )}
      </button>
    </div>
  );
}
