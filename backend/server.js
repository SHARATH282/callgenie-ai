import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Agent from './models/Agent.js';
import Call from './models/Call.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ MONGODB_URI is not defined in your .env file!');
} else {
  mongoose
    .connect(mongoURI)
    .then(() => console.log('🍃 Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err.message));
}

// ----------------------------------------------------
// 1. HEALTH CHECK ROUTE
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    message: 'CallGenie AI Backend API is running with MongoDB & OmniDimension!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// 2. AGENT ROUTES
// ----------------------------------------------------

// GET: All AI agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a single new agent
app.post('/api/agents', async (req, res) => {
  try {
    const newAgent = new Agent(req.body);
    const saved = await newAgent.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SEED: Insert default agents (Supports both GET and POST for convenience)
const seedAgentsHandler = async (req, res) => {
  try {
    const count = await Agent.countDocuments();
    if (count > 0) {
      const existing = await Agent.find();
      return res.json({ message: 'Agents already exist in MongoDB!', agents: existing });
    }

    const defaultAgents = [
      {
        name: 'Mallishwari',
        role: 'Telugu Voice Assistant',
        voice: 'Cartesia - Ramya',
        latency: '220ms',
        successRate: '96.5%',
        status: 'ready'
      },
      {
        name: 'Sophia',
        role: 'Real Estate Sales Specialist',
        voice: 'ElevenLabs - Serena (Warm & Professional)',
        latency: '280ms',
        successRate: '94.8%',
        status: 'ready'
      },
      {
        name: 'Liam',
        role: 'Tier 1 Support & Verification',
        voice: 'OpenAI Realtime - Alloy (Crisp & Direct)',
        latency: '240ms',
        successRate: '96.2%',
        status: 'ready'
      },
      {
        name: 'Chloe',
        role: 'Medical Appointments & Triage',
        voice: 'Deepgram Aura - Asteria (Empathetic)',
        latency: '310ms',
        successRate: '92.5%',
        status: 'ready'
      }
    ];

    const created = await Agent.insertMany(defaultAgents);
    res.status(201).json({
      message: 'Default agents seeded successfully!',
      agents: created
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.post('/api/agents/seed', seedAgentsHandler);
app.get('/api/agents/seed', seedAgentsHandler);

// ----------------------------------------------------
// 3. CALL HISTORY ROUTES
// ----------------------------------------------------

// GET: All past calls
app.get('/api/calls', async (req, res) => {
  try {
    const calls = await Call.find().sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Save a completed call record
app.post('/api/calls', async (req, res) => {
  try {
    const newCall = new Call(req.body);
    const saved = await newCall.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. OMNIDIMENSION WEBHOOK ROUTE
// ----------------------------------------------------
app.post('/api/webhook/omnidimension', async (req, res) => {
  try {
    const data = req.body;
    console.log('📞 Received Call Webhook from OmniDimension:', data);

    // Format transcript entries safely
    let formattedTranscript = [];
    if (Array.isArray(data.transcript)) {
      formattedTranscript = data.transcript.map((t) => ({
        speaker: t.role === 'assistant' || t.speaker === 'agent' ? 'ai' : 'user',
        text: t.message || t.text || '',
        time: t.time || '00:00'
      }));
    } else if (data.summary) {
      formattedTranscript = [
        { speaker: 'ai', text: `Call Summary: ${data.summary}`, time: '00:01' }
      ];
    }

    // Create call record to store in MongoDB
    const newCall = new Call({
      callId: data.call_id || `OMNI-${Date.now().toString().slice(-6)}`,
      customer: data.caller_name || data.caller_phone || 'Inbound Caller',
      phone: data.caller_phone || '+1 (555) OMNI-AI',
      agent: data.agent_name || 'Sophia',
      duration: data.duration ? `${Math.floor(data.duration / 60)}m ${data.duration % 60}s` : '01:45',
      sentiment: data.sentiment || 'Positive',
      outcome: data.outcome || data.summary || 'Completed via OmniDimension Voice AI',
      cost: data.cost ? `$${data.cost.toFixed(2)}` : '$0.28',
      transcript: formattedTranscript
    });

    const savedCall = await newCall.save();
    console.log('💾 Successfully saved OmniDimension call to MongoDB with ID:', savedCall._id);

    res.status(200).json({
      success: true,
      message: 'Call logged to MongoDB successfully!',
      callId: savedCall.callId
    });
  } catch (error) {
    console.error('❌ OmniDimension Webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. START SERVER
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 CallGenie Backend listening on http://localhost:${PORT}`);
});