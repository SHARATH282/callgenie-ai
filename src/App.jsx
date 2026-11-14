import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
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
  ChevronRight,
  FileText,
  X,
  Zap
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calls, setCalls] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  
  // Call Simulator States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakingOutLoud, setIsSpeakingOutLoud] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState([]);
  const [simulatedInput, setSimulatedInput] = useState('');
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Fetch live Agents & Call records from MongoDB
  useEffect(() => {
    fetch(`${API_BASE_URL}/agents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
          setSelectedAgent(data[0]);
        }
      })
      .catch((err) => console.error('Error fetching agents:', err));

    fetch(`${API_BASE_URL}/calls`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCalls(data);
      })
      .catch((err) => console.error('Error fetching calls:', err));
  }, []);

  // 2. Setup Speech-to-Text (Microphone)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setSimulatedInput(spokenText);
        setIsListening(false);
        sendMessage(spokenText);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [isCalling, selectedAgent]);

  // 3. AI Voice Speech Synthesis (TTS - Speaks out loud)
  const speakAI = (text) => {
    if (!isSpeakingOutLoud || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Choose voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find((v) => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English'));
    if (femaleVoice) utterance.voice = femaleVoice;

    window.speechSynthesis.speak(utterance);
  };

  // 4. Timer logic
  useEffect(() => {
    if (isCalling) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
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
    if (!selectedAgent) return;
    setIsCalling(true);
    const greeting = `Hello! I am ${selectedAgent.name}, your voice AI assistant with CallGenie. How can I help you today?`;
    
    setLiveTranscript([
      {
        speaker: 'ai',
        text: greeting,
        time: '00:01'
      }
    ]);

    speakAI(greeting);
  };

  // 6. End Call & Save to MongoDB
  const handleEndCall = async () => {
    setIsCalling(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    if (liveTranscript.length > 0 && selectedAgent) {
      const newCallData = {
        callId: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: 'Live Tester',
        phone: '+1 (555) 000-TEST',
        agent: selectedAgent.name,
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
        const savedCall = await response.json();
        setCalls((prev) => [savedCall, ...prev]);
      } catch (err) {
        console.error('Error saving call to MongoDB:', err);
      }
    }
  };

  // 7. Send user message & generate AI response
  const sendMessage = (textToSend) => {
    const message = textToSend || simulatedInput;
    if (!message.trim() || !isCalling) return;

    const userMsg = {
      speaker: 'user',
      text: message,
      time: formatSeconds(callDuration)
    };

    setLiveTranscript((prev) => [...prev, userMsg]);
    setSimulatedInput('');

    // Generate intelligent AI response based on agent role
    setTimeout(() => {
      let aiReply = "I understand completely! I have recorded your request in our system.";
      const lower = message.toLowerCase();

      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
        aiReply = "Our platform plans start at $49 a month with ultra-low latency conversational AI.";
      } else if (lower.includes('schedule') || lower.includes('book') || lower.includes('appointment')) {
        aiReply = "I've checked our calendar and locked in that slot for you. A confirmation SMS is on its way!";
      } else if (lower.includes('who are you') || lower.includes('your name')) {
        aiReply = `I am ${selectedAgent.name}, configured as a ${selectedAgent.role}.`;
      } else if (lower.includes('hello') || lower.includes('hi')) {
        aiReply = `Hello there! How can I assist with your inquiry right now?`;
      }

      setLiveTranscript((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: aiReply,
          time: formatSeconds(callDuration + 1)
        }
      ]);

      speakAI(aiReply);
    }, 600);
  };

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is supported in Chrome & Edge browsers.');
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
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div className="brand-text">
            <h2>CallGenie<span>.ai</span></h2>
            <p>Voice AI Engine</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            <PhoneCall size={18} />
            <span>Call Records</span>
            <span className="badge-count">{calls.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Bot size={18} />
            <span>AI Voice Agents</span>
            <span className="badge-count">{agents.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="agent-status-card">
            <div className="status-indicator-live"></div>
            <div>
              <p className="status-title">MongoDB: Connected</p>
              <p className="status-subtitle">Voice Engine: Active</p>
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
              <Phone size={16} />
              <span>Launch Live AI Caller</span>
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
                <p>Deploy hyper-realistic voice agents with live speech synthesis and MongoDB Atlas storage.</p>
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
                <div className="stat-value">{calls.length}</div>
                <div className="stat-trend positive"><TrendingUp size={14} /> Saved in MongoDB</div>
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

            {/* CALL LOGS PREVIEW */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h3>Recent Incoming & Outbound Voice Sessions</h3>
                  <p>Calls stored permanently in your live MongoDB Atlas collection</p>
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

        {/* CALL RECORDS TAB */}
        {activeTab === 'calls' && (
          <div className="view-content">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2>All Call Transcripts ({calls.length})</h2>
                  <p>Stored in your live MongoDB database</p>
                </div>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Customer</th>
                    <th>Agent</th>
                    <th>Duration</th>
                    <th>Outcome</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((c, i) => (
                    <tr key={c._id || i}>
                      <td className="font-mono text-dim">{c.callId || `CALL-${i}`}</td>
                      <td><strong>{c.customer}</strong></td>
                      <td>{c.agent}</td>
                      <td>{c.duration}</td>
                      <td><span className="outcome-pill">{c.outcome}</span></td>
                      <td>
                        <button className="btn-inspect" onClick={() => setSelectedCall(c)}>
                          <FileText size={15} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* LIVE VOICE CALLER MODAL */}
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
              <button className="btn-close" onClick={() => setIsSimulatorOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="simulator-body">
              {!isCalling ? (
                <div className="pre-call-state">
                  <div className="agent-avatar-large">
                    <Bot size={48} />
                  </div>
                  <h3>Ready to Call {selectedAgent?.name || 'an Agent'}?</h3>
                  <p>Make sure your speaker volume is turned up to hear the AI speak!</p>

                  <div className="agent-selector-bar">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select Persona:</label>
                    <select
                      value={selectedAgent?._id || ''}
                      onChange={(e) => {
                        const ag = agents.find((a) => a._id === e.target.value);
                        if (ag) setSelectedAgent(ag);
                      }}
                      className="select-agent"
                    >
                      {agents.map((a) => (
                        <option key={a._id} value={a._id}>{a.name} - {a.role}</option>
                      ))}
                    </select>
                  </div>

                  <button className="btn-start-call" onClick={handleStartCall}>
                    <PhoneCall size={20} />
                    <span>Dial Agent Now</span>
                  </button>
                </div>
              ) : (
                <div className="active-call-state">
                  <div className="call-status-timer">
                    <span className="call-time">{formatSeconds(callDuration)}</span>
                    <span className="call-tag">VOICE CALL ACTIVE</span>
                  </div>

                  {/* WAVEFORM */}
                  <div className="waveform-container">
                    {[...Array(24)].map((_, idx) => (
                      <div
                        key={idx}
                        className="waveform-bar"
                        style={{
                          height: `${Math.max(15, Math.sin(idx + callDuration) * 45 + 50)}%`
                        }}
                      />
                    ))}
                  </div>

                  {/* TRANSCRIPT */}
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

                  {/* INPUT / MIC */}
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="simulator-input-form">
                    <input
                      type="text"
                      placeholder="Type or click the microphone to talk..."
                      value={simulatedInput}
                      onChange={(e) => setSimulatedInput(e.target.value)}
                    />
                    <button type="submit" className="btn-send-sim">Send</button>
                  </form>

                  {/* CALL CONTROLS */}
                  <div className="call-controls">
                    {/* Real Microphone button */}
                    <button
                      className={`control-circle ${isListening ? 'active-mute' : ''}`}
                      onClick={handleToggleMic}
                      title={isListening ? "Listening... click to stop" : "Click to speak with microphone"}
                    >
                      <Mic size={20} color={isListening ? '#f43f5e' : 'white'} />
                    </button>

                    {/* End Call */}
                    <button className="control-circle end-call-btn" onClick={handleEndCall} title="End Call">
                      <PhoneOff size={24} />
                    </button>

                    {/* Speaker Output toggle */}
                    <button
                      className="control-circle"
                      onClick={() => {
                        setIsSpeakingOutLoud(!isSpeakingOutLoud);
                        if (isSpeakingOutLoud && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                      }}
                      title={isSpeakingOutLoud ? "Speaker On" : "Speaker Muted"}
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