"use strict";

// getServerInfo App - To get server info

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

// Once connected, provide server info
api.on("connected", async () => {
  const response = await api.getServerInfo();
  showMessage("ServerInfo", response);
  api.disconnect();
});

// Function to display similar console messages
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========`);
}
