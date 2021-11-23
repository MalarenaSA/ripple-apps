"use strict";

// APP-NAME App - To APP-DESC

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.error(dotenvConfig.error);

// Load xrpl.js API
const xrpl = require("xrpl");
console.log();  // Blank line for ease of reading output

// Async function to connect to XRP Server and process requests
async function main() {
  // Configure Client
  const client = new xrpl.Client(process.env.XRPL_SERVER);
  
  // Handle Connection
  client.on("connected", ()=> {
    console.log(`[Connected] to server: ${process.env.XRPL_SERVER}\n`);
  });
  
  // Handle Disconnection
  client.on("disconnected", (code)=> {
    console.log(`[Disconnected] from server with code: ${code}\n`);
  });
  
  // Create a wallet from an existing SEED
  /* Only required if signing a transaction */
  console.log("[Working] Getting Wallet...");
  const wallet = xrpl.Wallet.fromSeed(process.env.XRPL_SEED);
  console.log(`[Wallet] Created for account '${wallet.address}'\n`);
  
  try {
    // Make connection
    await client.connect();

    // Create & Send Request
    console.log(`[Working] Request Submitted...\n`);
    const response = await client.request({
      /* Insert / Update Code Here */
      "id": "TBA",
      "command": "TBA",
      "account": wallet.address,
      "ledger_index": "validated"
    });

    // Process Response
    showMessage("TITLE", response, "full");
    const info = response.result.SOMETHING;
    showMessage("TITLESummary", `summaryData`);

  } catch (error) {
    // Handle Errors
    console.error(`[Error]: ${error}\n`);
  }

  // Disconnect from server
  client.disconnect();
}

// Function to display formatted messages on the console
function showMessage(title, message, depth = null) {
  console.log(`---------- ${title} ----------`);
  if (depth === "full") {
    // Use this for showing full depth objects
    console.dir(message, {depth: null});
  } else {
    console.log(message);
  }
  console.log(`========== \\${title} ==========`, "\n");
}

// Run main function
main();
