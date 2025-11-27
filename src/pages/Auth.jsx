import { useEffect, useRef, useState, useMemo } from "react";
import {
  GoogleAuthProvider,
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
import { Eye, EyeOff, Music } from "lucide-react";
import { auth } from "../firebase";
import LiquidEther from "../components/LiquidEther";

export default function Auth({ onLogin }) {
  const colors = useMemo(() => [
    '#FFEDEE', // very light red
    '#FFF1E0', // pale orange
    '#FFF5CC', // soft yellow-orange
    '#FFF9B3', // light golden yellow
    '#FFFF99'  // creamy yellow
  ], []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: 'relative' }}>
      <LiquidEther
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1
        }}
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
      <div
        className="bg-spotify-black/80 dark:bg-light-dark/80 backdrop-blur-lg rounded-lg p-8 w-full max-w-md shadow-xl border border-gray-500/30 dark:border-gray-400/30"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-center justify-center mb-6">
          <Music className="w-12 h-12 text-yellow-400 mr-3" />
        </div>
        <h1 className="text-3xl font-bold text-spotify-white dark:text-light-white text-center mb-2">
          {isForgotPassword ? "Reset Password" : isSignUp ? "Sign Up to CloudJamz" : "Login to CloudJamz"}
        </h1>
        <p className="text-spotify-lighter dark:text-light-lighter text-center mb-8">
          {isForgotPassword ? "Enter your email to receive a reset link" : "Discover. Stream. Repeat."}
        </p>

        {error && <div className={`p-3 rounded mb-4 ${error.includes('sent') ? 'bg-green-500' : 'bg-red-500'} text-white`}>{error}</div>}

        <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth}>
          {isForgotPassword ? (
            <>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:bg-gradient-to-l hover:from-yellow-500 hover:to-yellow-300 text-spotify-white dark:text-light-black font-semibold py-3 px-4 rounded transition"
              >
                Send Reset Email
              </button>
              <div className="text-center mt-4">
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="text-yellow-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {isSignUp && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>
              <div className="mb-4 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-spotify-lighter dark:text-light-lighter hover:text-spotify-white dark:hover:text-light-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isSignUp && (
                <div className="text-right mb-4">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-spotify-lighter dark:text-light-lighter hover:underline text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
              <button type="submit" className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:bg-gradient-to-l hover:from-yellow-500 hover:to-yellow-300 text-spotify-black dark:text-light-black font-semibold py-3 px-4 rounded transition" 
              > {isSignUp ? "Sign Up to CloudJamz" : "Login to CloudJamz"} </button>

            </>
          )}
        </form>

        <div className="text-center text-spotify-lighter dark:text-light-lighter my-4">or</div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full px-5 py-3 border border-gray-400 rounded text-spotify-white dark:text-light-white hover:border-gray-500 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsForgotPassword(false);
            }}
            className="text-yellow-600 hover:underline"
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>

        {mfaResolver && (
          <div className="mt-8 border border-yellow-400/60 rounded-lg p-4 bg-spotify-black/60 dark:bg-light-black/60">
            <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white mb-3">Two-Factor Verification</h2>
            <p className="text-spotify-lighter dark:text-light-lighter text-sm mb-4">
              Use your trusted phone number to finish signing in.
            </p>
            {mfaResolver.hints.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-spotify-lighter dark:text-light-lighter mb-2">
                  Phone number
                </label>
                <select
                  value={selectedHintUid}
                  onChange={(e) => setSelectedHintUid(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white focus:outline-none focus:border-yellow-400"
                >
                  {mfaResolver.hints.map((hint) => (
                    <option key={hint.uid} value={hint.uid}>
                      {hint.displayName || hint.phoneNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!verificationId && (
              <button
                type="button"
                onClick={handleSendMfaCode}
                disabled={isSendingCode}
                className="w-full bg-yellow-500 hover:bg-yellow-500/80 text-spotify-white dark:text-light-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingCode ? "Sending code..." : "Send verification code"}
              </button>
            )}

            {verificationId && (
              <form onSubmit={handleVerifyMfaCode} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-spotify-lighter dark:text-light-lighter mb-2">
                    SMS code
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white placeholder-spotify-lighter dark:placeholder-light-lighter focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isVerifyingCode || mfaCode.length < 6}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-500/80 text-spotify-white dark:text-light-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify & Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={resetMfaFlow}
                    className="px-4 py-3 border border-spotify-light dark:border-light-light rounded text-spotify-white dark:text-light-white hover:border-spotify-white dark:hover:border-light-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {mfaMessage && (
              <div className="mt-4 bg-green-500/20 text-green-200 p-3 rounded">{mfaMessage}</div>
            )}
            {mfaError && (
              <div className="mt-4 bg-red-500/20 text-red-200 p-3 rounded">{mfaError}</div>
            )}
          </div>
        )}

        <div id="auth-mfa-recaptcha" className="hidden" />
      </div>
    </div>
  );
}
