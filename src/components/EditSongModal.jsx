import React, { useState, useEffect } from 'react';
import { uploadToCloudinary } from '../utils/cloudinary';

export default function EditSongModal({ isOpen, onClose, song, onSave }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [currentCoverUrl, setCurrentCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setAlbum(song.album || '');
      setCurrentCoverUrl(song.cover || '');
      setCoverFile(null);
      setCoverPreview(song.cover || '');
      setError(null);
    }
  }, [song]);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  if (!isOpen) {
    return null;
  }

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0];
    if (coverPreview && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    if (!file) {
      setCoverFile(null);
      setCoverPreview(currentCoverUrl);
      return;
    }
    setCoverFile(file);
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
  };

  const handleSave = async () => {
    if (!song) return;

    try {
      setIsSaving(true);
      setError(null);

      let finalCoverUrl = currentCoverUrl;
      if (coverFile) {
        const uploadResult = await uploadToCloudinary(
          coverFile,
          `covers/${song.userId || 'shared'}`
        );
        finalCoverUrl = uploadResult.url;
        setCurrentCoverUrl(finalCoverUrl);
      }

      const updatedSong = {
        ...song,
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim(),
        cover: finalCoverUrl,
      };

      onSave(updatedSong);
      onClose();
    } catch (uploadError) {
      console.error('Failed to upload cover:', uploadError);
      setError('Cover upload failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-spotify-white dark:text-light-white text-xl mb-4 font-semibold">Edit Song</h2>
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded">
            {error}
          </div>
        )}
        <label className="block mb-2 text-spotify-light dark:text-light-lighter">Title</label>
        <input
          type="text"
          className="w-full p-2 mb-4 rounded bg-spotify-light/10 dark:bg-light-light/10 text-spotify-white dark:text-light-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song Title"
        />
        <label className="block mb-2 text-spotify-light dark:text-light-lighter">Artist</label>
        <input
          type="text"
          className="w-full p-2 mb-4 rounded bg-spotify-light/10 dark:bg-light-light/10 text-spotify-white dark:text-light-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist Name"
        />
        <label className="block mb-2 text-spotify-light dark:text-light-lighter">Album</label>
        <input
          type="text"
          className="w-full p-2 mb-4 rounded bg-spotify-light/10 dark:bg-light-light/10 text-spotify-white dark:text-light-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder="Album Name (optional)"
        />
        <label className="block mb-2 text-spotify-light dark:text-light-lighter">Upload New Cover</label>
        <input
          type="file"
          accept="image/*"
          className="w-full p-2 mb-4 rounded bg-spotify-light/10 dark:bg-light-light/10 text-spotify-white dark:text-light-white focus:outline-none focus:ring-2 focus:ring-spotify-green file:bg-spotify-green file:text-spotify-black file:border-none file:px-3 file:py-1 file:rounded file:mr-3"
          onChange={handleCoverFileChange}
        />
        {coverPreview && (
          <div className="mb-6">
            <p className="text-spotify-light dark:text-light-lighter text-sm mb-2">Preview</p>
            <img src={coverPreview} alt="Cover preview" className="w-full h-48 object-cover rounded-lg border border-spotify-light/30 dark:border-light-light/30" />
          </div>
        )}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-spotify-green text-spotify-black font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:hover:bg-spotify-green"
            disabled={!title.trim() || !artist.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
