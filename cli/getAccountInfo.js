"use strict";

// getAccountInfo App - To get account info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);

// Get Account Details from the Command Line or Env Variables
const accountName = (process.argv[2] !== undefined) ?
  "CLI" :
  process.env.XRPL_ACCOUNT;
const accountAddress = (process.argv[2] !== undefined) ? 
  process.argv[2] :
  process.env.XRPL_ADDRESS;

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
      "id": "account_info",
      "command": "account_info",
      "account": accountAddress,
      "ledger_index": "validated"
    });
    
    // Process Response
    showMessage("AccountInfo", response, "full");
    const accountData = response.result.account_data;
    showMessage("AccountSummary", `Account: ${accountName} - ${accountAddress}\nBalance: ${xrpl.dropsToXrp(accountData.Balance)} XRP`);

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
