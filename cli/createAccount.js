"use strict";

// createAccount App - To create a new XRP Ledger account

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.log(dotenvConfig.error);
// console.log(process.env);

// Load ripple-lib API
const RippleAPI = require("ripple-lib").RippleAPI;

// Connect to server
const api = new RippleAPI({
  server: process.env.XRPL_SERVER
});

// Make Connection
api.connect();

// Handle Errors
api.on("error", (errorCode, errorMessage, data) => {
  console.error(`${errorCode} : ${errorMessage} : ${data}`);
});

// Once connected, create new account
api.on("connected", async () => {
  const response = await api.generateAddress();
  showMessage("CreateAccount", response);
  showMessage("Address", response.address);
  showMessage("Secret", response.secret);
  api.disconnect();
});

// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========`, "\n");
}
