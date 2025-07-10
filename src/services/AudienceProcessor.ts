import type { AudienceSegment, ConversationState } from './ConversationState';

export interface GWIField {
  name: string;
  type: 'demographic' | 'behavioral' | 'psychographic' | 'geographic';
  values: string[];
  operators: string[];
  description: string;
}

export class AudienceProcessor {
  private gwiFields: GWIField[] = [
    {
      name: 'gender',
      type: 'demographic',
      values: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
      operators: ['==', '!='],
      description: 'Gender identity'
    },
    {
      name: 'age',
      type: 'demographic',
      values: ['18-24', '25-34', '35-44', '45-54', '55-64'],
      operators: ['>=', '<=', '==', '!='],
      description: 'Age range'
    },
    {
      name: 'job_level',
      type: 'demographic',
      values: ['Entry Level', 'Mid Level', 'Senior Level', 'Manager', 'Director', 'Executive'],
      operators: ['==', '!='],
      description: 'Professional job level'
    },
    {
      name: 'industry',
      type: 'demographic',
      values: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing'],
      operators: ['==', '!='],
      description: 'Industry sector'
    },
    {
      name: 'education_level',
      type: 'demographic',
      values: ['High School', 'Some College', 'Bachelor\'s', 'Master\'s', 'PhD'],
      operators: ['>=', '<=', '==', '!='],
      description: 'Education level'
    },
    {
      name: 'education_status',
      type: 'demographic',
      values: ['Currently studying', 'Completed', 'Not applicable'],
      operators: ['==', '!='],
      description: 'Current education status'
    },
    {
      name: 'linkedin_usage',
      type: 'behavioral',
      values: ['Active', 'Occasional', 'Rarely', 'Never'],
      operators: ['==', '!='],
      description: 'LinkedIn platform usage'
    },
    {
      name: 'attitude_sustainability',
      type: 'psychographic',
      values: ['Very Important', 'Important', 'Somewhat Important', 'Not Important'],
      operators: ['==', '!='],
      description: 'Attitude toward sustainability'
    },
    {
      name: 'interest_environment',
      type: 'psychographic',
      values: ['1', '0'],
      operators: ['==', '!='],
      description: 'Interest in environmental issues'
    },
    {
      name: 'product_purchase_organic',
      type: 'behavioral',
      values: ['1', '0'],
      operators: ['==', '!='],
      description: 'Purchase organic products'
    },
    {
      name: 'country_residence',
      type: 'geographic',
      values: ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France'],
      operators: ['==', '!='],
      description: 'Country of residence'
    }
  ];

  private intentPatterns = {
    define_audience: /^(describe|define|target|audience|segment|who|people|users|customers)/i,
    add_criteria: /^(add|include|also|plus|and|with|having)/i,
    remove_criteria: /^(remove|exclude|not|without|except)/i,
    generate_query: /^(generate|create|build|make|show|give|query|boolean|logic)/i,
    refine_audience: /^(refine|adjust|modify|change|update|improve)/i
  };

