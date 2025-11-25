import { useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      mfaRecaptchaRef.current = new RecaptchaVerifier(auth, "login-mfa-recaptcha", {
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
        await createUserWithEmailAndPassword(auth, email, password);
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

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center p-4">
      <div className="bg-spotify-dark rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-spotify-white text-center mb-8">
          {isSignUp ? "Sign Up" : "Login"} to CloudJamz
        </h1>

        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}

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

        {mfaResolver && (
          <div className="mt-8 border border-spotify-green/60 rounded-lg p-4 bg-spotify-black/60">
            <h2 className="text-xl font-semibold text-white mb-3">Two-Factor Verification</h2>
            <p className="text-spotify-lighter text-sm mb-4">
              Use your trusted phone number to finish signing in.
            </p>
            {mfaResolver.hints.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-spotify-lighter mb-2">
                  Phone number
                </label>
                <select
                  value={selectedHintUid}
                  onChange={(e) => setSelectedHintUid(e.target.value)}
                  className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white focus:outline-none focus:border-spotify-green"
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
                className="w-full bg-spotify-green hover:bg-spotify-green/80 text-spotify-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingCode ? "Sending code..." : "Send verification code"}
              </button>
            )}

            {verificationId && (
              <form onSubmit={handleVerifyMfaCode} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-spotify-lighter mb-2">
                    SMS code
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-spotify-black border border-spotify-light rounded text-spotify-white placeholder-spotify-lighter focus:outline-none focus:border-spotify-green"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isVerifyingCode || mfaCode.length < 6}
                    className="flex-1 bg-spotify-green hover:bg-spotify-green/80 text-spotify-black font-semibold py-3 px-4 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify & Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={resetMfaFlow}
                    className="px-4 py-3 border border-spotify-light rounded text-white hover:border-spotify-white transition"
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

        <div id="login-mfa-recaptcha" className="hidden" />
      </div>
    </div>
  );
}
