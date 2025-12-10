import { Home, Library, Plus, Heart, Upload, Image, Folder, Trash2, Music, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../contexts/ThemeContext";

export default function Sidebar({ onNavigate, onUpload, onCreatePlaylist, user, isMobileOpen, onToggleMobile, currentPath, isVisible = true }) {
   const { isDarkMode } = useTheme();
   const [userPlaylists, setUserPlaylists] = useState([]);
   const [playlistsLoading, setPlaylistsLoading] = useState(true);
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
      setPlaylistsLoading(true);
      const q = query(collection(db, "playlists"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const playlists = [];
        querySnapshot.forEach((doc) => {
          playlists.push({ id: doc.id, ...doc.data() });
        });
        setUserPlaylists(playlists);
        setPlaylistsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setUserPlaylists([]);
      setPlaylistsLoading(false);
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
              style={{ color: isDarkMode ? '#555' : undefined }}
            >
              <X className="w-6 h-6" />
            </button>


      {/* Upload Section */}
      <div className="mb-4 mt-4">
        <button
          onClick={() => handleUploadClick('audio')}
          className="w-full p-3 rounded-lg transition hover:scale-105 duration-300 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, #F7E35A, #DAA520)' }}
          title="Upload Music"
        >
          <Plus className="w-5 h-5" style={{ color: 'black' }} />
          <span className="font-medium" style={{ color: 'black' }}>Upload Music</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mb-8">
        <ul className="space-y-2">
          <li>
            <button onClick={() => onNavigate('/')} className={`flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left ${currentPath === '/' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
              <Home className="w-6 h-6" />
              Home
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/playlists')} className={`flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left ${currentPath === '/playlists' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
              <Library className="w-6 h-6" />
              Your Library
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/trash')} className={`flex items-center gap-4 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left ${currentPath === '/trash' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
              <Trash2 className="w-6 h-6" />
              Trash
            </button>
          </li>
        </ul>
      </nav>

      {/* Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCreatePlaylist} className="flex items-center gap-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition" style={{ color: isDarkMode ? '#555' : undefined }}>
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
        <ul className="space-y-2">
          <li>
            <button onClick={() => onNavigate('/liked')} className={`flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left ${currentPath === '/liked' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
              <Heart className="w-5 h-5" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }} />
              Liked Songs
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('/my-music')} className={`flex items-center gap-3 px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition w-full text-left ${currentPath === '/my-music' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
              <Music className="w-5 h-5" />
              My Music
            </button>
          </li>
          {playlistsLoading ? (
            // Skeleton loaders for playlists
            Array.from({ length: 3 }, (_, i) => (
              <li key={`skeleton-${i}`}>
                <div className="px-4 py-2 animate-pulse">
                  <div className="h-4 bg-spotify-light dark:bg-light-light rounded w-3/4"></div>
                </div>
              </li>
            ))
          ) : (
            userPlaylists.slice(0, 5).map((playlist) => (
              <li key={playlist.id}>
                <button onClick={() => onNavigate(`/playlist/${playlist.id}`)} className={`block px-4 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition truncate w-full text-left ${currentPath === `/playlist/${playlist.id}` ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }}>
                  {playlist.name}
                </button>
              </li>
            ))
          )}
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
      {isVisible ? (
        <aside className="w-64 bg-spotify-dark dark:bg-light-dark border-r border-spotify-light dark:border-light-light p-6 overflow-y-auto hidden md:block relative slide-in-left">
        {/* Upload Section */}
        <div className="mb-4 mt-4">
          <button
            onClick={() => handleUploadClick('audio')}
            className="w-full p-3 rounded-lg transition hover:scale-105 duration-300 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(to right, #F7E35A, #DAA520)' }}
            title="Upload Music"
          >
            <Plus className="w-5 h-5" style={{ color: 'black' }} />
            <span className="font-medium" style={{ color: 'black' }}>Upload Music</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mb-8">
          <ul className="space-y-2">
            {/* Home */}
            <li>
              <button
                onClick={() => onNavigate('/')}
                className={`flex items-center gap-4 px-4 py-2
                  hover:text-spotify-white dark:hover:text-light-white
                  hover:bg-spotify-light dark:hover:bg-light-light
                  rounded-lg transition w-full text-left
                  ${currentPath === '/'
                    ? 'text-white dark:text-[#000000] font-bold'
                    : 'text-spotify-lighter dark:text-light-lighter'
                  }`}
              >
                <Home className="w-6 h-6" />
                Home
              </button>
            </li>

            {/* Your Library */}
            <li>
              <button
                onClick={() => onNavigate('/playlists')}
                className={`flex items-center gap-4 px-4 py-2
                  hover:text-spotify-white dark:hover:text-light-white
                  hover:bg-spotify-light dark:hover:bg-light-light
                  rounded-lg transition w-full text-left
                  ${currentPath === '/playlists'
                    ? 'text-white dark:text-[#000000] font-bold'
                    : 'text-spotify-lighter dark:text-light-lighter'
                  }`}
              >
                <Library className="w-6 h-6" />
                Your Library
              </button>
            </li>

            {/* Trash */}
            <li>
              <button
                onClick={() => onNavigate('/trash')}
                className={`flex items-center gap-4 px-4 py-2
                  hover:text-spotify-white dark:hover:text-light-white
                  hover:bg-spotify-light dark:hover:bg-light-light
                  rounded-lg transition w-full text-left
                  ${currentPath === '/trash'
                    ? 'text-white dark:text-[#000000] font-bold'
                    : 'text-spotify-lighter dark:text-light-lighter'
                  }`}
              >
                <Trash2 className="w-6 h-6" />
                Trash
              </button>
            </li>
          </ul>
        </nav>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onCreatePlaylist}
              className="flex items-center gap-2 
                text-spotify-lighter dark:text-light-lighter 
                hover:text-spotify-white dark:hover:text-light-white transition"
            >
              <Plus className="w-5 h-5" />
              Create Playlist
            </button>
          </div>

          <ul className="space-y-2">

            {/* Liked Songs */}
            <li>
              <button
                onClick={() => onNavigate('/liked')}
                className={`flex items-center gap-3 px-4 py-2
                  hover:bg-spotify-light dark:hover:bg-light-light
                  rounded-lg transition w-full text-left
                  ${currentPath === '/liked'
                    ? 'text-white dark:text-[#000000] font-bold'
                    : 'text-spotify-lighter dark:text-light-lighter'
                  }`}
              >
                <Heart
                  className="w-5 h-5"
                  style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }}
                />
                Liked Songs
              </button>
            </li>

            {/* My Music */}
            <li>
              <button
                onClick={() => onNavigate('/my-music')}
                className={`flex items-center gap-3 px-4 py-2
                  hover:bg-spotify-light dark:hover:bg-light-light
                  rounded-lg transition w-full text-left
                  ${currentPath === '/my-music'
                    ? 'text-white dark:text-[#000000] font-bold'
                    : 'text-spotify-lighter dark:text-light-lighter'
                  }`}
              >
                <Music className="w-5 h-5" />
                My Music
              </button>
            </li>

            {/* User Playlists or Skeleton Loaders */}
            {playlistsLoading ? (
              // Skeleton loaders for playlists
              Array.from({ length: 3 }, (_, i) => (
                <li key={`skeleton-${i}`}>
                  <div className="px-4 py-2 animate-pulse">
                    <div className="h-4 bg-spotify-light dark:bg-light-light rounded w-3/4"></div>
                  </div>
                </li>
              ))
            ) : (
              userPlaylists.slice(0, 5).map((playlist) => (
                <li key={playlist.id}>
                  <button
                    onClick={() => onNavigate(`/playlist/${playlist.id}`)}
                    className={`block px-4 py-2 truncate
                      hover:bg-spotify-light dark:hover:bg-light-light
                      rounded-lg transition w-full text-left
                      ${currentPath === `/playlist/${playlist.id}`
                        ? 'text-white dark:text-[#000000] font-bold'
                        : 'text-spotify-lighter dark:text-light-lighter'
                      }`}
                  >
                    {playlist.name}
                  </button>
                </li>
              ))
            )}

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
      ) : (
        /* Minimal Sidebar - Icons Only */
        <aside className="w-16 bg-spotify-dark dark:bg-light-dark border-r border-spotify-light dark:border-light-light p-4 pt-8 overflow-y-auto hidden md:block relative">
          {/* Upload Section */}
          <div className="mb-4">
            <button
              onClick={() => handleUploadClick('audio')}
              className="w-full p-2 rounded-lg transition hover:scale-105 duration-300 flex items-center justify-center"
              style={{ background: 'linear-gradient(to right, #F7E35A, #DAA520)' }}
              title="Upload Music"
            >
              <Plus className="w-4 h-4" style={{ color: 'black' }} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mb-8">
            <ul className="space-y-4">
              <li>
                <button onClick={() => onNavigate('/')} className={`flex items-center justify-center px-2 py-3 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === '/' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title="Home">
                  <Home className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/playlists')} className={`flex items-center justify-center px-2 py-3 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === '/playlists' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title="Your Library">
                  <Library className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/trash')} className={`flex items-center justify-center px-2 py-3 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === '/trash' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title="Trash">
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            </ul>
          </nav>

          {/* Playlists */}
          <div>
            <div className="flex items-center justify-center mb-4">
              <button onClick={onCreatePlaylist} className="flex items-center justify-center text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition" style={{ color: isDarkMode ? '#555' : undefined }} title="Create Playlist">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('/liked')} className={`flex items-center justify-center px-2 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === '/liked' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title="Liked Songs">
                  <Heart className="w-4 h-4" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }} />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/my-music')} className={`flex items-center justify-center px-2 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === '/my-music' ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title="My Music">
                  <Music className="w-4 h-4" />
                </button>
              </li>
              {playlistsLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <li key={`skeleton-${i}`}>
                    <div className="px-2 py-2 animate-pulse">
                      <div className="w-8 h-8 bg-spotify-light dark:bg-light-light rounded mx-auto"></div>
                    </div>
                  </li>
                ))
              ) : userPlaylists.length > 0 ? (
                userPlaylists.slice(0, 5).map((playlist) => (
                  <li key={playlist.id}>
                    <button onClick={() => onNavigate(`/playlist/${playlist.id}`)} className={`flex items-center justify-center px-2 py-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white hover:bg-spotify-light dark:hover:bg-light-light rounded-lg transition ${currentPath === `/playlist/${playlist.id}` ? 'bg-spotify-dark dark:bg-light-dark text-spotify-white dark:text-light-white font-bold' : ''}`} style={{ color: isDarkMode ? '#555' : undefined }} title={playlist.name}>
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${playlist.gradientColor || 'from-gray-500'}`}></div>
                    </button>
                  </li>
                ))
              ) : (
                <li>
                  <div className="flex items-center justify-center px-2 py-2 text-spotify-lighter dark:text-light-lighter opacity-50" title="No playlists yet">
                    <Music className="w-4 h-4" />
                  </div>
                </li>
              )}
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
      )}
    </>
  );
}
