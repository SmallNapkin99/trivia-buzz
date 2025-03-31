import React, { createContext, useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";

// Create a context for WebSocket
const WebSocketContext = createContext();

// Custom hook to use WebSocket in any component
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { id: gameId } = useParams();

  useEffect(() => {
    if (gameId) {
      let ws = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      const reconnectDelay = 3000;
      let isConnecting = false;

      const connect = () => {
        if (isConnecting) {
          return;
        }
        isConnecting = true;

        ws = new WebSocket(`ws://localhost:8080/game/${gameId}`);

        ws.onopen = () => {
          console.log(`Connected to WebSocket for game: ${gameId}`);
          reconnectAttempts = 0;
          isConnecting = false;
          setSocket(ws);
        };

        ws.onclose = (event) => {
          console.log(`Disconnected from WebSocket with code: ${event.code}`);
          isConnecting = false;
          if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(
              `Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}. Retrying in ${reconnectDelay}ms...`
            );
            setTimeout(() => {
              if (!ws || ws.readyState === WebSocket.CLOSED) {
                connect();
              } else {
                console.log("WebSocket connection is already open.");
              }
            }, reconnectDelay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.warn(
              "Max reconnection attempts reached. Stopping retries."
            );
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error: ${error.message}`);
          isConnecting = false;
        };
      };

      connect();

      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [gameId]); // Reconnect if gameId changes

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};
