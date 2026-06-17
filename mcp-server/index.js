const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const newman = require("newman");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const axios = require("axios");

// Load local MCP .env
dotenv.config({ path: path.join(__dirname, ".env") });

const server = new Server(
  {
    name: "jannetra-pro-tester",
    version: "1.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_live_postman_test",
        description: "Triggers a live Postman collection run in the workspace and returns results",
        inputSchema: {
          type: "object",
          properties: {
            verifyDb: { type: "boolean", description: "Whether to verify database after run" },
            username: { type: "string", description: "Username to verify in DB if verifyDb is true" }
          }
        },
      },
      {
        name: "run_local_api_tests",
        description: "Runs local Postman collections using Newman",
        inputSchema: {
          type: "object",
          properties: {
            collectionName: { type: "string", description: "Name of the .json collection in tests folder" },
          },
          required: ["collectionName"],
        },
      },
      {
        name: "get_db_stats",
        description: "Gets statistics from JanNetra MongoDB database (total users, etc.)",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "verify_user_in_db",
        description: "Checks if a specific username exists in the database",
        inputSchema: {
          type: "object",
          properties: {
            username: { type: "string" },
          },
          required: ["username"],
        },
      }
    ],
  };
});

// Tool Logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "run_live_postman_test") {
      const response = await axios.post(
        `https://api.getpostman.com/collections/${process.env.POSTMAN_COLLECTION_ID}/runs?environment=${process.env.POSTMAN_ENVIRONMENT_ID}`,
        {},
        {
          headers: {
            "X-Api-Key": process.env.POSTMAN_API_KEY,
          },
        }
      );

      const runData = response.data;
      // Note: Structure might vary slightly based on Postman API version
      const stats = runData.run.stats;
      const failures = runData.run.failures;
      
      let resultText = `Postman Live Run Completed! ✅\n\n` +
                       `Run ID: ${runData.run.id}\n` +
                       `Total Requests: ${stats.requests.total}\n` +
                       `Failed Assertions: ${stats.assertions.failed}\n`;

      if (failures && failures.length > 0) {
        resultText += `\nFailures:\n` + failures.map(f => `- ${f.error.name}: ${f.error.message}`).join('\n') + `\n`;
      }

      if (args.verifyDb && args.username) {
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.MONGODB_URI);
        }
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ username: args.username });
        resultText += user 
          ? `\nDB Verification: User '${args.username}' found in MongoDB! ✅` 
          : `\nDB Verification: User '${args.username}' NOT found in MongoDB! ❌`;
      }

      return { content: [{ type: "text", text: resultText }] };
    }

    if (name === "run_local_api_tests") {
      const collectionPath = path.join(__dirname, "tests", args.collectionName);
      return new Promise((resolve) => {
        newman.run({ collection: collectionPath, reporters: "cli" }, (err, summary) => {
          if (err) resolve({ content: [{ type: "text", text: `Error: ${err.message}` }], isError: true });
          else {
            const msg = summary.run.failures.length === 0 ? "Tests Passed! ✅" : `Failed: ${summary.run.failures.length} issues. ❌`;
            resolve({ content: [{ type: "text", text: msg }] });
          }
        });
      });
    }

    if (name === "get_db_stats" || name === "verify_user_in_db") {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
      }
      const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));

      if (name === "get_db_stats") {
        const count = await User.countDocuments();
        return { content: [{ type: "text", text: `Total Users in Database: ${count}` }] };
      }

      if (name === "verify_user_in_db") {
        const user = await User.findOne({ username: args.username });
        return { content: [{ type: "text", text: user ? `Found user: ${user.fullName} (${user.mobile}) ✅` : "User not found ❌" }] };
      }
    }
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    return { content: [{ type: "text", text: `Error: ${errorMsg}` }], isError: true };
  }

  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
