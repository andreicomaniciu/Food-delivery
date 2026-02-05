const http = require('http');

const PORT = process.env.PORT || 8080;

function calculateETA(distanceKm) {
    const averageSpeedKmh = 30; // realistic city delivery speed
    return Math.ceil((distanceKm / averageSpeedKmh) * 60);
}

function determineStatus(etaMinutes) {
    if (etaMinutes > 30) return 'PREPARING';
    if (etaMinutes > 10) return 'ON_THE_WAY';
    return 'ARRIVING';
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method !== 'POST') {
        res.writeHead(405);
        return res.end('Method Not Allowed');
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());

    req.on('end', async () => {
        try {
            const { orderId, food, distanceKm } = JSON.parse(body);

            if (!orderId || distanceKm == null) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    error: 'orderId and distanceKm are required'
                }));
            }

            const etaMinutes = calculateETA(distanceKm);
            const status = determineStatus(etaMinutes);

            console.log('='.repeat(50));
            console.log('DELIVERY ETA ESTIMATION');
            console.log(`Order ID:   ${orderId}`);
            console.log(`Food:       ${food || 'N/A'}`);
            console.log(`Distance:   ${distanceKm} km`);
            console.log(`ETA:        ${etaMinutes} minutes`);
            console.log(`Status:     ${status}`);
            console.log('='.repeat(50));

            // simulate computation
            await new Promise(r => setTimeout(r, 100));

            const response = {
                orderId,
                food,
                distanceKm,
                etaMinutes,
                status,
                calculatedAt: new Date().toISOString()
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));

        } catch (err) {
            console.error('ETA calculation failed:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Failed to calculate ETA'
            }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`ETA FaaS running on port ${PORT}`);
});
