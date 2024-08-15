require('dotenv').config(); // Load .env file

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// Set up MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', // Fallback to localhost for development
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Define schemas and models
const contactSchema = new Schema({
  name: { type: String, unique: true },
  password: String, // Store hashed password here
});

const messageSchema = new Schema({
  sender: String,
  recipient: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);
const Message = mongoose.model('Message', messageSchema);

// Middleware to authenticate the user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register route with password hashing
app.post('/register', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.sendStatus(400);

  try {
    const existingContact = await Contact.findOne({ name });
    if (existingContact) return res.sendStatus(409); // Conflict

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newContact = new Contact({ name, password: hashedPassword });
    await newContact.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login route with password verification
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.sendStatus(400);

  try {
    const user = await Contact.findOne({ name });
    if (!user) return res.sendStatus(401); // Unauthorized

    const isMatch = await bcrypt.compare(password, user.password); // Compare hashed password
    if (!isMatch) return res.sendStatus(401); // Unauthorized

    const token = jwt.sign({ name }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login user' });
  }
});

// Get contacts
app.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await Contact.find().select('-password'); // Exclude passwords from response
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get messages
app.get('/messages/:contactName', authenticateToken, async (req, res) => {
  try {
    const { contactName } = req.params;
    const userName = req.user.name;
    const contactMessages = await Message.find({
      $or: [
        { sender: userName, recipient: contactName },
        { sender: contactName, recipient: userName },
      ],
    }).sort({ timestamp: 1 });

    res.json(contactMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  // When a user joins, they should join their room based on their username
  socket.on('joinRoom', (username) => {
    socket.join(username);
    // console.log(`${username} has joined their room`);
  });

  // Handle sending a message
  socket.on('sendMessage', async (message) => {
    message.timestamp = new Date(); // Set the timestamp
    try {
      const savedMessage = await Message.create(message); // Save the message to the database
      io.to(message.recipient).emit('receiveMessage', message); // Emit to recipient's room
      // io.to(message.sender).emit('receiveMessage', message); // Optionally emit to sender's room
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

