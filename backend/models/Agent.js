import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    voice: {
      type: String,
      default: 'ElevenLabs - Serena'
    },
    latency: {
      type: String,
      default: '280ms'
    },
    successRate: {
      type: String,
      default: '95.0%'
    },
    status: {
      type: String,
      default: 'ready'
    }
  },
  {
    timestamps: true
  }
);

const Agent = mongoose.model('Agent', agentSchema);

// Both exports so imports never fail:
export { Agent };
export default Agent;