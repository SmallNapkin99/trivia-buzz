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

dotenv.config();

const app = express();
app.use(cors());

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

const server = http.createServer(app);

// OPTIMIZED WEBSOCKET SERVER WITH PERFORMANCE IMPROVEMENTS
const wss = new WebSocketServer({
  server,
  maxPayload: 16 * 1024, // 16KB max message size
  skipUTF8Validation: true, // Performance optimization for trusted clients
});

// OPTIMIZED DATA STRUCTURES
const players = new Map();
const questionsAnswered = new Set();
const connectionToPlayer = new Map(); // Track which connection belongs to which player
const playerConnections = new Map(); // Track player's active connections

// GAME STATE
let gameInProgress = false;
let buzzersActive = false;
let firstPlayerToBuzz = null;
let playersSubmittedWager = new Set();
let playersSubmittedFinal = new Set();
let buzzerLockTime = null;
let firstConnection = null;

// PERFORMANCE OPTIMIZATIONS
const MESSAGE_BATCH_SIZE = 50; // Send messages in batches
const BUZZ_COOLDOWN = 1000; // 1 second cooldown between buzzes per player
const playerBuzzCooldowns = new Map();

// RATE LIMITING
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_MESSAGES_PER_WINDOW = 10;

function isRateLimited(ws) {
  const now = Date.now();
  const clientData = rateLimits.get(ws) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData.count = 0;
    clientData.windowStart = now;
  }

  clientData.count++;
  rateLimits.set(ws, clientData);

  return clientData.count > MAX_MESSAGES_PER_WINDOW;
}

// OPTIMIZED BROADCAST FUNCTIONS
function broadcastToAll(message, excludeWs = null) {
  const messageStr =
    typeof message === "string" ? message : JSON.stringify(message);
  const clients = Array.from(wss.clients).filter(
    (client) => client.readyState === WebSocket.OPEN && client !== excludeWs
  );

  // Batch send messages to avoid blocking
  const batchSend = async (clientsBatch) => {
    return Promise.all(
      clientsBatch.map((client) => {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error("Error sending message to client:", error);
          // Remove failed connections
          if (client.readyState !== WebSocket.OPEN) {
            cleanupConnection(client);
          }
        }
      })
    );
  };

  // Send in batches to prevent blocking
  for (let i = 0; i < clients.length; i += MESSAGE_BATCH_SIZE) {
    const batch = clients.slice(i, i + MESSAGE_BATCH_SIZE);
    setImmediate(() => batchSend(batch));
  }
}

function sendToPlayer(playerId, message) {
  const connections = playerConnections.get(playerId);
  if (!connections) return;

  const messageStr =
    typeof message === "string" ? message : JSON.stringify(message);

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error("Error sending message to player:", error);
        cleanupConnection(ws);
      }
    }
  });
}

function cleanupConnection(ws) {
  const playerId = connectionToPlayer.get(ws);
  if (playerId) {
    const connections = playerConnections.get(playerId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        playerConnections.delete(playerId);
        players.delete(playerId);
        playersSubmittedWager.delete(playerId);
        playersSubmittedFinal.delete(playerId);
      }
    }
    connectionToPlayer.delete(ws);
  }
  rateLimits.delete(ws);
}

const resetGame = () => {
  console.log("Resetting game. Clearing all player data...");
  players.clear();
  playersSubmittedWager.clear();
  playersSubmittedFinal.clear();
  questionsAnswered.clear();
  connectionToPlayer.clear();
  playerConnections.clear();
  playerBuzzCooldowns.clear();
  gameInProgress = false;
  firstPlayerToBuzz = null;
  buzzersActive = false;
  buzzerLockTime = null;
};

// OPTIMIZED BUZZ HANDLING
function handleBuzz(playerId, ws) {
  const now = Date.now();

  // Check if buzzers are active
  if (!buzzersActive) {
    return false;
  }

  // Check player cooldown
  const lastBuzz = playerBuzzCooldowns.get(playerId) || 0;
  if (now - lastBuzz < BUZZ_COOLDOWN) {
    return false;
  }

  // ATOMIC OPERATION: Check and set first buzzer
  if (!firstPlayerToBuzz && buzzersActive) {
    const player = players.get(playerId);
    if (player) {
      // Lock buzzers immediately
      buzzersActive = false;
      firstPlayerToBuzz = player;
      buzzerLockTime = now;
      playerBuzzCooldowns.set(playerId, now);

      // Broadcast success (only once!)
      const buzzedInMessage = {
        action: "buzzed_in",
        playerId: playerId,
        playerName: player.name,
        timestamp: now,
      };

      broadcastToAll(buzzedInMessage);

      console.log(`Player ${player.name} buzzed in first at ${now}`);
      return true;
    }
  }

  return false;
}

