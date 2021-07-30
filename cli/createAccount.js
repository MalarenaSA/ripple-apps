"use strict";

// createAccount App - To create a new XRP Ledger account

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

// Create new account
async function run() {
  const response = await api.generateAddress();
  showMessage("CreateAccount", response);
  showMessage("Address", response.address);
  showMessage("Secret", response.secret);
}

// Run Function
run();

// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========`, "\n");
}
