import { useState, useRef, useEffect } from 'react';
import { BotMessageSquare, Mic, MicOff, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import OpenAI from 'openai';
import { searchItunes } from '../utils/itunesApi';

const openai = import.meta.env.VITE_OPENAI_API_KEY ? new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;


const Chatbot = ({
  isOpen,
  onClose,
  onPlaySong,
  currentSong,
  onTogglePlayPause,
  onNext,
  onPrev,
  onShuffleToggle,
  shuffle,
  onLoopToggle,
  loop,
  onSearchResult
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your music assistant. I can help you play songs, control playback, and more. Try saying 'play Bohemian Rhapsody' or 'pause the music'!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processCommand = async (command) => {
    const lowerCommand = command.toLowerCase();

    // Basic playback controls
    if (lowerCommand.includes('play') && !lowerCommand.includes('play ') && currentSong) {
      onTogglePlayPause();
      return "Playing music!";
    }

    if (lowerCommand.includes('pause') || lowerCommand.includes('stop')) {
      onTogglePlayPause();
      return "Paused!";
    }

    if (lowerCommand.includes('next') || lowerCommand.includes('skip')) {
      const success = await onNext();
      return success ? "Playing next song!" : "No more songs in queue.";
    }

    if (lowerCommand.includes('previous') || lowerCommand.includes('prev')) {
      onPrev();
      return "Playing previous song!";
    }

    if (lowerCommand.includes('shuffle')) {
      onShuffleToggle();
      return `Shuffle ${shuffle ? 'disabled' : 'enabled'}!`;
    }

    if (lowerCommand.includes('repeat') || lowerCommand.includes('loop')) {
      const nextMode = loop === 'off' ? 'all' : loop === 'all' ? 'one' : 'off';
      onLoopToggle(nextMode);
      return `Loop mode set to ${nextMode === 'off' ? 'off' : nextMode === 'all' ? 'all songs' : 'one song'}!`;
    }

    // Song search and auto-play first result
    if (lowerCommand.startsWith('play ')) {
      const songQuery = command.replace(/^play\s+/i, '');
      setIsLoading(true);

      try {
        // First try to find a track with preview URL to play immediately
        const trackResults = await searchItunes(songQuery);

        if (trackResults && trackResults.length > 0) {
          const firstTrack = trackResults[0];

          // If the first result has a preview URL, play it automatically
          if (firstTrack.url) {
            const songData = {
              id: firstTrack.id,
              title: firstTrack.title,
              artist: firstTrack.artist,
              album: firstTrack.album,
              cover: firstTrack.cover,
              url: firstTrack.url,
              duration: 30,
              userId: null,
              isItunesTrack: true
            };

            // Play just the single song
            if (onPlaySong) {
              onPlaySong(songData);
            }

            // Show all search results as options
            const allResults = [...trackResults.slice(1, 4)]; // Skip the first one since we're playing it

            // Add artist and album results
            const artistResults = await searchItunes(songQuery, 'musicArtist');
            const albumResults = await searchItunes(songQuery, 'album');

            if (artistResults && artistResults.length > 0) {
              allResults.push(...artistResults.slice(0, 2));
            }
            if (albumResults && albumResults.length > 0) {
              allResults.push(...albumResults.slice(0, 2));
            }

            if (allResults.length > 0) {
              return {
                text: `🎵 Playing "${firstTrack.title}" by ${firstTrack.artist}! Here are more results:`,
                searchResults: allResults
              };
            } else {
              return `🎵 Playing "${firstTrack.title}" by ${firstTrack.artist}!`;
            }
          }
        }

        // If no tracks with previews, show search results like before
        const artistResults = await searchItunes(songQuery, 'musicArtist');
        const albumResults = await searchItunes(songQuery, 'album');
        const results = [];

        if (artistResults && artistResults.length > 0) {
          results.push(...artistResults.slice(0, 2));
        }
        if (albumResults && albumResults.length > 0) {
          results.push(...albumResults.slice(0, 2));
        }

        if (results.length > 0) {
          return {
            text: `I found some results for "${songQuery}", but no playable tracks. Here are the options:`,
            searchResults: results
          };
        } else {
          return `I couldn't find any playable results for "${songQuery}". Try a different search term!`;
        }
      } catch (error) {
        console.error('Error searching for song:', error);
        return "Sorry, I had trouble searching. Please try again.";
      } finally {
        setIsLoading(false);
      }
    }

    // Current song info
    if (lowerCommand.includes('what') && lowerCommand.includes('playing')) {
      if (currentSong) {
        return `Currently playing "${currentSong.title}" by ${currentSong.artist}.`;
      } else {
        return "No song is currently playing.";
      }
    }

    // Use OpenAI for other queries if available
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful music assistant for CloudJamz, a music streaming app. You can control music playback and help users discover music. Available commands include:
              - Play [song name] - Search and play a song
              - Play/Pause/Stop - Control playback
              - Next/Previous - Skip tracks
              - Shuffle on/off - Toggle shuffle
              - Repeat/Loop - Toggle repeat modes
              - What's playing? - Current song info

              Keep responses concise and friendly. If the user asks something unrelated to music, politely redirect to music-related topics.`
            },
            {
              role: "user",
              content: command
            }
          ],
          max_tokens: 150
        });

        return completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error);
        return "Sorry, I'm having trouble processing your request right now. Please try again.";
      }
    } else {
      // Fallback responses when OpenAI is not available
      const lowerCommand = command.toLowerCase();
      if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        return "Hello! I'm your music assistant. Try commands like 'play Bohemian Rhapsody' or 'pause the music'!";
      } else if (lowerCommand.includes('help')) {
        return "I can help you control music playback. Try: 'play [song name]', 'pause', 'next', 'previous', 'shuffle', or 'what's playing?'";
      } else {
        return "I'm here to help with music! Try asking me to play a song or control playback.";
      }
    }
  };

  const handleSearchResultClick = (result) => {
    if (onSearchResult) {
      onSearchResult(result);
    }
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await processCommand(message);
      const botMessage = {
        id: Date.now() + 1,
        text: typeof response === 'string' ? response : response.text,
        sender: 'bot',
        timestamp: new Date(),
        searchResults: typeof response === 'object' ? response.searchResults : null
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-[95px] right-10 z-50 ${isMinimized ? 'w-80 h-14' : 'w-80 h-96'} bg-spotify-dark dark:bg-light-dark rounded-lg shadow-xl border border-spotify-light dark:border-light-light flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 
        border-b border-spotify-light dark:border-light-light
        bg-gradient-to-r from-yellow-300 to-yellow-500 
        dark:from-yellow-400 dark:to-yellow-600 
        rounded-t-lg"
      >
        {/* Left side */}
        <div className="flex items-center gap-2">
          <BotMessageSquare className="w-5 h-5 text-black dark:text-white" />
          <span className="text-black dark:text-white font-semibold">
            Music Assistant
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-black dark:text-light-lighter 
                      hover:text-gray-900 dark:hover:text-white transition"
          >
            {isMinimized 
              ? <Maximize2 className="w-4 h-4" /> 
              : <Minimize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-black dark:text-light-lighter 
                      hover:text-gray-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[80%]">
                  <div
                    className={`p-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#F7E35A] to-[#DAA520] text-black'
                        : 'bg-spotify-black dark:bg-light-black text-spotify-white dark:text-light-white'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.searchResults && message.searchResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id || result.title}-${index}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full p-2 bg-spotify-dark dark:bg-light-dark border border-spotify-light dark:border-light-light rounded text-left hover:bg-spotify-light/20 dark:hover:bg-light-light/20 transition flex items-center gap-2"
                        >
                          {result.cover && (
                            <img
                              src={result.cover}
                              alt={result.title}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-spotify-white dark:text-light-white font-medium truncate text-sm">{result.title}</div>
                            <div className="text-spotify-lighter dark:text-light-lighter text-xs truncate">
                              {result.type === 'track' && `${result.artist} • ${result.album}`}
                              {result.type === 'artist' && 'Artist'}
                              {result.type === 'album' && `${result.artist} • Album`}
                            </div>
                          </div>
                          <div className="text-spotify-lighter dark:text-light-lighter text-xs capitalize flex-shrink-0">{result.type}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-spotify-black dark:bg-light-black text-spotify-white dark:text-light-white p-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-spotify-light dark:border-light-light">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message or voice command..."
                className="flex-1 px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                disabled={isLoading}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded transition ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-spotify-light dark:bg-light-light text-spotify-white dark:text-light-white hover:bg-yellow-400 hover:text-black'
                }`}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-[#F7E35A] to-[#DAA520] text-black rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;