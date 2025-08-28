import React from "react";
import { Home } from "lucide-react";

const Footer = ({ onHomeClick }) => {
  return (
    <footer className="bg-black bg-opacity-50 backdrop-blur-sm border-t border-white border-opacity-20">
      <div className="flex justify-center items-center py-4">
        <button
          onClick={onHomeClick}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          aria-label="Home"
        >
          <Home className="w-6 h-6 text-white" />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
