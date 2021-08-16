/* global bootstrap BigNumber */
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
const SERVER_STATE_CLASS = {  // Classes to use for different server states
  "disconnected": "col-danger",
  "connected": "text-warning",
  "syncing": "text-warning",
  "tracking": "text-warning",
  "full": "col-success",
  "validating": "text-warning",
  "proposing": "text-warning",
};
const RIPPLE_EPOCH = 946684800;  // Ripple Epoch Timestamp in seconds

// Global Variables
let currentServer = "Testnet";  // Current Server -- TODO: GET FROM LOCAL STORAGE
let currentServerURL = SERVERS[currentServer];  // Current Server URL to connect to
let reserveBaseXRP = 0;  // Minimum XRP Reserve per account
let awaitingMsgs = {};  // Object to hold awaiting messages
let messageID = 0;  // Specific message ID
let currentAccounts = [{  // Current Accounts -- TODO: GET FROM LOCAL STORAGE
  "name": "Testnet01",
  "address": "rww9WLeWwviNvAJV3QeRCof3kJLomPnaNw",
}, {
  "name": "Testnet02",
  "address": "rhacBEhAdTBeuwcXe5ArVnX8Kwh886poSo",
}, {
  "name": "Testnet03",
  "address": "rnbsExCdXV2y85Qg9ewKkuNsuQGGjDBfBC",
}];

// Global HTML Elements
const statusEl = document.getElementById("status");
const serverInfoEl = document.getElementById("serverInfo");
const ledgerInfoEl = document.getElementById("ledgerInfo");
const accountInfoEls = document.querySelectorAll(".account-info");


// Initialise Bootstrap Tooltips
const tooltipList = document.querySelectorAll(`[data-bs-toggle="tooltip"]`);
tooltipList.forEach((tooltip) => {
  new bootstrap.Tooltip(tooltip);
});


// Setup Websocket Connection
const socket = new WebSocket(currentServerURL);

// Add Websocket "close" event listener
socket.addEventListener("close", () => {
  console.log(`Disconnected from '${currentServer}' at '${currentServerURL}'`);
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
  console.log(`Connected to '${currentServer}' at '${currentServerURL}'`);
  showStatus("col-success", "Connected");
  // Get all initial data
  getServerInfo();
  getLedgerInfo();
  getAccountsInfo();
});


// Function to load a Websocket Request into a Promise
function createRequest(message, type) {
  // Check if message contains an ID and if not add one
  if (!Object.prototype.hasOwnProperty.call(message, "id")) {
    message.id = `${ID_PREFIX}-${messageID}-${type}`;
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
    if (!Object.prototype.hasOwnProperty.call(awaitingMsgs, data.id)) {
      throw new Error(`Response received for un-awaited request with ID: ${data.id}`);
    }
    // Check if returned status is "success" response
    if (data.status !== "success") {
      throw new Error(`Response received does not have status: "success"`);
    }

    // If all OK then run resolve promise
    awaitingMsgs[data.id].resolve(data);
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
  const response = await createRequest(message, "svr");
  console.log(response);
  showStatus("col-success", "Connected");

  // Store Reserve XRP to global variable
  reserveBaseXRP = response.result.info.validated_ledger.reserve_base_xrp;

  // Calculate Current Fee
  const currentFee = response.result.info.validated_ledger.base_fee_xrp * response.result.info.load_factor;

  // Update Server Info Table
  serverInfoEl.innerHTML = `
    <tr><th>Server Hostname:</th><td>${response.result.info.hostid} (${currentServer})</td></tr>
    <tr><th>State:</th><td class="text-capitalize ${SERVER_STATE_CLASS[response.result.info.server_state]}">${(response.result.info.server_state)}</td></tr>
    <tr><th>Ledgers Available:</th><td>${response.result.info.complete_ledgers}</td></tr>
    <tr><th>Current Fee:</th><td>${currentFee.toFixed(6)} XRP</td></tr>
  `;
}

// Function to get Ledger Info
async function getLedgerInfo() {
  const message = {
    "command": "ledger",
    "ledger_index": "validated",
    "transactions": true,
  };
  const response = await createRequest(message, "ldg");
  console.log(response);
  showStatus("col-success", "Connected");

  // Set Ledger Validation class and text
  const ledgerValid = (response.result.validated === true) ?
    `<span class="col-success">(Validated)</span>` :
    `<span class="col-danger">(Unvalidated)</span>`;

  // Calculate Ledger Age value and set class
  const ledgerAge = (new Date().getTime() / 1000) - (RIPPLE_EPOCH + response.result.ledger.close_time);
  let ledgerAgeClass = "";
  if (ledgerAge < 4) {
    ledgerAgeClass = "col-success";
  } else if (ledgerAge >= 4 && ledgerAge < 10) {
    ledgerAgeClass = "text-warning";
  } else {
    ledgerAgeClass = "col-danger";
  }
  
  // Update Ledger Info Table
  ledgerInfoEl.innerHTML = `
    <tr><th>Ledger Version:</th><td>${response.result.ledger.ledger_index} ${ledgerValid}</td></tr>
    <tr><th>Age:</th><td class="${ledgerAgeClass}">${ledgerAge.toFixed(4)}s</td></tr>
    <tr><th>Close Time:</th><td>${fixDate(new Date((RIPPLE_EPOCH + response.result.ledger.close_time) * 1000))}</td></tr>
    <tr><th>Transaction Count:</th><td>${response.result.ledger.transactions.length}</td></tr>
  `;
}

// Function to get Accounts Info
function getAccountsInfo() {
  currentAccounts.forEach(async (account, index) => {
    const message = {
      "command": "account_info",
      "account": account.address,
      "ledger_index": "validated",
    };
    const response = await createRequest(message,"act");
    console.log(response);
    showStatus("col-success", "Connected");

    // Calculate Balance in XRP and set class
    const accBalDrops = new BigNumber(response.result.account_data.Balance);
    const accBalXRP = accBalDrops.div(1e6);
    let accBalClass = "";
    if (accBalXRP.lte(reserveBaseXRP)) {
      accBalClass = "col-danger";
    } else if (accBalXRP.gt(reserveBaseXRP) && accBalXRP.lte(reserveBaseXRP * 1.5)) {
      accBalClass = "text-warning";
    } else {
      accBalClass = "col-success";
    }

    // Update Account Info Table
    accountInfoEls[index].innerHTML = `
      <thead>
        <tr><th class="text-center" colspan="2" scope="colgroup">
          <h5 class="text-info">Account: ${account.name}</h5>
        </th></tr>
      </thead>
      <tbody>
        <tr><th>Address:</th><td>${account.address}</td></tr>
        <tr><th>Balance:</th><td><span class=${accBalClass}>${accBalXRP.toFixed(6).toString()}</span> XRP as at Ledger '${response.result.ledger_index}'</td></tr>
      </tbody>
    `;
  });
}


// TO HERE 


// Function to show the current status message
function showStatus(statusClass, message) {
  const statusDate = fixDate(new Date());
  statusEl.innerHTML = `<span class="col-info">Last updated: ${statusDate} - </span><span class="${statusClass}">${message}`;
}

// Function to fix the output date format
function fixDate(date) {
  return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

