import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import MusicCard from "../components/MusicCard";

export default function TrashPage({ user, onPlaySong }) {
  const [trashedSongs, setTrashedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTrashedSongs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for trashed songs
    const trashQuery = query(collection(db, "trash"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(trashQuery, (snapshot) => {
      const songs = [];
      snapshot.forEach((doc) => {
        songs.push({ ...doc.data(), documentId: doc.id });
      });
      setTrashedSongs(songs);
      setLoading(false);
    }, (error) => {
      console.warn("Error listening to trash:", error.message);
      setTrashedSongs([]);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user]);

  const restoreSong = async (song) => {
    try {
      // Add back to songs collection
      await addDoc(collection(db, "songs"), {
        ...song,
        restoredAt: new Date(),
      });

      // Remove from trash
      await deleteDoc(doc(db, "trash", song.documentId));
    } catch (error) {
      console.error("Error restoring song:", error);
    }
  };

  const permanentDeleteSong = async (song) => {
    try {
      // Skip Cloudinary deletion for now (client-side not supported for unsigned uploads)
      // Just remove from trash collection
      await deleteDoc(doc(db, "trash", song.documentId));
    } catch (error) {
      console.error("Error permanently deleting song:", error);
    }
  };

  const emptyTrash = async () => {
    if (!confirm("Are you sure you want to permanently delete all songs in trash? This action cannot be undone.")) {
      return;
    }

    try {
      for (const song of trashedSongs) {
        // Skip Cloudinary deletion for now (client-side not supported for unsigned uploads)
        await deleteDoc(doc(db, "trash", song.documentId));
      }
    } catch (error) {
      console.error("Error emptying trash:", error);
    }
  };

  if (!user) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
        <div className="text-spotify-lighter text-center">
          Please log in to view your trash.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-spotify-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-spotify-white">Trash</h1>
        {trashedSongs.length > 0 && (
          <button
            onClick={emptyTrash}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            Empty Trash
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-spotify-lighter">Loading trash...</div>
      ) : trashedSongs.length > 0 ? (
        <>
          <p className="text-spotify-lighter mb-6">
            Songs in trash will be permanently deleted after 30 days.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {trashedSongs.map((song) => (
              <div key={song.documentId} className="relative">
                <MusicCard
                  song={song}
                  isFavorite={false}
                  onPlay={() => onPlaySong(song)}
                  onRestore={() => restoreSong(song)}
                  onPermanentDelete={() => permanentDeleteSong(song)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-spotify-lighter text-center">
          Your trash is empty.
        </div>
      )}
    </main>
  );
}
