import React from "react";
import "../Home.css";
import "./BigButton.jsx";
import BigButton from "./BigButton.jsx";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-16 min-h-screen">
      <h1 className="text-shadows font-sans font-extrabold">
        FAMILY
        <br />
        JEOPARDY
      </h1>
      <Link to="/creategame">
        <BigButton text="Create Game" />
      </Link>

      <Link to="/gamelist">
        <BigButton text="Load Game" />
      </Link>
    </div>
  );
};

export default Home;
