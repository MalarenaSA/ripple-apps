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

// Load xrpl.js API
const xrpl = require("xrpl");
console.log();  // Blank line for ease of reading output

// Async function to connect to XRP Server and process requests
async function main() {
  // Configure Client
  const client = new xrpl.Client(process.env.XRPL_SERVER_URL);
  
  // Handle Connection
  client.on("connected", ()=> {
    console.log(`[Connected] to ${process.env.XRPL_SERVER_NAME} server: ${process.env.XRPL_SERVER_URL}\n`);
  });
  
  // Handle Disconnection
  client.on("disconnected", (code)=> {
    console.log(`[Disconnected] from ${process.env.XRPL_SERVER_NAME} server with code: ${code}\n`);
  });

  // Create a wallet from an existing SEED
  console.log("[Working] Getting Wallet...");
  const wallet = xrpl.Wallet.fromSeed(process.env.XRPL_SEED);
  console.log(`[Wallet] Created for account '${wallet.address}'\n`);
  
  try {
    // Make connection
    await client.connect();

    // Prepare the transaction  
    console.log("\n[Working] Transaction Being Prepared...");
    const preparedTx = await client.autofill({
      "TransactionType": "Payment",
      "Account": wallet.classicAddress,
      "Amount": process.env.XRPL_AMT_DROPS,
      "Destination": process.env.XRPL_DESTINATION
    });

    // Display preparedTx & ask to continue
    showMessage("PreparedTx", preparedTx, true);
    const answerSign = await ask("Sign above transaction (Yes/No)? ");
    if (answerSign !== "Yes") {
      // Only proceed if answer is "Yes"
      throw "Signing Process Terminated.";
    }

    // Sign the transaction
    console.log(`\n[Working] Transaction Being Signed...`);
    const signedTx = wallet.sign(preparedTx);
    
    // Display signedTx & ask to continue
    showMessage("SignedTx", signedTx, true);
    const answerSubmit = await ask("Submit above signed transaction (Yes/No)? ");
    if (answerSubmit !== "Yes") {
      // Only proceed if answer is "Yes"
      throw "Submission Process Terminated.";
    }

    // Submit transaction & Wait
    console.log(`\n[Working] Transaction Submitted. Awaiting Result...`);
    const tx = await client.submitAndWait(signedTx.tx_blob);

    // Display submission results
    showMessage("SubmissionResult", tx, true);
    const meta = tx.result.meta;
    showMessage("BalanceChanges:", xrpl.getBalanceChanges(meta), true);
    console.log(`Link: ${process.env.XRPL_EXPLORER}transactions/${tx.result.hash} `);
    console.log(`CLI: node getTransactionInfo.js ${tx.result.hash}\n`);

  } catch (error) {
    // Handle Errors
    console.error(`[Error]: ${error}\n`);
  }

  // Disconnect from server & close Readline
  client.disconnect();
  rl.close();
}


// Function to display formatted messages on the console
function showMessage(title, message, fullDepth = false) {
  console.log(`---------- ${title} ----------`);
  if (fullDepth === true) {
    // Use this for showing full depth objects
    console.dir(message, {depth: null});
  } else {
    console.log(message);
  }
  console.log(`========== \\${title} ==========`, "\n");
}

// Function to ask the user a question & return the answer
function ask(question) {
  return new Promise ((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run main function
main();
