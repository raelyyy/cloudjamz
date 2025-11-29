export default function PlayingAnimationOverlay({ isPlaying }) {
  if (!isPlaying) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
      <div className="loading">
        <div className="load"></div>
        <div className="load"></div>
        <div className="load"></div>
        <div className="load"></div>
      </div>
    </div>
  );
}