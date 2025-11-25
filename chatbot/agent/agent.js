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
      content: `You are a helpful AI assistant for a project management system. You have access to a SQL database and can generate queries dynamically to answer user questions.

DATABASE SCHEMA:
================
TABLE: users (id, name, email, role['client','employee'], created_at)
TABLE: projects (id, name, client_id->users.id, status['pending','in_progress','completed','on_hold'], deadline, created_at)
TABLE: tasks (id, project_id->projects.id, assigned_to->users.id, description, status['pending','in_progress','completed','on_hold'], due_date, updated_at)

YOUR TASK:
1. Understand the user's request
2. Generate an appropriate SQL query to fetch or modify the data
3. Call the executeSqlQuery tool with your generated query
4. Present the results in a clear, user-friendly format

QUERY GUIDELINES:
- Use JOINs to include human-readable names (user names, project names) instead of just IDs
- For overdue tasks: WHERE due_date < CURDATE() AND status != 'completed'
- Use aggregation (COUNT, SUM with CASE) for statistics
- Always include helpful columns like names, dates, and statuses

EXAMPLES:
- "Show all projects" -> SELECT * FROM projects
- "Who is working on Website Redesign?" -> SELECT u.name, t.description, t.status FROM tasks t JOIN users u ON t.assigned_to = u.id JOIN projects p ON t.project_id = p.id WHERE p.name LIKE '%Website Redesign%'
- "What are overdue tasks?" -> SELECT t.*, u.name as assignee, p.name as project FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id WHERE t.due_date < CURDATE() AND t.status != 'completed'

IMPORTANT:
- ALWAYS call executeSqlQuery to get real data - NEVER assume or make up data
- Generate efficient queries that return all needed information
- Remember conversation context for follow-up questions
- Present results in a natural, conversational way
- When users say "my projects", "my tasks", or similar possessive phrases, treat it as ALL projects/tasks - do NOT ask for user ID or email`
    };
    console.log("🧾 System message prepared.", systemMessage);

    // ✅ Build messages array with full conversation history
    const messages = [
      systemMessage,
      ...conversationHistory, // This should be simple {role, content} objects
      {
        role: "user",
        content: userMessage
      }
    ];

    console.log("📨 Messages being sent to model:", messages,messages.length);

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