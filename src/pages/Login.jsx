import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onLogin }) {
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
        <h1 className="text-3xl font-bold text-spotify-white text-center mb-8">
          {isSignUp ? "Sign Up" : "Login"} to CloudJamz
        </h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-spotify-green hover:bg-spotify-green/80 text-spotify-black font-semibold py-3 px-4 rounded mb-4 transition"
        >
          Continue with Google
        </button>

        <div className="text-center text-spotify-lighter mb-4">or</div>

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
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-spotify-green hover:underline"
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
