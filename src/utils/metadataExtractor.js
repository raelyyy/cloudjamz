import { parseBlob } from 'music-metadata';

export const extractMetadata = async (file) => {
  try {
    const metadata = await parseBlob(file);
    let cover = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const blob = new Blob([picture.data], { type: picture.format });
      cover = URL.createObjectURL(blob);
    }
    return {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
      artist: metadata.common.artist || "Unknown Artist",
      album: metadata.common.album || "Unknown Album",
      year: metadata.common.year || null,
      genre: metadata.common.genre?.[0] || null,
      duration: metadata.format.duration || 0,
      cover: cover,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      album: "Unknown Album",
      year: null,
      genre: null,
      duration: 0,
      cover: null,
    };
  }
};
