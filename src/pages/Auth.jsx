import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Music } from "lucide-react";

export default function Auth({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error) {
      setError(error.message);
    }
  };





  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center p-4">
      <div className="bg-spotify-dark rounded-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Music className="w-12 h-12 text-spotify-green mr-3" />
          
        </div>
        <h1 className="text-3xl font-bold text-spotify-white text-center mb-2">
          {isSignUp ? "Sign Up to CloudJamz" : "Login to CloudJamz"}
        </h1>

        {/* Subtext */}
        <p className="text-spotify-lighter text-center mb-8">Discover. Stream. Repeat.</p>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-spotify-green hover:bg-spotify-green/80 text-spotify-black font-semibold py-3 px-4 rounded transition"
          >
            {isSignUp ? "Sign Up to CloudJamz" : "Login to CloudJamz"}
          </button>

        </form>

        <div className="text-center text-spotify-lighter my-4">or</div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>


        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-spotify-green hover:underline"
          >
            {isSignUp
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </button>

        </div>
      </div>
    </div>
  );
}
