export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: 'Artist and title parameters are required' });
  }

  try {
    // Clean up the artist and title for better API matching
    const cleanArtist = artist.trim();
    const cleanTitle = title.trim();

    // Try multiple lyrics APIs for better coverage

    // First try lyrics.ovh
    try {
      const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`, {
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics && data.lyrics.trim()) {
          return res.status(200).json({ lyrics: data.lyrics });
        }
      }
    } catch {
      console.log('Lyrics.ovh failed or no lyrics found, trying alternatives...');
    }

    // Try alternative: AZLyrics API (more comprehensive but requires scraping)
    try {
      // Clean artist and title for URL formatting
      const urlArtist = cleanArtist.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1) + '/' +
                       cleanArtist.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '').substring(0, 24);
      const urlTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');

      const azResponse = await fetch(`https://www.azlyrics.com/lyrics/${urlArtist}/${urlTitle}.html`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (azResponse.ok) {
        const html = await azResponse.text();

        // Extract lyrics from AZLyrics HTML
        const lyricsMatch = html.match(/<!-- Usage of azlyrics\.com content by any third-party lyrics provider is prohibited by our licensing agreement\. Sorry about that\. -->([\s\S]*?)<!-- MxM banner -->/);

        if (lyricsMatch && lyricsMatch[1]) {
          let lyrics = lyricsMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/"/g, '"')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .trim();

          if (lyrics && lyrics.length > 50) { // Ensure we have substantial lyrics
            return res.status(200).json({ lyrics: lyrics });
          }
        }
      }
    } catch {
      console.log('AZLyrics failed, trying another alternative...');
    }

    // Try another API: Genius API (requires token but has good coverage)
    try {
      // Note: This would require a Genius API token
      // For now, we'll skip this and provide a helpful message
      console.log('Genius API would be tried here with proper token...');
    } catch {
      console.log('Genius API failed...');
    }

    // If no lyrics found from any API, return a helpful message
    const noLyricsMessage = `🎵 Lyrics for "${cleanTitle}" by ${cleanArtist}\n\n❌ Lyrics not found in our database\n\n🔍 We searched multiple lyrics providers but couldn't find lyrics for this song.\n\n💡 This could be because:\n• The song is very new\n• It's an instrumental track\n• The lyrics aren't publicly available\n• There might be a typo in the song/artist name\n\n🎤 Demo songs with instant lyrics:\n• "Dynamite" by BTS\n• "Not Like Us" by Kendrick Lamar\n• "Sunflower" by Post Malone\n\n📝 You can help by contributing lyrics to lyrics databases!`;

    res.status(200).json({ lyrics: noLyricsMessage });

  } catch (error) {
    console.error('Error fetching lyrics:', error);

    // Return a user-friendly error message
    const errorMessage = `🎵 Lyrics Unavailable\n\n⚠️ We're having trouble fetching lyrics right now.\n\n🔄 Please try again in a moment.\n\n🎤 Demo songs with instant lyrics:\n• "Dynamite" by BTS\n• "Not Like Us" by Kendrick Lamar\n• "Sunflower" by Post Malone`;

    res.status(200).json({ lyrics: errorMessage });
  }
}