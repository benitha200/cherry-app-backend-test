// import express from 'express';
// import cors from 'cors';
// import { PrismaClient } from '@prisma/client';
// import dotenv from 'dotenv';
// import swaggerUI from "swagger-ui-express";
// import swaggerJSDoc from "swagger-jsdoc";

// // Load environment variables
// dotenv.config();

// // Routes
// import authRoutes from './src/routes/auth.js';
// import purchaseRoutes from './src/routes/purchase.js';
// import cwsRoutes from './src/routes/cws.js';
// import siteCollectionRoutes from './src/routes/siteCollection.js';
// import processingRoutes from './src/routes/processing.js';
// import processingsRoutes from './src/routes/batches/batches.js';
// import BagOffRoutes from './src/routes/bagoff.js';
// import TransferRoutes from './src/routes/transfer.js';
// import PricingRoutes from './src/routes/price.js';
// import WetTransfer from './src/routes/wettransfer.js';
// import SampleStorageRoutes from './src/routes/quality/sampleStorage.js';
// import QualityRoutes from './src/routes/quality/quality.js';
// import QualityDeliveryRoutes from './src/routes/quality/qualityDelivery.js';
// import StockRoutes from './src/routes/Report/stock.js';

// // Prisma Client
// const prisma = new PrismaClient();

// // Create Express App
// const app = express();

// // CORS Configuration
// const corsOptions = {
//   origin: [
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'http://localhost:3002',
//     'http://localhost:3003',
//     'http://localhost:3300',
//     'http://localhost:5173',
//     'https://cherryapp.sucafina.com:9900',
//     'https://cherryapp.sucafina.com:9901',
//     'https://cherryapp.sucafina.com:5000',
//     'https://cherryapp.sucafina.com',
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Origin',
//     'X-Requested-With',
//     'Content-Type',
//     'Accept',
//     'Authorization',
//     'Cache-Control',
//     'Pragma'
//   ],
//   exposedHeaders: ['set-cookie']
// };

// // Middleware
// app.use(cors(corsOptions));
// app.use(express.json());

// // Server Setup
// const PORT = process.env.PORT || 3000;

// // Swagger
// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Cherry App API DOCUMENTATION",
//       version: "1.0.0",
//       description: "Cherry App Apis doc",
//       contact: {
//         name: "Api",
//         email: "yves.iradukunda@sucafina.com",
//       },
//     },
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//         },
//       },
//     },
//     security: [
//       {
//         bearerAuth: [],
//       },
//     ],
//     servers: [
//       { url: `http://localhost:${PORT}/api/` },
//       { url: `https://cherryapp.sucafina.com:9901/api/` },
//       { url: `https://cherryapp.sucafina.com:5000/api/` },
//     ],
//   },
//   apis: ["./src/routes/**/*.js"],
// };

// const specs = swaggerJSDoc(options);
// app.use("/api-docs",
//   swaggerUI.serve,
//   swaggerUI.setup(specs)
// );

// // Handle preflight requests
// app.options('*', cors(corsOptions));

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     message: 'Server is running',
//     timestamp: new Date().toISOString()
//   });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/purchases', purchaseRoutes);
// app.use('/api/cws', cwsRoutes);
// app.use('/api/site-collections', siteCollectionRoutes);
// app.use('/api/processing', processingRoutes);
// app.use('/api/batches', processingsRoutes);
// app.use('/api/bagging-off', BagOffRoutes);
// app.use('/api/transfer', TransferRoutes);
// app.use('/api/pricing', PricingRoutes);
// app.use('/api/wet-transfer', WetTransfer);
// app.use('/api/sample-storage', SampleStorageRoutes);
// app.use('/api/quality', QualityRoutes);
// app.use('/api/quality-delivery', QualityDeliveryRoutes);
// app.use('/api/stock', StockRoutes);

// // Initialize Server
// async function startServer() {
//   try {
//     const server = app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });

//     // Graceful Shutdown
//     process.on('SIGINT', async () => {
//       server.close(() => {
//         console.log('Server closed');
//         process.exit(0);
//       });
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Export for use in other modules
// export { prisma, app };

// // Start the server
// startServer();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import swaggerUI from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

// Load environment variables
dotenv.config();

// DATABASE URL CONSTRUCTION - Add this BEFORE Prisma initialization
const databaseUrl = `mysql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
console.log("Database URL:", databaseUrl.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs
process.env.DATABASE_URL = databaseUrl;

// Routes
import authRoutes from './src/routes/auth.js';
import purchaseRoutes from './src/routes/purchase.js';
import cwsRoutes from './src/routes/cws.js';
import siteCollectionRoutes from './src/routes/siteCollection.js';
import processingRoutes from './src/routes/processing.js';
import processingsRoutes from './src/routes/batches/batches.js';
import BagOffRoutes from './src/routes/bagoff.js';
import TransferRoutes from './src/routes/transfer.js';
import PricingRoutes from './src/routes/pricing.js';
import WetTransfer from './src/routes/wettransfer.js';
import SampleStorageRoutes from './src/routes/quality/sampleStorage.js';
import QualityRoutes from './src/routes/quality/quality.js';
import QualityDeliveryRoutes from './src/routes/quality/qualityDelivery.js';
import StockRoutes from './src/routes/Report/stock.js';

// Prisma Client - Now initialized with constructed DATABASE_URL
const prisma = new PrismaClient();

// Create Express App
const app = express();

// CORS Configuration - Updated for Kubernetes ingress
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3300',
    'http://localhost:5173',
    // Add ingress hostnames
    'http://dev.cherry-app.local',
    'http://staging.cherry-app.local',
    'http://prod.cherry-app.com',
    'https://dev.cherry-app.local',
    'https://staging.cherry-app.local',
    'https://prod.cherry-app.com',
    // Keep existing production URLs
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

// Server Setup
const PORT = process.env.PORT || 3000;

// Swagger Configuration - Updated for multiple environments
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cherry App API DOCUMENTATION",
      version: "1.0.0",
      description: "Cherry App APIs documentation",
      contact: {
        name: "API Support",
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
      { url: `http://localhost:${PORT}/api/`, description: "Local Development" },
      { url: `http://dev.cherry-app.local/api/`, description: "Development Environment" },
      { url: `http://staging.cherry-app.local/api/`, description: "Staging Environment" },
      { url: `http://prod.cherry-app.com/api/`, description: "Production Environment" },
      { url: `https://cherryapp.sucafina.com:9901/api/`, description: "Legacy Production" },
      { url: `https://cherryapp.sucafina.com:5000/api/`, description: "Legacy Staging" },
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

// Health check endpoint - Enhanced for environment info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_HOST || 'localhost',
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

// Initialize Server with database connection test
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Shutting down server...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { prisma, app };

// Start the server
startServer();
