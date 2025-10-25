// agent.js
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

import tools from "./tools.js";
import * as toolExecutor from "./toolExecutor.js";

// ✅ Extract tools from OpenAI format
const toolsList = tools.map(tool => {
  const toolDef = tool.function || tool;
  return {
    name: toolDef.name,
    description: toolDef.description,
    parameters: toolDef.parameters?.properties || {}
  };
});

console.log("📋 Available tools:", toolsList.map(t => t.name));

// ✅ Wrap tools with LangChain-compatible schema
const wrappedTools = toolsList.map((tool) => {
  const toolName = tool.name;
  const toolDescription = tool.description || `Tool: ${toolName}`;
  
  const schemaShape = {};
  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (paramDef.type === "string") {
      schemaShape[paramName] = z.string().describe(paramDef.description || "");
    } else if (paramDef.type === "number") {
      schemaShape[paramName] = z.number().describe(paramDef.description || "");
    } else if (paramDef.type === "boolean") {
      schemaShape[paramName] = z.boolean().describe(paramDef.description || "");
    } else {
      schemaShape[paramName] = z.any().describe(paramDef.description || "");
    }
  }
  
  console.log(`📋 Registering tool: ${toolName} with params:`, Object.keys(schemaShape));
  
  return new DynamicStructuredTool({
    name: toolName,
    description: toolDescription,
    schema: z.object(schemaShape),
    func: async (args) => {
      console.log(`🔧 Executing tool: ${toolName} with args:`, args);
      const result = await toolExecutor.executeToolCall({ 
        function: { name: toolName, arguments: args } 
      });
      return JSON.stringify(result.data);
    },
  });
});

// ✅ Initialize OpenAI model
const chatModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const modelWithTools = chatModel.bindTools(wrappedTools);

// ✅ UPDATED: Now accepts conversationHistory parameter
export async function getChatResponse(userMessage, conversationHistory = []) {
  console.log("💬 User message:", userMessage);
  console.log("📜 Conversation history:", JSON.stringify(conversationHistory, null, 2));
  
  try {
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant with access to project management tools. 

IMPORTANT INSTRUCTIONS:
- When asked about a project, you MUST gather ALL relevant information by calling multiple tools
- First use getAllProjects or searchProjectByName to find the project ID
- Then use getProjectSummary to get project details
- Then use getUserTasks to get tasks for team members mentioned in the summary
- ALWAYS call tools to get real data - NEVER make assumptions or provide generic information
- If you need information from multiple sources, call multiple tools
- Correlate and combine data from different tool calls to provide a complete answer
- Remember context from previous messages in this conversation
- If the user refers to "it", "that project", "those tasks", etc., use the context from previous messages

When presenting information:
- Show actual task names and details from the data
- Show actual team member names and their specific tasks
- Include relevant dates, statuses, and assignments
- Organize the information clearly with the actual data retrieved`
    };

    // ✅ Build messages array with full conversation history
    const messages = [
      systemMessage,
      ...conversationHistory, // This should be simple {role, content} objects
      {
        role: "user",
        content: userMessage
      }
    ];

    console.log("📨 Messages being sent to model:", messages.length);

    let iterations = 0;
    const maxIterations = 5;
    
    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n🔄 Iteration ${iterations}`);
      
      const response = await modelWithTools.invoke(messages);
      console.log("🧠 Model response type:", response.constructor.name);
      
      // Add assistant's response to messages
      messages.push(response);
      
      // Check if model wants to call tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`📞 Model wants to call ${response.tool_calls.length} tool(s)`);
        
        // Execute each tool call
        for (const toolCall of response.tool_calls) {
          const tool = wrappedTools.find(t => t.name === toolCall.name);
          
          if (!tool) {
            console.error(`❌ Tool "${toolCall.name}" not found`);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: `Error: Tool "${toolCall.name}" not found`
            });
            continue;
          }
          
          console.log(`🔧 Executing: ${toolCall.name} with args:`, toolCall.args);
          
          try {
            const result = await tool.func(toolCall.args);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.name,
              content: result
            });
            console.log(`✅ Tool result length:`, result.length);
          } catch (error) {
            console.error(`❌ Tool execution failed:`, error);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: `Error executing tool: ${error.message}`
            });
          }
        }
        
        // Continue loop to let model process tool results
        continue;
      } else {
        // No more tool calls, return final response
        console.log("📝 Final output:", response.content);
        return response.content;
      }
    }
    
    console.log("⚠️ Max iterations reached");
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content || "I've gathered information but reached the maximum number of steps.";
    
  } catch (error) {
    console.error("❌ Error during agent execution:", error);
    throw error;
  }
}