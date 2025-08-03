import React from "react";
import "../Home.css";

const BigButton = (props) => {
  return (
    <button
      className="font-extrabold rounded font-sans text-purple-700 bg-yellow-500 hover:bg-yellow-300 w-72 h-16 text-2xl"
      onClick={props.onClick}
    >
      {props.text}
    </button>
  );
};

export default BigButton;
