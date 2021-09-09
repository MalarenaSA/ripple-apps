"use strict";

// getTransactionInfo App - To get transaction info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);

// Get Transaction from Command Line or Env Variables
const transaction = (process.argv[2] !== undefined) ? 
  process.argv[2] :
  process.env.XRPL_TRANSACTION;

// Load ripple-lib API
const RippleAPI = require("ripple-lib").RippleAPI;

// Configure API
const api = new RippleAPI({
  server: process.env.XRPL_SERVER
});

// Handle API Connection Errors
api.on("error", (errorCode, errorMessage, data) => {
  console.error(`API Connection Error:`);
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
  return api.getTransaction(transaction);
}).then((response) => {
  // Process Response
  showMessage("TransactionInfo", response);
  showMessage("TransactionSummary", `Result: ${response.outcome.result}\nAmount: ${response.outcome.deliveredAmount.value} ${response.outcome.deliveredAmount.currency}`);
}).then(() => {
  // Disconnect from the server
  return api.disconnect();
}).catch((error) => {
  // Handle response errors
  console.error("Response returned an Error:");
  console.error(error);
  return api.disconnect();
});


// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========`, "\n");
}
