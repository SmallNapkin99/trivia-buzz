import React from "react";

const PageFrame = ({ content }) => {
  const wallpaperContainer = {
    background: "linear-gradient(45deg, #3e003a, #7300b0)",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    height: "100vh",
  };
  return <div style={wallpaperContainer}>{content}</div>;
};

export default PageFrame;
