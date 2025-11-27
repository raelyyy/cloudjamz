import { useEffect, useRef, useState } from "react";
import { User, Lock, ArrowLeft, Save, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  EmailAuthProvider,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  multiFactor,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile
} from "firebase/auth";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mfaFactors, setMfaFactors] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLabel, setPhoneLabel] = useState('Personal phone');
  const [smsCode, setSmsCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaProcessing, setMfaProcessing] = useState(false);
  const [disablingUid, setDisablingUid] = useState('');
  const mfaRecaptchaRef = useRef(null);

  const refreshMfaFactors = async (currentUser = auth.currentUser) => {
    if (!currentUser) return;
    await currentUser.reload();
    const factors = multiFactor(currentUser).enrolledFactors || [];
    setMfaFactors(factors);
  };

  const ensureRecaptcha = async () => {
    if (!mfaRecaptchaRef.current) {
      mfaRecaptchaRef.current = new RecaptchaVerifier(auth, "settings-mfa-recaptcha", {
        size: "invisible"
      });
      await mfaRecaptchaRef.current.render();
    }
    return mfaRecaptchaRef.current;
  };

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setFormData(prev => ({
          ...prev,
          displayName: user.displayName || '',
          email: user.email || ''
        }));
        await refreshMfaFactors(user);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    return () => {
      if (mfaRecaptchaRef.current) {
        mfaRecaptchaRef.current.clear();
        mfaRecaptchaRef.current = null;
      }
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendEnrollmentCode = async () => {
    setMfaProcessing(true);
    setMfaError('');
    setMfaMessage('');
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      if (!phoneNumber) {
        throw new Error('Enter a phone number to continue');
      }
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Use international format (e.g. +15555555555)');
      }
      const session = await multiFactor(user).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const appVerifier = await ensureRecaptcha();
      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber, session },
        appVerifier
      );
      setVerificationId(verificationIdResult);
      setSmsCode('');
      setMfaMessage(`Verification code sent to ${phoneNumber}.`);
    } catch (error) {
      setMfaError(error.message);
      if (mfaRecaptchaRef.current) {
        mfaRecaptchaRef.current.clear();
        mfaRecaptchaRef.current = null;
      }
    } finally {
      setMfaProcessing(false);
    }
  };

  const completeEnrollment = async () => {
    if (!verificationId || smsCode.length < 6) {
      setMfaError('Enter the 6-digit code from your SMS.');
      return;
    }
    setMfaProcessing(true);
    setMfaError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      const phoneCredential = PhoneAuthProvider.credential(verificationId, smsCode);
      const assertion = PhoneMultiFactorGenerator.assertion(phoneCredential);
      await multiFactor(user).enroll(assertion, phoneLabel.trim() || 'Trusted phone');
      setMfaMessage('Two-factor authentication enabled.');
      setVerificationId('');
      setSmsCode('');
      setPhoneNumber('');
      await refreshMfaFactors(user);
    } catch (error) {
      setMfaError(error.message);
    } finally {
      setMfaProcessing(false);
    }
  };

  const cancelEnrollment = () => {
    setVerificationId('');
    setSmsCode('');
    setMfaMessage('');
    setMfaError('');
    if (mfaRecaptchaRef.current) {
      mfaRecaptchaRef.current.clear();
      mfaRecaptchaRef.current = null;
    }
  };

  const disableFactor = async (factorUid) => {
    setDisablingUid(factorUid);
    setMfaError('');
    setMfaMessage('');
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      await multiFactor(user).unenroll(factorUid);
      await refreshMfaFactors(user);
      setMfaMessage('Two-factor authentication disabled.');
    } catch (error) {
      setMfaError(error.message);
    } finally {
      setDisablingUid('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update display name
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: formData.displayName
        });
      }

      // Update email (requires reauthentication for security)
      if (formData.email !== user.email) {
        // For email changes, we need to reauthenticate
        if (formData.currentPassword) {
          const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, formData.email);
        } else {
          throw new Error('Current password required to change email');
        }
      }

      // Update password
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (!formData.currentPassword) {
          throw new Error('Current password required to change password');
        }
        const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, formData.newPassword);
      }

      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-spotify-black dark:bg-light-black text-spotify-white dark:text-light-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto pb-36">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>

        {/* Account Settings Form */}
        <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-yellow-400" />
                  Profile Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  Change Password
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Current Password</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-3 rounded ${message.includes('successfully') ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {message}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 hover:bg-yellow-500/80 disabled:opacity-50 disabled:cursor-not-allowed text-spotify-black font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6 w-full mt-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-semibold text-spotify-white dark:text-light-white">Two-Factor Authentication</h2>
          </div>
          <p className="text-spotify-lighter dark:text-light-lighter text-sm mb-6 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Add a phone-based second factor to block unauthorized access.
          </p>

          {mfaFactors.length > 0 ? (
            <div className="space-y-3 mb-6">
              {mfaFactors.map((factor) => (
                <div
                  key={factor.uid}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border border-spotify-light dark:border-light-light rounded-lg p-4"
                >
                  <div>
                    <p className="font-semibold text-spotify-white dark:text-light-white">{factor.displayName || 'Trusted phone'}</p>
                    <p className="text-sm text-spotify-lighter dark:text-light-lighter">{factor.phoneNumber}</p>
                  </div>
                  <button
                    onClick={() => disableFactor(factor.uid)}
                    disabled={disablingUid === factor.uid}
                    className="px-4 py-2 border border-red-500 text-red-400 rounded hover:bg-red-500/10 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ShieldOff className="w-4 h-4" />
                    {disablingUid === factor.uid ? 'Removing...' : 'Disable'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-spotify-lighter dark:text-light-lighter mb-6">
              You have not enabled two-factor authentication yet.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Phone number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+15555555555"
                className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">Label (optional)</label>
              <input
                type="text"
                value={phoneLabel}
                onChange={(e) => setPhoneLabel(e.target.value)}
                placeholder="Personal phone"
                className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-spotify-white dark:text-light-white">SMS code</label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={!verificationId}
                className="w-full px-4 py-3 bg-spotify-black dark:bg-light-black border border-spotify-light dark:border-light-light rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-spotify-white dark:text-light-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start mt-6">
            <button
              onClick={sendEnrollmentCode}
              disabled={mfaProcessing || !phoneNumber}
              className="px-5 py-3 bg-gradient-to-r from-yellow-300 to-yellow-500 text-spotify-black rounded-lg font-semibold hover:bg-yellow-500/80 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mfaProcessing && !verificationId ? 'Sending...' : 'Send verification code'}
            </button>
            <button
              onClick={completeEnrollment}
              disabled={mfaProcessing || !verificationId || smsCode.length < 6}
              className="px-5 py-3 border border-yellow-400 text-yellow-400 rounded-lg font-semibold hover:bg-yellow-500/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mfaProcessing && verificationId ? 'Verifying...' : 'Verify & enable'}
            </button>
            {verificationId && (
              <button
                onClick={cancelEnrollment}
                className="px-5 py-3 border border-spotify-light dark:border-light-light rounded-lg text-spotify-white dark:text-light-white hover:border-spotify-white dark:hover:border-light-white transition"
              >
                Cancel
              </button>
            )}
          </div>

          {mfaError && (
            <div className="mt-4 bg-red-500/20 text-red-200 p-3 rounded">{mfaError}</div>
          )}
          {mfaMessage && (
            <div className="mt-4 bg-green-500/20 text-green-200 p-3 rounded">{mfaMessage}</div>
          )}
        </div>

        <div id="settings-mfa-recaptcha" className="hidden" />
      </div>
    </div>
  );
}
