var express = require('express');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config()

const errorHandler = require('./middlewares/errorMiddleware');

//Import Routes
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var emergencyRouter = require('./routes/emergency');
var chatbotRoutes = require("./routes/chatbot");

var app = express();
connectDB();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use Routes
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/emergency',emergencyRouter);
app.use('/chatbot', chatbotRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Use error handling middleware
app.use(errorHandler);

module.exports = app;