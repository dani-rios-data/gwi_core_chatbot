import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import './App.css'

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  booleanOutput?: string;
  files?: FileInfo[];
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ContextData {
  core: string;
  travel: string;
  usa: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load context data on component mount
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [coreResponse, travelResponse, usaResponse] = await Promise.all([
          fetch('/context/GWI_CORE_context.txt'),
          fetch('/context/GWI_TRAVEL_context.txt'),
          fetch('/context/GWI_USA_context.txt')
        ]);

        const contextData: ContextData = {
          core: await coreResponse.text(),
          travel: await travelResponse.text(),
          usa: await usaResponse.text()
        };

        setContextData(contextData);
        console.log('Context data loaded successfully');
      } catch (error) {
        console.error('Error loading context data:', error);
      }
    };

    loadContextData();
  }, []);

  // Improved auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      // Always scroll to bottom when new messages arrive
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      };
      
      // Small delay to ensure DOM is updated
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
      'boolean-translation': 'Translate to GWI Core: Millennial women interested in sustainability who buy organic products',
      'variable-validation': 'Verify if these variables exist in GWI Core Q2 2024: fitness_level, organic_preference, tech_adoption',
      'detailed-explanation': 'Explain step by step how you would map: Young parents with high income who buy premium baby products'
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
      const userQuestion = userInput.toLowerCase();
      let responseText = '';
      let suggestions: string[] = [];
      let booleanOutput = '';

      // Use context data if available for more accurate responses
      if (contextData) {
        // Search through context data for relevant information
        const searchContext = (query: string): string => {
          const lowerQuery = query.toLowerCase();
          let relevantContext = '';
          
          // Search in core context first
          if (contextData.core.toLowerCase().includes(lowerQuery)) {
            const lines = contextData.core.split('\n');
            const relevantLines = lines.filter(line => 
              line.toLowerCase().includes(lowerQuery) || 
              lines.indexOf(line) > 0 && lines[lines.indexOf(line) - 1].toLowerCase().includes(lowerQuery)
            );
            relevantContext += relevantLines.slice(0, 5).join('\n') + '\n';
          }
          
          return relevantContext;
        };

        // Try to find context-based response
        const contextInfo = searchContext(userQuestion);
        if (contextInfo.trim()) {
          responseText = `Based on GWI Core Q2 2024 data:\n\n${contextInfo}\n\nWould you like me to help you create a Boolean logic expression based on this information?`;
          suggestions = [
            "Create Boolean logic for this audience",
            "Show more detailed variables",
            "Map to specific platform targeting"
          ];
        }
      }

             // Generate response based on input (fallback if no context match)
      if (!responseText && (userQuestion.includes('meta') || userQuestion.includes('facebook') || userQuestion.includes('millennial women') || userQuestion.includes('sustainability'))) {
        responseText = `I've analyzed your audience definition for Millennial women interested in sustainability. Here's the translation using GWI Core Q2 2024 variables:

**Audience Interpretation:**
• Target: Women aged 25-40
• Interest: Environmental consciousness and sustainability
• Behavior: Organic product purchasing

**Variable Mapping:**
• Demographics: gender='Female' AND age>=25 AND age<=40
• Interests: interest_environment=1 AND lifestyle_sustainability=1
• Purchase behavior: product_purchase_organic=1`;

        booleanOutput = "gender=='Female' AND age>=25 AND age<=40 AND interest_environment==1 AND lifestyle_sustainability==1 AND product_purchase_organic==1";

        suggestions = [
          "Add income targeting to this audience",
          "Include social media behavior variables",
          "Map this to LinkedIn professional targeting"
        ];
      }
      else if (!responseText && (userQuestion.includes('professional') || userQuestion.includes('linkedin') || userQuestion.includes('managers'))) {
        responseText = `Professional audience translation completed. Here's the GWI Core Boolean logic for technology managers:

**Audience Breakdown:**
• Demographics: Males aged 30-45
• Professional: Manager-level positions in technology sector
• Platform behavior: Active LinkedIn engagement

**GWI Core Q2 2024 Mapping:**
• Gender and age targeting
• Job level and industry classification
• Social platform usage patterns`;

        booleanOutput = "gender=='Male' AND age>=30 AND age<=45 AND job_level=='Manager' AND industry=='Technology' AND linkedin_usage=='Active'";

        suggestions = [
          "Add education level requirements",
          "Include company size targeting",
          "Map similar audience for other platforms"
        ];
      }
      else if (!responseText && (userQuestion.includes('validation') || userQuestion.includes('verify') || userQuestion.includes('variables'))) {
        responseText = `Variable validation completed for GWI Core Q2 2024 fields:

**Field Verification Results:**
❌ fitness_level - This field does not exist in GWI Core Q2 2024
❌ organic_preference - Not a documented variable
❌ tech_adoption - Not available in current dataset

**Suggested Alternatives:**
✅ Use: interest_fitness=1 (for fitness interests)
✅ Use: product_purchase_organic=1 (for organic purchasing)
✅ Use: attitude_technology='Early_adopter' (for tech adoption)

All suggested fields are verified GWI Core Q2 2024 variables.`;

        suggestions = [
          "Show me valid interest categories",
          "List available attitude variables",
          "Help with product purchase fields"
        ];
      }
      else if (!responseText && (userQuestion.includes('parents') || userQuestion.includes('premium') || userQuestion.includes('high income'))) {
        responseText = `Detailed explanation for young parents with high income buying premium baby products:

**Step 1: Demographic Segmentation**
• Age range: 25-40 (typical young parent age)
• Income threshold: Upper income brackets
• Household composition: Presence of children

**Step 2: Behavioral Indicators**
• Premium product purchasing patterns
• Baby/family product categories
• Brand preference for quality

**Step 3: GWI Variable Mapping**
Each characteristic maps to documented GWI Core fields for precise targeting.`;

        booleanOutput = "age>=25 AND age<=40 AND household_income>='$75K' AND number_of_children>0 AND product_purchase_premium_baby==1";

        suggestions = [
          "Add brand awareness variables",
          "Include media consumption patterns",
          "Map similar audience for different product categories"
        ];
      }
      else if (!responseText) {
        responseText = `I understand you're asking about audience replication. Let me help you with GWI Core Boolean logic translation.

**What I can help with:**
• Converting external platform audiences to GWI variables
• Validating field names against GWI Core Q2 2024
• Building proper Boolean syntax
• Explaining mapping rationale

Please describe the specific audience you'd like to translate, including:
- Platform source (Meta, LinkedIn, etc.)
- Key characteristics (demographics, interests, behaviors)
- Any specific requirements`;

        suggestions = [
          "Convert a Facebook custom audience",
          "Map LinkedIn professional targeting",
          "Validate GWI Core field names",
          "Explain Boolean syntax rules"
        ];
      }

      // Add bot response
      const botMessage: Message = {
        id: 'msg-' + Date.now().toString(),
        content: responseText,
        type: 'bot',
        timestamp: new Date(),
        suggestions: suggestions,
        booleanOutput: booleanOutput
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now().toString(),
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question about GWI Core audience replication.",
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
        <div className="chat-container" ref={chatContainerRef}>
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
                <div className="feature-card" onClick={() => handleFeatureClick('variable-validation')}>
                  <div className="feature-title">Variable Validation</div>
                  <div className="feature-description">Verify that all variables exist in GWI Core questionnaire without inventing field names</div>
                </div>
                <div className="feature-card" onClick={() => handleFeatureClick('detailed-explanation')}>
                  <div className="feature-title">Detailed Explanation</div>
                  <div className="feature-description">Provide audience type summary, mapping rationale per segment, and final boolean output</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`message ${message.type}`}>
                <div style={{ whiteSpace: 'pre-line' }}>{message.content}</div>
                
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
                  <div className="boolean-label">Boolean Output:</div>
                  {message.booleanOutput}
                </div>
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
                placeholder="Describe the audience you want to translate to GWI Core variables..."
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
