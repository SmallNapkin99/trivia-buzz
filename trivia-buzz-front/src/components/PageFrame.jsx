import React from "react";

const PageFrame = ({ content }) => {
  const wallpaperContainer = {
    background: "linear-gradient(135deg, #1e1b4b, #581c87, #9d174d)",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    height: "100vh",
  };
  return <div style={wallpaperContainer}>{content}</div>;
};

export default PageFrame;
