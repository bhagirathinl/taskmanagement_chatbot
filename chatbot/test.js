import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "gpt-4",
  openAIApiKey: "sk-proj-yourkey"
});

model.invoke("Say hello").then(console.log).catch(console.error);