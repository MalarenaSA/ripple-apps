"use strict";
// JavaScript for Monitor App

// Global Constants
const SERVERS = {  // List of XRP Server URL's
  "Mainnet": "wss://xrplcluster.com/",
  "Testnet": "wss://s.altnet.rippletest.net/",
  "Localnet": "ws://localhost:6006/",
};
const WS_HANDLERS = {  // Websocket Message Handlers
  "response": processResponse,
  "transaction": processTransaction,
};
const ID_PREFIX = Math.round(Math.random() * 10000);  // Message ID Prefix - Random 4 digits



// Global Variables
let currentServer = SERVERS["Testnet"];  // Current Server to connect to
let awaitingMsgs = {};  // Object to hold awaiting messages
let messageID = 0;  // Specific message ID
let currentAccounts = [{  // Current Accounts
  "account": "Testnet01",
  "address": "rww9WLeWwviNvAJV3QeRCof3kJLomPnaNw",
}, {
  "account": "Testnet02",
  "address": "rhacBEhAdTBeuwcXe5ArVnX8Kwh886poSo",
}, {
  "account": "Testnet03",
  "address": "rnbsExCdXV2y85Qg9ewKkuNsuQGGjDBfBC",
}];

// Global HTML Elements
const statusEl = document.getElementById("status");


// Set Initial Status
showStatus("text-light", "Waiting...");

// Setup Websocket Connection
const socket = new WebSocket(currentServer);

// Add Websocket "close" event listener
socket.addEventListener("close", () => {
  console.log(`Disconnected from '${currentServer}'`);
  // Show disconnected message, but only if no error message
  if (!statusEl.lastChild.classList.contains("col-danger")) {
    showStatus("text-warning", "Disconnected");
  }
});

// Add Websocket "error" event listener
socket.addEventListener("error", (event) => {
  console.log(event);
  showStatus("col-danger", "Error. See console");
});

// Add Websocket "message" event listener
socket.addEventListener("message", (event) => {
  try {
    const parsedData = JSON.parse(event.data);
    // Check WS_HANDLERS has a method to process the message type
    if (Object.prototype.hasOwnProperty.call(WS_HANDLERS, parsedData.type)) {
      // Call the message handler with the data
      WS_HANDLERS[parsedData.type](parsedData);
    } else {
      throw new Error(`Message Type '${parsedData.type}' not setup in WS_HANDLERS`);
    }
  } catch (error) {
    console.error(`Websocket Message Error: ${error}`);
    console.log(event);
    showStatus("col-danger", "Error. See console");
  }
});

// Add Websocket "open" event listener
socket.addEventListener("open", () => {
  console.log(`Connected to '${currentServer}'`);
  showStatus("col-success", "Connected");
  // Get all initial data
  getServerInfo();
  getLedgerInfo();
  getAccountsInfo();
});


// Function to load a Websocket Request into a Promise
function createRequest(message) {
  // Check if message contains an ID and if not add one
  if (!Object.prototype.hasOwnProperty.call(message, "id")) {
    message.id = `${ID_PREFIX}-${messageID}`;
    messageID++;
  }

  // Create Promise
  let resolveHolder;
  awaitingMsgs[message.id] = new Promise((resolve, reject) => {
    resolveHolder = resolve;
    try {
      socket.send(JSON.stringify(message));
    } catch (error) {
      reject(error);
    }
  });

  // Load message into Awaiting Messages
  awaitingMsgs[message.id].resolve = resolveHolder;
  // console.log(awaitingMsgs);
  return awaitingMsgs[message.id];
}

// Function to process a Websocket Response
function processResponse(data) {
  try {
    // Check if the response contains an ID
    if (!Object.prototype.hasOwnProperty.call(data, "id")) {
      throw new Error(`Response received without ID`);
    }
    // Check if waiting for received ID
    if (Object.prototype.hasOwnProperty.call(awaitingMsgs, data.id)) {
      // Run resolve promise
      awaitingMsgs[data.id].resolve(data);
    } else {
      throw new Error(`Response received for un-awaited request with ID: ${data.id}`);
    }
  } catch (error) {
    console.error(`Error processing response: ${error}`);
    console.log(data);
    showStatus("col-danger", "Error. See console");
  }
}

// Function to process a Websocket Transaction
function processTransaction(data) {
  // TODO
}


// Function to get Server Info
async function getServerInfo() {
  const message = {
    "command": "server_info",
  };
  const response = await createRequest(message);
  console.log(response);
  showStatus("col-success", "Connected");
}


// UP TO HERE - NEED TO combine all get()s to getCurrentData() so that it all works off the current validated ledger


// Function to get Ledger Info
async function getLedgerInfo() {
  const message = {
    "command": "ledger",
  };
  const response = await createRequest(message);
  console.log(response);
  showStatus("col-success", "Connected");
}

// Function to get Accounts Info
function getAccountsInfo() {
  currentAccounts.forEach(async (account) => {
    const message = {
      "command": "account_info",
      "account": account.address,
    };
    const response = await createRequest(message);
    console.log(response);
    showStatus("col-success", "Connected");
  });
}



// Function to show the current status message
function showStatus(statusClass, message) {
  const statusDate = fixDate(new Date());
  statusEl.innerHTML = `<span class="col-info">Last updated: ${statusDate} - </span><span class="${statusClass}">${message}`;
}

// Function to fix the output date format
function fixDate(date) {
  return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

