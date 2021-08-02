"use strict";

// getCurrentFee App - To get current estimated transaction fee

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.error(dotenvConfig.error);

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
  return api.getFee();
}).then((response) => {
  // Process Response
  showMessage("Current Fee", response);
}).then(() => {
  // Disconnect from the server
  return api.disconnect();
}). catch(console.error);


// Function to display formatted messages on the console
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========\n`);
}
