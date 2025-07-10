import type { AudienceSegment, ConversationState } from './ConversationState';

export interface FormattedResponse {
  content: string;
  booleanOutput?: string;
  suggestions: string[];
  actionButtons: Array<{
    label: string;
    action: 'add_criteria' | 'generate_query' | 'refine_audience' | 'clear_audience';
    priority: 'primary' | 'secondary';
  }>;
}

export class ResponseGenerator {
  generateResponse(
    segments: AudienceSegment[],
    intent: ConversationState['context']['lastUserIntent'],
    suggestions: string[]
  ): FormattedResponse {
    switch (intent) {
      case 'define_audience':
        return this.generateAudienceDefinitionResponse(segments, suggestions);
      case 'add_criteria':
        return this.generateAddCriteriaResponse(segments, suggestions);
      case 'generate_query':
        return this.generateQueryResponse(segments, suggestions);
      case 'refine_audience':
        return this.generateRefinementResponse(segments, suggestions);
      case 'remove_criteria':
        return this.generateRemovalResponse(segments, suggestions);
      default:
        return this.generateDefaultResponse(segments, suggestions);
    }
  }

  private generateAudienceDefinitionResponse(segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    if (segments.length === 0) {
      return {
        content: `🎯 **Welcome to GWI Core Translator**

I'm ready to help you translate your audience into GWI Core boolean logic. Please describe your target audience including:

• **Demographics**: Age, gender, location
• **Professional**: Job level, industry, experience
• **Behavioral**: Platform usage, interests, behaviors
• **Psychographic**: Values, attitudes, lifestyle

**Example**: "Professional males 30-45, managers in technology, active LinkedIn users"`,
        suggestions: ['Try example audience', 'What fields are available?', 'Show me demographic options'],
        actionButtons: []
      };
    }

    const audienceDescription = segments.map(s => s.label).join(', ');
    const segmentBreakdown = segments.map(s => 
      `• **${s.criteria}**: ${s.booleanLogic}`
    ).join('\n');

    return {
      content: `🎯 **Audience Analysis Complete**

**Target Audience**: ${audienceDescription}

**Identified Segments**:
${segmentBreakdown}

**Confidence Level**: ${Math.round(segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length * 100)}%

The audience has been successfully analyzed and mapped to GWI Core Q2 2024 fields.`,
      suggestions,
      actionButtons: [
        { label: 'Generate Boolean Query', action: 'generate_query', priority: 'primary' },
        { label: 'Add More Criteria', action: 'add_criteria', priority: 'secondary' },
        { label: 'Refine Audience', action: 'refine_audience', priority: 'secondary' }
      ]
    };
  }

  private generateAddCriteriaResponse(segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    const audienceDescription = segments.map(s => s.label).join(', ');
    const newSegments = segments.slice(-2); // Show last 2 added segments
    
    return {
      content: `✅ **Criteria Added Successfully**

**Updated Audience**: ${audienceDescription}

**Recently Added**:
${newSegments.map(s => `• **${s.criteria}**: ${s.booleanLogic}`).join('\n')}

**Total Segments**: ${segments.length}`,
      suggestions,
      actionButtons: [
        { label: 'Generate Boolean Query', action: 'generate_query', priority: 'primary' },
        { label: 'Add More Criteria', action: 'add_criteria', priority: 'secondary' },
        { label: 'Clear All', action: 'clear_audience', priority: 'secondary' }
      ]
    };
  }

  private generateQueryResponse(segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    const query = segments.map(s => s.booleanLogic).join(' AND ');
    const audienceDescription = segments.map(s => s.label).join(', ');
    
    return {
      content: `🔗 **Boolean Query Generated**

**Target Audience**: ${audienceDescription}

**Query Structure**:
${segments.map((s, i) => `${i + 1}. ${s.criteria} → ${s.booleanLogic}`).join('\n')}

**Completion Status**: ✅ Ready for GWI Core Q2 2024

**Next Steps**:
1. Copy the boolean query below
2. Paste into GWI Core platform
3. Execute query and analyze results
4. Refine targeting as needed`,
      booleanOutput: query,
      suggestions: suggestions.filter(s => !s.includes('Generate')),
      actionButtons: [
        { label: 'Refine Query', action: 'refine_audience', priority: 'secondary' },
        { label: 'Add More Criteria', action: 'add_criteria', priority: 'secondary' },
        { label: 'Start Over', action: 'clear_audience', priority: 'secondary' }
      ]
    };
  }

  private generateRefinementResponse(segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    const audienceDescription = segments.map(s => s.label).join(', ');
    
    return {
      content: `🔄 **Audience Refined**

**Updated Target**: ${audienceDescription}

**Current Segments**: ${segments.length}
**Targeting Precision**: ${segments.length > 3 ? 'High' : segments.length > 1 ? 'Medium' : 'Basic'}

The audience definition has been updated with your refinements.`,
      suggestions,
      actionButtons: [
        { label: 'Generate Boolean Query', action: 'generate_query', priority: 'primary' },
        { label: 'Add More Criteria', action: 'add_criteria', priority: 'secondary' },
        { label: 'Refine Further', action: 'refine_audience', priority: 'secondary' }
      ]
    };
  }

  private generateRemovalResponse(segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    const audienceDescription = segments.length > 0 ? segments.map(s => s.label).join(', ') : 'No criteria defined';
    
    return {
      content: `🗑️ **Criteria Removed**

**Remaining Audience**: ${audienceDescription}

**Active Segments**: ${segments.length}

${segments.length === 0 ? 'All criteria have been removed. Please define a new audience.' : 'Criteria successfully removed from audience definition.'}`,
      suggestions,
      actionButtons: segments.length === 0 ? [
        { label: 'Define New Audience', action: 'add_criteria', priority: 'primary' }
      ] : [
        { label: 'Generate Boolean Query', action: 'generate_query', priority: 'primary' },
        { label: 'Add More Criteria', action: 'add_criteria', priority: 'secondary' }
      ]
    };
  }

  private generateDefaultResponse(_segments: AudienceSegment[], suggestions: string[]): FormattedResponse {
    return {
      content: `🤖 **GWI Core Boolean Logic Assistant**

I can help you translate audience descriptions into GWI Core boolean logic. Please describe your target audience or ask me about:

• Available GWI Core fields and values
• Boolean logic syntax
• Audience translation examples
• Platform-specific conversions`,
      suggestions,
      actionButtons: [
        { label: 'Show Available Fields', action: 'add_criteria', priority: 'secondary' },
        { label: 'Try Example Audience', action: 'add_criteria', priority: 'secondary' }
      ]
    };
  }

  generateWelcomeMessage(): FormattedResponse {
    return {
      content: `🎯 **GWI Core Translator**

**Smart Audience Translation & Boolean Logic Assistant**

I help translate audience descriptions from any platform into precise GWI Core Q2 2024 boolean logic. I maintain conversation context and can refine audiences iteratively.

**Key Features**:
• **Intelligent Parsing**: Understands natural language audience descriptions
• **Memory**: Remembers your audience and builds upon it
• **Validation**: Uses only verified GWI Core Q2 2024 fields
• **Interactive**: Refine audiences through conversation

**Ready to start?** Describe your target audience...`,
      suggestions: [
        'Professional males 30-45 in technology',
        'Millennial women interested in sustainability',
        'University students aged 18-25',
        'What fields are available?'
      ],
      actionButtons: []
    };
  }
}