  detectIntent(userInput: string): ConversationState['context']['lastUserIntent'] {
    const input = userInput.toLowerCase().trim();
    
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(input)) {
        return intent as ConversationState['context']['lastUserIntent'];
      }
    }
    
    return 'define_audience';
  }

  processAudienceInput(userInput: string, currentAudience: AudienceSegment[]): {
    segments: AudienceSegment[];
    intent: ConversationState['context']['lastUserIntent'];
    suggestions: string[];
  } {
    const intent = this.detectIntent(userInput);
    const input = userInput.toLowerCase();
    
    let newSegments: AudienceSegment[] = [];
    let suggestions: string[] = [];

    switch (intent) {
      case 'define_audience':
        newSegments = this.extractAudienceSegments(input);
        suggestions = this.generateRefinementSuggestions(newSegments);
        break;
        
      case 'add_criteria':
        const additionalSegments = this.extractAudienceSegments(input);
        newSegments = [...currentAudience, ...additionalSegments];
        suggestions = ['Generate boolean query', 'Add more criteria', 'Refine existing criteria'];
        break;
        
      case 'remove_criteria':
        newSegments = this.removeCriteria(input, currentAudience);
        suggestions = ['Add different criteria', 'Generate boolean query', 'Start over'];
        break;
        
      case 'generate_query':
        newSegments = currentAudience;
        suggestions = ['Refine query', 'Add more criteria', 'Export to different format'];
        break;
        
      case 'refine_audience':
        newSegments = this.refineAudience(input, currentAudience);
        suggestions = ['Generate boolean query', 'Add more criteria', 'Remove criteria'];
        break;
    }

    return { segments: newSegments, intent, suggestions };
  }

  private extractAudienceSegments(input: string): AudienceSegment[] {
    const segments: AudienceSegment[] = [];
    
    // Gender detection
    if (input.includes('male') && !input.includes('female')) {
      segments.push(this.createSegment('gender', 'Male', 'Male professionals', 'gender == \'Male\''));
    } else if (input.includes('female') || input.includes('women')) {
      segments.push(this.createSegment('gender', 'Female', 'Female professionals', 'gender == \'Female\''));
    } else if (input.includes('men') && input.includes('women')) {
      segments.push(this.createSegment('gender', 'All', 'All genders', '(gender == \'Male\' OR gender == \'Female\')'));
    }

    // Age detection
    if (input.includes('30') && input.includes('45')) {
      segments.push(this.createSegment('age', '30-45', 'Ages 30-45', 'age >= 30 AND age <= 45'));
    } else if (input.includes('25') && input.includes('40')) {
      segments.push(this.createSegment('age', '25-40', 'Ages 25-40', 'age >= 25 AND age <= 40'));
    } else if (input.includes('18') && input.includes('25')) {
      segments.push(this.createSegment('age', '18-25', 'Ages 18-25', 'age >= 18 AND age <= 25'));
    } else if (input.includes('millennial')) {
      segments.push(this.createSegment('age', 'Millennial', 'Millennial generation', 'age >= 25 AND age <= 40'));
    }

    // Job level detection
    if (input.includes('manager') || input.includes('management')) {
      segments.push(this.createSegment('job_level', 'Manager', 'Management level', 'job_level == \'Manager\''));
    } else if (input.includes('professional') || input.includes('professionals')) {
      segments.push(this.createSegment('job_level', 'Professional', 'Professional level', 'job_level >= \'Mid Level\''));
    } else if (input.includes('student') || input.includes('students')) {
      segments.push(this.createSegment('education_status', 'Student', 'Currently studying', 'education_status == \'Currently studying\''));
    }

    // Industry detection
    if (input.includes('technology') || input.includes('tech')) {
      segments.push(this.createSegment('industry', 'Technology', 'Technology industry', 'industry == \'Technology\''));
    }

    // Platform usage
    if (input.includes('linkedin')) {
      segments.push(this.createSegment('linkedin_usage', 'Active', 'Active LinkedIn users', 'linkedin_usage == \'Active\''));
    }

    // Sustainability/Environment
    if (input.includes('sustainability') || input.includes('sustainable')) {
      segments.push(this.createSegment('attitude_sustainability', 'Important', 'Values sustainability', 'attitude_sustainability == \'Important\''));
    }
    if (input.includes('organic')) {
      segments.push(this.createSegment('product_purchase_organic', 'Yes', 'Buys organic products', 'product_purchase_organic == 1'));
    }
    if (input.includes('environment')) {
      segments.push(this.createSegment('interest_environment', 'Yes', 'Interested in environment', 'interest_environment == 1'));
    }

    // Location
    if (input.includes('usa') || input.includes('united states') || input.includes('america')) {
      segments.push(this.createSegment('country_residence', 'USA', 'United States residents', 'country_residence == \'USA\''));
    }

    return segments;
  }

  private createSegment(
    fieldName: string,
    value: string,
    label: string,
    booleanLogic: string,
    type: AudienceSegment['type'] = 'demographic'
  ): AudienceSegment {
    return {
      id: `${fieldName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      criteria: `${fieldName}: ${value}`,
      booleanLogic,
      confidence: 0.8,
      type
    };
  }

  private generateRefinementSuggestions(segments: AudienceSegment[]): string[] {
    const suggestions: string[] = [];
    
    const hasGender = segments.some(s => s.criteria.includes('gender'));
    const hasAge = segments.some(s => s.criteria.includes('age'));
    const hasJob = segments.some(s => s.criteria.includes('job_level'));
    const hasIndustry = segments.some(s => s.criteria.includes('industry'));
    
    if (!hasGender) suggestions.push('Add gender targeting');
    if (!hasAge) suggestions.push('Add age range');
    if (!hasJob) suggestions.push('Add job level');
    if (!hasIndustry) suggestions.push('Add industry focus');
    
    suggestions.push('Generate boolean query');
    
    return suggestions;
  }

  private removeCriteria(input: string, currentAudience: AudienceSegment[]): AudienceSegment[] {
    let filtered = [...currentAudience];
    
    if (input.includes('gender') || input.includes('male') || input.includes('female')) {
      filtered = filtered.filter(s => !s.criteria.includes('gender'));
    }
    if (input.includes('age')) {
      filtered = filtered.filter(s => !s.criteria.includes('age'));
    }
    if (input.includes('job') || input.includes('manager')) {
      filtered = filtered.filter(s => !s.criteria.includes('job_level'));
    }
    
    return filtered;
  }

  private refineAudience(input: string, currentAudience: AudienceSegment[]): AudienceSegment[] {
    const additional = this.extractAudienceSegments(input);
    return [...currentAudience, ...additional];
  }

  generateBooleanQuery(segments: AudienceSegment[]): string {
    if (segments.length === 0) return '';
    
    const logic = segments.map(s => s.booleanLogic).join(' AND ');
    return logic;
  }

  getFieldInfo(fieldName: string): GWIField | undefined {
    return this.gwiFields.find(field => field.name === fieldName);
  }

  getAllFields(): GWIField[] {
    return this.gwiFields;
  }
}