import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const OrderStats = ({ token }: { token: string }) => {
    const [count, setCount] = useState(0);
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
            setCount(0);
            socket.disconnect();
        }

        // socket.on("notifications", () => {
        //     setCount(prev => prev + 1);
        // });

        socket.on("notifications", (data) => {
            if (data?.message?.includes("🍔")) {
                setCount(prev => prev + 1);
            }
        });


        socket.on("connect_error", (error) => {
            console.error("OrderStats socket error:", error);
            if (error.message === "Authentication error") {
                setCount(0);
            }
        });

        return () => {
            socket.off("notifications");
            socket.off("connect_error");
        };
    }, [token]);

    return (
        <div
            style={{
                background: "linear-gradient(145deg, #222222, #171717)",
                borderRadius: "16px",
                padding: "22px",
                boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
                color: "#f5f5f5"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <h3 style={{ margin: 0, fontWeight: 600 }}>
                    🍔 Live Orders
                </h3>

                <span
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: token ? "#4CAF50" : "#e74c3c",
                        boxShadow: token
                            ? "0 0 10px rgba(76,175,80,0.8)"
                            : "0 0 10px rgba(231,76,60,0.8)"
                    }}
                />
            </div>

            <div
                style={{
                    fontSize: "3.4rem",
                    fontWeight: 800,
                    margin: "18px 0 6px",
                    color: "#ff9800"
                }}
            >
                {count}
            </div>

            <p
                style={{
                    fontSize: "0.9rem",
                    color: "#b0b0b0"
                }}
            >
                Orders received this session
            </p>

            {!token && (
                <div
                    style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: "rgba(231,76,60,0.15)",
                        borderLeft: "4px solid #e74c3c",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        color: "#f1b0b0"
                    }}
                >
                    🔒 Login required to receive live updates
                </div>
            )}
        </div>
    );
};

export default OrderStats;
