import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Mic, Paperclip, Image, Smile } from 'lucide-react';
import { Button } from './ui/Button';

// Define the types for our chat messages
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// Define the props for our ChatBot component
interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: ChatMessage[];
  sessionId?: string;
  onSendMessage?: (message: string) => Promise<string>;
  title?: string;
  placeholder?: string;
  primaryColor?: string;
  secondaryColor?: string;
  darkMode?: boolean;
}

// Default FAQ data
const defaultFAQs = [
  {
    keywords: ['password', 'forgot', 'reset', 'login', 'sign in'],
    response: 'To reset your password, click the "Forgot Password" link on the login page. We\'ll send you an email with instructions to create a new password.'
  },
  {
    keywords: ['subscription', 'plan', 'upgrade', 'downgrade', 'cancel', 'pricing', 'cost', 'price'],
    response: 'We offer several pricing tiers starting at $9.99/month. You can manage your subscription in Settings > Subscription. From there, you can upgrade, downgrade, or cancel your plan. Changes will take effect on your next billing cycle.'
  },
  {
    keywords: ['refund', 'money back', 'payment', 'charge', 'bill'],
    response: 'Refunds are typically processed within 3-5 business days. If you have questions about a refund, please contact our billing department at billing@voiceverse.app.'
  },
  {
    keywords: ['voice', 'model', 'create', 'clone', 'transform', 'effect', 'filter', 'audio'],
    response: 'Our voice transformation technology allows you to modify your voice with various effects. Upload your audio file in the Studio, select an effect from our library, adjust the settings, and click "Transform" to apply it.'
  },
  {
    keywords: ['download', 'export', 'save', 'file'],
    response: 'You can download your transformed audio files from your Library. Click on the file you want to download and select the "Download" option from the menu.'
  },
  {
    keywords: ['nft', 'marketplace', 'sell', 'buy', 'mint'],
    response: 'Our NFT marketplace allows you to mint and sell your voice creations as NFTs. Go to the NFT section, connect your wallet, and follow the instructions to create or purchase voice NFTs.'
  },
  {
    keywords: ['contact', 'support', 'help', 'team', 'service'],
    response: 'You can reach our support team through email at support@voiceverse.app, by phone at +254 700 581 615, or by using the contact form on our website.'
  },
  {
    keywords: ['free', 'trial', 'demo'],
    response: 'We offer a free trial that includes limited access to our voice transformation features. Sign up on our website to start your free trial today!'
  },
  {
    keywords: ['privacy', 'data', 'security', 'information', 'policy'],
    response: 'We take your privacy seriously. Your data is encrypted and securely stored. You can review our privacy policy at voiceverse.app/privacy for more details.'
  },
  {
    keywords: ['api', 'integration', 'developer', 'code', 'documentation', 'docs'],
    response: 'Our API documentation is available at voiceverse.app/developers. You\'ll find guides, examples, and SDKs to help you integrate VoiceVerse into your applications.'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'howdy'],
    response: 'Hello! I\'m the VoiceVerse AI assistant. How can I help you with voice transformation, audio effects, or any other questions about our platform?'
  },
  {
    keywords: ['features', 'capabilities', 'what can you do', 'help me'],
    response: 'I can help you with information about voice transformations, subscription plans, account management, technical support, and more. Just ask me anything about VoiceVerse!'
  },
  {
    keywords: ['thanks', 'thank you', 'appreciate', 'helpful'],
    response: 'You\'re welcome! I\'m happy to help. If you have any other questions, feel free to ask.'
  }
];

// Generate a unique ID for each message
const generateId = () => Math.random().toString(36).substring(2, 9);

export const ChatBot: React.FC<ChatBotProps> = ({
  isOpen,
  onClose,
  initialMessages = [],
  sessionId,
  onSendMessage,
  title = 'VoiceVerse AI Assistant',
  placeholder = 'Type your message...',
  primaryColor = '#6366f1',
  secondaryColor = '#f9fafb',
  darkMode = false
}) => {
  // State for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0 
      ? initialMessages 
      : [
          {
            id: generateId(),
            role: 'assistant',
            content: 'Hello! I\'m your VoiceVerse AI assistant. How can I help you today?',
            timestamp: new Date()
          }
        ]
  );
  
  // State for user input
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set processing state
    setUserInput('');
    setIsProcessing(true);
    
    // Add typing indicator
    const typingIndicatorId = generateId();
    setMessages(prev => [
      ...prev, 
      { 
        id: typingIndicatorId, 
        role: 'assistant', 
        content: '', 
        timestamp: new Date(),
        isTyping: true 
      }
    ]);
    
    try {
      let response: string;
      
      // Use provided onSendMessage function if available
      if (onSendMessage) {
        response = await onSendMessage(userMessage.content);
      } else {
        // Otherwise use local keyword matching
        response = await simulateAIResponse(userMessage.content);
      }
      
      // Remove typing indicator and add actual response
      setMessages(prev => 
        prev.filter(msg => msg.id !== typingIndicatorId).concat({
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        })
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== typingIndicatorId).concat({
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
          timestamp: new Date()
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to simulate AI response with keyword matching
  const simulateAIResponse = async (message: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const lowerCaseMessage = message.toLowerCase();
    
    // Check for keyword matches
    for (const faq of defaultFAQs) {
      if (faq.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
        return faq.response;
      }
    }
    
    // Default response if no keywords match
    return "I'm not sure I understand your question. Could you please provide more details or rephrase? You can ask about voice transformations, subscription plans, technical support, or any other VoiceVerse features.";
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Styles based on props
  const headerStyle = {
    backgroundColor: primaryColor,
    color: '#ffffff'
  };
  
  const userBubbleStyle = {
    backgroundColor: primaryColor,
    color: '#ffffff'
  };
  
  const assistantBubbleStyle = {
    backgroundColor: darkMode ? '#374151' : secondaryColor,
    color: darkMode ? '#ffffff' : '#111827'
  };
  
  const containerStyle = {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#ffffff' : '#111827'
  };
  
  // Render typing animation
  const renderTypingAnimation = () => (
    <div className="flex space-x-2 items-center p-2">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
  
  // Only render if the chat is open
  if (!isOpen) return null;
  
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
          className="rounded-xl p-0 max-w-md w-full h-[600px] max-h-[80vh] flex flex-col overflow-hidden shadow-xl"
          style={containerStyle}
          onClick={e => e.stopPropagation()}
        >
          {/* Chat Header */}
          <div 
            className="p-4 border-b flex items-center justify-between"
            style={headerStyle}
          >
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <button 
              className="text-white hover:text-gray-200 transition-colors"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            ref={chatContainerRef}
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'assistant' 
                      ? 'rounded-tl-none' 
                      : 'rounded-tr-none'
                  }`}
                  style={msg.role === 'assistant' ? assistantBubbleStyle : userBubbleStyle}
                >
                  {msg.isTyping ? renderTypingAnimation() : msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form 
              className="flex gap-2"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isProcessing || !userInput.trim()}
                className="px-4"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            
            {/* Suggested Questions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {['How do I reset my password?', 'Tell me about voice models', 'Subscription plans'].map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setUserInput(question);
                  }}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatBot;