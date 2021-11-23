"use strict";

// createAccount App - To create a new XRP Ledger account

// Load xrpl.js API
const xrpl = require("xrpl");
console.log();  // Blank line for ease of reading output

// Create new wallet containing new account and seed
const wallet = xrpl.Wallet.generate();

// Process Response
showMessage("Wallet", wallet, "full");
showMessage("WalletSummary", `Address: ${wallet.classicAddress}\nSeed: ${wallet.seed}`);


// Function to display formatted messages on the console
function showMessage(title, message, depth = null) {
  console.log(`---------- ${title} ----------`);
  if (depth === "full") {
    // Use this for showing full depth objects
    console.dir(message, {depth: null});
  } else {
    console.log(message);
  }
  console.log(`========== \\${title} ==========`, "\n");
}
