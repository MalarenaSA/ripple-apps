"use strict";

// sendXRPPayments.app - Create, Sign & Send an XRP Payment Transaction

// Load Env Variables
const Dotenv = require("dotenv");
const dotenvConfig = Dotenv.config();
if (dotenvConfig.error) console.error(dotenvConfig.error);

// Load Node Readline functionality
const Readline = require("readline");
const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  // Close readline
  rl.close();
});


// Connect to Server and process request
let preparedTx = {};  // Prepared Transaction
let signedTx = {};  // Signed Transaction

api.connect().then(() => {
  // Prepare Transaction
  const transaction = {
    "TransactionType": "Payment",
    "Account": process.env.XRPL_ADDRESS,
    "Amount": process.env.XRPL_AMT_DROPS,
    "Destination": process.env.XRPL_DESTINATION
  };
  const instructions = {
    "maxLedgerVersionOffset": 50  // ~ 3-4mins
  };
  return api.prepareTransaction(transaction, instructions);
}).then((response) => {
  // Display preparedTx & ask to continue
  preparedTx = response;
  showMessage("PreparedTx", (JSON.parse(preparedTx.txJSON)));
  showMessage("Instructions", (preparedTx.instructions));
  return ask("Sign above transaction (Yes/No)? ");
}).then((answer) => {
  if (answer !== "Yes") {
    // Only proceed if answer is "Yes"
    throw "Signing Process Terminated.";
  }
  // Sign transaction
  return api.sign(preparedTx.txJSON, process.env.XRPL_SECRET);
}).then((response) => {
  // Display signedTx & ask to continue
  signedTx = response;
  showMessage("SignedTx", signedTx);
  return ask("Submit above signed transaction (Yes/No)? ");
}).then((answer) => {
  if (answer !== "Yes") {
    // Only proceed if answer is "Yes"
    throw "Sending Process Terminated.";
  }
  // Submit transaction
  return api.submit(signedTx.signedTransaction);
}).then((response) => {
  // Display tentative result
  showMessage("Tentative Result", response);
  console.log(`See monitor, XRPL Explorer or CLI:getTransaction() for final status.`);
  console.log(`Link: ${process.env.XRPL_EXPLORER}transactions/${response.tx_json.hash}`);
  console.log(`CLI: node getTransactionInfo.js ${response.tx_json.hash}\n`);
}).then(() => {
  // Disconnect from the server
  return api.disconnect();
}).catch((error) => {
  // Handle response errors
  if (typeof error === "object") {
    console.error("Response returned an Error:");
  }
  console.error(error);
  return api.disconnect();
});


// Function to display formatted messages on the console
function showMessage(title, message) {
  console.log(`---------- ${title} ----------`);
  console.log(message);
  console.log(`========== \\${title} ==========\n`);
}

// Function to ask the user a question & return the answer
function ask(question) {
  return new Promise ((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}
