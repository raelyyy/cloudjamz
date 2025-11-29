import { useState } from "react";
import { Moon, Sun, Bell, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isDarkMode, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('public');

  const handleNotificationsChange = (enabled) => {
    setNotifications(enabled);
    // Apply notifications change logic here
  };

  const handlePrivacyChange = (newPrivacy) => {
    setPrivacy(newPrivacy);
    // Apply privacy change logic here
  };

  return (
    <div className="min-h-screen bg-spotify-black dark:bg-light-black text-spotify-white dark:text-light-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-spotify-light/20 dark:hover:bg-light-light/20 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Theme Section */}
          <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-6 h-6 text-spotify-green" />
              <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white">Theme</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setTheme('light')}
                className={`w-full p-4 rounded-lg border transition flex items-center gap-3 ${
                  !isDarkMode
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-spotify-light dark:border-light-light hover:bg-spotify-light/10 dark:hover:bg-light-light/10'
                }`}
              >
                <Sun className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-spotify-white dark:text-light-white">Light Theme</div>
                  <div className="text-sm text-spotify-lighter dark:text-light-lighter">Bright and clean interface</div>
                </div>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`w-full p-4 rounded-lg border transition flex items-center gap-3 ${
                  isDarkMode
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-spotify-light dark:border-light-light hover:bg-spotify-light/10 dark:hover:bg-light-light/10'
                }`}
              >
                <Moon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-spotify-white dark:text-light-white">Dark Theme</div>
                  <div className="text-sm text-spotify-lighter dark:text-light-lighter">Easy on the eyes</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-spotify-green" />
              <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-spotify-white dark:text-light-white">Push Notifications</div>
                  <div className="text-sm text-spotify-lighter dark:text-light-lighter">Receive notifications about new releases</div>
                </div>
                <button
                  onClick={() => handleNotificationsChange(!notifications)}
                  className={`w-12 h-6 rounded-full transition relative ${
                    notifications ? 'bg-spotify-green' : 'bg-spotify-light dark:bg-light-light'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-spotify-black dark:bg-light-black rounded-full transition absolute top-0.5 ${
                      notifications ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-spotify-dark dark:bg-light-dark rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-spotify-green" />
              <h2 className="text-xl font-semibold text-spotify-white dark:text-light-white">Privacy</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handlePrivacyChange('public')}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  privacy === 'public'
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-spotify-light dark:border-light-light hover:bg-spotify-light/10 dark:hover:bg-light-light/10'
                }`}
              >
                <div className="font-medium text-spotify-white dark:text-light-white">Public Profile</div>
                <div className="text-sm text-spotify-lighter dark:text-light-lighter">Anyone can see your playlists and activity</div>
              </button>
              <button
                onClick={() => handlePrivacyChange('private')}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  privacy === 'private'
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-spotify-light dark:border-light-light hover:bg-spotify-light/10 dark:hover:bg-light-light/10'
                }`}
              >
                <div className="font-medium text-spotify-white dark:text-light-white">Private Profile</div>
                <div className="text-sm text-spotify-lighter dark:text-light-lighter">Only you can see your playlists and activity</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
