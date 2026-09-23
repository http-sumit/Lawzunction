import { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { Headphones, X, Phone, Bot, Send } from 'lucide-react';
import './FloatingContactWidget.css';

export default function FloatingContactWidget() {
  const { chatHistory, isBotTyping, handleChatSend } = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // Auto-hide on downward scroll & show on upward scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timeoutId = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY + 15 && currentScrollY > 150) {
        // Scrolling down -> hide button
        setIsVisible(false);
        setIsExpanded(false);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY < 100) {
        // Scrolling up or near top -> show button
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;

      // Reset inactivity timer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Scroll chatbot to bottom
  useEffect(() => {
    if (chatEndRef.current && isChatbotOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isBotTyping, isChatbotOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleChatSend(inputText);
      setInputText('');
    }
  };

  const quickQuestions = [
    'How do I book a consultation?',
    'What are the Client Portal credentials?',
    'Tell me about your Corporate practice',
    'Where are your offices located?'
  ];

  const phoneNumber = '+916263262661';
  const whatsappUrl = `https://api.whatsapp.com/send?phone=916263262661&text=${encodeURIComponent('Hello Lawzunction, I would like to request a callback regarding a legal inquiry.')}`;

  return (
    <>
      {/* Floating Action Trigger Container */}
      <div className={`floating-contact-container ${!isVisible && !isExpanded && !isChatbotOpen ? 'hidden-scroll' : ''}`}>
        
        {/* Expanded Glassmorphism Quick Action Menu */}
        {isExpanded && (
          <div className="quick-contact-menu animate-fade-in">
            <div className="menu-header">
              <span className="menu-header-title">Lawzunction Helpline</span>
              <button className="menu-close-btn" onClick={() => setIsExpanded(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="menu-options-list">
              {/* Option 1: Direct Call */}
              <a href={`tel:${phoneNumber}`} className="contact-option call-option" onClick={() => setIsExpanded(false)}>
                <div className="option-icon call-bg">
                  <Phone size={18} />
                </div>
                <div className="option-text">
                  <span className="option-title">Call Advocate</span>
                  <span className="option-sub">+91 6263262661</span>
                </div>
              </a>

              {/* Option 2: WhatsApp Chat */}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="contact-option whatsapp-option" onClick={() => setIsExpanded(false)}>
                <div className="option-icon whatsapp-bg">
                  <svg className="option-wa-svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="option-text">
                  <span className="option-title">WhatsApp Chat</span>
                  <span className="option-sub">24/7 Available</span>
                </div>
              </a>

              {/* Option 3: AI Assistant */}
              <button className="contact-option bot-option" onClick={() => { setIsChatbotOpen(true); setIsExpanded(false); }}>
                <div className="option-icon bot-bg">
                  <Bot size={18} />
                </div>
                <div className="option-text">
                  <span className="option-title">AI Legal Assistant</span>
                  <span className="option-sub">Instant Legal Guidance</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Single Trigger Floating Button */}
        <button
          className={`floating-trigger-btn ${isExpanded ? 'active' : ''}`}
          onClick={() => {
            if (isChatbotOpen) {
              setIsChatbotOpen(false);
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          aria-label="Toggle contact menu"
        >
          {isExpanded || isChatbotOpen ? (
            <X size={22} />
          ) : (
            <>
              <Headphones size={22} />
              <span className="trigger-pulse-dot"></span>
            </>
          )}
          <span className="trigger-tooltip">
            {isExpanded || isChatbotOpen ? 'Close' : 'Quick Contact'}
          </span>
        </button>
      </div>

      {/* Full AI Chatbot Window */}
      {isChatbotOpen && (
        <div className="chatbot-window animate-fade-in">
          <div className="chat-header">
            <div className="chat-header-info">
              <Bot className="bot-icon" />
              <div>
                <h4>Lawzunction AI</h4>
                <p>Legal Assistant • Online</p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsChatbotOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages-container">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message-bubble ${msg.sender}`}>
                {msg.sender === 'bot' && <Bot className="bubble-bot-icon" />}
                <div className="message-content-wrapper">
                  <div className="message-text-bubble">
                    {msg.text}
                  </div>
                  {msg.time && (
                    <span className="message-timestamp">{msg.time}</span>
                  )}
                </div>
              </div>
            ))}
            {isBotTyping && (
              <div className="chat-message-bubble bot typing-indicator-bubble animate-fade-in">
                <Bot className="bubble-bot-icon" />
                <div className="message-content-wrapper">
                  <div className="message-text-bubble typing-bubble">
                    <span className="typing-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                    <span className="typing-label">Analyzing inquiry...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Option Chips */}
          <div className="chat-quick-options">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="quick-option-chip"
                onClick={() => handleChatSend(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask a legal query..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
