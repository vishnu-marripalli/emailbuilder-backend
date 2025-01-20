const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cors = require('cors');


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Use the CORS middleware
app.use(cors()); // Allows all origins by default

// Alternatively, restrict to specific origins
const corsOptions = {
  origin: 'https://emailbuilder-frontend.vercel.app', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'email-images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.json());

// MongoDB Schema and Model
const emailTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    sections: { type: Array, default: [] },
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

// API Endpoints

// 1. Create a New Email Template
app.post('/api/email-templates', async (req, res) => {
  const { title, sections } = req.body;

  try {
    const newTemplate = new EmailTemplate({ title, sections });
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create email template.' });
  }
});

// 2. Get All Email Templates
app.get('/api/email-templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.find();
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch email templates.' });
  }
});

// 3. Get a Single Email Template by ID
app.get('/api/email-templates/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    res.json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the email template.' });
  }
});

// 4. Update an Email Template
app.put('/api/email-templates/:id', async (req, res) => {
  const { id } = req.params;
  const { title, sections } = req.body;

  try {
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      { title, sections },
      { new: true }
    );
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    res.json(updatedTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update the email template.' });
  }
});

// 5. Delete an Email Template
app.delete('/api/email-templates/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);
    if (!deletedTemplate) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    res.json({ message: 'Template deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete the email template.' });
  }
});

// 6. Upload an Image to Cloudinary
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }
  res.json({ imageUrl: req.file.path });
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
