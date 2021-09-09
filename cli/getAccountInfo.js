"use strict";

// getAccountInfo App - To get account info

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);

// Get Account Details from Command Line or Env Variables
const accountName = (process.argv[2] !== undefined) ?
  "CLI" :
  process.env.XRPL_ACCOUNT;
const accountAddress = (process.argv[2] !== undefined) ? 
  process.argv[2] :
  process.env.XRPL_ADDRESS;

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
  return api.getAccountInfo(accountAddress);
}).then((response) => {
  // Process Response
  showMessage("Account", `${accountName} - ${accountAddress}`);
  showMessage("AccountInfo", response);
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
  console.log(`========== \\${title} ==========\n`);
}
