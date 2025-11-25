import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { uploadToCloudinary } from "../utils/cloudinary";
import PlaylistCard from "../components/PlaylistCard";
import MusicCard from "../components/MusicCard";

export default function Playlists({ user, onPlaySong, onCreatePlaylist }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [myMusicName, setMyMusicName] = useState("My Music");
  const [myMusicDescription, setMyMusicDescription] = useState("");
  const [myMusicCover, setMyMusicCover] = useState(null);

  useEffect(() => {
    if (user) {
      // Load My Music custom name, description, and cover from localStorage
      const savedMyMusicName = localStorage.getItem(`myMusicName_${user.uid}`);
      const savedMyMusicDescription = localStorage.getItem(`myMusicDescription_${user.uid}`);
      const savedMyMusicCover = localStorage.getItem(`myMusicCover_${user.uid}`);
      if (savedMyMusicName) setMyMusicName(savedMyMusicName);
      if (savedMyMusicDescription) setMyMusicDescription(savedMyMusicDescription);
      if (savedMyMusicCover) setMyMusicCover(savedMyMusicCover);

      // Fetch playlists
      const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", user.uid));
      const unsubscribePlaylists = onSnapshot(playlistsQuery, (querySnapshot) => {
        const userPlaylists = [];
        querySnapshot.forEach((doc) => {
          userPlaylists.push({ id: doc.id, ...doc.data() });
        });
        setPlaylists(userPlaylists);
      }, (error) => {
        console.error("Error fetching playlists:", error);
      });

      // Fetch songs
      const songsQuery = query(collection(db, "songs"), where("userId", "==", user.uid));
      const unsubscribeSongs = onSnapshot(songsQuery, (querySnapshot) => {
        const userSongs = [];
        querySnapshot.forEach((doc) => {
          userSongs.push({ id: doc.id, ...doc.data() });
        });
        // Sort by upload date (assuming id is timestamp-based, sort descending for latest first)
        userSongs.sort((a, b) => b.id - a.id);
        setSongs(userSongs);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching songs:", error);
        setLoading(false);
      });

      return () => {
        unsubscribePlaylists();
        unsubscribeSongs();
      };
    } else {
      setPlaylists([]);
      setSongs([]);
      setLoading(false);
    }
  }, [user]);

  const handleCoverUpload = async (file) => {
    if (!file) return null;
    setUploadingCover(true);
    try {
      const result = await uploadToCloudinary(file, `playlist-covers/${user.uid}`);
      return result.url;
    } catch (error) {
      console.error("Error uploading cover:", error);
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;

    try {
      let coverUrl = null;
      if (newPlaylistCover) {
        coverUrl = await handleCoverUpload(newPlaylistCover);
      }

      const playlistData = {
        name: newPlaylistName,
        description: newPlaylistDescription,
        cover: coverUrl,
        userId: user.uid,
        songs: [],
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "playlists"), playlistData);
      const newPlaylist = {
        id: docRef.id,
        ...playlistData,
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setNewPlaylistCover(null);
      setShowCreateModal(false);
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

  const handleEditPlaylist = (playlist) => {
    if (playlist.isMyMusic) {
      // Handle My Music editing separately
      setEditingPlaylist(playlist);
      setNewPlaylistName(myMusicName);
      setNewPlaylistDescription(myMusicDescription);
      setNewPlaylistCover(null);
      setShowEditModal(true);
    } else {
      // Handle regular playlist editing
      setEditingPlaylist(playlist);
      setNewPlaylistName(playlist.name);
      setNewPlaylistDescription(playlist.description || "");
      setNewPlaylistCover(null);
      setShowEditModal(true);
    }
  };

  const editPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !editingPlaylist) return;

    try {
      if (editingPlaylist.isMyMusic) {
        // Save My Music custom name, description, and cover to localStorage
        localStorage.setItem(`myMusicName_${user.uid}`, newPlaylistName);
        localStorage.setItem(`myMusicDescription_${user.uid}`, newPlaylistDescription);
        if (newPlaylistCover) {
          const coverUrl = await handleCoverUpload(newPlaylistCover);
          if (coverUrl) {
            localStorage.setItem(`myMusicCover_${user.uid}`, coverUrl);
            setMyMusicCover(coverUrl);
          }
        }
        setMyMusicName(newPlaylistName);
        setMyMusicDescription(newPlaylistDescription);
      } else {
        // Handle regular playlist editing
        let coverUrl = editingPlaylist.cover;
        if (newPlaylistCover) {
          coverUrl = await handleCoverUpload(newPlaylistCover);
        }

        const updatedData = {
          name: newPlaylistName,
          description: newPlaylistDescription,
          cover: coverUrl,
        };

        await updateDoc(doc(db, "playlists", editingPlaylist.id), updatedData);

        setPlaylists(prev => prev.map(p =>
          p.id === editingPlaylist.id ? { ...p, ...updatedData } : p
        ));
      }

      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setNewPlaylistCover(null);
      setEditingPlaylist(null);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error editing playlist:", error);
    }
  };



  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
        <div className="text-spotify-lighter dark:text-light-lighter text-center">
          Please log in to view your playlists.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black dark:bg-light-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-spotify-white dark:text-light-white">Your Playlists</h1>
        <button
          onClick={onCreatePlaylist}
          className="bg-spotify-green hover:bg-spotify-green/80 text-spotify-black px-4 py-2 rounded transition"
        >
          Create Playlist
        </button>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-spotify-dark dark:bg-light-dark p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white mb-4">
              {showEditModal ? "Edit Playlist" : "Create New Playlist"}
            </h2>
            <form onSubmit={showEditModal ? editPlaylist : createPlaylist} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-spotify-green"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-spotify-green resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-spotify-lighter dark:text-light-lighter text-sm mb-2">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPlaylistCover(e.target.files[0])}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white file:bg-spotify-green file:text-spotify-black file:border-none file:px-3 file:py-1 file:rounded file:mr-3 hover:file:bg-spotify-green/80"
                />
                {uploadingCover && <p className="text-spotify-lighter dark:text-light-lighter text-sm mt-1">Uploading cover...</p>}
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="bg-spotify-green hover:bg-spotify-green/80 disabled:bg-spotify-green/50 text-spotify-black px-4 py-2 rounded transition"
                >
                  {uploadingCover ? (showEditModal ? "Updating..." : "Creating...") : (showEditModal ? "Update Playlist" : "Create Playlist")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setNewPlaylistName("");
                    setNewPlaylistDescription("");
                    setNewPlaylistCover(null);
                    setEditingPlaylist(null);
                  }}
                  className="px-4 py-2 border border-spotify-light dark:border-light-light text-spotify-white dark:text-light-white rounded hover:border-spotify-white dark:hover:border-light-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Music Section */}
      {songs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-6">My Music</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <PlaylistCard
              playlist={{
                id: 'my-music',
                name: myMusicName,
                description: myMusicDescription || `${songs.length} songs`,
                cover: myMusicCover,
                userId: user.uid,
                songs: songs,
                createdAt: new Date(),
                isMyMusic: true
              }}
              onDelete={() => {}} // My Music can't be deleted
              onPlaySong={onPlaySong}
              onEdit={handleEditPlaylist}
              onClick={() => navigate('/my-music')}
            />
          </div>
        </div>
      )}

      {/* Playlists Section */}
      <div>
        <h2 className="text-2xl font-bold text-spotify-white dark:text-light-white mb-6">Playlists</h2>
        {loading ? (
          <div className="text-spotify-lighter dark:text-light-lighter">Loading playlists...</div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onDelete={() => deletePlaylist(playlist.id)}
                onPlaySong={onPlaySong}
                onEdit={handleEditPlaylist}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-spotify-lighter dark:text-light-lighter text-center">
            You don't have any playlists yet. Create your first playlist!
          </div>
        )}
      </div>
    </main>
  );
}
