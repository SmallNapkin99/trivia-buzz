import Footer from "./Footer";

const PageFrame = ({ content, showFooter = true, onHomeClick }) => {
  const wallpaperContainer = {
    background: "linear-gradient(135deg, #1e1b4b, #581c87, #9d174d)",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  };

  return (
    <div style={wallpaperContainer}>
      <div style={{ flex: 1, overflow: "auto" }}>{content}</div>

      {/* Simply render footer when showFooter is true */}
      {showFooter && <Footer onHomeClick={onHomeClick} />}
    </div>
  );
};

export default PageFrame;
