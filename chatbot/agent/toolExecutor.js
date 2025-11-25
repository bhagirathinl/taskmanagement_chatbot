import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}

export async function executeToolCall({ function: funcCall }) {
  const { name, arguments: rawArgs } = funcCall;
  // Handle both string (from Realtime API) and object (from LangChain) arguments
  const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
  console.log(`🔧 Executing tool: ${name}`, args);

  try {
    let data;

    switch (name) {
      case 'executeSqlQuery':
        // Execute the dynamic SQL query
        data = await makeRequest('/sql/execute', 'POST', { query: args.query });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error(`❌ Tool execution error for ${name}:`, error);
    return { success: false, error: error.message };
  }
}
