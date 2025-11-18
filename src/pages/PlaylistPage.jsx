import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { uploadToCloudinary } from "../utils/cloudinary";
import { MoreHorizontal, Edit, Trash2, Share } from "lucide-react";
import MusicCard from "../components/MusicCard";

export default function PlaylistPage({ onPlaySong, currentSong, isPlaying, favorites, onFavorite, onRemoveFromPlaylist }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingCover, setEditingCover] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const dropdownRef = useRef(null);

  const handleEditPlaylist = () => {
    if (playlist) {
      setEditingName(playlist.title);
      setEditingDescription(playlist.description || "");
      setEditingCover(null);
      setShowEditModal(true);
      setShowOptions(false);
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return null;
    setUploadingCover(true);
    try {
      const result = await uploadToCloudinary(file, `playlist-covers/${playlist.userId}`);
      return result.url;
    } catch (error) {
      console.error("Error uploading cover:", error);
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  const editPlaylist = async (e) => {
    e.preventDefault();
    if (!editingName.trim() || !playlist) return;

    try {
      // Check for duplicate playlist names
      const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", playlist.userId), where("name", "==", editingName));
      const querySnapshot = await getDocs(playlistsQuery);
      const existingPlaylists = querySnapshot.docs.filter(doc => doc.id !== playlist.id);

      if (existingPlaylists.length > 0) {
        alert("A playlist with this name already exists. Please choose a different name.");
        return;
      }

      let coverUrl = playlist.cover;
      if (editingCover) {
        coverUrl = await handleCoverUpload(editingCover);
      }

      const updatedData = {
        name: editingName,
        description: editingDescription,
        cover: coverUrl,
      };

      await updateDoc(doc(db, "playlists", playlist.id), updatedData);

      // Update local state
      setPlaylist(prev => ({
        ...prev,
        ...updatedData,
        title: editingName,
      }));

      setShowEditModal(false);
      setEditingName("");
      setEditingDescription("");
      setEditingCover(null);
    } catch (error) {
      console.error("Error editing playlist:", error);
    }
  };

  const handleSharePlaylist = async () => {
    const shareUrl = `${window.location.origin}/playlist/${id}`;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Playlist URL copied to clipboard!');
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          alert('Playlist URL copied to clipboard!');
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          alert(`Please copy this URL manually: ${shareUrl}`);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert(`Please copy this URL manually: ${shareUrl}`);
    }

    setShowOptions(false);
  };

  const handleDeletePlaylist = async () => {
    if (window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, "playlists", id));
        navigate('/playlists');
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
    setShowOptions(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const genreColors = {
    rock: 'from-red-500',
    pop: 'from-pink-500',
    'hip-hop': 'from-purple-500',
    opm: 'from-blue-500',
    kpop: 'from-yellow-500',
    metal: 'from-gray-500',
    electronic: 'from-green-500',
    jazz: 'from-orange-500',
    classical: 'from-indigo-500'
  };

  const getConsistentGradient = (playlistId) => {
    const gradients = [
      'from-red-500',
      'from-pink-500',
      'from-purple-500',
      'from-blue-500',
      'from-yellow-500',
      'from-gray-500',
      'from-green-500',
      'from-orange-500',
      'from-indigo-500',
      'from-teal-500',
      'from-cyan-500',
      'from-lime-500',
      'from-emerald-500',
      'from-violet-500',
      'from-fuchsia-500',
      'from-rose-500'
    ];
    // Use playlist ID to generate consistent color
    let hash = 0;
    for (let i = 0; i < playlistId.length; i++) {
      hash = playlistId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  useEffect(() => {
    // First check if it's a genre playlist (static, no real-time needed)
    const genres = ['rock', 'pop', 'hip-hop', 'opm', 'kpop', 'metal', 'electronic', 'jazz', 'classical'];
    const genre = genres.find(g => g === id);

    if (genre) {
      const fetchGenrePlaylist = async () => {
        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${genre}&media=music&limit=200&country=US`);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            let tracks = data.results
              .filter(track => genre !== 'pop' || track.artistName !== 'The 1975') // Exclude The 1975 from general pop search to avoid duplicates
              .map(track => ({
                id: track.trackId,
                title: track.trackName,
                artist: track.artistName,
                album: track.collectionName,
                cover: track.artworkUrl100.replace('100x100', '600x600'),
                url: track.previewUrl,
                external_url: track.trackViewUrl,
                duration: track.trackTimeMillis
              }));

            // Add The 1975 songs from iTunes API to the Pop playlist
            if (genre === 'pop') {
              const the1975Response = await fetch(`https://itunes.apple.com/search?term=The+1975&media=music&limit=20&country=US`);
              const the1975Data = await the1975Response.json();
              const the1975Tracks = the1975Data.results
                .filter(track => track.previewUrl) // Only include tracks with preview URLs
                .map(track => ({
                  id: track.trackId,
                  title: track.trackName,
                  artist: track.artistName,
                  album: track.collectionName,
                  cover: track.artworkUrl100.replace('100x100', '600x600'),
                  url: track.previewUrl,
                  external_url: track.trackViewUrl,
                  duration: track.trackTimeMillis
                }));
              tracks = [...the1975Tracks, ...tracks]; // Add The 1975 songs first
            }

            // Shuffle the tracks to randomize the order for all playlists
            tracks = tracks.sort(() => Math.random() - 0.5);

            let cover = tracks[0]?.cover || 'https://via.placeholder.com/192x192/1DB954/FFFFFF?text=' + encodeURIComponent(genre);
            if (genre === 'opm') {
              cover = 'https://i.scdn.co/image/ab67616d0000b27314708b669227cf0b2c458946';
            } else if (genre === 'electronic') {
              cover = 'https://d2rd7etdn93tqb.cloudfront.net/wp-content/uploads/2022/03/spotify-playlist-cover-woman-listeningt-to-headphones-purple-music-032322.jpg';
            } else if (genre === 'jazz') {
              cover = 'https://external-preview.redd.it/qnrcglcd_DBgSPmq35qcoBb29Qu2qSEGwJiKoVfTl_U.jpg?auto=webp&s=51f0bece12746e43502f075977d55f282947ed28';
            } else if (genre === 'classical') {
              cover = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSlRPNFUMGEYetuQkpf25F70mKjO-4Akyg2w&s';
            }

            let title = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Mix`;
            if (genre === 'opm') {
              title = 'OPM Mix';
            }

            setPlaylist({
              id: genre,
              title: title,
              description: `Discover the best ${genre} tracks`,
              cover: cover,
              songs: tracks
            });
          }
        } catch (error) {
          console.error('Error fetching genre playlist:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchGenrePlaylist();
      return;
    }

    // For user-created playlists, use real-time listener
    const playlistRef = doc(db, "playlists", id);
    const unsubscribe = onSnapshot(playlistRef, async (playlistDoc) => {
      if (playlistDoc.exists()) {
        const playlistData = playlistDoc.data();
        let songs = playlistData.songs || [];

        // If there are songs, fetch additional data for user-uploaded songs
        if (songs.length > 0) {
          const songsQuery = query(collection(db, "songs"), where("userId", "==", playlistData.userId));
          const songsSnapshot = await getDocs(songsQuery);
          const songsMap = new Map();
          songsSnapshot.forEach((doc) => {
            const song = { id: doc.id, ...doc.data() };
            songsMap.set(song.id, song);
          });

          // Merge song data
          songs = songs.map(songId => {
            if (songsMap.has(songId)) {
              return songsMap.get(songId);
            }
            // If not found in songs collection, assume it's API song data stored in playlist
            return songId; // songId might be the full song object
          });

          // Sort songs from latest added (assuming array is appended, so reverse for latest first)
          songs.reverse();
        }

        setPlaylist({
          id: playlistDoc.id,
          ...playlistData,
          title: playlistData.name,
          description: playlistData.description || 'A custom playlist created by you',
          songs: songs,
          gradientColor: playlistData.gradientColor,
          isUserCreated: true
        });
      } else {
        setPlaylist(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to playlist:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Loading playlist...</div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter">Playlist not found</div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-8 pb-8 px-8 overflow-y-auto bg-spotify-black">
      <div className={`flex items-center justify-between mb-8 sticky -top-4 bg-gradient-to-b ${genreColors[id] || playlist.gradientColor || getConsistentGradient(id)} to-transparent z-10 pb-4 pt-4 pl-4 pr-8`}>
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full w-12 h-12 flex items-center justify-center bg-spotify-gray hover:bg-spotify-dark text-spotify-lighter hover:text-spotify-white transition mr-2 text-2xl font-bold"
          >
            {"<"}
          </button>
          <div>
            <h1 className="text-3xl font-bold text-spotify-white mb-1">{playlist.title}</h1>
            <p className="text-spotify-lighter">{playlist.description}</p>
          </div>
        </div>

        {playlist.isUserCreated && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-spotify-gray rounded-full transition"
            >
              <MoreHorizontal className="w-6 h-6 text-spotify-lighter" />
            </button>

            {showOptions && (
              <div ref={dropdownRef} className="absolute right-0 top-full mt-2 bg-spotify-dark border border-spotify-light rounded-lg shadow-lg z-20 min-w-48">
                <button onClick={handleEditPlaylist} className="w-full text-left px-4 py-3 hover:bg-spotify-gray text-spotify-white flex items-center gap-3 rounded-t-lg">
                  <Edit className="w-4 h-4" />
                  Edit playlist
                </button>
                <button onClick={handleSharePlaylist} className="w-full text-left px-4 py-3 hover:bg-spotify-gray text-spotify-white flex items-center gap-3">
                  <Share className="w-4 h-4" />
                  Share playlist
                </button>
                <button onClick={handleDeletePlaylist} className="w-full text-left px-4 py-3 hover:bg-spotify-gray text-red-400 flex items-center gap-3 rounded-b-lg">
                  <Trash2 className="w-4 h-4" />
                  Delete playlist
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {playlist.songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="text-spotify-lighter text-lg mb-2">This playlist is empty</div>
          <div className="text-spotify-gray text-sm">Add some songs to get started!</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlist.songs
            .filter((song, index, self) => index === self.findIndex(s => s.id === song.id))
            .map((song, index) => (
              <MusicCard
                key={`${song.id}-${index}`}
                song={song}
                onPlay={() => {
                  if (song.url) {
                    onPlaySong(song, playlist.songs);
                  } else {
                    console.log('No preview URL for track:', song.title);
                  }
                }}
                onFavorite={onFavorite}
                onAddToPlaylist={playlist.isUserCreated ? undefined : (song) => {
                  // Handle adding to playlist for suggested playlists
                  // This will trigger the modal in App.jsx
                  if (window.handleAddToPlaylist) {
                    window.handleAddToPlaylist(song);
                  }
                }}
                onRemoveFromPlaylist={playlist.isUserCreated ? () => onRemoveFromPlaylist(song, playlist.id) : undefined}
                showAddToPlaylist={!playlist.isUserCreated}
                disableNavigation={true}
                isPlaying={song.id === currentSong?.id && isPlaying}
                isFavorite={favorites.has(song.id)}
              />
            ))}
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-spotify-dark p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-spotify-white mb-4">Edit Playlist</h2>
            <form onSubmit={editPlaylist} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-spotify-lighter text-sm mb-2">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditingCover(e.target.files[0])}
                  className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white file:bg-spotify-green file:text-spotify-black file:border-none file:px-3 file:py-1 file:rounded file:mr-3 hover:file:bg-spotify-green/80"
                />
                {uploadingCover && <p className="text-spotify-lighter text-sm mt-1">Uploading cover...</p>}
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="bg-spotify-green hover:bg-spotify-green/80 disabled:bg-spotify-green/50 text-spotify-black px-4 py-2 rounded transition"
                >
                  {uploadingCover ? "Updating..." : "Update Playlist"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingName("");
                    setEditingDescription("");
                    setEditingCover(null);
                  }}
                  className="px-4 py-2 border border-spotify-light text-spotify-white rounded hover:border-spotify-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
