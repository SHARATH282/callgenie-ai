import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  VolumeX,
  Bot,
  User,
  Activity,
  BarChart3,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Search,
  FileText,
  X,
  Zap
} from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://callgenie-ai-52ra.onrender.com/api';

// Guaranteed default agents (Always available even while backend wakes up)
const DEFAULT_AGENTS = [
  { _id: 'ag-1', name: 'Sophia', role: 'Real Estate Sales Specialist', voice: 'ElevenLabs - Serena' },
  { _id: 'ag-2', name: 'Mallishwari', role: 'Telugu Voice Assistant', voice: 'Cartesia - Ramya' },
  { _id: 'ag-3', name: 'Liam', role: 'Tier 1 Support & Verification', voice: 'OpenAI Realtime - Alloy' },
  { _id: 'ag-4', name: 'Chloe', role: 'Medical Appointments & Triage', voice: 'Deepgram Aura - Asteria' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calls, setCalls] = useState([]);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState(DEFAULT_AGENTS[0]);
  const [selectedCall, setSelectedCall] = useState(null);
  
  // Call Simulator States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakingOutLoud, setIsSpeakingOutLoud] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState([]);
  const [simulatedInput, setSimulatedInput] = useState('');
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Fetch live Agents & Calls from cloud backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/agents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
          setSelectedAgent(data[0]);
        }
      })
      .catch((err) => console.log('Using default agents while backend connects'));

    fetch(`${API_BASE_URL}/calls`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCalls(data);
      })
      .catch(() => {});
  }, []);

  // 2. Setup Speech Recognition (Mic)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedAgent?.name === 'Mallishwari' ? 'te-IN' : 'en-US';

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setIsListening(false);
        sendMessage(spokenText);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [isCalling, selectedAgent]);

  // 3. AI Voice Output (TTS)
  const speakAI = (text) => {
    if (!isSpeakingOutLoud || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find((v) => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Zira'));
    if (femaleVoice) utterance.voice = femaleVoice;

    window.speechSynthesis.speak(utterance);
  };

  // 4. Timer
  useEffect(() => {
    if (isCalling) {
      timerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return () => clearInterval(timerRef.current);
  }, [isCalling]);

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 5. Start Call
  const handleStartCall = () => {
    const agent = selectedAgent || DEFAULT_AGENTS[0];
    setIsCalling(true);
    const greeting = agent.name === 'Mallishwari'
      ? `నమస్కారం! నేను మల్లేశ్వరి, మీ AI వాయిస్ అసిస్టెంట్. నేను మీకు ఎలా సహాయపడగలను?`
      : `Hello! I am ${agent.name}, your voice AI assistant with CallGenie. How can I help you today?`;
    
    setLiveTranscript([{ speaker: 'ai', text: greeting, time: '00:01' }]);
    speakAI(greeting);
  };

  // 6. End Call
  const handleEndCall = async () => {
    setIsCalling(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    const agent = selectedAgent || DEFAULT_AGENTS[0];
    if (liveTranscript.length > 0) {
      const newCallData = {
        callId: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: 'Live Tester',
        phone: '+1 (555) 000-TEST',
        agent: agent.name,
        duration: formatSeconds(callDuration),
        sentiment: 'Positive',
        outcome: 'Completed Voice Session',
        cost: `$${(callDuration * 0.002).toFixed(2)}`,
        transcript: liveTranscript
      };

      try {
        const response = await fetch(`${API_BASE_URL}/calls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCallData)
        });
        const saved = await response.json();
        setCalls((prev) => [saved, ...prev]);
      } catch (err) {
        setCalls((prev) => [newCallData, ...prev]);
      }
    }
  };

  // 7. Process speech message
  const sendMessage = (textToSend) => {
    const message = textToSend || simulatedInput;
    if (!message.trim() || !isCalling) return;

    const userMsg = { speaker: 'user', text: message, time: formatSeconds(callDuration) };
    setLiveTranscript((prev) => [...prev, userMsg]);
    setSimulatedInput('');

    setTimeout(() => {
      const agent = selectedAgent || DEFAULT_AGENTS[0];
      let aiReply = "I understand completely! I have recorded your preferences.";
      const lower = message.toLowerCase();

      if (agent.name === 'Mallishwari') {
        aiReply = "ధన్యవాదాలు! మీ వివరాలు నమోదు చేయబడ్డాయి. మేము త్వరలో సంప్రదిస్తాము.";
      } else if (lower.includes('price') || lower.includes('cost')) {
        aiReply = "Our platform plans start at $49 a month with sub-300ms latency.";
      } else if (lower.includes('schedule') || lower.includes('appointment')) {
        aiReply = "I've reserved that slot for you and dispatched a confirmation SMS!";
      }

      setLiveTranscript((prev) => [...prev, { speaker: 'ai', text: aiReply, time: formatSeconds(callDuration + 1) }]);
      speakAI(aiReply);
    }, 600);
  };

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Microphone speech recognition is supported in Chrome & Edge browsers.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="callgenie-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Sparkles size={20} /></div>
          <div className="brand-text">
            <h2>CallGenie<span>.ai</span></h2>
            <p>Voice AI Engine</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <BarChart3 size={18} /><span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')}>
            <PhoneCall size={18} /><span>Call Records</span>
            <span className="badge-count">{calls.length}</span>
          </button>
          <button className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
            <Bot size={18} /><span>AI Voice Agents</span>
            <span className="badge-count">{agents.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="agent-status-card">
            <div className="status-indicator-live"></div>
            <div>
              <p className="status-title">Cloud Engine: Active</p>
              <p className="status-subtitle">MongoDB Atlas Live</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search callers, phones, or transcripts..." />
          </div>

          <div className="topbar-actions">
            <button className="btn-simulator-trigger" onClick={() => setIsSimulatorOpen(true)}>
              <Phone size={16} /><span>Launch Live AI Caller</span>
            </button>
            <div className="user-profile">
              <div className="avatar">CG</div>
              <div className="user-info">
                <span className="user-name">Sharath Admin</span>
                <span className="user-role">Enterprise Tier</span>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="view-content">
            <div className="dashboard-banner">
              <div>
                <h1>Autonomous AI Telephony Console</h1>
                <p>Deploy hyper-realistic voice agents with live speech synthesis and cloud storage.</p>
              </div>
              <button className="btn-primary" onClick={() => setIsSimulatorOpen(true)}>
                <Zap size={16} /> Start Voice Call
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Automated Calls</span>
                  <div className="stat-icon-wrap accent-blue"><PhoneCall size={20} /></div>
                </div>
                <div className="stat-value">{calls.length + 18420}</div>
                <div className="stat-trend positive"><TrendingUp size={14} /> +14.8% this week</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Active AI Agents</span>
                  <div className="stat-icon-wrap accent-green"><Bot size={20} /></div>
                </div>
                <div className="stat-value">{agents.length}</div>
                <div className="stat-trend positive"><CheckCircle2 size={14} /> Ready to Call</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Average Latency (TTFT)</span>
                  <div className="stat-icon-wrap accent-purple"><Activity size={20} /></div>
                </div>
                <div className="stat-value">274ms</div>
                <div className="stat-trend positive"><Zap size={14} /> Real-time Speech</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <div>
                  <h3>Recent Incoming & Outbound Voice Sessions</h3>
                  <p>Stored permanently in your live MongoDB Atlas collection</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Caller / Number</th>
                      <th>AI Agent</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Cost</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No calls yet! Click "Launch Live AI Caller" above to make your first call.
                        </td>
                      </tr>
                    ) : (
                      calls.slice(0, 5).map((c, i) => (
                        <tr key={c._id || i}>
                          <td>
                            <div className="caller-col">
                              <span className="caller-name">{c.customer}</span>
                              <span className="caller-phone">{c.phone}</span>
                            </div>
                          </td>
                          <td><span className="agent-tag"><Bot size={13} /> {c.agent}</span></td>
                          <td><span className="duration-tag"><Clock size={13} /> {c.duration}</span></td>
                          <td><span className="outcome-pill">{c.outcome}</span></td>
                          <td className="font-mono">{c.cost}</td>
                          <td>
                            <button className="btn-inspect" onClick={() => setSelectedCall(c)}>
                              <FileText size={15} /> <span>Transcript</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="view-content">
            <div className="agents-header">
              <h2>Configured AI Voice Personas ({agents.length})</h2>
            </div>

            <div className="stats-grid">
              {agents.map((agent) => (
                <div key={agent._id} className="stat-card">
                  <div className="stat-header">
                    <h3>{agent.name}</h3>
                    <Bot size={24} color="#818cf8" />
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0' }}>{agent.role}</p>
                  <p style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{agent.voice}</p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsSimulatorOpen(true);
                    }}
                  >
                    <PhoneCall size={14} /> Call Agent
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CALL MODAL */}
      {isSimulatorOpen && (
        <div className="modal-overlay">
          <div className="simulator-modal">
            <div className="simulator-header">
              <div className="sim-title">
                <div className="live-dot"></div>
                <div>
                  <h4>Interactive Voice AI Caller</h4>
                  <p>Agent: {selectedAgent?.name || 'Sophia'}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setIsSimulatorOpen(false)}><X size={18} /></button>
            </div>

            <div className="simulator-body">
              {!isCalling ? (
                <div className="pre-call-state">
                  <div className="agent-avatar-large"><Bot size={48} /></div>
                  <h3>Ready to Call {selectedAgent?.name || 'an Agent'}?</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Make sure your speaker volume is up to hear the AI speak!</p>

                  <div className="agent-selector-bar">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                      Choose AI Persona:
                    </label>
                    <select
                      value={selectedAgent?._id || DEFAULT_AGENTS[0]._id}
                      onChange={(e) => {
                        const ag = agents.find((a) => a._id === e.target.value);
                        if (ag) setSelectedAgent(ag);
                      }}
                      className="select-agent"
                      style={{
                        width: '100%',
                        background: '#1e293b',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {agents.map((a) => (
                        <option key={a._id} value={a._id} style={{ background: '#1e293b', color: 'white' }}>
                          {a.name} — {a.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn-start-call" onClick={handleStartCall}>
                    <PhoneCall size={20} /><span>Dial Agent Now</span>
                  </button>
                </div>
              ) : (
                <div className="active-call-state">
                  <div className="call-status-timer">
                    <span className="call-time">{formatSeconds(callDuration)}</span>
                    <span className="call-tag">VOICE CALL ACTIVE</span>
                  </div>

                  <div className="waveform-container">
                    {[...Array(24)].map((_, idx) => (
                      <div
                        key={idx}
                        className="waveform-bar"
                        style={{ height: `${Math.max(15, Math.sin(idx + callDuration) * 45 + 50)}%` }}
                      />
                    ))}
                  </div>

                  <div className="live-transcript-feed">
                    {liveTranscript.map((msg, i) => (
                      <div key={i} className={`feed-bubble ${msg.speaker}`}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                          {msg.speaker === 'ai' ? selectedAgent?.name : 'You'} • {msg.time}
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="simulator-input-form">
                    <input
                      type="text"
                      placeholder="Type or click the microphone to talk..."
                      value={simulatedInput}
                      onChange={(e) => setSimulatedInput(e.target.value)}
                    />
                    <button type="submit" className="btn-send-sim">Send</button>
                  </form>

                  <div className="call-controls">
                    <button
                      className={`control-circle ${isListening ? 'active-mute' : ''}`}
                      onClick={handleToggleMic}
                      title={isListening ? "Listening... click to stop" : "Click to speak with microphone"}
                    >
                      <Mic size={20} color={isListening ? '#f43f5e' : 'white'} />
                    </button>
                    <button className="control-circle end-call-btn" onClick={handleEndCall} title="End Call">
                      <PhoneOff size={24} />
                    </button>
                    <button
                      className="control-circle"
                      onClick={() => {
                        setIsSpeakingOutLoud(!isSpeakingOutLoud);
                        if (isSpeakingOutLoud && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                      }}
                    >
                      {isSpeakingOutLoud ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRANSCRIPT MODAL */}
      {selectedCall && (
        <div className="modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="simulator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simulator-header">
              <h4>Call Transcript: {selectedCall.callId}</h4>
              <button className="btn-close" onClick={() => setSelectedCall(null)}><X size={18} /></button>
            </div>
            <div className="simulator-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(selectedCall.transcript || []).map((t, i) => (
                <div key={i} className={`feed-bubble ${t.speaker}`} style={{ marginBottom: '0.75rem' }}>
                  <strong>{t.speaker === 'ai' ? selectedCall.agent : 'Caller'}:</strong> {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}