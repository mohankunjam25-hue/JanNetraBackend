const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Global Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cookieParser());

// Morgan HTTP request logger
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN?.split(","),
    credentials: true
}));

app.use(express.static(path.join(__dirname, "../public")));

// JSON and URL-encoded body parsers for all routes, before any specific router
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Routes Import
const userRouter = require('./routes/user.routes');
const postRouter = require('./routes/post.routes');
const commentRouter = require('./routes/comment.routes');
const notificationRouter = require('./routes/notification.routes');
const chatRouter = require('./routes/chat.routes');
const reportRouter = require('./routes/report.routes');

// The post router handles multipart/form-data, so it must be configured
// AFTER the global JSON and urlencoded body parsers, so express.json() is run first
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/reports", reportRouter);


// Routes Declaration
app.use("/api/v1/users", userRouter);


// Default Route
app.get('/', (req, res) => {
    res.json({ message: "RealJanNetra API is running..." });
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = { app };
