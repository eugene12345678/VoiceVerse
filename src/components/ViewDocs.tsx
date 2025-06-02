import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Book, Code, FileText, Terminal, Server, Database, Lock } from 'lucide-react';
import { Button } from './ui/Button';

interface ViewDocsProps {
  isOpen: boolean;
  onClose: () => void;
  externalDocsUrl?: string;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
  codeExample?: string;
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of VoiceVerse API',
    icon: <Book className="h-5 w-5" />,
    content: `
      # Getting Started with VoiceVerse API
      
      Welcome to the VoiceVerse API documentation. This guide will help you get started with integrating voice transformation capabilities into your applications.
      
      ## Authentication
      
      All API requests require authentication using an API key. You can obtain your API key from the Developer Dashboard.
      
      ## Base URL
      
      All API requests should be made to: \`https://api.voiceverse.app/v1\`
    `,
    codeExample: `
      // Example: Authenticating with the VoiceVerse API
      const voiceverse = require('voiceverse-sdk');
      
      // Initialize with your API key
      const client = new voiceverse.Client({
        apiKey: 'your_api_key_here'
      });
      
      // Now you can make authenticated requests
      const voices = await client.voices.list();
    `
  },
  {
    id: 'voice-transformation',
    title: 'Voice Transformation',
    description: 'Transform audio with various voice effects',
    icon: <Terminal className="h-5 w-5" />,
    content: `
      # Voice Transformation API
      
      The Voice Transformation API allows you to apply various effects to audio files.
      
      ## Supported Formats
      
      - Input: MP3, WAV, M4A, FLAC (max 10MB)
      - Output: MP3, WAV
      
      ## Transformation Types
      
      - Pitch shifting
      - Voice cloning
      - Gender transformation
      - Age modification
      - Accent changes
      - Character voices
    `,
    codeExample: `
      // Example: Transforming a voice file
      const transformation = await client.transformations.create({
        sourceFile: 'path/to/audio.mp3',
        effect: 'pitch_shift',
        parameters: {
          pitchShift: 2.5,
          preserveFormants: true
        },
        outputFormat: 'mp3'
      });
      
      // Get the result URL
      const resultUrl = transformation.resultUrl;
    `
  },
  {
    id: 'voice-models',
    title: 'Voice Models',
    description: 'Create and manage custom voice models',
    icon: <Server className="h-5 w-5" />,
    content: `
      # Voice Models API
      
      The Voice Models API allows you to create, train, and manage custom voice models.
      
      ## Creating a Voice Model
      
      To create a voice model, you need to provide at least 3 minutes of clear audio samples.
      
      ## Training Process
      
      Training typically takes 30-60 minutes depending on the amount of data provided.
      
      ## Using Voice Models
      
      Once trained, you can use your voice models with the Transformation API.
    `,
    codeExample: `
      // Example: Creating a voice model
      const model = await client.voiceModels.create({
        name: 'My Custom Voice',
        description: 'A custom voice for my application',
        samples: [
          'path/to/sample1.mp3',
          'path/to/sample2.mp3',
          'path/to/sample3.mp3'
        ]
      });
      
      // Check training status
      const status = await client.voiceModels.getStatus(model.id);
    `
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    description: 'Receive real-time updates for async processes',
    icon: <Database className="h-5 w-5" />,
    content: `
      # Webhooks
      
      Webhooks allow you to receive real-time updates about asynchronous processes like voice model training or long-running transformations.
      
      ## Setting Up Webhooks
      
      1. Configure a webhook URL in your Developer Dashboard
      2. Choose the events you want to subscribe to
      3. Implement an endpoint to receive webhook events
      
      ## Security
      
      All webhook requests are signed with a secret key to ensure authenticity.
    `,
    codeExample: `
      // Example: Verifying a webhook signature (Node.js/Express)
      app.post('/webhooks/voiceverse', (req, res) => {
        const signature = req.headers['x-voiceverse-signature'];
        const payload = req.body;
        
        // Verify the signature
        const isValid = voiceverse.webhooks.verifySignature(
          signature,
          'your_webhook_secret',
          JSON.stringify(payload)
        );
        
        if (!isValid) {
          return res.status(400).send('Invalid signature');
        }
        
        // Handle the webhook event
        const event = payload.event;
        
        if (event === 'transformation.completed') {
          // Handle completed transformation
        }
        
        res.status(200).send('Webhook received');
      });
    `
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Best practices for secure API usage',
    icon: <Lock className="h-5 w-5" />,
    content: `
      # Security Best Practices
      
      Follow these guidelines to ensure secure usage of the VoiceVerse API.
      
      ## API Key Security
      
      - Never expose your API key in client-side code
      - Use environment variables to store API keys
      - Create separate API keys for different environments
      
      ## Rate Limiting
      
      The API enforces rate limits to prevent abuse. Current limits:
      
      - 100 requests per minute
      - 5,000 requests per day
      
      ## Data Privacy
      
      All audio data is encrypted in transit and at rest. We comply with GDPR and CCPA regulations.
    `,
    codeExample: `
      // Example: Secure API key handling in Node.js
      require('dotenv').config();
      
      const voiceverse = require('voiceverse-sdk');
      
      // Load API key from environment variables
      const client = new voiceverse.Client({
        apiKey: process.env.VOICEVERSE_API_KEY
      });
      
      // Now you can make authenticated requests
      const voices = await client.voices.list();
    `
  }
];

export const ViewDocs: React.FC<ViewDocsProps> = ({
  isOpen,
  onClose,
  externalDocsUrl = 'https://docs.voiceverse.app'
}) => {
  const [activeSection, setActiveSection] = useState<string>(docSections[0].id);
  
  if (!isOpen) return null;
  
  const activeDoc = docSections.find(section => section.id === activeSection);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-0 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-primary-600 text-white">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-semibold">VoiceVerse API Documentation</h2>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={externalDocsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Full Docs</span>
              </a>
              <button 
                className="text-white hover:text-gray-200 transition-colors"
                onClick={onClose}
                aria-label="Close documentation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800">
              <nav className="p-4">
                <ul className="space-y-1">
                  {docSections.map(section => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {section.icon}
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{section.description}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            
            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeDoc && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {activeDoc.title}
                  </h1>
                  <div className="prose dark:prose-invert max-w-none">
                    {activeDoc.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.substring(3)}</h2>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i} className="ml-6">{line.substring(2)}</li>;
                      } else if (line.trim() === '') {
                        return <br key={i} />;
                      } else {
                        return <p key={i} className="my-2">{line}</p>;
                      }
                    })}
                  </div>
                  
                  {activeDoc.codeExample && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Code Example</h3>
                      <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <pre className="text-sm">
                          <code>
                            {activeDoc.codeExample.trim()}
                          </code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Documentation version: v1.2.0
            </div>
            <Button
              onClick={() => window.open(externalDocsUrl, '_blank')}
              variant="outline"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Full Documentation</span>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewDocs;