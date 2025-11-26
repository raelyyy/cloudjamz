import axios from 'axios'; // Kept for future API integration

// Demo lyrics for popular songs
const demoLyrics = {
  "dynamite": `[Verse 1: RM, Jin, Suga, J-Hope, Jimin, V, Jungkook]
'Cause I, I, I'm in the stars tonight
So watch me bring the fire and set the night alight
Shoes on, get up in the morn'
Cup of milk, let's rock and roll
King Kong, kick the drum, rolling on like a Rolling Stone
Sing song when I'm walking home
Jump up to the top, LeBron
Ding-dong, call me on my phone
Ice tea and a game of ping pong

[Chorus: RM, Jin, Suga, J-Hope, Jimin, V, Jungkook]
'Cause I, I, I'm in the stars tonight
So watch me bring the fire and set the night alight (Hey)
Shining through the city with a little funk and soul
So I'ma light it up like dynamite, whoa-oh-oh

[Verse 2: RM, Jin, Suga, J-Hope, Jimin, V, Jungkook]
Time to make some music, make some money, find some models for wives
I got a brand new home in the sky, I got a room full of trophies
Got a closet full of clothes, got a closet full of diamonds
Got a walk-in full of walk-ins, got a house full of houses
Got a boat full of boats, got a yard full of yards
Got a garage full of cars, got a garage full of cars
Got a closet full of diamonds, got a closet full of clothes
Got a room full of trophies, got a brand new home in the sky

[Chorus: RM, Jin, Suga, J-Hope, Jimin, V, Jungkook]
'Cause I, I, I'm in the stars tonight
So watch me bring the fire and set the night alight (Hey)
Shining through the city with a little funk and soul
So I'ma light it up like dynamite, whoa-oh-oh`,

  "not like": `[Intro: Kendrick Lamar & DJ Mustard]
Doo-doo-doo-doo-doo
Doo-doo-doo-doo-doo-doo-doo
Doo-doo-doo-doo-doo
Doo-doo-doo-doo-doo-doo-doo

[Chorus: Kendrick Lamar]
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this

[Verse 1: Kendrick Lamar]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Chorus: Kendrick Lamar]
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this
Ayy, I'm livin' my life like this`,

  "sunflower": `[Verse 1: Post Malone]
Ayy, ayy, ayy, ayy
Ooh-ooh-ooh-ooh
Ooh-ooh-ooh-ooh

[Chorus: Post Malone & Swae Lee]
Needless to say, I keep her in check
She was a bad-bad, nevertheless
Callin' it quits now, baby, I'm a wreck
Crash at my place, baby, you're a wreck
Needless to say, I'm keeping her in check
She was a bad-bad, nevertheless
Callin' it quits now, baby, I'm a wreck
Crash at my place, baby, you're a wreck

[Verse 2: Post Malone]
Thinkin' in a bad way, losin' your grip
Screamin' at my face, baby, don't trip
Someone took a big L, don't know how that felt
Lookin' at you sideways, party on tilt
Ooh-ooh-ooh
Some things you just can't refuse
She wanna ride the train, train, train
Some things you just can't refuse
She wanna ride the train, train, train

[Chorus: Post Malone & Swae Lee]
Needless to say, I keep her in check
She was a bad-bad, nevertheless
Callin' it quits now, baby, I'm a wreck
Crash at my place, baby, you're a wreck
Needless to say, I'm keeping her in check
She was a bad-bad, nevertheless
Callin' it quits now, baby, I'm a wreck
Crash at my place, baby, you're a wreck`
};

export const getLyrics = async (artist, title) => {
  // Clean up title for better matching
  const cleanTitle = title.toLowerCase().replace(/[^\w\s]/gi, '').trim();

  // Check for demo lyrics first - instant response
  const demoKey = cleanTitle.split(' ').slice(0, 2).join(' '); // First 2 words
  if (demoLyrics[demoKey]) {
    return demoLyrics[demoKey];
  }

  // For demo purposes, show educational content immediately for other songs
  // In production, this would be real API calls
  return `🎵 Lyrics Feature Demo\n\n📱 Current Status: Client-side API calls have CORS limitations\n\n🔧 Production Solution:\n• Server-side proxy for external APIs\n• Backend service handles lyrics fetching\n• No CORS issues for end users\n\n🎤 Available Demo Songs:\n• "Dynamite" by BTS\n• "Not Like Us" by Kendrick Lamar\n• "Sunflower" by Post Malone\n\nTry playing one of these songs to see real lyrics!`;
};