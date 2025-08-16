import React from "react";
import "../Home.css";
import "./BigButton.jsx";
import BigButton from "./BigButton.jsx";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center space-y-24 min-h-screen px-4">
      {/* Game Show Title */}
      <div className="text-center relative">
        {/* Ripple effect container with matching gradient */}
        <div className="relative inline-block p-8 rounded-3xl border-4 border-yellow-400">
          {/* Ripple animations with proper 8-second intervals */}
          <div
            className="absolute inset-0 rounded-3xl border-4 border-amber-500 opacity-30"
            style={{
              animation: "customRipple 2s infinite",
              animationDelay: "0s",
            }}
          ></div>

          {/* Custom keyframes for proper ripple timing */}
          <style jsx>{`
            @keyframes customRipple {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              100% {
                transform: scale(1.3);
                opacity: 0;
              }
            }
          `}</style>

          {/* Title content */}
          <div className="relative z-10">
            <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl mb-4 tracking-wider">
              TRIVIA
            </h1>
            <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl tracking-wider">
              BUZZ
            </h1>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-8">
        <Link to="/creategame">
          <BigButton text="Create Game" />
        </Link>

        <Link to="/gamelist">
          <BigButton text="Load Game" />
        </Link>
      </div>

      {/* Call to action text */}
      <p className="text-lg text-white opacity-70 font-medium">
        The custom trivia game for you and your friends!
      </p>
    </div>
  );
};

export default Home;
