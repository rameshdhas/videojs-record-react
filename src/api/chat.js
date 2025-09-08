import OpenAI from 'openai';

// This would normally be on your backend server
export const callOpenAI = async (message, apiKey) => {
  console.log('callOpenAI called with:', { message, apiKey: apiKey?.substring(0, 7) + '...' });
  
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for demo - move to backend in production
    });

    console.log('OpenAI client created successfully');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are PREDDLE, a helpful AI assistant specialized in video recording and overlay creation. You help users with:

- Video recording guidance and troubleshooting
- Adding overlays to videos (intros, outros, call-to-actions, Calendly links)
- Technical support for the video recorder interface
- Creative suggestions for video enhancement

Key capabilities you should mention:
- VideoJS-based recording with device selection
- Multiple aspect ratios (16:9, 1:1, 9:16)  
- Mirror mode for natural recording
- Overlay editor with drag-and-drop positioning
- Popular overlay types: intros, thank you notes, Calendly links, CTAs

Be concise, helpful, and encouraging. Always relate responses back to video recording or overlay creation when possible.`
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    console.log('OpenAI API call successful');
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error details:', error);
    throw error;
  }
};