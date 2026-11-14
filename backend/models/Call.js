import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true },
    customer: { type: String, default: 'Web Caller' },
    phone: { type: String, default: '+1 (555) 000-TEST' },
    agent: { type: String, required: true },
    duration: { type: String, default: '00:00' },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Urgent'], default: 'Positive' },
    outcome: { type: String, default: 'Completed Simulation' },
    cost: { type: String, default: '$0.00' },
    transcript: [
      {
        speaker: { type: String, enum: ['ai', 'user'] },
        text: String,
        time: String
      }
    ]
  },
  { timestamps: true }
);

const Call = mongoose.model('Call', callSchema);

export { Call };
export default Call;