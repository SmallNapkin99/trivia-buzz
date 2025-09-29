import WebSocket from "ws";
import { performance } from "perf_hooks";

// TEST CONFIGURATION
const CONFIG = {
  WS_URL: "ws://localhost:8080", // Change to your Render URL for production testing
  NUM_PLAYERS: 50,
  GAME_ID: "test-game-123",
  TEST_DURATION_MS: 60000, // 1 minute test
  BUZZ_PROBABILITY: 0.3, // 30% chance a player will attempt to buzz
  MESSAGE_DELAY_MS: 100, // Delay between actions
};

// METRICS TRACKING
const metrics = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  totalMessagesSent: 0,
  totalMessagesReceived: 0,
  buzzAttempts: 0,
  successfulBuzzes: 0,
  failedBuzzes: 0,
  connectionTimes: [],
  messageLatencies: [],
  errors: [],
  disconnections: 0,
  rateLimit: 0,
};

// PLAYER SIMULATION CLASS
class SimulatedPlayer {
  constructor(playerId, playerName) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.ws = null;
    this.connected = false;
    this.messageTimes = new Map();
    this.score = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      this.ws = new WebSocket(`${CONFIG.WS_URL}/game/${CONFIG.GAME_ID}`);
      metrics.totalConnections++;

      this.ws.on("open", () => {
        const connectionTime = performance.now() - startTime;
        metrics.connectionTimes.push(connectionTime);
        metrics.successfulConnections++;
        this.connected = true;
        console.log(
          `✓ Player ${this.playerName} connected in ${connectionTime.toFixed(
            2
          )}ms`
        );

        // Register player
        this.sendMessage({
          action: "player_ready",
          playerId: this.playerId,
          playerName: this.playerName,
        });

        resolve();
      });

      this.ws.on("message", (data) => {
        metrics.totalMessagesReceived++;
        this.handleMessage(data);
      });

      this.ws.on("close", () => {
        this.connected = false;
        metrics.disconnections++;
        console.log(`✗ Player ${this.playerName} disconnected`);
      });

