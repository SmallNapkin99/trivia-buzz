import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import gameRoutes from "./src/routes/game_routes.js";
import questionRoutes from "./src/routes/question_routes.js";
import imageRoutes from "./src/routes/image_routes.js";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { initGridFSBucket } from "./src/utils/gridfs.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());

// Workaround to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    initGridFSBucket();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.use(express.json());

app.use("/api/games", gameRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/images", imageRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "build")));

// Catch-all route to serve the React app for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create WebSocket server, passing the HTTP server instance
const wss = new WebSocketServer({ server });

const players = new Map();
let buzzersActive = false;
let firstPlayerToBuzz = null;
const resetGame = () => {
  console.log("Resetting game. Clearing all player data...");
  players.clear();
  firstPlayerToBuzz = null;
  buzzersActive = false;
};
wss.on("connection", (ws) => {
  console.log("A new player connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.action === "new_game") {
      resetGame();
    }

    if (data.action === "get_players") {
      const playerList = JSON.stringify({
        action: "set_player_list",
        players: Array.from(players.values()),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(playerList);
        }
      });
    }

    if (data.action === "player_ready") {
      const { playerId, playerName } = data;
      if (!players.has(playerId)) {
        players.set(playerId, { name: playerName, id: playerId, score: 0 });
      } else {
        const existingPlayer = players.get(playerId);
        if (existingPlayer.name !== playerName) {
          // Update the player's name if it has changed
          players.set(playerId, { ...existingPlayer, name: playerName });
        }
      }

      const playerListUpdate = JSON.stringify({
        action: "update_player_list",
        players: Array.from(players.values()),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(playerListUpdate);
        }
      });
    }

    if (data.action === "score_update") {
      const { playerId, newScore } = data;
      const player = players.get(playerId);
      if (player) {
        player.score = newScore;
        players.set(playerId, player);
      }
      const scoreUpdate = JSON.stringify({
        action: "update_score",
        playerId: playerId,
        newScore: newScore,
      });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(scoreUpdate);
        }
      });
    }

    if (data.action === "remove_player") {
      const { playerId } = data;
      console.log(`Removing player with ID: ${playerId}`);
      players.delete(playerId);
      //Broadcast updated player list to all clients
      const playerListUpdate = JSON.stringify({
        action: "update_player_list",
        players: Array.from(players.values()),
      });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(playerListUpdate);
        }
      });
    }

    if (data.action === "close_buzzers") {
      console.log("Buzzers closed.");
      buzzersActive = false;
    }

    if (data.action === "open_buzzers") {
      console.log("Buzzers opened.");
      buzzersActive = true;
    }

    if (data.action === "buzzed") {
      const { playerId } = data;
      if (buzzersActive) {
        buzzersActive = false;
        firstPlayerToBuzz = players.get(playerId);
        const buzzedInMessage = JSON.stringify({
          action: "buzzed_in",
          playerId: playerId,
        });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(buzzedInMessage);
          }
        });
      } else {
        const buzzerLockUpdate = JSON.stringify({
          action: "lock_buzzer",
          playerId: playerId,
        });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(buzzerLockUpdate);
          }
        });
      }
    }

    if (data.action === "end_game") {
      console.log("Received end game command.");
      resetGame();
      //Broadcast to all players that the game has ended
      const endGameMessage = JSON.stringify({ action: "game_ended" });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(endGameMessage);
        }
      });
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    console.log("A player disconnected");
  });
});

const PORT = process.env.PORT || 8080;
// Start the HTTP server on port assigned by hosting service or on 8080 (this is the same server that will handle both HTTP and WebSocket)
server.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
