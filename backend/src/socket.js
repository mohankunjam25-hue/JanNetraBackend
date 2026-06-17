const { Server } = require("socket.io");
const mongoose = require("mongoose");
const logger = require("./utils/logger");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN?.split(","),
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        logger.info("A user connected: %s", socket.id);

        socket.on("join_id", (userId) => {
            socket.join(userId);
            logger.info("User %s joined their private room", userId);
        });

        socket.on("disconnect", () => {
            logger.info("User disconnected: %s", socket.id);
        });
    });

    // Listen for changes in MongoDB
    setupChangeStreams();

    return io;
};

const setupChangeStreams = () => {
    const db = mongoose.connection;

    // Watch Posts collection
    const postCollection = db.collection("posts");
    const postChangeStream = postCollection.watch();

    postChangeStream.on("change", (change) => {
        logger.info("Post Collection Change: %s", change.operationType);
        // Notify all connected clients about the change
        io.emit("posts_changed", {
            type: change.operationType,
            postId: change.documentKey._id
        });
    });

    // Watch Users collection
    const userCollection = db.collection("users");
    const userChangeStream = userCollection.watch();

    userChangeStream.on("change", (change) => {
        logger.info("User Collection Change: %s", change.operationType);
        io.emit("user_changed", {
            type: change.operationType,
            userId: change.documentKey._id
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIO };
