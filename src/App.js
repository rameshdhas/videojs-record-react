'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import VideoRecorderApp from './VideoRecorderApp';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { callOpenAI } from './api/chat';

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

// Helper function to detect overlay requests
const getOverlayResponse = (input) => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('intro') || lowerInput.includes('introduction')) {
    return "Perfect! I'll help you add an intro overlay. You can:\n\n• Add your name and title at the beginning\n• Include your company logo\n• Add a brief description of what the video covers\n• Set the timing for when it appears (e.g., 0-3 seconds)\n\nUse the overlay editor above to drag and position your intro text where you'd like it to appear!";
  }
  
  if (lowerInput.includes('calendly') || lowerInput.includes('calendar') || lowerInput.includes('schedule') || lowerInput.includes('book')) {
    return "Great idea! Adding a Calendly link at the end will help viewers take action. You can:\n\n• Add text like 'Book a call with me'\n• Include your Calendly URL as a clickable link\n• Position it in the final 5-10 seconds of your video\n• Make it prominent but not overwhelming\n\nUse the overlay editor to add this call-to-action at the end of your video!";
  }
  
  if (lowerInput.includes('thank') || lowerInput.includes('thanks') || lowerInput.includes('thank you')) {
    return "Excellent choice! A thank you note adds a professional touch. You can:\n\n• Add 'Thank you for watching!' \n• Include your social media handles\n• Add 'Like and subscribe' if for YouTube\n• Position it in the last 3-5 seconds\n\nUse the overlay editor above to create a warm closing message for your viewers!";
  }
  
  if (lowerInput.includes('call to action') || lowerInput.includes('cta') || lowerInput.includes('button')) {
    return "Smart thinking! Call-to-action overlays boost engagement. You can add:\n\n• 'Visit our website' buttons\n• 'Download our app' links  \n• 'Follow us' social media prompts\n• 'Get started' action buttons\n\nPosition these strategically throughout your video using the overlay editor above!";
  }
  
  return null;
};

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownOverlayPrompt, setHasShownOverlayPrompt] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY || '');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getAIResponse = async (userMessage) => {
    console.log('Getting AI response for:', userMessage);
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    console.log('API Key starts with sk-:', apiKey?.startsWith('sk-'));

    // First check for video recorder launch (always prioritize this)
    if (userMessage.toLowerCase().includes("launch") && userMessage.toLowerCase().includes("video")) {
      return "VIDEO_RECORDER_COMPONENT";
    }

    // If we have an API key, use OpenAI for most responses
    if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.length > 10) {
      try {
        console.log('Calling OpenAI API...');
        const response = await callOpenAI(userMessage, apiKey);
        console.log('OpenAI Response:', response);
        return response;
      } catch (error) {
        console.error('OpenAI Error:', error);
        // Fall through to backup responses on API error
      }
    }

    // Fallback to predefined responses if no API key or API fails
    console.log('Using fallback responses');
    
    // Check for overlay-related responses
    const overlayResponse = getOverlayResponse(userMessage);
    if (overlayResponse) {
      return overlayResponse;
    }

    // Check for specific video recorder questions
    const mockResponse = mockResponses[userMessage];
    if (mockResponse) {
      return mockResponse;
    }

    // Final fallback
    return "I can help you with questions about the video recorder. Try clicking one of the suggested questions above, or ask about recording features, device settings, or troubleshooting. (Add OpenAI API key for AI responses)";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Focus input after messages are added/loading changes
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleOverlaySuggestionClick = async (suggestion) => {
    const userMessage = { id: Date.now(), role: 'user', content: suggestion };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    try {
      const response = await getAIResponse(suggestion);
      const assistantMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response,
        isComponent: response === "VIDEO_RECORDER_COMPONENT"
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const handleRecordingFinished = () => {
    // Only show overlay prompt once per recording session
    if (!hasShownOverlayPrompt) {
      setHasShownOverlayPrompt(true);
      setIsLoading(true);
      
      setTimeout(() => {
        const overlayPromptMessage = { 
          id: Date.now() + 3, 
          role: 'assistant', 
          content: "Great recording! 🎥 Would you like to add overlays to make your video more engaging?",
          hasOverlaySuggestions: true
        };
        setMessages(prev => [...prev, overlayPromptMessage]);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    // Skip user message for video recorder launch
    if (suggestion !== "Launch video recorder") {
      const userMessage = { id: Date.now(), role: 'user', content: suggestion };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);
    
    // Handle video recorder launch with follow-up questions
    if (suggestion === "Launch video recorder") {
      // Add video recorder component first
      setTimeout(() => {
        const recorderMessage = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: "VIDEO_RECORDER_COMPONENT",
          isComponent: true
        };
        setMessages(prev => [...prev, recorderMessage]);
        setIsLoading(false);
        
        // Add follow-up questions immediately with loading state
        setIsLoading(true);
        
        setTimeout(() => {
          const followUpMessage = { 
            id: Date.now() + 2, 
            role: 'assistant', 
            content: "Great! Your video recorder is ready. Before you start recording, I can help you prepare:\n\n• Do you want me to create a script for this recording?\n• What is this video about?\n• Any specific talking points or topics you'd like to cover?\n\nJust let me know how I can assist with your recording!"
          };
          setMessages(prev => [...prev, followUpMessage]);
          setIsLoading(false);
        }, 500);
      }, 1000);
      return;
    }
    
    // Handle other suggestions with AI
    try {
      const response = await getAIResponse(suggestion);
      const assistantMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response,
        isComponent: response === "VIDEO_RECORDER_COMPONENT"
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { id: Date.now(), role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      
      setIsLoading(true);
      
      // Check if user is asking for video recorder launch
      if (input.toLowerCase().includes("launch") && input.toLowerCase().includes("video")) {
        // Add video recorder component first
        setTimeout(() => {
          const recorderMessage = { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: "VIDEO_RECORDER_COMPONENT",
            isComponent: true
          };
          setMessages(prev => [...prev, recorderMessage]);
          setIsLoading(false);
          
          // Add follow-up questions immediately with loading state
          setIsLoading(true);
          
          setTimeout(() => {
            const followUpMessage = { 
              id: Date.now() + 2, 
              role: 'assistant', 
              content: "Great! Your video recorder is ready. Before you start recording, I can help you prepare:\n\n• Do you want me to create a script for this recording?\n• What is this video about?\n• Any specific talking points or topics you'd like to cover?\n\nJust let me know how I can assist with your recording!"
            };
            setMessages(prev => [...prev, followUpMessage]);
            setIsLoading(false);
          }, 500);
        }, 1000);
        setInput('');
        return;
      }
      
      // Handle other messages with AI
      try {
        const response = await getAIResponse(input);
        const assistantMessage = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: response,
          isComponent: response === "VIDEO_RECORDER_COMPONENT"
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: "Sorry, I encountered an error. Please try again."
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="container max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold">PREDDLE</h1>
            {(!apiKey || apiKey === 'your_openai_api_key_here') && (
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="Enter OpenAI API key for AI responses"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-64"
                />
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            Ask me anything about using the video recorder or select from the suggestions below.
            {apiKey && apiKey !== 'your_openai_api_key_here' && (
              <span className="text-green-600 ml-1">✓ AI responses enabled</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-4">
          {/* Chat Messages */}
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`${
                  message.role === 'user'
                    ? 'ml-auto max-w-[80%] bg-primary text-primary-foreground'
                    : message.isComponent
                    ? 'mr-auto max-w-full sticky top-2 z-30 bg-white border-2 border-primary/20'
                    : 'mr-auto max-w-[80%]'
                }`}
              >
                {!message.isComponent && (
                  <CardHeader className="pb-2">
                    <CardDescription className={message.role === 'user' ? 'text-primary-foreground/70' : ''}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </CardDescription>
                  </CardHeader>
                )}
                <CardContent className={message.isComponent ? 'p-0' : 'pt-0'}>
                  {message.isComponent ? (
                    <VideoRecorderApp key={message.id} onRecordingFinished={handleRecordingFinished} />
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      {message.hasOverlaySuggestions && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-3 text-left whitespace-normal text-sm"
                            onClick={() => handleOverlaySuggestionClick("Add intro")}
                          >
                            🎬 Add Intro
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-3 text-left whitespace-normal text-sm"
                            onClick={() => handleOverlaySuggestionClick("Add Calendly at the end")}
                          >
                            📅 Add Calendly Link
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-3 text-left whitespace-normal text-sm"
                            onClick={() => handleOverlaySuggestionClick("Add thank you note")}
                          >
                            🙏 Thank You Note
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-3 text-left whitespace-normal text-sm"
                            onClick={() => handleOverlaySuggestionClick("Add call to action button")}
                          >
                            🔗 Call-to-Action
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {isLoading && (
              <Card className="mr-auto max-w-[80%]">
                <CardHeader className="pb-2">
                  <CardDescription>Assistant</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </CardContent>
              </Card>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 border-t bg-muted/30">
          <div className="container max-w-4xl mx-auto p-4">
            <h2 className="text-lg font-semibold mb-3">Quick Questions:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left whitespace-normal"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Input Container */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="container max-w-4xl mx-auto p-4">
          <form onSubmit={onSubmit} className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me about the video recorder..."
              className="pr-12 h-12"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-1 top-1 h-10 w-10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <p className="mt-2 text-sm text-muted-foreground text-center">
            You can ask questions about video recording features, troubleshooting, or click the suggestions above.
          </p>
        </div>
      </div>

    </div>
  );
}

export default App;