// BROWSER CONSOLE SCRIPT - Copy and paste this into your browser console while logged into CloudJamz
// This will clear the old "Evil J0rdan" data from recently played

/*
Copy this entire script and paste it into your browser's developer console:

```javascript
// Import Firebase modules (already loaded by the app)
const { db } = window; // Access the db from the app
const { collection, query, where, getDocs, deleteDoc } = window;

// Function to clear recently played data
async function clearRecentlyPlayed() {
  try {
    console.log('🔄 Clearing recently played data for song ID: 11b...');

    // Get current user
    const user = window.auth?.currentUser;
    if (!user) {
      console.log('❌ Please log in first');
      return;
    }

    // Query for the specific song in recently played
    const q = query(
      collection(db, "recentlyPlayed"),
      where("userId", "==", user.uid),
      where("songId", "==", "11b")
    );

    const snapshot = await getDocs(q);

    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deletedCount++;
      console.log(`🗑️ Deleted recently played entry: ${doc.id}`);
    }

    console.log(`✅ Successfully cleared ${deletedCount} recently played entries for "Evil J0rdan".`);
    console.log('🔄 Refresh the page to see the updated recently played list.');

  } catch (error) {
    console.error('❌ Error clearing recently played data:', error);
  }
}

// Run the cleanup
clearRecentlyPlayed();
```
*/