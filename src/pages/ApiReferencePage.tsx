import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Terminal,
  Copy,
  Check,
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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
  Shield
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

const endpoints = [
  {
    id: 'authentication',
    title: 'Authentication',
    icon: <Key />,
    description: 'API authentication and authorization',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/auth/token',
        title: 'Generate API Token',
        description: 'Generate a new API token for authentication',
        request: `{
  "apiKey": "your_api_key",
  "scope": ["voice.transform", "voice.train"]
}`,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "scope": ["voice.transform", "voice.train"]
}`
      }
    ]
  },
  {
    id: 'voice-transformation',
    title: 'Voice Transformation',
    icon: <Zap />,
    description: 'Transform voice using AI models',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/transform',
        title: 'Transform Voice',
        description: 'Transform audio using specified voice model',
        request: `{
  "input": "base64_encoded_audio",
  "model": "celebrity-v1",
  "settings": {
    "pitch": 1.0,
    "speed": 1.0,
    "quality": "high"
  }
}`,
        response: `{
  "id": "trans_123",
  "status": "completed",
  "output": "transformed_audio_url",
  "duration": 15.5
}`
      },
      {
        method: 'GET',
        path: '/v1/transform/:id',
        title: 'Get Transformation Status',
        description: 'Check the status of a voice transformation',
        response: `{
  "id": "trans_123",
  "status": "completed",
  "progress": 100,
  "output": "transformed_audio_url"
}`
      }
    ]
  },
  {
    id: 'voice-models',
    title: 'Voice Models',
    icon: <Database />,
    description: 'Manage and use voice models',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/models',
        title: 'List Models',
        description: 'Get a list of available voice models',
        response: `{
  "models": [
    {
      "id": "celebrity-v1",
      "name": "Celebrity Voices",
      "version": "1.0",
      "variants": ["morgan-freeman", "david-attenborough"]
    },
    {
      "id": "emotion-v1",
      "name": "Emotional Voices",
      "version": "1.0",
      "variants": ["happy", "sad", "excited"]
    }
  ]
}`
      },
      {
        method: 'POST',
        path: '/v1/models/train',
        title: 'Train Custom Model',
        description: 'Train a custom voice model',
        request: `{
  "name": "my-custom-voice",
  "samples": [
    "base64_encoded_audio_1",
    "base64_encoded_audio_2"
  ],
  "settings": {
    "iterations": 1000,
    "quality": "high"
  }
}`,
        response: `{
  "id": "model_123",
  "status": "training",
  "progress": 0,
  "estimatedTime": 3600
}`
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: <Webhook />,
    description: 'Manage webhook integrations',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/webhooks',
        title: 'Create Webhook',
        description: 'Create a new webhook endpoint',
        request: `{
  "url": "https://your-domain.com/webhook",
  "events": ["transformation.complete", "transformation.failed"],
  "secret": "your_webhook_secret"
}`,
        response: `{
  "id": "webhook_123",
  "url": "https://your-domain.com/webhook",
  "events": ["transformation.complete", "transformation.failed"],
  "status": "active"
}`
      }
    ]
  }
];

interface EndpointProps {
  method: string;
  path: string;
  title: string;
  description: string;
  request?: string;
  response: string;
}

const Endpoint: React.FC<EndpointProps> = ({
  method,
  path,
  title,
  description,
  request,
  response
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const methodColors = {
    GET: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    POST: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    PUT: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    DELETE: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
  };

  return (
    <div className="border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
      <button
        className="w-full text-left p-4 focus:outline-none hover:bg-gray-50 dark:hover:bg-dark-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full font-mono text-sm ${methodColors[method as keyof typeof methodColors]}`}>
              {method}
            </span>
            <span className="font-mono text-dark-900 dark:text-white">{path}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-dark-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-dark-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mt-2">
          {title}
        </h3>
        <p className="text-dark-600 dark:text-dark-400 mt-1">
          {description}
        </p>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-dark-700 p-4">
          {request && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-dark-900 dark:text-white mb-2">
                Request Body
              </h4>
              <div className="relative">
                <button
                  className="absolute right-2 top-2 p-2 rounded-lg bg-dark-900/10 dark:bg-white/10 hover:bg-dark-900/20 dark:hover:bg-white/20 transition-colors"
                  onClick={() => handleCopyCode(request)}
                >
                  {copiedCode === request ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <pre className="bg-dark-900 dark:bg-dark-800 rounded-lg p-4 overflow-x-auto">
                  <code className="language-json">{request}</code>
                </pre>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-dark-900 dark:text-white mb-2">
              Response
            </h4>
            <div className="relative">
              <button
                className="absolute right-2 top-2 p-2 rounded-lg bg-dark-900/10 dark:bg-white/10 hover:bg-dark-900/20 dark:hover:bg-white/20 transition-colors"
                onClick={() => handleCopyCode(response)}
              >
                {copiedCode === response ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <pre className="bg-dark-900 dark:bg-dark-800 rounded-lg p-4 overflow-x-auto">
                <code className="language-json">{response}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ApiReferencePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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
              API Reference
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Complete reference documentation for the VoiceVerse API
            </p>
          </motion.div>
        </div>

        {/* API Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Base URL
                </h3>
                <p className="text-dark-600 dark:text-dark-400">
                  api.voiceverse.ai
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Rate Limits
                </h3>
                <p className="text-dark-600 dark:text-dark-400">
                  100 requests/minute
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Authentication
                </h3>
                <p className="text-dark-600 dark:text-dark-400">
                  Bearer Token
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-12">
          {endpoints.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white">
                    {section.title}
                  </h2>
                  <p className="text-dark-600 dark:text-dark-400">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {section.endpoints.map((endpoint, index) => (
                  <Endpoint key={index} {...endpoint} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <Card className="p-8 mt-12 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-display font-bold mb-2">
                Need Help with Integration?
              </h2>
              <p className="text-primary-100">
                Our developer support team is ready to assist you with API integration.
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
                leftIcon={<Terminal className="h-5 w-5" />}
              >
                View SDK Docs
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};