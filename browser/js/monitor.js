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
  "disconnected": "col-error",
  "connected": "text-warning",
  "syncing": "text-warning",
  "tracking": "text-warning",
  "full": "col-success",
  "validating": "text-warning",
  "proposing": "text-warning",
};
const RIPPLE_EPOCH = 946684800;  // Ripple Epoch Timestamp in seconds
const LOG_INFO = false;  // Flag to output info responses to console
const LOG_TRANS = true;  // Flag to output transaction data to console

// Global Variables
let currentServer = "Testnet";  // Current Server -- TODO: GET FROM LOCAL STORAGE
let currentServerURL = SERVERS[currentServer];  // Current Server URL to connect to
let reserveBaseXRP = 0;  // Minimum XRP Reserve per account
let awaitingMsgs = {};  // Awaiting Messages
let receivedTrans = {};  // Received Transactions
let currentTrans = "";  // Current Selected Transaction
let messageID = 0;  // Specific message ID
let currentAccounts = [{  // Current Accounts -- TODO: GET FROM LOCAL STORAGE
  "name": "New",
  "address": "rsCXXu88g3LtHgVmVj1obnY6gzvUdRyxZN",
  "transClass": "justify-content-start",
}, {
  "name": "Testnet02",
  "address": "rhacBEhAdTBeuwcXe5ArVnX8Kwh886poSo",
  "transClass": "justify-content-center",
}, {
  "name": "Faucet",
  "address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
  "transClass": "justify-content-end",
}];

// rsCXXu88g3LtHgVmVj1obnY6gzvUdRyxZN  - NEW
// rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe  - Faucet
// rfyJRyFZzX71LL5LreHpUZBZqrB18xUL4P  - Offers
// rww9WLeWwviNvAJV3QeRCof3kJLomPnaNw  - Testnet01
// rhacBEhAdTBeuwcXe5ArVnX8Kwh886poSo  - Testnet02
// rnbsExCdXV2y85Qg9ewKkuNsuQGGjDBfBC  - Testnet03

// Global HTML Elements
const statusEl = document.getElementById("status");
const serverInfoEl = document.getElementById("serverInfo");
const ledgerInfoEl = document.getElementById("ledgerInfo");
const accountInfoEls = document.querySelectorAll(".account-info");
const accountTransEls = document.querySelectorAll(".account-trans");
const transInfoEl = document.getElementById("transInfo");

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
  // Show disconnected message
  showStatus("text-warning", "Disconnected");
});

// Add Websocket "error" event listener
socket.addEventListener("error", (event) => {
  console.log(event);
  showStatus("col-error", "Error. See console");
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
    showStatus("col-error", "Error. See console");
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
  subscribeActTrans();
});


// Add Refresh Button
const refreshBtn = document.getElementById("refreshBtn");
refreshBtn.addEventListener("click", refreshInfo);

// Function to Refresh Info
function refreshInfo(event = null){
  if (event) {
    // Clear any error message if refresh was triggered by click event
    statusEl.lastChild.classList.remove("col-error");
  }
  // Get all information data
  getServerInfo();
  getLedgerInfo();
  getAccountsInfo();
}


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
    showStatus("col-error", "Error. See console");
  }
}


