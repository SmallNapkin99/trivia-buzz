import React from "react";
import { Home } from "lucide-react";

const Footer = ({ onHomeClick }) => {
  return (
    <footer className="fixed bottom-0 right-0 p-4">
      <button
        onClick={onHomeClick}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 opacity-0 hover:opacity-100"
        aria-label="Home"
      >
        <Home className="w-6 h-6 text-white" />
      </button>
    </footer>
  );
};

export default Footer;
