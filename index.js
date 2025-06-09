// import express from 'express';
// import cors from 'cors';
// import { PrismaClient } from '@prisma/client';
// import authRoutes from './src/routes/auth.js';
// import purchaseRoutes from './src/routes/purchase.js';
// import cwsRoutes from './src/routes/cws.js';
// import siteCollectionRoutes from './src/routes/siteCollection.js';
// import processingRoutes from './src/routes/processing.js'
// import BagOffRoutes from './src/routes/bagoff.js';
// import TransferRoutes from './src/routes/transfer.js';
// import PricingRoutes from './src/routes/price.js';
// import WetTransfer from './src/routes/wettransfer.js';

// const prisma = new PrismaClient();
// const app = express();

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/cws', cwsRoutes);
// app.use('/api/site-collections', siteCollectionRoutes);
// app.use('/api/processing', processingRoutes);
// app.use('/api/bagging-off', BagOffRoutes);
// app.use('/api/transfer', TransferRoutes);
// app.use('/api/pricing', PricingRoutes);
// app.use('/api/wet-transfer', WetTransfer);


// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import swaggerUI from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

// Load environment variables
dotenv.config();

// Routes
import authRoutes from './src/routes/auth.js';
import purchaseRoutes from './src/routes/purchase.js';
import cwsRoutes from './src/routes/cws.js';
import siteCollectionRoutes from './src/routes/siteCollection.js';
import processingRoutes from './src/routes/processing.js';
import processingsRoutes from './src/routes/batches/batches.js';
import BagOffRoutes from './src/routes/bagoff.js';
import TransferRoutes from './src/routes/transfer.js';
import PricingRoutes from './src/routes/price.js';
import WetTransfer from './src/routes/wettransfer.js';
import SampleStorageRoutes from './src/routes/quality/sampleStorage.js';
import QualityRoutes from './src/routes/quality/quality.js';
import QualityDeliveryRoutes from './src/routes/quality/qualityDelivery.js';
import StockRoutes from './src/routes/Report/stock.js';

// Redis Configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Redis Error Handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Prisma Client
const prisma = new PrismaClient();

// Create Express App
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3300',
    'http://localhost:5173',
    'https://cherryapp.sucafina.com:9900',
    'https://cherryapp.sucafina.com:9901',
    'https://cherryapp.sucafina.com:5000',
    'https://cherryapp.sucafina.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['set-cookie']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Redis Initialization Middleware
async function initRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('Connected to Redis successfully');
    } catch (error) {
      console.error('Failed to connect to Redis', error);
    }
  }
}

// Server Setup
const PORT = process.env.PORT || 3000;

// Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cherry App API DOCUMENTATION",
      version: "1.0.0",
      description: "Cherry App Apis doc",
      contact: {
        name: "Api",
        email: "yves.iradukunda@sucafina.com",
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      { url: `http://localhost:${PORT}/api/` },
      { url: `https://cherryapp.sucafina.com:9901/api/` },
      { url: `https://cherryapp.sucafina.com:5000/api/` },

    ],
  },
  apis: ["./src/routes/**/*.js"],
};

const specs = swaggerJSDoc(options);
app.use("/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(specs)
);

// Handle preflight requests
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/cws', cwsRoutes);
app.use('/api/site-collections', siteCollectionRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/batches', processingsRoutes);
app.use('/api/bagging-off', BagOffRoutes);
app.use('/api/transfer', TransferRoutes);
app.use('/api/pricing', PricingRoutes);
app.use('/api/wet-transfer', WetTransfer);
app.use('/api/sample-storage', SampleStorageRoutes);
app.use('/api/quality', QualityRoutes);
app.use('/api/quality-delivery', QualityDeliveryRoutes);
app.use('/api/stock', StockRoutes);



// Initialize Server
async function startServer() {
  try {
    await initRedis();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful Shutdown
    process.on('SIGINT', async () => {
      await redisClient.quit();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { redisClient, prisma, app };

// Start the server
startServer();