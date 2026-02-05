import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const LiveDriverLocation = ({ token }: { token: string }) => {
    const [history, setHistory] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost", {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionDelay: 1000,
                autoConnect: false
            });
        }

        const socket = socketRef.current;

        if (token) {
            socket.auth = { token };
            if (!socket.connected) socket.connect();
        } else {
            setHistory([]);
            socket.disconnect();
        }

        socket.on("driver-moved", (data) => {
            setHistory(prev =>
                [
                    { ...data, time: new Date().toLocaleTimeString() },
                    ...prev
                ].slice(0, 5)
            );
        });

        socket.on("connect_error", (error) => {
            console.error("LiveDriverLocation socket error:", error);
            if (error.message === "Authentication error") {
                setHistory([]);
            }
        });

        return () => {
            socket.off("driver-moved");
            socket.off("connect_error");
        };
    }, [token]);

    return (
        <div
            style={{
                background: "linear-gradient(145deg, #222222, #151515)",
                borderRadius: "16px",
                padding: "22px",
                boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
                color: "#f5f5f5"
            }}
        >
            <h3 style={{ marginTop: 0, fontWeight: 600 }}>
                🚴 Live Delivery Tracking
            </h3>

            {!token ? (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "rgba(231,76,60,0.15)",
                        borderLeft: "4px solid #e74c3c",
                        borderRadius: "8px",
                        color: "#f1b0b0",
                        fontSize: "0.9rem"
                    }}
                >
                    🔒 Please login to view live driver updates
                </div>
            ) : history.length === 0 ? (
                <p style={{ color: "#b0b0b0" }}>
                    Waiting for driver movement…
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
                    {history.map((pos, i) => (
                        <li
                            key={i}
                            style={{
                                marginBottom: "12px",
                                paddingLeft: "12px",
                                borderLeft: "3px solid #ff9800",
                                fontSize: "0.9rem"
                            }}
                        >
                            <div style={{ fontWeight: 600, color: "#ff9800" }}>
                                🚚 {pos.driverId}
                            </div>
                            <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
                                {pos.time}
                            </div>
                            <div style={{ marginTop: "2px" }}>
                                Lat: {pos.latitude.toFixed(4)} | Lng:{" "}
                                {pos.longitude.toFixed(4)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LiveDriverLocation;
