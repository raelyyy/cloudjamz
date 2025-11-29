import { useTheme } from "../contexts/ThemeContext";
import './LoadingModal.css';

export default function LoadingModal({ isOpen, message = "Loading..." }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-spotify-dark dark:bg-light-dark p-8 rounded-lg shadow-lg max-w-sm mx-4 border border-spotify-light/20 dark:border-light-light/20">
        <div className="flex flex-col items-center">
          <div className="loader mb-4" style={{ color: isDarkMode ? '#DAA520' : '#F7E35A' }}>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
                <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
                <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
              </svg>
            </span>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
                <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
                <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
              </svg>
            </span>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0" y="0" viewBox="0 0 100 100">
                <ellipse transform="rotate(-21.283 49.994 75.642)" cx="50" cy="75.651" rx="19.347" ry="16.432" fill="currentColor"></ellipse>
                <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z"></path>
              </svg>
            </span>
          </div>
          <p className="text-spotify-white dark:text-light-white text-center font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}