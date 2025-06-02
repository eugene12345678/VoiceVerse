import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  
  Book,
  Terminal,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Search,
  ExternalLink,
  Key,
  Lock,
  Zap,
  Webhook,
  Database,
  Server,
  MessageCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Book />,
    content: `
# Quick Start Guide

## Installation

\`\`\`bash
npm install @voiceverse/sdk
\`\`\`

## Basic Usage

\`\`\`typescript
import { VoiceVerse } from '@voiceverse/sdk';

const client = new VoiceVerse({
  apiKey: 'your_api_key',
  options: {
    region: 'us-east-1',
    timeout: 30000
  }
});

// Transform voice
const result = await client.transform({
  input: audioBuffer,
  model: 'celebrity-v1',
  settings: {
    pitch: 1.0,
    speed: 1.0
  }
});
\`\`\`
    `
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: <Key />,
    content: `
# Authentication

VoiceVerse uses API keys for authentication. You can obtain your API key from the dashboard.

## API Keys

\`\`\`typescript
const client = new VoiceVerse({
  apiKey: process.env.VOICEVERSE_API_KEY
});
\`\`\`

## Security Best Practices

- Never expose your API key in client-side code
- Use environment variables to store sensitive data
- Implement proper key rotation
- Set up IP whitelisting for additional security
    `
  },
  {
    id: 'voice-models',
    title: 'Voice Models',
    icon: <Zap />,
    content: `
# Voice Models

VoiceVerse offers various pre-trained voice models.

## Available Models

- \`celebrity-v1\`: Celebrity voice impressions
- \`emotion-v1\`: Emotional voice transformations
- \`accent-v1\`: Accent modifications

## Using Models

\`\`\`typescript
// Using celebrity model
const result = await client.transform({
  input: audioBuffer,
  model: 'celebrity-v1',
  variant: 'morgan-freeman'
});

// Using emotion model
const result = await client.transform({
  input: audioBuffer,
  model: 'emotion-v1',
  variant: 'happy'
});
\`\`\`
    `
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: <Webhook />,
    content: `
# Webhooks

Set up webhooks to receive real-time updates about voice transformations.

## Configuration

\`\`\`typescript
// Register webhook
await client.webhooks.create({
  url: 'https://your-domain.com/webhook',
  events: ['transformation.complete', 'transformation.failed']
});

// Webhook payload example
{
  "event": "transformation.complete",
  "data": {
    "id": "trans_123",
    "status": "completed",
    "outputUrl": "https://..."
  }
}
\`\`\`
    `
  },
  {
    id: 'error-handling',
    title: 'Error Handling',
    icon: <AlertCircle />,
    content: `
# Error Handling

Learn how to handle errors gracefully in your application.

## Error Types

\`\`\`typescript
try {
  const result = await client.transform({
    input: audioBuffer,
    model: 'celebrity-v1'
  });
} catch (error) {
  if (error instanceof VoiceVerseError) {
    switch (error.code) {
      case 'invalid_input':
        console.error('Invalid audio input');
        break;
      case 'model_not_found':
        console.error('Selected model not found');
        break;
      case 'rate_limit_exceeded':
        console.error('Rate limit exceeded');
        break;
      default:
        console.error('An error occurred:', error.message);
    }
  }
}
\`\`\`
    `
  }
];

export const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Override marked renderer for code blocks to add copy button
  const renderer = new marked.Renderer();
  renderer.code = (code, language) => {
    const highlightedCode = language
      ? hljs.highlight(code, { language }).value
      : hljs.highlightAuto(code).value;

    return `
      <div class="relative">
        <button
          class="absolute right-2 top-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          onclick="handleCopyCode('${code.replace(/'/g, "\\'")}')"
        >
          ${copiedCode === code ? '<Check className="h-4 w-4" />' : '<Copy className="h-4 w-4" />'}
        </button>
        <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
      </div>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Documentation
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Learn how to integrate and use VoiceVerse in your applications
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      selectedSection === section.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'text-dark-600 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-800'
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    {section.icon}
                    <span>{section.title}</span>
                    {selectedSection === section.id && (
                      <ChevronRight className="ml-auto h-5 w-5" />
                    )}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: marked(
                    sections.find((s) => s.id === selectedSection)?.content || '',
                    { renderer }
                  ),
                }}
              />
            </Card>

            {/* Support Section */}
            <Card className="p-8 mt-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    Need Help?
                  </h2>
                  <p className="text-primary-100">
                    Our developer support team is here to help you integrate VoiceVerse.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    className="bg-white text-primary-600 hover:bg-primary-50"
                    leftIcon={<MessageCircle className="h-5 w-5" />}
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                  >
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    leftIcon={<ExternalLink className="h-5 w-5" />}
                  >
                    API Reference
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};