// CONNECTION HANDLING
wss.on("connection", (ws) => {
  console.log(`New connection. Total clients: ${wss.clients.size}`);

  // Mark first connection - it never gets timed out
  let isFirstConnection = false;
  if (!firstConnection) {
    firstConnection = ws;
    isFirstConnection = true;
    console.log("First connection established - will never timeout");
  }

  // Connection timeout - but skip for first connection
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN && !isFirstConnection) {
      ws.close(1000, "Connection timeout - no player registration");
    }
  }, 30000); // 30 second timeout to register

  ws.on("message", (message) => {
    try {
      // Rate limiting
      if (isRateLimited(ws)) {
        ws.send(
          JSON.stringify({
            action: "rate_limited",
            message: "Too many messages",
          })
        );
        return;
      }

      const data = JSON.parse(message);
      const now = Date.now();

      // OPTIMIZED MESSAGE HANDLERS
      switch (data.action) {
        case "new_game":
          resetGame();
          broadcastToAll({ action: "game_reset", timestamp: now });
          break;

        case "player_ready":
          clearTimeout(connectionTimeout);
          const { playerId, playerName } = data;

          // Register player connection
          if (!players.has(playerId)) {
            players.set(playerId, { name: playerName, id: playerId, score: 0 });
          } else {
            const existingPlayer = players.get(playerId);
            if (existingPlayer.name !== playerName) {
              players.set(playerId, { ...existingPlayer, name: playerName });
            }
          }

          // Track connections
          connectionToPlayer.set(ws, playerId);
          if (!playerConnections.has(playerId)) {
            playerConnections.set(playerId, new Set());
          }
          playerConnections.get(playerId).add(ws);

          // Broadcast updated player list
          broadcastToAll({
            action: "update_player_list",
            players: Array.from(players.values()),
            timestamp: now,
          });
          break;

        case "get_players":
          ws.send(
            JSON.stringify({
              action: "set_player_list",
              players: Array.from(players.values()),
              timestamp: now,
            })
          );
          break;

        case "score_update":
          const { playerId: scorePlayerId, newScore } = data;
          const player = players.get(scorePlayerId);
          if (player) {
            player.score = newScore;
            players.set(scorePlayerId, player);

            broadcastToAll({
              action: "update_score",
              playerId: scorePlayerId,
              newScore: newScore,
              timestamp: now,
            });
          }
          break;

        case "question_answered":
          questionsAnswered.add(data.questionId);
          break;

        case "get_answered_questions":
          ws.send(
            JSON.stringify({
              action: "set_answered_questions",
              questions: Array.from(questionsAnswered),
              timestamp: now,
            })
          );
          break;

        case "remove_player":
          const { playerId: removePlayerId } = data;
          players.delete(removePlayerId);
          playersSubmittedWager.delete(removePlayerId);
          playersSubmittedFinal.delete(removePlayerId);
          playerConnections.delete(removePlayerId);
          playerBuzzCooldowns.delete(removePlayerId);

          broadcastToAll({
            action: "update_player_list",
            players: Array.from(players.values()),
            timestamp: now,
          });
          break;

        case "close_buzzers":
          console.log("Buzzers closed.");
          buzzersActive = false;
          firstPlayerToBuzz = null;

          broadcastToAll({
            action: "lock_buzzers",
            timestamp: now,
          });
          break;

        case "open_buzzers":
          console.log("Buzzers opened.");
          buzzersActive = true;
          firstPlayerToBuzz = null;
          buzzerLockTime = null;

          // Clear all buzz cooldowns when opening buzzers
          playerBuzzCooldowns.clear();

          broadcastToAll({
            action: "unlock_buzzers",
            timestamp: now,
          });
          break;

        case "buzzed":
          // OPTIMIZED BUZZ HANDLING
          const { playerId: buzzPlayerId } = data;
          const success = handleBuzz(buzzPlayerId, ws);

          if (!success) {
            // Send failure only to the buzzing player
            ws.send(
              JSON.stringify({
                action: "buzz_failed",
                reason: buzzersActive ? "too_late" : "buzzers_closed",
                timestamp: now,
              })
            );
          }
          break;

        case "check_game_in_progress":
          ws.send(
            JSON.stringify({
              action: "game_in_progress",
              gameInProgress: gameInProgress,
              buzzersActive: buzzersActive,
              timestamp: now,
            })
          );
          break;

        case "start_game":
          gameInProgress = true;
          broadcastToAll({
            action: "game_started",
            timestamp: now,
          });
          break;

        case "end_game":
          console.log("Received end game command.");
          resetGame();
          broadcastToAll({
            action: "game_ended",
            gameId: data.gameId,
            timestamp: now,
          });
          //kill all connections
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.close(1001, "Game ended - server reset");
            }
          });
          break;

        case "final_trivia_input":
          console.log("Starting final trivia.");
          broadcastToAll({
            action: "final_trivia_started",
            gameId: data.gameId,
            timestamp: now,
          });
          break;

        case "submit_wager":
          const { playerId: wagerPlayerId, pointWager } = data;
          if (!playersSubmittedWager.has(wagerPlayerId)) {
            playersSubmittedWager.add(wagerPlayerId);
            //add wager to player map
            const player = players.get(wagerPlayerId);
            if (player) {
              player.wager = pointWager;
              players.set(wagerPlayerId, player);
            }
          }
          if (playersSubmittedWager.size === players.size) {
            // Broadcast wagers submitted to all clients
            broadcastToAll({
              action: "wagers_submitted",
              timestamp: now,
            });
          }
          break;

        case "submit_final_answer":
          const { playerId: finalPlayerId, wager, correct } = data;
          if (!playersSubmittedFinal.has(finalPlayerId)) {
            playersSubmittedFinal.add(finalPlayerId);
            const finalPlayer = players.get(finalPlayerId);
            if (finalPlayer) {
              if (correct) {
                finalPlayer.score += wager;
              } else {
                finalPlayer.score -= wager;
              }
              players.set(finalPlayerId, finalPlayer);
            }
            if (playersSubmittedFinal.size === players.size) {
              // Broadcast player list with updated scores to all clients
              broadcastToAll({
                action: "final_answers_submitted",
                players: Array.from(players.values()),
                timestamp: now,
              });
            }
          }
          break;

        case "final_trivia_time_up":
          // Mark all players who haven't submitted as incorrect
          players.forEach((player, id) => {
            if (!playersSubmittedFinal.has(id)) {
              const updatedPlayer = {
                ...player,
                score: player.score - player.wager || 0,
              };
              players.set(id, updatedPlayer);
            }
          });

          // Broadcast final answers submitted to all clients
          broadcastToAll({
            action: "final_answers_submitted",
            players: Array.from(players.values()),
            timestamp: now,
          });
          break;

        default:
          ws.send(
            JSON.stringify({
              action: "unknown_action",
              originalAction: data.action,
              timestamp: now,
            })
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          action: "error",
          message: "Invalid message format",
          timestamp: Date.now(),
        })
      );
    }
  });

  ws.on("close", () => {
    console.log(`Connection closed. Total clients: ${wss.clients.size - 1}`);
    cleanupConnection(ws);

    if (ws === firstConnection) {
      firstConnection = null;
      console.log("First connection closed");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    cleanupConnection(ws);
  });

  // Send connection confirmation
  ws.send(
    JSON.stringify({
      action: "connected",
      timestamp: Date.now(),
      clientCount: wss.clients.size,
    })
  );
});

// HEALTH CHECK AND MONITORING
setInterval(() => {
  const stats = {
    connections: wss.clients.size,
    players: players.size,
    gameInProgress,
    buzzersActive,
    firstPlayerToBuzz: firstPlayerToBuzz?.name || null,
  };

  console.log("WebSocket Stats:", stats);

  // Clean up stale connections
  wss.clients.forEach((ws) => {
    if (ws.readyState !== WebSocket.OPEN) {
      cleanupConnection(ws);
    }
  });
}, 30000); // Every 30 seconds

// GRACEFUL SHUTDOWN
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing WebSocket server...");
  wss.clients.forEach((ws) => {
    ws.close(1001, "Server shutting down");
  });
  wss.close(() => {
    console.log("WebSocket server closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(
    `Express server with optimized WebSocket listening on port ${PORT}`
  );
  console.log(
    `WebSocket optimizations: Rate limiting, batched broadcasts, connection pooling enabled`
  );
});
