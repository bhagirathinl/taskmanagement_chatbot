// services/openaiClient.js
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: "sk-proj-your key here"
});

module.exports = openai;