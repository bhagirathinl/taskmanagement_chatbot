import express from 'express';
import chatRoutes from './routes/chat.js'; // ✅ Correct import
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log('🟢 Starting chatbot server...');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/chat', chatRoutes);

const port = process.env.PORT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log(`🔑 OPENAI_API_KEY is: ${OPENAI_API_KEY}`);
console.log(`🚀 Server will run on port: ${port}`);

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables.');
  console.log('Please set the OPENAI_API_KEY to run the chatbot server.');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`🤖 Chatbot server running at http://localhost:${port}`);
});
