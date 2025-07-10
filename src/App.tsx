import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import './App.css'
import { ConversationStateManager } from './services/ConversationState'
import { AudienceProcessor } from './services/AudienceProcessor'
import { ResponseGenerator } from './services/ResponseGenerator'
import type { FormattedResponse } from './services/ResponseGenerator'
import AudiencePanel from './components/AudiencePanel'
import ActionButtons from './components/ActionButtons'

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  booleanOutput?: string;
  files?: FileInfo[];
  actionButtons?: FormattedResponse['actionButtons'];
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ContextData {
  core: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [, setContextData] = useState<ContextData | null>(null);
  const [showAudiencePanel, setShowAudiencePanel] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const stateManager = useRef(new ConversationStateManager());
  const audienceProcessor = useRef(new AudienceProcessor());
  const responseGenerator = useRef(new ResponseGenerator());
  const [conversationState, setConversationState] = useState(stateManager.current.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateManager.current.subscribe((state) => {
      setConversationState(state);
    });
    return unsubscribe;
  }, []);
  
  // Show audience panel when audience is defined
  useEffect(() => {
    setShowAudiencePanel(conversationState.currentAudience.length > 0);
  }, [conversationState.currentAudience]);

  // Load context data on component mount
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const coreResponse = await fetch('/data/GWI_Core.txt');
        
        if (!coreResponse.ok) {
          throw new Error(`HTTP error! status: ${coreResponse.status}`);
        }

        const contextData: ContextData = {
          core: await coreResponse.text()
        };

        setContextData(contextData);
        console.log('GWI Core context data loaded successfully');
        
        // Show welcome message
        const welcomeResponse = responseGenerator.current.generateWelcomeMessage();
        const welcomeMessage: Message = {
          id: 'welcome-' + Date.now().toString(),
          content: welcomeResponse.content,
          type: 'bot',
          timestamp: new Date(),
          suggestions: welcomeResponse.suggestions,
          actionButtons: welcomeResponse.actionButtons
        };
        setMessages([welcomeMessage]);
        
      } catch (error) {
        console.error('Error loading context data:', error);
        const errorMessage: Message = {
          id: 'error-' + Date.now().toString(),
          content: "I'm having trouble accessing the GWI Core Q2 2024 data. Please refresh the page or try again later.",
          type: 'bot',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    };

    loadContextData();
  }, []);

  // Improved auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      };
      
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  // Additional scroll effect for loading state
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FileInfo[] = [];

    files.forEach(file => {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        const url = URL.createObjectURL(file);
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: url
        });
      }
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  // Remove attached file
  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle suggestion clicks
  const handleFeatureClick = (feature: string) => {
    const prompts = {
      'audience-interpretation': 'Help me interpret this audience: Professional males 30-45, managers in technology, active LinkedIn users',
      'boolean-translation': 'Translate to GWI Core: Millennial women interested in sustainability who buy organic products'
    };
    
    setInputMessage(prompts[feature as keyof typeof prompts]);
    setTimeout(() => {
      const input = document.querySelector('.input-field') as HTMLTextAreaElement;
      if (input) input.focus();
    }, 100);
  };

  const processMessage = async (userInput: string) => {
    setIsLoading(true);
    
    try {
      const currentAudience = conversationState.currentAudience;
      const result = audienceProcessor.current.processAudienceInput(userInput, currentAudience);
      
      // Update conversation state
      stateManager.current.updateAudience(result.segments);
      stateManager.current.updateContext(result.intent, result.suggestions);
      
      // Generate response
      const response = responseGenerator.current.generateResponse(
        result.segments,
        result.intent,
        result.suggestions
      );
      
      // Update current query if generating
      if (result.intent === 'generate_query') {
        const query = audienceProcessor.current.generateBooleanQuery(result.segments);
        stateManager.current.setCurrentQuery(query);
      }
      
      // Add to history
      stateManager.current.addToHistory(userInput, response.content, result.segments);
      
      // Create bot message
      const botMessage: Message = {
        id: 'msg-' + Date.now().toString(),
        content: response.content,
        type: 'bot',
        timestamp: new Date(),
        suggestions: response.suggestions,
        booleanOutput: response.booleanOutput,
        actionButtons: response.actionButtons
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now().toString(),
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question about GWI Core audience translation.",
        type: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;

    // Hide welcome section
    setShowWelcome(false);

    // Add user message with files
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage || 'Shared files for analysis',
      type: 'user',
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAttachedFiles([]);

    // Reset textarea height
    const textarea = document.querySelector('.input-field') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    // Process the message
    await processMessage(inputMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => {
      const input = document.querySelector('.input-field') as HTMLTextAreaElement;
      if (input) input.focus();
    }, 100);
  };

  const handleActionButtonClick = (action: 'add_criteria' | 'generate_query' | 'refine_audience' | 'clear_audience') => {
    switch (action) {
      case 'add_criteria':
        setInputMessage('Add more criteria to my audience');
        break;
      case 'generate_query':
        setInputMessage('Generate boolean query');
        break;
      case 'refine_audience':
        setInputMessage('Refine my current audience');
        break;
      case 'clear_audience':
        stateManager.current.clearAudience();
        setInputMessage('');
        break;
    }
    
    if (action !== 'clear_audience') {
      setTimeout(() => {
        const input = document.querySelector('.input-field') as HTMLTextAreaElement;
        if (input) input.focus();
      }, 100);
    }
  };

  const handleRemoveAudienceSegment = (segmentId: string) => {
    stateManager.current.removeAudienceSegment(segmentId);
  };

  const handleAddCriteria = () => {
    setInputMessage('Add more criteria to my audience');
    setTimeout(() => {
      const input = document.querySelector('.input-field') as HTMLTextAreaElement;
      if (input) input.focus();
    }, 100);
  };

  const handleGenerateQuery = () => {
    const query = audienceProcessor.current.generateBooleanQuery(conversationState.currentAudience);
    stateManager.current.setCurrentQuery(query);
    
    const response = responseGenerator.current.generateResponse(
      conversationState.currentAudience,
      'generate_query',
      ['Refine query', 'Add more criteria', 'Export to different format']
    );
    
    const botMessage: Message = {
      id: 'generate-' + Date.now().toString(),
      content: response.content,
      type: 'bot',
      timestamp: new Date(),
      suggestions: response.suggestions,
      booleanOutput: response.booleanOutput,
      actionButtons: response.actionButtons
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo-section">
          <div className="tbwa-section">
            <img src="/images/logo_tbwa_white.svg" alt="TBWA Logo" className="tbwa-logo" />
          </div>
          <div className="divider"></div>
          <div className="gwi-section">
            <img 
              src="https://cdn.brandfetch.io/idB_IK0frl/w/1280/h/960/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B"
              alt="GWI Logo"
              className="gwi-logo"
            />
            <div>
              <div className="gwi-title">Core Translator</div>
              <div className="core-subtitle">Boolean Logic Assistant</div>
            </div>
          </div>
        </div>
        <div className="robot-section">
          <div className="status-section">
            <div className="status-dot"></div>
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Audience Panel */}
        {showAudiencePanel && (
          <div className="audience-sidebar">
            <AudiencePanel
              segments={conversationState.currentAudience}
              onRemoveSegment={handleRemoveAudienceSegment}
              onAddCriteria={handleAddCriteria}
              onGenerateQuery={handleGenerateQuery}
              currentQuery={conversationState.context.currentQuery}
            />
          </div>
        )}
        
        <div className={`chat-container ${showAudiencePanel ? 'with-sidebar' : ''}`} ref={chatContainerRef}>
          {/* Welcome Section */}
          {showWelcome && (
            <div className="welcome-section">
              <h1 className="welcome-title">GWI Core Translator</h1>
              <p className="welcome-subtitle">Audience Translation & Boolean Logic Assistant</p>
              <p className="welcome-description">
                Translate audiences from external platforms (Meta, LinkedIn, YouGov) into boolean logic for GlobalWebIndex. 
                Using only documented variables from GWI Core Q2 2024 for precise and valid segmentation.
              </p>
              
              <div className="features-grid">
                <div className="feature-card" onClick={() => handleFeatureClick('audience-interpretation')}>
                  <div className="feature-title">Audience Interpretation</div>
                  <div className="feature-description">Analyze structured or descriptive audience inputs and identify key characteristics</div>
                </div>
                <div className="feature-card" onClick={() => handleFeatureClick('boolean-translation')}>
                  <div className="feature-title">Boolean Translation</div>
                  <div className="feature-description">Convert segments using only verified GWI Core Q2 2024 fields with valid boolean syntax</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* Files Display */}
                {message.files && message.files.length > 0 && (
                  <div className="message-files">
                    {message.files.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Boolean Output */}
              {message.booleanOutput && (
                <div className="boolean-output">
                  <div className="boolean-label">🔗 GWI Core Q2 2024 Boolean Output:</div>
                  {message.booleanOutput}
                </div>
              )}

              {/* Action Buttons */}
              {message.actionButtons && message.actionButtons.length > 0 && (
                <ActionButtons
                  buttons={message.actionButtons}
                  onButtonClick={handleActionButtonClick}
                  disabled={isLoading}
                />
              )}
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="suggestions-container">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-chip"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
              <span className="loading-text">Processing your audience translation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="input-container">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="attached-files">
              {attachedFiles.map((file, index) => (
                <div key={index} className="attached-file">
                  <span className="file-info">
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                  <button onClick={() => removeFile(index)} className="remove-file-btn">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="input-area">
            {/* Robot Section - Outside input wrapper */}
            <div className="input-robot-section">
              <img 
                src="/images/3D_AI_front_view.png"
                alt="AI Assistant"
                className="input-robot-image"
              />
            </div>
            
            <div className="input-wrapper">
            <textarea
                className="input-field"
                placeholder="Example: Describe your target audience (e.g., age, gender, interests, behaviors)"
              value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json"
                  style={{ display: 'none' }}
            />
            <button
                  className="attach-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip size={16} />
                </button>
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                >
                  <Send size={16} />
                  <span>Translate</span>
            </button>
              </div>
            </div>
          </div>
        </div>
        </div>
    </div>
  )
}

export default App
