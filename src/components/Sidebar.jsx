import { Home, Library, Plus, Heart, Upload, Image, Folder, Trash2 } from "lucide-react";
import { useRef } from "react";

export default function Sidebar({ onNavigate, onUpload }) {
  const playlists = ["Liked Songs", "Discover Weekly", "Release Radar", "Daily Mix 1", "Daily Mix 2"];
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const handleUploadClick = (type) => {
    switch (type) {
      case 'audio':
        fileInputRef.current.click();
        break;
      case 'image':
        imageInputRef.current.click();
        break;
      case 'folder':
        folderInputRef.current.click();
        break;
    }
  };

  return (
    <aside className="w-64 bg-spotify-dark border-r border-spotify-light p-6 overflow-y-auto hidden md:block relative">


      {/* Upload Section */}
      <div className="mb-4 mt-4">
        <button
          onClick={() => handleUploadClick('audio')}
          className="w-full p-3 bg-spotify-green hover:bg-spotify-green/80 rounded-lg transition flex items-center justify-center gap-2"
          title="Upload Music"
        >
          <Plus className="w-5 h-5 text-spotify-black" />
          <span className="text-spotify-black font-medium">Upload Music</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mb-8">
        <ul className="space-y-2">
          <li>
            <button onClick={() => onNavigate('/')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter hover:text-spotify-white hover:bg-spotify-light rounded-lg transition w-full text-left">
              <Home className="w-6 h-6" />
              Home
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/playlists')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter hover:text-spotify-white hover:bg-spotify-light rounded-lg transition w-full text-left">
              <Library className="w-6 h-6" />
              Your Library
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/trash')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter hover:text-spotify-white hover:bg-spotify-light rounded-lg transition w-full text-left">
              <Trash2 className="w-6 h-6" />
              Trash
            </button>
          </li>
        </ul>
      </nav>

      {/* Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onNavigate('/playlists')} className="flex items-center gap-2 text-spotify-lighter hover:text-spotify-white transition">
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
        <ul className="space-y-2">
          <li>
            <button onClick={() => onNavigate('/liked')} className="flex items-center gap-3 px-4 py-2 text-spotify-lighter hover:text-spotify-white hover:bg-spotify-light rounded-lg transition w-full text-left">
              <Heart className="w-5 h-5 text-spotify-green" />
              Liked Songs
            </button>
          </li>
          {playlists.slice(1).map((playlist, i) => (
            <li key={i}>
              <button onClick={() => onNavigate('/playlists')} className="block px-4 py-2 text-spotify-lighter hover:text-spotify-white hover:bg-spotify-light rounded-lg transition truncate w-full text-left">
                {playlist}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </aside>
  );
}
