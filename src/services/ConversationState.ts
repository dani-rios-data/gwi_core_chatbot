export interface AudienceSegment {
  id: string;
  label: string;
  criteria: string;
  booleanLogic: string;
  confidence: number;
  type: 'demographic' | 'behavioral' | 'psychographic' | 'geographic';
}

export interface ConversationState {
  currentAudience: AudienceSegment[];
  conversationHistory: Array<{
    id: string;
    userInput: string;
    botResponse: string;
    timestamp: Date;
    audienceChanges: AudienceSegment[];
  }>;
  context: {
    lastUserIntent: 'define_audience' | 'refine_audience' | 'generate_query' | 'add_criteria' | 'remove_criteria';
    pendingActions: string[];
    currentQuery: string;
  };
}

export class ConversationStateManager {
  private state: ConversationState;
  private listeners: Array<(state: ConversationState) => void> = [];

  constructor() {
    this.state = {
      currentAudience: [],
      conversationHistory: [],
      context: {
        lastUserIntent: 'define_audience',
        pendingActions: [],
        currentQuery: ''
      }
    };
  }

  getState(): ConversationState {
    return { ...this.state };
  }

  updateAudience(segments: AudienceSegment[]): void {
    this.state.currentAudience = segments;
    this.notifyListeners();
  }

  addAudienceSegment(segment: AudienceSegment): void {
    this.state.currentAudience.push(segment);
    this.notifyListeners();
  }

  removeAudienceSegment(segmentId: string): void {
    this.state.currentAudience = this.state.currentAudience.filter(s => s.id !== segmentId);
    this.notifyListeners();
  }

  addToHistory(userInput: string, botResponse: string, audienceChanges: AudienceSegment[]): void {
    this.state.conversationHistory.push({
      id: Date.now().toString(),
      userInput,
      botResponse,
      timestamp: new Date(),
      audienceChanges
    });
    this.notifyListeners();
  }

  updateContext(intent: ConversationState['context']['lastUserIntent'], actions: string[] = []): void {
    this.state.context.lastUserIntent = intent;
    this.state.context.pendingActions = actions;
    this.notifyListeners();
  }

  setCurrentQuery(query: string): void {
    this.state.context.currentQuery = query;
    this.notifyListeners();
  }

  subscribe(listener: (state: ConversationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  generateCombinedQuery(): string {
    if (this.state.currentAudience.length === 0) return '';
    
    const segments = this.state.currentAudience.map(s => s.booleanLogic);
    return segments.join(' AND ');
  }

  getAudienceDescription(): string {
    if (this.state.currentAudience.length === 0) return 'No audience defined';
    
    return this.state.currentAudience.map(s => s.label).join(', ');
  }

  clearAudience(): void {
    this.state.currentAudience = [];
    this.notifyListeners();
  }
}