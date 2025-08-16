import React from "react";

const PageFrame = ({ content }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-y-auto">
      {/* Static Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">{content}</div>
    </div>
  );
};

export default PageFrame;
