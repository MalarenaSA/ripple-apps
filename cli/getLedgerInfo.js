"use strict";

// getLedgerInfo App - To get ledger info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);
// console.log(process.env);

// Load ripple-lib API
const RippleAPI = require("ripple-lib").RippleAPI;

// Configure API
const api = new RippleAPI({
  server: process.env.XRPL_SERVER
});

// Connect to Server
api.connect();

// Handle Errors
api.on("error", (errorCode, errorMessage, data) => {
  console.error(`${errorCode} : ${errorMessage} : ${data}`);
});

// Once connected, provide ledger info
api.on("connected", async () => {
  const response = await api.getLedger();
  showMessage("LedgerInfo", response);
  showMessage("Total XRP", api.dropsToXrp(response.totalDrops));
  // Disconnect from Server
  api.disconnect();
});

// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========`, "\n");
}
