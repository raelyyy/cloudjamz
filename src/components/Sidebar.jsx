import { Home, Library, Plus, Heart, Upload, Image, Folder, Trash2, Music, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Sidebar({ onNavigate, onUpload, onCreatePlaylist, user, isMobileOpen, onToggleMobile }) {
  const [userPlaylists, setUserPlaylists] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "playlists"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const playlists = [];
        querySnapshot.forEach((doc) => {
          playlists.push({ id: doc.id, ...doc.data() });
        });
        setUserPlaylists(playlists);
      });

      return () => unsubscribe();
    } else {
      setUserPlaylists([]);
    }
  }, [user]);



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
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onToggleMobile} />
          <aside className="w-64 bg-spotify-dark dark:bg-light-dark border-r border-spotify-light dark:border-light-light p-6 overflow-y-auto absolute left-0 top-0 h-full">
            {/* Mobile Close Button */}
            <button
              onClick={onToggleMobile}
              className="absolute top-4 right-4 p-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition"
            >
              <X className="w-6 h-6" />
            </button>


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
            <button onClick={() => onNavigate('/')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
              <Home className="w-6 h-6" />
              Home
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/playlists')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
              <Library className="w-6 h-6" />
              Your Library
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/trash')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
              <Trash2 className="w-6 h-6" />
              Trash
            </button>
          </li>
        </ul>
      </nav>

      {/* Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCreatePlaylist} className="flex items-center gap-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition">
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
        <ul className="space-y-2">
          <li>
            <button onClick={() => onNavigate('/liked')} className="flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
              <Heart className="w-5 h-5 text-spotify-green" />
              Liked Songs
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/my-music')} className="flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
              <Music className="w-5 h-5" />
              My Music
            </button>
          </li>
          {userPlaylists.slice(0, 5).map((playlist) => (
            <li key={playlist.id}>
              <button onClick={() => onNavigate(`/playlist/${playlist.id}`)} className="block px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition truncate w-full text-left">
                {playlist.name}
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
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-spotify-dark dark:bg-light-dark border-r border-spotify-light dark:border-light-light p-6 overflow-y-auto hidden md:block relative">
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
              <button onClick={() => onNavigate('/')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
                <Home className="w-6 h-6" />
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/playlists')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
                <Library className="w-6 h-6" />
                Your Library
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/trash')} className="flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
                <Trash2 className="w-6 h-6" />
                Trash
              </button>
            </li>
          </ul>
        </nav>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={onCreatePlaylist} className="flex items-center gap-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition">
              <Plus className="w-5 h-5" />
              Create Playlist
            </button>
          </div>
          <ul className="space-y-2">
            <li>
              <button onClick={() => onNavigate('/liked')} className="flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
                <Heart className="w-5 h-5 text-spotify-green" />
                Liked Songs
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/my-music')} className="flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left">
                <Music className="w-5 h-5" />
                My Music
              </button>
            </li>
            {userPlaylists.slice(0, 5).map((playlist) => (
              <li key={playlist.id}>
                <button onClick={() => onNavigate(`/playlist/${playlist.id}`)} className="block px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition truncate w-full text-left">
                  {playlist.name}
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
    </>
  );
}