      this.ws.on("error", (error) => {
        metrics.failedConnections++;
        metrics.errors.push({
          player: this.playerName,
          error: error.message,
          timestamp: Date.now(),
        });
        console.error(`✗ Player ${this.playerName} error:`, error.message);
        reject(error);
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageId = `${message.action}-${Date.now()}`;
      this.messageTimes.set(messageId, performance.now());
      this.ws.send(JSON.stringify(message));
      metrics.totalMessagesSent++;
      return messageId;
    }
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      // Calculate latency for tracked messages
      if (message.timestamp) {
        const latency = Date.now() - message.timestamp;
        metrics.messageLatencies.push(latency);
      }

      switch (message.action) {
        case "buzzed_in":
          if (message.playerId === this.playerId) {
            metrics.successfulBuzzes++;
            console.log(`🔔 ${this.playerName} successfully buzzed in!`);
          }
          break;

        case "buzz_failed":
          if (this.ws.readyState === WebSocket.OPEN) {
            metrics.failedBuzzes++;
          }
          break;

        case "update_score":
          if (message.playerId === this.playerId) {
            this.score = message.newScore;
          }
          break;

        case "rate_limited":
          metrics.rateLimit++;
          console.warn(`⚠ ${this.playerName} was rate limited`);
          break;
      }
    } catch (error) {
      metrics.errors.push({
        player: this.playerName,
        error: "Failed to parse message",
        timestamp: Date.now(),
      });
    }
  }

  buzz() {
    metrics.buzzAttempts++;
    return this.sendMessage({
      action: "buzzed",
      playerId: this.playerId,
    });
  }

  updateScore(newScore) {
    return this.sendMessage({
      action: "score_update",
      playerId: this.playerId,
      newScore: newScore,
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// TEST SCENARIOS
async function runStressTest() {
  console.log("\n=== TRIVIA APP WEBSOCKET STRESS TEST ===\n");
  console.log(`Configuration:`);
  console.log(`- URL: ${CONFIG.WS_URL}`);
  console.log(`- Players: ${CONFIG.NUM_PLAYERS}`);
  console.log(`- Duration: ${CONFIG.TEST_DURATION_MS / 1000}s\n`);

  const players = [];
  const testStartTime = Date.now();

  // PHASE 1: Connect all players
  console.log("PHASE 1: Connecting players...\n");

  for (let i = 0; i < CONFIG.NUM_PLAYERS; i++) {
    const player = new SimulatedPlayer(`player-${i}`, `TestPlayer${i}`);
    players.push(player);

    try {
      await player.connect();
      // Stagger connections slightly
      await sleep(50);
    } catch (error) {
      console.error(`Failed to connect player ${i}`);
    }
  }

  console.log(
    `\n✓ Phase 1 complete: ${metrics.successfulConnections}/${CONFIG.NUM_PLAYERS} players connected\n`
  );
  await sleep(2000);

  // PHASE 2: Request player list from all players
  console.log("PHASE 2: Requesting player lists...\n");

  for (const player of players) {
    if (player.connected) {
      player.sendMessage({ action: "get_players" });
    }
  }

  await sleep(2000);

  // PHASE 3: Simulate game with buzzer rounds
  console.log("PHASE 3: Running buzzer stress test...\n");

  const roundsToTest = 10;

  for (let round = 0; round < roundsToTest; round++) {
    console.log(`\n--- Round ${round + 1} ---`);

    // Open buzzers (only first player should do this)
    if (players[0].connected) {
      players[0].sendMessage({ action: "open_buzzers" });
    }

    await sleep(500);

    // Random players attempt to buzz
    const buzzingPlayers = players
      .filter((p) => p.connected && Math.random() < CONFIG.BUZZ_PROBABILITY)
      .slice(0, Math.floor(CONFIG.NUM_PLAYERS * 0.8)); // Max 80% of players buzz

    // Simulate rapid concurrent buzzing
    await Promise.all(
      buzzingPlayers.map((p) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            p.buzz();
            resolve();
          }, Math.random() * 200); // Random delay 0-200ms
        });
      })
    );

    await sleep(1000);

    // Close buzzers
    if (players[0].connected) {
      players[0].sendMessage({ action: "close_buzzers" });
    }

    await sleep(500);
  }

  // PHASE 4: Score updates stress test
  console.log("\n\nPHASE 4: Testing score updates...\n");

  for (let i = 0; i < 20; i++) {
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    if (randomPlayer.connected) {
      const newScore = Math.floor(Math.random() * 1000);
      randomPlayer.updateScore(newScore);
      await sleep(CONFIG.MESSAGE_DELAY_MS);
    }
  }

  await sleep(2000);

  // PHASE 5: Final trivia simulation
  console.log("\nPHASE 5: Testing final trivia workflow...\n");

  if (players[0].connected) {
    players[0].sendMessage({
      action: "final_trivia_input",
      gameId: CONFIG.GAME_ID,
    });
  }

  await sleep(1000);

  // All players submit wagers
  for (const player of players) {
    if (player.connected) {
      player.sendMessage({
        action: "submit_wager",
        playerId: player.playerId,
        pointWager: Math.floor(Math.random() * 500),
      });
      await sleep(50);
    }
  }

  await sleep(2000);

  // PHASE 6: Cleanup
  console.log("\nPHASE 6: Disconnecting players...\n");

  for (const player of players) {
    player.disconnect();
  }

  await sleep(2000);

  // CALCULATE AND DISPLAY RESULTS
  displayResults(testStartTime);
}

