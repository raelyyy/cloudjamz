import { useEffect, useRef, useState, useMemo } from "react"; 
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { Eye, EyeOff, AudioWaveform, Sun, Moon } from "lucide-react";
import { auth } from "../firebase";
import { useTheme } from "../contexts/ThemeContext";
import LiquidEther from "../components/LiquidEther";
import guitar from "../assets/guitar.png";
import headphone from "../assets/headphone.png";
import nota from "../assets/nota.png";
import drums from "../assets/drums.png";
import note from "../assets/note.png";

export default function Auth({ onLogin }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = useMemo(() => [
    '#FFEDEE',
    '#FFF1E0',
    '#FFF5CC',
    '#FFF9B3',
    '#FFFF99'
  ], []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  // MFA state
  const [mfaResolver, setMfaResolver] = useState(null);
  const [selectedHintUid, setSelectedHintUid] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const mfaRecaptchaRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mfaRecaptchaRef.current) {
        mfaRecaptchaRef.current.clear();
        mfaRecaptchaRef.current = null;
      }
    };
  }, []);

  const beginMfaFlow = (resolver) => {
    setMfaResolver(resolver);
    setSelectedHintUid(resolver.hints[0]?.uid || "");
    setVerificationId("");
    setMfaCode("");
    setMfaMessage("");
    setMfaError("");
  };

  const resetMfaFlow = () => {
    setMfaResolver(null);
    setSelectedHintUid("");
    setVerificationId("");
    setMfaCode("");
    setMfaMessage("");
    setMfaError("");
    if (mfaRecaptchaRef.current) {
      mfaRecaptchaRef.current.clear();
      mfaRecaptchaRef.current = null;
    }
  };

  const ensureRecaptcha = async () => {
    if (!mfaRecaptchaRef.current) {
      mfaRecaptchaRef.current = new RecaptchaVerifier(auth, "auth-mfa-recaptcha", {
        size: "invisible"
      });
      await mfaRecaptchaRef.current.render();
    }
    return mfaRecaptchaRef.current;
  };

  const handleSendMfaCode = async () => {
    if (!mfaResolver) return;
    const selectedHint =
      mfaResolver.hints.find((hint) => hint.uid === selectedHintUid) || mfaResolver.hints[0];
    if (!selectedHint) {
      setMfaError("No enrolled second factors found.");
      return;
    }
    setIsSendingCode(true);
    setMfaError("");
    setMfaMessage("");
    try {
      const appVerifier = await ensureRecaptcha();
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        {
          multiFactorHint: selectedHint,
          session: mfaResolver.session
        },
        appVerifier
      );
      setVerificationId(verificationIdResult);
      setMfaMessage(`Verification code sent to ${selectedHint.phoneNumber}.`);
    } catch (err) {
      setMfaError(err.message);
      if (mfaRecaptchaRef.current) {
        mfaRecaptchaRef.current.clear();
        mfaRecaptchaRef.current = null;
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyMfaCode = async (e) => {
    e.preventDefault();
    if (!mfaResolver || !verificationId) {
      setMfaError("Please request a verification code first.");
      return;
    }
    setIsVerifyingCode(true);
    setMfaError("");
    try {
      const phoneCredential = PhoneAuthProvider.credential(verificationId, mfaCode);
      const assertion = PhoneMultiFactorGenerator.assertion(phoneCredential);
      await mfaResolver.resolveSignIn(assertion);
      resetMfaFlow();
      onLogin();
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        beginMfaFlow(resolver);
      } else {
        setError(err.message);
      }
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        beginMfaFlow(resolver);
      } else {
        setError(err.message);
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGithubLogin = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        beginMfaFlow(resolver);
      } else {
        setError(err.message);
      }
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        beginMfaFlow(resolver);
      } else {
        setError(err.message);
      }
    }
  };

  const handleTwitterLogin = async () => {
    const provider = new TwitterAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        beginMfaFlow(resolver);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Liquid background */}
      <LiquidEther
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
        colors={colors}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-full bg-spotify-dark dark:bg-light-dark hover:bg-spotify-light dark:hover:bg-light-light transition z-10"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <Sun className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" /> : <Moon className="w-6 h-6 text-spotify-lighter dark:text-light-lighter" />}
      </button>

      {/* Main Auth container */}
      <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-xl border border-gray-500/30 dark:border-gray-400/30">

        {/* LEFT PANEL: Form */}
        <div className={`flex-1 p-8 transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-full' : 'translate-x-0'}`}>
          {/* Form content (Login / SignUp / Forgot) */}
          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center justify-center mb-6">
              <AudioWaveform className="w-12 h-12 text-yellow-400 mr-3" />
            </div>
            <h1 className="text-3xl font-bold text-spotify-white dark:text-light-white text-center mb-2">
              {isForgotPassword ? "Reset Password" : isSignUp ? "Sign Up to CloudJamz" : "Login to CloudJamz"}
            </h1>
            <p className="text-spotify-lighter dark:text-light-lighter text-center mb-8">
              {isForgotPassword ? "Enter your email to receive a reset link" : "Discover. Stream. Repeat."}
            </p>

            {error && <div className={`p-3 rounded mb-4 ${error.includes('sent') ? 'bg-green-500' : 'bg-red-500'} text-white`}>{error}</div>}

            <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth}>
              {/* Forgot Password Form */}
              {isForgotPassword && (
                <>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400" required />
                  <button type="submit" className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:bg-gradient-to-l hover:from-yellow-500 hover:to-yellow-300 text-spotify-black dark:text-light-black font-semibold py-3 px-4 rounded-full transition">Send Reset Email</button>
                  <div className="text-center mt-4">
                    <button onClick={() => setIsForgotPassword(false)} className="text-yellow-600 hover:underline">Back to Login</button>
                  </div>
                </>
              )}

              {/* Login / SignUp Form */}
              {!isForgotPassword && (
                <>
                  {isSignUp && <input type="text" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mb-4 px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400" required />}
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400" required />
                  <div className="mb-4 relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 pr-10 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!isSignUp && (
                    <div className="text-right mb-4">
                      <button type="button" onClick={() => setIsForgotPassword(true)} className="text-spotify-lighter dark:text-light-lighter hover:underline text-sm">Forgot Password?</button>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:bg-gradient-to-l hover:from-yellow-500 hover:to-yellow-300 text-spotify-black dark:text-light-black font-semibold py-3 px-4 rounded-full transition">{isSignUp ? "Sign Up" : "Log In "}</button>
                </>
              )}
            </form>

            <div className="text-center text-spotify-lighter dark:text-light-lighter my-4">or</div>

            <div className="flex justify-center space-x-4 mb-4">
              <button onClick={handleGoogleLogin} className="w-12 h-12 border border-gray-400 rounded-full text-spotify-white dark:text-light-white hover:border-yellow-400 hover:text-yellow-400 hover:scale-110 transition flex items-center justify-center" title="Continue with Google">
                {/* Google icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button onClick={handleGithubLogin} className="w-12 h-12 border border-gray-400 rounded-full text-spotify-white dark:text-light-white hover:border-yellow-400 hover:text-yellow-400 hover:scale-110 transition flex items-center justify-center" title="Continue with GitHub">
                {/* GitHub icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              <button onClick={handleFacebookLogin} className="w-12 h-12 border border-gray-400 rounded-full text-spotify-white dark:text-light-white hover:border-yellow-400 hover:text-yellow-400 hover:scale-110 transition flex items-center justify-center" title="Continue with Facebook">
                {/* Facebook icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button onClick={handleTwitterLogin} className="w-12 h-12 border border-gray-400 rounded-full text-spotify-white dark:text-light-white hover:border-yellow-400 hover:text-yellow-400 hover:scale-110 transition flex items-center justify-center" title="Continue with Twitter">
                {/* Twitter icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
            </div>

  

            {/* MFA */}
            {mfaResolver && (
              <div className="mt-8 border border-yellow-400/60 rounded-lg p-4 bg-spotify-black/60 dark:bg-light-black/60">
                <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white mb-3">Two-Factor Verification</h2>
                <p className="text-spotify-lighter dark:text-light-lighter text-sm mb-4">
                  Use your trusted phone number to finish signing in.
                </p>
                {mfaResolver.hints.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-spotify-lighter dark:text-light-lighter mb-2">Phone number</label>
                    <select value={selectedHintUid} onChange={(e) => setSelectedHintUid(e.target.value)} className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white focus:outline-none focus:border-yellow-400">
                      {mfaResolver.hints.map((hint) => (
                        <option key={hint.uid} value={hint.uid}>
                          {hint.displayName || hint.phoneNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!verificationId && (
                  <button type="button" onClick={handleSendMfaCode} disabled={isSendingCode} className="w-full bg-yellow-500 hover:bg-yellow-500/80 text-spotify-white dark:text-light-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSendingCode ? "Sending code..." : "Send verification code"}
                  </button>
                )}

                {verificationId && (
                  <form onSubmit={handleVerifyMfaCode} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-spotify-lighter dark:text-light-lighter mb-2">SMS code</label>
                      <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="submit" disabled={isVerifyingCode || mfaCode.length < 6} className="flex-1 bg-yellow-500 hover:bg-yellow-500/80 text-spotify-white dark:text-light-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed">
                        {isVerifyingCode ? "Verifying..." : "Verify & Sign in"}
                      </button>
                      <button type="button" onClick={resetMfaFlow} className="px-4 py-3 border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white hover:border-spotify-white dark:hover:border-light-white transition">Cancel</button>
                    </div>
                  </form>
                )}

                {mfaMessage && <div className="mt-4 bg-green-500/20 text-green-200 p-3 rounded">{mfaMessage}</div>}
                {mfaError && <div className="mt-4 bg-red-500/20 text-red-200 p-3 rounded">{mfaError}</div>}
              </div>
            )}

            <div id="auth-mfa-recaptcha" className="hidden" />
          </div>
        </div>

        {/* RIGHT PANEL: Welcome + toggle */}
        <div className={`flex-1 p-8 py-10 flex flex-col bg-yellow-400 rounded-3xl transition-transform duration-700 ease-in-out ${isSignUp ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={headphone}
              alt="Headphone"
              className="absolute top-0 left-0 w-20 h-20 opacity-80 float-animation"
              style={{ animationDelay: '0s' }}
            />
            <img
              src={nota}
              alt="Nota"
              className="absolute top-0 right-0 w-32 h-32 float-animation"
              style={{ animationDelay: '0.5s' }}
            />
            <img
              src={drums}
              alt="Drums"
              className="absolute bottom-20 right-5 w-24 h-24 float-animation"
              style={{ animationDelay: '1s' }}
            />
            <img
              src={note}
              alt="Note"
              className="absolute bottom-20 left-5 w-14 h-14 opacity-80 float-animation"
              style={{ animationDelay: '1.5s' }}
            />
            <img
              src={guitar}
              alt="Guitar"
              className="w-62 h-62 float-animation"
              style={{ animationDelay: '2s' }}
            />
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-black dark:text-black">{isSignUp ? "Welcome Back!" : "Hey there!"}</h2>
            <p className="mb-4 text-black dark:text-black">{isSignUp ? "Ready to continue your music journey?" : "Let's get you started with amazing music!"}</p>
            <button onClick={() => setIsSignUp(!isSignUp)} className="border-2 border-black text-black font-semibold py-3 px-6 rounded-full hover:bg-black hover:text-yellow-300 transition">
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
