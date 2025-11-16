import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import PlaylistCard from "../components/PlaylistCard";

export default function Playlists({ user, onPlaySong }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const q = collection(db, "playlists");
      const querySnapshot = await getDocs(q);
      const userPlaylists = [];
      querySnapshot.forEach((doc) => {
        const playlist = { id: doc.id, ...doc.data() };
        if (playlist.userId === user.uid) {
          userPlaylists.push(playlist);
        }
      });
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;

    try {
      await addDoc(collection(db, "playlists"), {
        name: newPlaylistName,
        userId: user.uid,
        songs: [],
        createdAt: new Date(),
      });
      setNewPlaylistName("");
      setShowCreateForm(false);
      fetchPlaylists();
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await deleteDoc(doc(db, "playlists", playlistId));
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };



  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter text-center">
          Please log in to view your playlists.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-spotify-white">Your Playlists</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-spotify-green hover:bg-spotify-green/80 text-spotify-black px-4 py-2 rounded transition"
        >
          Create Playlist
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 p-4 bg-spotify-dark rounded-lg">
          <form onSubmit={createPlaylist}>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green"
                required
              />
              <button
                type="submit"
                className="bg-spotify-green hover:bg-spotify-green/80 text-spotify-black px-4 py-2 rounded transition"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-spotify-light text-spotify-white rounded hover:border-spotify-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-spotify-lighter">Loading playlists...</div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onDelete={() => deletePlaylist(playlist.id)}
              onPlaySong={onPlaySong}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-spotify-lighter text-center">
          You don't have any playlists yet. Create your first playlist!
        </div>
      )}
    </main>
  );
}
