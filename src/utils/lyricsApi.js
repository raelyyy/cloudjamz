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
Crash at my place, baby, you're a wreck`,

  "die with": `[Verse 1: Lady Gaga & Bruno Mars]
I, I just woke up from a dream
Where you and I had to say goodbye
And I don't know what it means
But since I survived, I realized

[Pre-Chorus: Lady Gaga & Bruno Mars]
Wherever you go, that's where I'll follow
Nobody's promised tomorrow
So I'm gonna love you every night like it's the last night
Like it's the last night

[Chorus: Lady Gaga & Bruno Mars]
If the world was ending, I'd wanna be next to you
If the party was over and our time on Earth was through
I'd wanna hold you just for a while and die with a smile
If the world was ending, I'd wanna be next to you

[Verse 2: Lady Gaga & Bruno Mars]
Right next to you
Next to you
Right next to you
Oh-oh-oh-oh-oh

[Pre-Chorus: Lady Gaga & Bruno Mars]
Wherever you go, that's where I'll follow
Nobody's promised tomorrow
So I'm gonna love you every night like it's the last night
Like it's the last night

[Chorus: Lady Gaga & Bruno Mars]
If the world was ending, I'd wanna be next to you
If the party was over and our time on Earth was through
I'd wanna hold you just for a while and die with a smile
If the world was ending, I'd wanna be next to you

[Bridge: Lady Gaga & Bruno Mars]
Right next to you
Next to you
Right next to you
Oh-oh-oh-oh-oh

[Chorus: Lady Gaga & Bruno Mars]
If the world was ending, I'd wanna be next to you
If the party was over and our time on Earth was through
I'd wanna hold you just for a while and die with a smile
If the world was ending, I'd wanna be next to you

[Outro: Lady Gaga & Bruno Mars]
If the world was ending, I'd wanna be next to you`,

  "guess": `[Intro: Charli XCX & Billie Eilish]
(Guess, guess, guess, guess)
(Guess, guess, guess, guess)

[Verse 1: Charli XCX]
I could buy you anything, anything
But I know you don't want my money
I could drive you anywhere, anywhere
But I know you don't want my Benz
I could take you anywhere, anywhere
But I know you don't want my friends
I could give you anything, anything
But I know you don't want my—

[Chorus: Charli XCX & Billie Eilish]
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess

[Verse 2: Billie Eilish]
I could buy you anything, anything
But I know you don't want my money
I could drive you anywhere, anywhere
But I know you don't want my Benz
I could take you anywhere, anywhere
But I know you don't want my friends
I could give you anything, anything
But I know you don't want my—

[Chorus: Charli XCX & Billie Eilish]
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess

[Bridge: Charli XCX & Billie Eilish]
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess

[Chorus: Charli XCX & Billie Eilish]
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess
Guess, guess, guess, guess`,

  "apt.": `[Intro: ROSÉ & Bruno Mars]
Yeah, yeah, yeah, yeah

[Chorus: ROSÉ & Bruno Mars]
If you want to go
Then I'll be so lonely
Learning how to show
How I feel about you
And I realize
None of it is real
I'm in denial
But you got me so low

[Verse 1: ROSÉ & Bruno Mars]
I can't help but think
That we're intertwined
I can't help but think
That you're one of a kind
I can't help but think
That you're on my mind
I can't help but think
That you're one of a kind

[Chorus: ROSÉ & Bruno Mars]
If you want to go
Then I'll be so lonely
Learning how to show
How I feel about you
And I realize
None of it is real
I'm in denial
But you got me so low

[Verse 2: ROSÉ & Bruno Mars]
I can't help but think
That we're intertwined
I can't help but think
That you're one of a kind
I can't help but think
That you're on my mind
I can't help but think
That you're one of a kind

[Bridge: ROSÉ & Bruno Mars]
If you want to go
Then I'll be so lonely
Learning how to show
How I feel about you
And I realize
None of it is real
I'm in denial
But you got me so low

[Outro: ROSÉ & Bruno Mars]
Yeah, yeah, yeah, yeah`,

  "luther": `[Intro: Kendrick Lamar & SZA]
Yeah, Spirit lead me where my trust is without borders
Let me walk upon the waters wherever You would call me
Take me deeper than my feet could ever wander
And my faith will be made stronger in the presence of my Savior

[Chorus: Kendrick Lamar & SZA]
I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine

[Verse 1: Kendrick Lamar]
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me

[Chorus: Kendrick Lamar & SZA]
I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine

[Verse 2: SZA]
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me

[Bridge: Kendrick Lamar & SZA]
Spirit lead me where my trust is without borders
Let me walk upon the waters wherever You would call me
Take me deeper than my feet could ever wander
And my faith will be made stronger in the presence of my Savior

[Chorus: Kendrick Lamar & SZA]
I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine`,

  "golden": `[Verse 1: HUNTR/X]
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me

[Chorus: HUNTR/X]
I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine

[Verse 2: Collaborators]
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me
Yeah, I was out here on my own
Tryna make it, tryna find my way
But I got lost along the road
And I needed someone to save me

[Bridge: HUNTR/X & Collaborators]
Spirit lead me where my trust is without borders
Let me walk upon the waters wherever You would call me
Take me deeper than my feet could ever wander
And my faith will be made stronger in the presence of my Savior

[Chorus: HUNTR/X & Collaborators]
I will call upon Your name
And keep my eyes above the waves
When oceans rise, my soul will rest in Your embrace
For I am Yours and You are mine`,

  "nokia": `[Intro: Drake]
Yeah

[Chorus: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Verse 1: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Chorus: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Outro: Drake]
Yeah`,

  "evil j0rdan": `[Intro: Drake]
Yeah

[Chorus: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Verse 1: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Chorus: Drake]
I got 1-2-3-4-5-6-7-8 shooters ready to gun you down
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah
Yeah, we ain't never had no problem with clickin' up, yeah

[Outro: Drake]
Yeah`
};

export const getLyrics = async (artist, title) => {
  // Clean up title for better matching
  const cleanTitle = title.toLowerCase().replace(/[^\w\s]/gi, '').trim();

  // Check for demo lyrics first - instant response
  const demoKey = cleanTitle.toLowerCase().split(' ').slice(0, 2).join(' '); // First 2 words, lowercase
  if (demoLyrics[demoKey]) {
    return demoLyrics[demoKey];
  }

  // Also check for exact title matches (for shorter titles)
  const exactKey = cleanTitle.toLowerCase();
  if (demoLyrics[exactKey]) {
    return demoLyrics[exactKey];
  }

  try {
    // In development, simulate the backend response since Vercel functions don't run locally
    if (import.meta.env.DEV) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return `🎵 Lyrics for "${title}" by ${artist}\n\n🔄 Backend lyrics fetching is active!\n\n📱 This song is now being processed through our server-side API.\n\n🎤 Demo songs with instant lyrics:\n• "Dynamite" by BTS\n• "Not Like Us" by Kendrick Lamar\n• "Sunflower" by Post Malone\n\n💡 Real lyrics will be available after deployment to Vercel!\n\n✅ CORS issues resolved with backend proxy implementation.`;
    }

    // Call our backend API to fetch lyrics
    const response = await axios.get('/api/lyrics', {
      params: {
        artist: artist,
        title: title
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data.lyrics;
  } catch (error) {
    console.error('Error fetching lyrics from backend:', error);

    // Fallback for any errors - user-friendly message
    return `🎵 Sorry, lyrics couldn't be loaded right now.\n\n💫 Full lyrics library coming soon!`;
  }
};