function displayResults(testStartTime) {
  const testDuration = (Date.now() - testStartTime) / 1000;

  console.log("\n\n========================================");
  console.log("     STRESS TEST RESULTS");
  console.log("========================================\n");

  console.log("CONNECTION METRICS:");
  console.log(`  Total Attempts:     ${metrics.totalConnections}`);
  console.log(
    `  Successful:         ${metrics.successfulConnections} (${(
      (metrics.successfulConnections / metrics.totalConnections) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Failed:             ${metrics.failedConnections}`);
  console.log(`  Disconnections:     ${metrics.disconnections}`);

  if (metrics.connectionTimes.length > 0) {
    const avgConnTime = avg(metrics.connectionTimes);
    const p95ConnTime = percentile(metrics.connectionTimes, 95);
    const maxConnTime = Math.max(...metrics.connectionTimes);
    console.log(`  Avg Connect Time:   ${avgConnTime.toFixed(2)}ms`);
    console.log(`  P95 Connect Time:   ${p95ConnTime.toFixed(2)}ms`);
    console.log(`  Max Connect Time:   ${maxConnTime.toFixed(2)}ms`);
  }

  console.log("\nMESSAGE METRICS:");
  console.log(`  Total Sent:         ${metrics.totalMessagesSent}`);
  console.log(`  Total Received:     ${metrics.totalMessagesReceived}`);
  console.log(
    `  Messages/Second:    ${(metrics.totalMessagesSent / testDuration).toFixed(
      2
    )}`
  );
  console.log(`  Rate Limited:       ${metrics.rateLimit}`);

  if (metrics.messageLatencies.length > 0) {
    const avgLatency = avg(metrics.messageLatencies);
    const p95Latency = percentile(metrics.messageLatencies, 95);
    const maxLatency = Math.max(...metrics.messageLatencies);
    console.log(`  Avg Latency:        ${avgLatency.toFixed(2)}ms`);
    console.log(`  P95 Latency:        ${p95Latency.toFixed(2)}ms`);
    console.log(`  Max Latency:        ${maxLatency.toFixed(2)}ms`);
  }

  console.log("\nBUZZER METRICS:");
  console.log(`  Total Buzz Attempts:    ${metrics.buzzAttempts}`);
  console.log(`  Successful Buzzes:      ${metrics.successfulBuzzes}`);
  console.log(`  Failed Buzzes:          ${metrics.failedBuzzes}`);
  console.log(
    `  Success Rate:           ${(
      (metrics.successfulBuzzes / metrics.buzzAttempts) *
      100
    ).toFixed(1)}%`
  );

  console.log("\nERROR SUMMARY:");
  console.log(`  Total Errors:       ${metrics.errors.length}`);

  if (metrics.errors.length > 0) {
    console.log("\nError Details:");
    const errorCounts = {};
    metrics.errors.forEach((e) => {
      errorCounts[e.error] = (errorCounts[e.error] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`  - ${error}: ${count}`);
    });
  }

  console.log("\n========================================");
  console.log(`Test Duration: ${testDuration.toFixed(2)}s`);
  console.log("========================================\n");

  // Performance assessment
  const successRate =
    (metrics.successfulConnections / metrics.totalConnections) * 100;
  const avgLatency =
    metrics.messageLatencies.length > 0 ? avg(metrics.messageLatencies) : 0;

  console.log("PERFORMANCE ASSESSMENT:");
  if (successRate >= 95 && avgLatency < 100 && metrics.errors.length < 5) {
    console.log("✓ EXCELLENT - System handling load very well");
  } else if (
    successRate >= 85 &&
    avgLatency < 200 &&
    metrics.errors.length < 20
  ) {
    console.log("⚠ GOOD - System performing adequately with minor issues");
  } else {
    console.log("✗ NEEDS IMPROVEMENT - System struggling under load");
  }
  console.log();
}

// UTILITY FUNCTIONS
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

// RUN THE TEST
runStressTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

// async function verifyCleanState() {
//   console.log("\n--- Verifying Server State ---\n");

//   const response = await fetch("http://localhost:8080/api/admin/game-state");
//   const state = await response.json();

//   console.log("Server State:", state);

//   if (state.connections === 0 && state.players === 0) {
//     console.log("✓ Server is clean - no lingering data");
//   } else {
//     console.log("⚠ Warning - server still has data:");
//     console.log(`  - Connections: ${state.connections}`);
//     console.log(`  - Players: ${state.players}`);
//   }
// }

// // Call this after the test
// await verifyCleanState();
