'use client';

import React, { useState } from 'react';
import VideoRecorderApp from './VideoRecorderApp';

const suggestions = [
  "Launch video recorder",
  "How do I use the video recorder?",
  "What aspect ratios are supported?",
  "How do I toggle mirror mode?",
  "What's the maximum recording length?",
  "How do I change camera or microphone?",
];

// Mock responses for demo purposes
const mockResponses = {
  "Launch video recorder": "VIDEO_RECORDER_COMPONENT",
  "How do I use the video recorder?": "To use the video recorder, select 'Launch video recorder' from the suggestions. Once launched, you can:\n1. Select your camera and microphone from the dropdowns\n2. Choose your preferred aspect ratio (16:9, 1:1, or 9:16)\n3. Toggle mirror mode on/off\n4. Click the record button to start recording\n5. Click stop when finished",
  "What aspect ratios are supported?": "The video recorder supports three aspect ratios:\n• 16:9 (Landscape) - 320x180 pixels\n• 1:1 (Square) - 320x320 pixels\n• 9:16 (Portrait/Mobile) - 180x320 pixels\n\nYou can change the aspect ratio using the dropdown before or during recording.",
  "How do I toggle mirror mode?": "Mirror mode can be toggled using the switch in the controls. When enabled, your video appears flipped horizontally (like looking in a mirror). This is often preferred for front-facing camera recordings as it feels more natural.",
  "What's the maximum recording length?": "The maximum recording length is set to 120 seconds (2 minutes). This limit is configured in the video recorder settings and helps manage file sizes and performance.",
  "How do I change camera or microphone?": "You can change your camera and microphone using the dropdown menus:\n1. 'Select Video Input' - Choose your camera\n2. 'Select Audio Input' - Choose your microphone\n\nMake sure to grant permission when prompted by your browser. If devices don't appear, try refreshing the page."
};

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { id: Date.now(), role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      
      setIsLoading(true);
      
      // Simulate AI response
      setTimeout(() => {
        const response = mockResponses[input] || "I can help you with questions about the video recorder. Try clicking one of the suggested questions above, or ask about recording features, device settings, or troubleshooting.";
        const assistantMessage = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: response,
          isComponent: response === "VIDEO_RECORDER_COMPONENT"
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Video Recorder Assistant</h1>
        <p className="text-gray-600">Ask me anything about using the video recorder or select from the suggestions below.</p>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick Questions:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-50 border-l-4 border-blue-500 p-4'
                : message.isComponent
                ? 'bg-white border border-gray-200'
                : 'bg-gray-50 border-l-4 border-gray-500 p-4'
            }`}
          >
            {!message.isComponent && (
              <div className="font-semibold text-sm text-gray-600 mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
            )}
            {message.isComponent ? (
              <VideoRecorderApp />
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="mb-4 p-4 rounded-lg bg-gray-50 border-l-4 border-gray-500">
            <div className="font-semibold text-sm text-gray-600 mb-1">Assistant</div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={onSubmit} className="relative">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me about the video recorder..."
          className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        You can ask questions about video recording features, troubleshooting, or click the suggestions above.
      </div>
    </div>
  );
}

export default App;