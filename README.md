# 🍔 Food Delivery Platform

A **microservice-based food delivery system** featuring real-time order notifications, live delivery tracking, and a **self-hosted Function-as-a-Service (FaaS)** for delivery estimation.

The system is designed using **event-driven architecture**, **micro-frontends**, and **containerized services**, fulfilling all assessment requirements.

---

## Features

- Secure REST API with JWT authentication
- Real-time notifications using WebSockets (Socket.io)
- Event-driven communication via RabbitMQ
- Event streaming for driver movement via Kafka
- Self-hosted Function-as-a-Service for delivery ETA estimation
- Micro-frontend architecture using Module Federation
- Reverse proxy and load balancing with Nginx
- Fully containerized using Docker and Docker Compose

---

## Tech Stack

### Frontend
- React 18
- TypeScript
- Module Federation (Micro Frontends)
- Socket.io (WebSockets)

### Backend
- Node.js 20
- Express
- Socket.io
- JWT Authentication

### Data & Messaging
- PostgreSQL (Order persistence)
- RabbitMQ (Asynchronous notifications)
- Kafka (Driver movement streaming)

### Function-as-a-Service (FaaS)
- Self-hosted Node.js HTTP function
- Stateless and event-triggered
- No third-party cloud provider

### DevOps
- Docker
- Docker Compose
- Nginx (Reverse Proxy / Load Balancer)

---

##  Quick Start

```bash
https://github.com/andreicomaniciu/Food-delivery.git
docker-compose up --build
```

##  Usage

1. Click **Login** to authenticate.
2. Enter a food item (e.g. *Pizza Margherita*).
3. Click **Place Order** to create a new order.
4. Observe the following real-time updates:
   -  Order notifications
   -  Delivery ETA updates
   -  Live driver movement
5. Click **Simulate Driver** to generate driver tracking events.

## Diagram with the system:

https://github.com/andreicomaniciu/Food-delivery/blob/main/System%20diagram.png
