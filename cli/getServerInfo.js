"use strict";

// getServerInfo App - To get server info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);

// Load xrpl.js API
const xrpl = require("xrpl");
console.log();  // Blank line for ease of reading output

// Async function to connect to XRP Server and process requests
async function main() {
  // Configure Client
  const client = new xrpl.Client(process.env.XRPL_SERVER_URL);
  
  // Handle Connection
  client.on("connected", ()=> {
    console.log(`[Connected] to ${process.env.XRPL_SERVER_NAME} server: ${process.env.XRPL_SERVER_URL}\n`);
  });
  
  // Handle Disconnection
  client.on("disconnected", (code)=> {
    console.log(`[Disconnected] from ${process.env.XRPL_SERVER_NAME} server with code: ${code}\n`);
  });

  try {
    // Make connection
    await client.connect();

    // Create & Send Request
    console.log(`[Working] Request Submitted...\n`);
    const response = await client.request({
      "id": "server_info",
      "command": "server_info"
    });

    // Process Response
    showMessage("ServerInfo", response, true);
    const info = response.result.info;
    showMessage("ServerSummary", `Hostname: ${info.hostid}\nState: ${info.server_state}\nLatest Ledger: ${info.validated_ledger.seq}`);
    
  } catch (error) {
    // Handle Errors
    console.error(`\x1b[31m[Error]\x1b[0m ${error}\n`);
  }

  // Disconnect from server
  client.disconnect();
}

// Function to display formatted messages on the console
function showMessage(title, message, fullDepth = false) {
  console.log(`---------- ${title} ----------`);
  if (fullDepth === true) {
    // Use this for showing full depth objects
    console.dir(message, {depth: null});
  } else {
    console.log(message);
  }
  console.log(`========== \\${title} ==========`, "\n");
}

// Run main function
main();
