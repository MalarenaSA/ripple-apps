"use strict";

// getLedgerInfo App - To get ledger info

// Global Constants
const RIPPLE_EPOCH = 946684800;  // Ripple Epoch Timestamp in seconds

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
  const client = new xrpl.Client(process.env.XRPL_SERVER);
  
  // Handle Connection
  client.on("connected", ()=> {
    console.log(`[Connected] to server: ${process.env.XRPL_SERVER}\n`);
  });
  
  // Handle Disconnection
  client.on("disconnected", (code)=> {
    console.log(`[Disconnected] from server with code: ${code}\n`);
  });

  try {
    // Make connection
    await client.connect();

    // Create & Send Request
    console.log(`[Working] Request Submitted...\n`);
    const response = await client.request({
      "id": "ledger_info",
      "command": "ledger",
      "ledger_index": "validated"
    });
    
    // Process Response
    showMessage("LedgerInfo", response, "full");
    const ledger = response.result.ledger;
    const ledgerAge = (new Date().getTime() / 1000) - (RIPPLE_EPOCH + ledger.close_time);
    showMessage("LedgerSummary", `Ledger Index: ${ledger.ledger_index}\nLedger Age: ${ledgerAge.toFixed(4)}s\nValidated: ${response.result.validated}`);

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
