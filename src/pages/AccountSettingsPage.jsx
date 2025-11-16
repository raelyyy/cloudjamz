import { useState } from "react";
import { User, Mail, Lock, ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save account settings logic here
    console.log('Saving account settings:', formData);
    // Show success message or handle errors
  };

  return (
    <div className="min-h-screen bg-spotify-black text-spotify-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-spotify-light/20 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>

        {/* Account Settings Form */}
        <div className="bg-spotify-dark rounded-lg p-6 space-y-6">
          {/* Profile Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-spotify-green" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 bg-spotify-black border border-spotify-light rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-spotify-white"
                  placeholder="Enter your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-spotify-black border border-spotify-light rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-spotify-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-spotify-green" />
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-4 py-3 bg-spotify-black border border-spotify-light rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-spotify-white"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-4 py-3 bg-spotify-black border border-spotify-light rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-spotify-white"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 bg-spotify-black border border-spotify-light rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-spotify-white"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* My Playlists Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">My Playlists</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/playlists')}
                className="w-full p-4 bg-spotify-light/10 hover:bg-spotify-light/20 rounded-lg transition text-left"
              >
                <div className="font-medium">View All Playlists</div>
                <div className="text-sm text-spotify-lighter">Manage your created and saved playlists</div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full bg-spotify-green hover:bg-spotify-green/80 text-spotify-black font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
