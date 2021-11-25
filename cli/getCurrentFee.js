"use strict";

// getCurrentFee App - To get current estimated transaction fee

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
    console.log(`[Working] Requests Submitted...\n`);
    const response = await client.request({
      "id": "fee_info",
      "command": "fee"
    });

    // Process Response
    showMessage("CurrentFee", response, true);
    const drops = response.result.drops;
    const minFeeCush = Math.round(drops.minimum_fee * client.feeCushion);
    const openLedgerFeeCush = Math.round(drops.open_ledger_fee * client.feeCushion);
    showMessage("CurrentFeeSummary", `Fee Cushion: ${client.feeCushion}\nMinimum Fee: ${xrpl.dropsToXrp(drops.minimum_fee)} XRP / + Cushion: ${xrpl.dropsToXrp(minFeeCush)} XRP\nOpen Ledger Fee: ${xrpl.dropsToXrp(drops.open_ledger_fee)} XRP / + Cushion: ${xrpl.dropsToXrp(openLedgerFeeCush)} XRP`);

  } catch (error) {
    // Handle Errors
    console.error(`[Error]: ${error}\n`);
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
