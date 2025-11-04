import OpenAI from 'openai';

async function generateAIBulletin(user, data) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `You are a friendly AI assistant creating a personalized 
  morning briefing for ${user.name}, a ${user.role}.
  
  Data: ${JSON.stringify(data)}
  
  Create a natural, encouraging 60-second briefing that:
  - Highlights urgent items
  - Celebrates progress
  - Provides actionable insights
  - Sounds human and conversational
  
  Tone: ${user.role === 'client' ? 'Professional but warm' : 'Casual and motivating'}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",  // Faster and cheaper
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });

  return completion.choices[0].message.content;
}