// Function to get Server Info
async function getServerInfo() {
  const message = {
    "command": "server_info",
  };
  const response = await createRequest(message, "svr");
  if (LOG_INFO === true) {
    console.log(response);
  }
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
  if (LOG_INFO === true) {
    console.log(response);
  }
  showStatus("col-success", "Connected");

  // Set Ledger Validation class and text
  const ledgerValid = (response.result.validated === true) ?
    `<span class="col-success">(Validated)</span>` :
    `<span class="col-error">(Unvalidated)</span>`;

  // Calculate Ledger Age value and set class
  const ledgerAge = (new Date().getTime() / 1000) - (RIPPLE_EPOCH + response.result.ledger.close_time);
  let ledgerAgeClass = "";
  if (ledgerAge < 4) {
    ledgerAgeClass = "col-success";
  } else if (ledgerAge >= 4 && ledgerAge < 10) {
    ledgerAgeClass = "text-warning";
  } else {
    ledgerAgeClass = "col-error";
  }

  // Fix Ledger Close Time
  const ledgerCloseTime = fixDate(new Date((RIPPLE_EPOCH + response.result.ledger.close_time) * 1000));
  
  // Update Ledger Info Table
  ledgerInfoEl.innerHTML = `
    <tr><th>Ledger Version:</th><td>${response.result.ledger.ledger_index} ${ledgerValid}</td></tr>
    <tr><th>Age:</th><td class="${ledgerAgeClass}">${ledgerAge.toFixed(4)}s</td></tr>
    <tr><th>Close Time:</th><td>${ledgerCloseTime}</td></tr>
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
    const response = await createRequest(message, "act");
    if (LOG_INFO === true) {
      console.log(response);
    }
    showStatus("col-success", "Connected");

    // Calculate Balance in XRP and set class
    const accBalXRP = convertDropsToXRP(response.result.account_data.Balance);
    let accBalClass = "";
    if (accBalXRP.lte(reserveBaseXRP)) {
      accBalClass = "col-error";
    } else if (accBalXRP.gt(reserveBaseXRP) && accBalXRP.lte(reserveBaseXRP * 2)) {
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
        <tr><th>Balance:</th><td><span class=${accBalClass}>${accBalXRP.toFixed(6)}</span> XRP as at Ledger '${response.result.ledger_index}'</td></tr>
      </tbody>
    `;
  });
}

// Function to Subscribe to Accounts Transactions
async function subscribeActTrans() {
  // Create Accounts Array
  const accountsArray = currentAccounts.map((account) => {
    return account.address;
  });
  const message = {
    "command": "subscribe",
    "accounts": accountsArray,
  };
  const response = await createRequest(message, "sub");
  if (LOG_INFO === true) {
    console.log(response);
  }

  // Update Account Transactions <div>
  currentAccounts.forEach((account, index) => {
    accountTransEls[index].innerHTML = `
      <p class="px-2 col-success">Subscribed...</p>
    `;
  });
}


// Function to process a Websocket Transaction
function processTransaction(data) {
  try {
    // Store Transaction Data for future use & output to console
    receivedTrans[data.transaction.hash] = data;
    if (LOG_TRANS === true) {
      console.log(data);
    }
  
    // Fix Transaction Date
    const transDate = fixDate(new Date((RIPPLE_EPOCH + data.transaction.date) * 1000));
  
    // Fix Transaction Delivered Amount
    const transAmtXRP = convertDropsToXRP(data.meta.delivered_amount);
  
    // Loop over accounts and output transaction details for relevant account
    let accountFound = false;
    currentAccounts.forEach((account, index) => {
      let transText = "";
      if (account.address === data.transaction.Account) {
        transText = "Sent";
        accountFound = true;
      } else if (account.address === data.transaction.Destination) {
        transText = "Received";
        accountFound = true;
      }
  
      if (transText !== "") {
        // Create new <p> and <a> elements and populate with default values
        const newTransItem = document.createElement("p");
        const newTransLink = document.createElement("a");
        newTransLink.href = "#";
        newTransLink.className = "px-2";
        // Add Data Attributes for Transaction Hash, Account Index & Trans Type
        const dataHash = document.createAttribute("data-hash");
        dataHash.value = data.transaction.hash;
        newTransLink.setAttributeNode(dataHash);
        const dataAccount = document.createAttribute("data-account");
        dataAccount.value = index;
        newTransLink.setAttributeNode(dataAccount);
        const dataType = document.createAttribute("data-type");
        dataType.value = transText;
        newTransLink.setAttributeNode(dataType);
  
        if (data.meta.TransactionResult !== "tesSUCCESS") {
          // Failed Transaction
          newTransLink.classList.add("trans-error");
          newTransLink.textContent = `${transDate} > ${transText} Transaction Failed!`;
  
        } else if (data.transaction.TransactionType !== "Payment" || typeof data.meta.delivered_amount !== "string") {
          // Non-XRP Payment Sent
          newTransLink.classList.add("trans-non-payment");
          newTransLink.textContent = `${transDate} > Non-XRP Payment ${transText}`;
  
        } else {
          // Show Sent Payment Transaction
          newTransLink.classList.add(`trans-${transText.toLowerCase()}`);
          newTransLink.textContent = `${transDate} > ${transAmtXRP.toFixed(6)} XRP ${transText}`;
        }
  
        // Update Transaction List with new item
        newTransItem.appendChild(newTransLink);
        accountTransEls[index].prepend(newTransItem);
  
        // Add "click" Event Listener to new item
        accountTransEls[index].addEventListener("click", showTransaction);
      }
    });

    // Check that transaction was for one of the subscribed accounts
    if (accountFound === false) {
      throw new Error (`Transaction received for non-subscribed account`);
    }

  } catch (error) {
    console.error(`Error processing transaction: ${error}`);
    // Only log transaction data to console if not already being logged to console
    if (LOG_TRANS === false) {
      console.log(data);
    }
    showStatus("col-error", "Error. See console");
  }

  // Refresh Information Data
  refreshInfo();
}

