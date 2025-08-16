import React from "react";
import "../Home.css";

const BigButton = ({ text, onClick, disabled }) => {
  return (
    <button
      className={`group relative font-black bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 w-80 h-20 text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-2xl hover:shadow-yellow-500/50 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Button shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse rounded-2xl"></div>

      {/* Button border glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-amber-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>

      {/* Button text with purple gradient */}
      <span className="relative z-10 drop-shadow-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 font-black">
        {text}
      </span>
    </button>
  );
};

export default BigButton;
