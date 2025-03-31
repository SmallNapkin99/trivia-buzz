import React from "react";
import Home from "./components/Home";
import CreateGame from "./components/CreateGame";
import GameList from "./components/GameList";
import GameAction from "./components/GameAction";
import EditGame from "./components/EditGame";
import { WebSocketProvider } from "./components/WebSocketContext";
import ReadyUp from "./components/ReadyUp";
import PlayerList from "./components/PlayerList";
import Buzzer from "./components/Buzzer";
import GameBoard from "./components/GameBoard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/creategame" element={<CreateGame />} />
        <Route path="/gamelist" element={<GameList />} />
        <Route path="/game/:id" element={<GameAction />} />
        <Route path="/game/:id/edit" element={<EditGame />} />
        <Route
          path="/game/:id/*"
          element={
            <WebSocketProvider>
              <Routes>
                <Route path="readyup" element={<ReadyUp />} />
                <Route path="playerlist" element={<PlayerList />} />
                <Route path="buzzer" element={<Buzzer />} />
                <Route path="gameboard" element={<GameBoard />} />
              </Routes>
            </WebSocketProvider>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
