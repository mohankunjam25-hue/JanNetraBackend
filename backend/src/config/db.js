const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Force use of Google DNS to avoid local DNS issues with MongoDB Atlas SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    logger.warn("Could not set custom DNS servers: %s", e.message);
}

// Set DNS result order to favor IPv4
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

/**
 * @description Connects to MongoDB using the URI provided in environment variables
 * Includes retry logic and enhanced error handling.
 */
const connectDB = async (retryCount = 5) => {
    if (!process.env.MONGODB_URI) {
        logger.error("ERROR: MONGODB_URI is not defined in .env file");
        process.exit(1);
    }

    const options = {
        // These options are often helpful for stability, though some are defaults in newer versions
        autoIndex: true,
        connectTimeoutMS: 30000, // Increased to 30 seconds
        socketTimeoutMS: 60000,  // Increased to 60 seconds
    };

    try {
        logger.info("Attempting to connect to MongoDB...");
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, options);
        
        logger.info("MongoDB connected !!");
        logger.info("DB HOST: %s", connectionInstance.connection.host);
        logger.info("DB NAME: %s", connectionInstance.connection.name);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB runtime error: %o', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        logger.error("MONGODB connection FAILED");
        logger.error("Error Name: %s", error.name);
        logger.error("Error Message: %s", error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            logger.error("HINT: This often means DNS resolution failed for the SRV record or the port is blocked.");
            logger.error("Try checking your Internet connection, VPN, or MongoDB Atlas IP Access List.");
        }

        if (retryCount > 0) {
            logger.info("Retrying connection in 5 seconds... (%d retries left)", retryCount);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB(retryCount - 1);
        } else {
            logger.error("All retry attempts failed. Exiting...");
            process.exit(1);
        }
    }
}

module.exports = connectDB;
