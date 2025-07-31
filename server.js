const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');       // ✅ Needed globally
const session = require('express-session'); // ✅ NEW
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Add this before passport middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat', // Use a better secret in production
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set true if using HTTPS
      maxAge: 1000 * 60 * 10, // 10 minutes
    },
  })
);

// ✅ Required for passport-azure-ad to store state
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use('/auth', require('./routes/microsoftAuth'));

const PORT = process.env.PORT || 5200;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
