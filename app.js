const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user'); // Use uppercase 'User' for consistency
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { request } = require('http');

app.use(cookieParser());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/testDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const SECRET_KEY = "your_secret_key"; // Change this to an environment variable in production

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    
})
app.get('/Register', (req, res) => { 
  res.sendFile(path.join(__dirname, 'public', 'server.html'));
})

// Signup Route
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        console.log('User registered successfully', newUser);
        return res.redirect('/'); 

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "User registration failed" });
    }
});


// Login Route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user in the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) {
            console.log('Incorrect password');
            return res.redirect('/'); // Redirect if password is incorrect
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });

        // Set cookie with token
        res.cookie('token', token, { httpOnly: true, secure: false }); 

        // Redirect to dashboard after setting the token
        return res.redirect('/dashboard');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "User login failed" });
    }
});



// Protected Route Example
app.get('/dashboard', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ message: "Welcome to the dashboard"});
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
