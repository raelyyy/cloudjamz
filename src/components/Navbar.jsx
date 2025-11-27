import { Search, User, Settings, Music, Palette, Bell, Shield, ListMusic, UserCog, LogOut, Menu, Sun, Moon, CodeXml } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { searchItunes } from "../utils/itunesApi";
import { useTheme } from "../contexts/ThemeContext";
import ScrambledText from "./ScrambledText";

export default function Navbar({ user, onLogin, onLogout, onSearchResult, onToggleMobileSidebar }) {
   const navigate = useNavigate();
   const { isDarkMode, toggleTheme } = useTheme();
   const [searchQuery, setSearchQuery] = useState("");
   const [searchResults, setSearchResults] = useState([]);
   const [showResults, setShowResults] = useState(false);
   const [loading, setLoading] = useState(false);
   const [profileDropdown, setProfileDropdown] = useState(false);
   const searchRef = useRef(null);
   const profileRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const trackResults = await searchItunes(searchQuery);
        const artistResults = await searchItunes(searchQuery, 'musicArtist');
        const albumResults = await searchItunes(searchQuery, 'album');
        const results = [];

        // Add tracks
        if (trackResults && trackResults.length > 0) {
          results.push(...trackResults.slice(0, 4));
        }

        // Add artists
        if (artistResults && artistResults.length > 0) {
          results.push(...artistResults.slice(0, 2));
        }

        // Add albums
        if (albumResults && albumResults.length > 0) {
          results.push(...albumResults.slice(0, 2));
        }

        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchQuery("");
    if (onSearchResult) {
      onSearchResult(result);
    }
  };

  return (
    <header className="w-screen fixed top-0 left-0 z-50 bg-spotify-black/90 dark:bg-light-dark/90 backdrop-blur-lg border-b border-spotify-light dark:border-light-light flex justify-between items-center px-4 md:px-6 py-4">
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleMobileSidebar}
        className="md:hidden p-2 mr-2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white transition"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center">
        <Music className="w-8 h-8 mr-2" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }} />
        <ScrambledText
          className="text-xl font-black hidden sm:block"
          scrambleChars=".:"
          radius={50}
          duration={0.8}
          speed={0.3}
        >
          CloudJamz
        </ScrambledText>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-2 md:mx-6 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-12 py-3 rounded-full bg-spotify-light dark:bg-light-light text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-[#DAA520]' : 'focus:ring-[#F7E35A]'} hidden md:block`}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-10 py-2 rounded-full bg-spotify-light dark:bg-light-light text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-[#DAA520]' : 'focus:ring-[#F7E35A]'} md:hidden`}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-spotify-lighter dark:text-light-lighter bg-spotify-light dark:bg-light-light md:left-4 md:w-5 md:h-5 left-3 w-4 h-4" />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-spotify-dark dark:bg-light-dark border border-spotify-light dark:border-light-light rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 text-left hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-3"
              >
                {result.cover && (
                  <img
                    src={result.cover}
                    alt={result.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-spotify-white dark:text-light-white font-medium truncate">{result.title}</div>
                  <div className="text-spotify-lighter dark:text-light-lighter text-sm truncate">
                    {result.type === 'track' && `${result.artist} • ${result.album}`}
                    {result.type === 'artist' && 'Artist'}
                    {result.type === 'album' && `${result.artist} • Album`}
                  </div>
                </div>
                <div className="text-spotify-lighter dark:text-light-lighter text-xs capitalize">{result.type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2">
        {/* About Devs Button */}
        <button
          onClick={() => navigate('/about-devs')}
          className="p-3 rounded-full bg-spotify-dark dark:bg-light-dark hover:bg-spotify-light dark:hover:bg-light-light transition"
          title="About Developers"
        >
          <CodeXml className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
        </button>

        {user ? (
          <>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-spotify-dark dark:bg-light-dark hover:bg-spotify-light dark:hover:bg-light-light transition"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
              ) : (
                <Moon className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
              )}
            </button>

            {/* Profile Icon */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="p-3 rounded-full bg-spotify-dark dark:bg-light-dark hover:bg-spotify-light dark:hover:bg-light-light transition"
              >
                <User className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />
              </button>
              {profileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-spotify-dark dark:bg-light-dark border border-spotify-light dark:border-light-light rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => navigate('/playlists')}
                    className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-2"
                  >
                    <ListMusic className="w-4 h-4" />
                    My Playlists
                  </button>
                  <button
                    onClick={() => navigate('/account-settings')}
                    className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-2"
                  >
                    <UserCog className="w-4 h-4" />
                    Account Settings
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-spotify-white dark:text-light-white hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={onLogin} className="px-3 py-1 bg-spotify-green hover:bg-spotify-green/80 transition text-spotify-black text-sm rounded">
            Login
          </button>
        )}
      </div>
    </header>
  );
}
