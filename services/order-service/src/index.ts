import express, { Request, Response, NextFunction } from 'express';
import amqp from 'amqplib';
import { Order, initDB } from './db'
import axios from 'axios';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
const SECRET = process.env.JWT_SECRET || 'supersecret';

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, SECRET, (err: any, user: any) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        next();
    });
};

let channel: amqp.Channel;

async function initRabbit() {
    try {
        const connection = await amqp.connect(process.env.RABBIT_URL || 'amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('order_notifications', { durable: true });
        console.log("Connected to RabbitMQ");
    } catch (e) {
        setTimeout(initRabbit, 5000);
    }
};

app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { customerName, food, total } = req.body;

        if (!food) {
            return res.status(400).json({ error: "Food is required" });
        }

        const order: any = await Order.create({
            customerName,
            food,
            total
        });

        console.log(`New order created: ${order.id} for ${customerName}`);

        channel.sendToQueue(
            'order_notifications',
            Buffer.from(
                JSON.stringify({
                    orderId: order.id,
                    food: order.food,
                    message: `🍔 ${customerName} ordered: ${order.food}`
                })
            ),
            { persistent: true }
        );


        axios.post('http://delivery-estimator:8080', {
            orderId: order.id,
            food: order.food,
            distanceKm: 5 + Math.random() * 5
        })
            .then(res => {
                console.log(`ETA for order ${order.id}: ${res.data.etaMinutes} min`);

                channel.sendToQueue(
                    'order_notifications',
                    Buffer.from(JSON.stringify({
                        orderId: order.id,
                        message: `🚴 ${order.food} arriving in ~${res.data.etaMinutes} min (${res.data.status})`
                    }))
                );

            })
            .catch(err => {
                console.error('ETA service failed:', err.message);
            });


        res.status(201).json(order);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: "Failed to place order" });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'order-service'
    });
});

const start = async () => {
    await initDB();
    await initRabbit();

    app.listen(3001, () => {
        console.log("Order Service running on 3001");
    });
};

start();
