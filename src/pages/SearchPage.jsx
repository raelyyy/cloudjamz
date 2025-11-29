import { useState, useEffect } from "react";
import { collection, getDocs, query, where, limit, orderBy, addDoc, deleteDoc } from "firebase/firestore";
import { Search } from "lucide-react";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";
import SkeletonCard from "../components/SkeletonCard";
import { useTheme } from "../contexts/ThemeContext";

export default function SearchPage({ onPlaySong, user }) {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load recent searches on component mount
  useEffect(() => {
    if (user) {
      loadRecentSearches();
    }
  }, [user]);

  const loadRecentSearches = async () => {
    try {
      const recentQuery = query(
        collection(db, "recentSearches"),
        where("userId", "==", user.uid),
        orderBy("searchedAt", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(recentQuery);
      const searches = [];
      snapshot.forEach((doc) => {
        searches.push(doc.data().query);
      });
      setRecentSearches(searches);
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query) => {
    if (!user || !query.trim()) return;

    try {
      // Remove existing entry for this query
      const existingQuery = query(
        collection(db, "recentSearches"),
        where("userId", "==", user.uid),
        where("query", "==", query)
      );
      const existingSnapshot = await getDocs(existingQuery);
      existingSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Add new search
      await addDoc(collection(db, "recentSearches"), {
        userId: user.uid,
        query: query,
        searchedAt: new Date(),
      });

      loadRecentSearches();
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const songsRef = collection(db, "songs");
        const q = query(songsRef);
        const querySnapshot = await getDocs(q);

        const results = [];
        querySnapshot.forEach((doc) => {
          const song = { id: doc.id, ...doc.data() };
          const query = searchQuery.toLowerCase();
          if (
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            (song.album && song.album.toLowerCase().includes(query))
          ) {
            results.push(song);
          }
        });

        setSearchResults(results);
        saveRecentSearch(searchQuery);
      } catch (error) {
        console.error("Error searching songs:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-spotify-black h-5 w-5" />
        <input
          type="text"
          placeholder="What do you want to listen to?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full max-w-2xl pl-12 pr-4 py-3 rounded-full bg-spotify-white text-spotify-black placeholder-spotify-light focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-[#DAA520]' : 'focus:ring-[#F7E35A]'}`}
        />
      </div>

      {!searchQuery && recentSearches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-spotify-white mb-4">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((query, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(query)}
                className="px-4 py-2 bg-spotify-dark hover:bg-spotify-light/20 text-spotify-white rounded-full transition"
              >
                {query}
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <section>
          <h2 className="text-2xl font-bold text-spotify-white mb-4">Search Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      ) : searchResults.length > 0 ? (
        <section>
          <h2 className="text-2xl font-bold text-spotify-white mb-4">Search Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {searchResults.map((song) => (
              <MusicCard key={song.id} song={song} onPlay={() => onPlaySong(song, searchResults)} isFavorite={false} />
            ))}
          </div>
        </section>
      ) : searchQuery ? (
        <div className="text-spotify-lighter">No results found for "{searchQuery}"</div>
      ) : (
        <div className="text-spotify-lighter">Start typing to search for songs, artists, or albums</div>
      )}
    </main>
  );
}
