# TODO: Make songs update in realtime when liking songs

## Task: Make the liked songs list update in real-time when liking or unliking songs from any page

### Steps:
- [ ] Move likedSongs state and logic from LikedSongs.jsx to App.jsx
- [ ] Add useEffect in App.jsx to listen to favorites collection and build likedSongs array
- [ ] Update toggleFavorite in App.jsx to immediately update likedSongs state for instant UI update
- [ ] Pass likedSongs as prop to LikedSongs component
- [ ] Update LikedSongs.jsx to use passed likedSongs prop instead of local state
- [ ] Modify MusicCard.jsx to use isFavorite prop for correct menu text ("Add to Favorites" or "Remove from Favorites")
- [ ] Update LikedSongs.jsx to pass isFavorite={true} to MusicCard since all songs are liked
- [ ] Test liking/unliking songs from different pages and verify real-time updates

### Notes:
- Current implementation only updates when LikedSongs page is active; moving state to App.jsx ensures updates across the app
- Immediate state update in toggleFavorite provides instant UI feedback
- MusicCard menu text will now reflect favorite status
