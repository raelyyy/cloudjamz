export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-spotify-dark dark:bg-light-dark rounded-lg p-4 animate-pulse ${className}`}>
      <div className="w-full h-48 bg-spotify-light dark:bg-light-light rounded-lg mb-4"></div>
      <div className="h-4 bg-spotify-light dark:bg-light-light rounded mb-2"></div>
      <div className="h-3 bg-spotify-light dark:bg-light-light rounded w-3/4"></div>
    </div>
  );
}