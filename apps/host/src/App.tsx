import React, { Suspense, useEffect, useState } from 'react'
import { io } from 'socket.io-client';

const OrderStats = React.lazy(() => import('dashboard/OrderStats'));
const LiveMap = React.lazy(() => import('tracking/LiveMap'));

const socket = io('http://localhost', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  autoConnect: false
});

function App() {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [food, setFood] = useState('');

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const login = async () => {
    const res = await fetch('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user123' })
    });
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem('token', data.token);

    const decoded = decodeToken(data.token);
    if (decoded?.exp) setTokenExpiry(decoded.exp * 1000);
  };

  const logout = () => {
    setToken('');
    setTokenExpiry(null);
    localStorage.removeItem('token');
    socket.disconnect();
    setNotifications([]);
  };

  const placeOrder = async () => {
    try {
      const response = await fetch('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'John Doe',
          food,
          total: Math.random() * 100
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) logout();
        return;
      }

      setFood('');
    } catch {}
  };

  const moveDriver = async () => {
    try {
      const response = await fetch('http://localhost/api/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId: 'DRV-001',
          latitude: 45 + Math.random(),
          longitude: 25 + Math.random()
        })
      });

      if (!response.ok && (response.status === 401 || response.status === 403)) {
        logout();
      }
    } catch {}
  };

  /* ---- effects unchanged ---- */

  useEffect(() => {
    if (!token || !tokenExpiry) return;
    const interval = setInterval(() => {
      if (Date.now() >= tokenExpiry) logout();
    }, 5000);
    return () => clearInterval(interval);
  }, [token, tokenExpiry]);

  useEffect(() => {
    if (token && !tokenExpiry) {
      const decoded = decodeToken(token);
      if (decoded?.exp) setTokenExpiry(decoded.exp * 1000);
    }
  }, []);

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [token]);


  useEffect(() => {
    socket.on('notifications', data => {
      setNotifications(prev => [data.message, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('notifications');
    };
  }, []);

  return (
      <div className="app-container">
        {/* HEADER */}
        <header className="app-header">
          <h1>🍔 Food Delivery Dashboard</h1>

          {!token ? (
              <button className="btn primary" onClick={login}>Login</button>
          ) : (
              <div className="auth-info">
            <span className="logged-in">
              ✓ Logged in
              {tokenExpiry && (
                  <span className="expiry">
                  ({Math.max(0, Math.floor((tokenExpiry - Date.now()) / 60000))}m)
                </span>
              )}
            </span>
                <button className="btn danger" onClick={logout}>Logout</button>
              </div>
          )}
        </header>

        {/* ORDER ACTIONS */}
        <div className="order-panel">
          <input
              type="text"
              placeholder="🍕 What are you ordering?"
              value={food}
              onChange={(e) => setFood(e.target.value)}
          />

          <button
              className="btn primary"
              onClick={placeOrder}
              disabled={!token || !food}
          >
            Place Order
          </button>

          <button
              className="btn secondary"
              onClick={moveDriver}
              disabled={!token}
          >
            Simulate Driver
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid">
          <section className="card">
            <Suspense fallback={<div>Loading stats…</div>}>
              <OrderStats token={token} />
            </Suspense>

            <div className="card notifications">
              <h3>📢 Notifications</h3>
              {notifications.length === 0 && <p>No recent activity</p>}
              {notifications.map((note, i) => (
                  <div key={i} className="notification-item">{note}</div>
              ))}
            </div>
          </section>

          <section className="card">
            <Suspense fallback={<div>Loading map…</div>}>
              <LiveMap token={token} />
            </Suspense>
          </section>
        </div>
      </div>
  );
}

export default App;
