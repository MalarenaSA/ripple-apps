"use strict";

// getLedgerInfo App - To get ledger info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);

// Load ripple-lib API
const RippleAPI = require("ripple-lib").RippleAPI;

// Configure API
const api = new RippleAPI({
  server: process.env.XRPL_SERVER
});

// Handle Errors
api.on("error", (errorCode, errorMessage, data) => {
  console.error(`${errorCode} : ${errorMessage} : ${data}`);
});

// Handle Connection
api.on("connected", () => {
  console.log(`Connected to server: ${process.env.XRPL_SERVER}\n`);
});

// Handle Disconnection
api.on("disconnected", (code) => {
  console.log(`Disconnected from server with code: ${code}\n`);
});


// Connect to Server and process request
api.connect().then(() => {
  // Send Request
  return api.getLedger();
}).then((response) => {
  // Process Response
  const age = (new Date() - new Date(response.closeTime)) / 1000;
  showMessage("LedgerInfo", response);
  showMessage("LedgerSummary", `Age: ${age} / Latest:  ${response.ledgerVersion}`);
  // showMessage("Total XRP", api.dropsToXrp(response.totalDrops));  // Not really required!
}).then(() => {
  // Disconnect from the server
  return api.disconnect();
}). catch(console.error);


// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========\n`);
}
