import React, { useState } from "react";
import Footer from "./Footer";

const PageFrame = ({ content, showFooter = true, onHomeClick }) => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

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

      {/* Invisible hover trigger - positioned absolutely so it doesn't take up space */}
      {showFooter && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 h-16 z-10"
            onMouseEnter={() => setIsFooterVisible(true)}
            onMouseLeave={() => setIsFooterVisible(false)}
          />

          {/* Only render footer when hovering */}
          {isFooterVisible && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 animate-in fade-in duration-200"
              onMouseEnter={() => setIsFooterVisible(true)}
              onMouseLeave={() => setIsFooterVisible(false)}
            >
              <Footer onHomeClick={onHomeClick} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PageFrame;
