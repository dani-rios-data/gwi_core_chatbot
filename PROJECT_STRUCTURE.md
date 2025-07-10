# GWI Core Chatbot - Cleaned Project Structure

## Overview
This is a modern, intelligent chatbot for translating audience descriptions into GWI Core Q2 2024 boolean logic queries. The project has been cleaned and optimized with a state-of-the-art architecture.

## Project Structure

```
GWI_CORE/
├── src/
│   ├── components/          # React UI components
│   │   ├── ActionButtons.tsx    # Interactive action buttons
│   │   └── AudiencePanel.tsx    # Side panel for audience management
│   ├── services/            # Core business logic
│   │   ├── ConversationState.ts      # State management
│   │   ├── AudienceProcessor.ts      # Natural language processing
│   │   └── ResponseGenerator.ts      # Response formatting
│   ├── styles/
│   │   └── fonts.css        # TBWA Grotesk font definitions
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── index.css            # Global styles
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # TypeScript environment definitions
├── public/
│   ├── data/
│   │   └── GWI_Core.txt     # GWI Core Q2 2024 context data
│   ├── fonts/               # TBWA Grotesk font files (optimized set)
│   │   ├── TBWAGrotesk-Regular.woff(2)
│   │   ├── TBWAGrotesk-Medium.woff(2)
│   │   ├── TBWAGrotesk-SemiBold.woff(2)
│   │   ├── TBWAGrotesk-Bold.woff(2)
│   │   └── TBWAGrotesk-Black.woff(2)
│   └── images/              # Essential images only
│       ├── 3D_AI_front_view.png     # App icon & AI avatar
│       └── logo_tbwa_white.svg      # TBWA logo
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── eslint.config.js         # ESLint configuration
```

## Key Features

### 🧠 **Smart Architecture**
- **ConversationState**: Manages audience segments and conversation history
- **AudienceProcessor**: Intelligent parsing of natural language input
- **ResponseGenerator**: Context-aware response formatting

### 🎯 **Interactive UI**
- **AudiencePanel**: Visual representation of current audience segments
- **ActionButtons**: Context-sensitive action buttons
- **Real-time Updates**: Live audience building and query generation

### 💾 **Data Management**
- **Single Source**: Consolidated GWI Core Q2 2024 data in `/public/data/`
- **Memory**: Persistent conversation state and audience building
- **Validation**: Only verified GWI Core fields and syntax

## Removed Files
The following unnecessary files have been removed:
- Duplicate context files
- Unused image assets (globe.gif, logo variants, Half_view.png)
- Unused font weights and styles
- Empty directories
- Unused React assets

## Data Sources
- **Primary**: `/public/data/GWI_Core.txt` - Complete GWI Core Q2 2024 questionnaire data
- **Fonts**: Optimized TBWA Grotesk font set (5 weights only)
- **Images**: Essential branding and UI assets only

## Architecture Benefits
1. **Memory**: Remembers and builds upon audience definitions
2. **Intelligence**: Understands user intent (add, remove, generate, refine)
3. **Validation**: Uses only verified GWI Core Q2 2024 fields
4. **UX**: Interactive workflow with visual feedback
5. **Performance**: Cleaned codebase with minimal assets

## File Count
- **Total TypeScript/React files**: 8
- **Total CSS files**: 3
- **Total config files**: 6
- **Total assets**: 7 fonts + 2 images + 1 data file
- **Removed files**: ~50+ unused assets and duplicates

The project is now optimized, clean, and ready for production deployment.