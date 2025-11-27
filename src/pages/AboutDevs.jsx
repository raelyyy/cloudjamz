import Lanyard from '../components/Lanyard';
import raely from '../assets/raely.png';
import jomari from '../assets/jomari.jpg';
import pearly from '../assets/pearly.jpg';
import jelina from '../assets/jelina.jpg';
import { useTheme } from '../contexts/ThemeContext';

export default function AboutDevs() {
  const { isDarkMode } = useTheme();

  // Array of developer images
  const devImages = [raely, jomari, pearly, jelina];

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isDarkMode ? "#fff" : "#000",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Developer Cards */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "75vh",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "-15vh",
        }}
      >
        {devImages.map((img, index) => (
          <div
            key={index}
            style={{
              backgroundColor: isDarkMode ? "#f9f9f9" : "#111",
              borderRadius: "20px",
              padding: 0,
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? "linear-gradient(135deg, #e5e7eb, #d1d5db)"
                : "linear-gradient(135deg, #4b5563, #1f2937)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 200,
                left: "50%",
                transform: "translateX(-50%) translateY(-175px)",
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                filter: "brightness(0.8)",
              }}
            >
              <Lanyard cardImage={img} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
