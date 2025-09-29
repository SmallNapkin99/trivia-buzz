import WebSocket from "ws";

// Quick test with 10 users for rapid testing
const WS_URL = "ws://localhost:8080";
const GAME_ID = "test-game-quick";
const NUM_PLAYERS = 10;

const players = [];
let connectedCount = 0;

console.log(`\n🚀 Quick WebSocket Test - ${NUM_PLAYERS} players\n`);

// Connect players
for (let i = 0; i < NUM_PLAYERS; i++) {
  const ws = new WebSocket(`${WS_URL}/game/${GAME_ID}`);
  const playerId = `quick-player-${i}`;
  const playerName = `QuickTest${i}`;

  ws.on("open", () => {
    connectedCount++;
    console.log(`✓ ${playerName} connected (${connectedCount}/${NUM_PLAYERS})`);

    // Register player
    ws.send(
      JSON.stringify({
        action: "player_ready",
        playerId: playerId,
        playerName: playerName,
      })
    );

    // If all connected, start test
    if (connectedCount === NUM_PLAYERS) {
      setTimeout(() => runQuickTest(players), 1000);
    }
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    if (msg.action === "buzzed_in") {
      console.log(`🔔 ${playerName} sees: ${msg.playerName} buzzed in!`);
    } else if (msg.action === "buzz_failed") {
      console.log(`❌ ${playerName} buzz failed: ${msg.reason}`);
    }
  });

  ws.on("error", (err) => {
    console.error(`✗ Error for ${playerName}:`, err.message);
  });

  players.push({ ws, playerId, playerName });
}

function runQuickTest(players) {
  console.log("\n--- Testing Buzzer System ---\n");

  // Open buzzers
  players[0].ws.send(JSON.stringify({ action: "open_buzzers" }));

  // All players buzz simultaneously after 500ms
  setTimeout(() => {
    console.log("All players buzzing NOW!\n");
    players.forEach((p) => {
      p.ws.send(
        JSON.stringify({
          action: "buzzed",
          playerId: p.playerId,
        })
      );
    });
  }, 500);

  // Close and cleanup after 3 seconds
  setTimeout(() => {
    console.log("\n--- Test Complete ---");
    players.forEach((p) => p.ws.close());
    process.exit(0);
  }, 3000);
}

// Timeout if test doesn't complete
setTimeout(() => {
  console.log("\n⏱ Test timeout");
  process.exit(1);
}, 15000);