// Function to show a selected transaction
function showTransaction(event) {
  // Check if currentTrans already selected and if so close it
  if (currentTrans !== "") {
    closeTransaction();

    // STILL PROBLEM HERE - CANNOT READ PROPERTY IF PROPERLY CLOSED
    
  }
  currentTrans = event.target;
  const transHash = event.target.dataset.hash;
  const transData = receivedTrans[transHash];
  const accountIndex = event.target.dataset.account;
  const transType = event.target.dataset.type;

  // Fix Transaction Date
  const transDate = fixDate(new Date((RIPPLE_EPOCH + transData.transaction.date) * 1000));

  // Calculate Transaction Amount
  const transAmount = (Object.prototype.hasOwnProperty.call(transData.meta, "delivered_amount")) ? convertDropsToXRP(transData.meta.delivered_amount) : 0;

  // Calculate Fee Amount if Type is "Sent"
  let feeText = "";
  if (transType === "Sent") {
    const transFee = convertDropsToXRP(transData.transaction.Fee);
    feeText = ` (+Fee: ${transFee.toFixed(6)} XRP)`;
  }

  // Get Result Class
  const resultClass = (transData.meta.TransactionResult === "tesSUCCESS") ? "col-success" : "col-error";

  // Update Transaction Table
  transInfoEl.innerHTML = `
    <div class="row ${currentAccounts[accountIndex].transClass}">
      <div class="col-6 border">
        <table class="table table-sm table-dark">
          <thead>
            <tr><th class="text-center" colspan="2" scope="colgroup">
              <h5 class="text-info">Transaction: ${currentAccounts[accountIndex].name} @ ${transDate}
                <button type="button" class="float-end btn-close bg-light h6 my-1" id="transCloseBtn"></button>
              </h5>
            </th></tr>
          </thead>
          <tbody>
            <tr><th>Type:</th><td>${transData.transaction.TransactionType} (${transType})</td></tr>
            <tr><th>Hash:</th><td>${transHash}</td></tr>
            <tr><th>From/To:</th><td>${transData.transaction.Account} TO ${transData.transaction.Destination}</td></tr>
            <tr><th>Amount:</th><td>${transAmount.toFixed(6)} XRP${feeText}</td></tr>
            <tr><th>Result:</th><td class="${resultClass}">${transData.meta.TransactionResult} - ${transData.engine_result_message}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Set class of selected transaction
  currentTrans.classList.remove(`trans-${transType.toLowerCase()}`);
  currentTrans.classList.add(`trans-${transType.toLowerCase()}-selected`);

  // Add Close Button Event Listener
  const transCloseBtn = document.getElementById("transCloseBtn");
  transCloseBtn.addEventListener("click", closeTransaction);

  // Function for Transaction Close Button
  function closeTransaction() {
    // Hide Transaction Info Section
    transInfoEl.style.visibility = "hidden";
    // Re-Set class of selected transaction & clear currentTrans
    currentTrans.classList.remove(`trans-${currentTrans.dataset.type.toLowerCase()}-selected`);
    currentTrans.classList.add(`trans-${currentTrans.dataset.type.toLowerCase()}`);
    currentTrans = "";
  }

  // Show Transaction Info Section
  transInfoEl.style.visibility = "visible";
}


// Function to show the current status message
function showStatus(statusClass, message) {
  // Only show new message if current message is not an error
  if (!statusEl.lastChild.classList.contains("col-error")) {
    const statusDate = fixDate(new Date());
    statusEl.innerHTML = `<span class="col-info">Last updated: ${statusDate} - </span><span class="${statusClass}">${message}`;  
  }
}

// Function to fix the output date format
function fixDate(date) {
  return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear() + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

// Function to convert drops to XRP
function convertDropsToXRP(drops) {
  const amtDrops = new BigNumber(drops);
  const amtXRP = amtDrops.div(1e6);
  return amtXRP;
}
