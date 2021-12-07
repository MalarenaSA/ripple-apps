# ripple-apps
_Ripple Apps for interacting with the XRP Ledger_
> Created by Malarena SA - [www.malarena.com](https://www.malarena.com)

## ripple-apps Overview
There are two sets of Ripple Apps in this repository:
- \browser\ apps which use the [rippled](https://xrpl.org/rippled-api.html) WebSocket API to monitor the XRP ledger
- \cli\ apps which use the [xrpl.js](https://js.xrpl.org/) JavaScript API with Node.js to interact directly with the XRP Ledger

All of these Apps can be configured to connect to one of the [Public XRP Servers](https://xrpl.org/public-servers.html), or you can configure them to connect to a [Local XRP Server](https://xrpl.org/install-rippled.html), for safer transaction processing.

## Installation & Setup
1. Ensure that your system is setup with current versions of [git](https://git-scm.com/), [Node.js](https://nodejs.org/) & [npm](https://www.npmjs.com/) - preferably using a [package manager](https://nodejs.org/en/download/package-manager/). (**NOTE** the JavaScript API recommends using Node.js v14 and npm v7.14 or above - `nvm install 16.10.0` works best)
2. Open a terminal window/command prompt, navigate to the directory required and then `git clone` this repository
3. Change to the newly created `ripple-apps` directory and run `npm install` to load the required npm modules

## Usage - Browser Monitor
The Ripple XRP monitor connects to an XRP Server and displays key information about the Server, the current Ledger, and information about up to three accounts. It then captures and displays transactions processed by any of these three accounts. On the top-left is a link to the live XRPL Explorer, and on the top right are buttons to Refresh the Server and Ledger data on the screen and to open the Settings menu. Under the "Ripple XRP Monitor" title are the details of when the data was last updated.

* Use a file manager/explorer to navigate to the `/ripple-apps/browser/` directory and double-click on `monitor.html`. This will open up the Ripple XRP Monitor in your browser connected initially to the TestNet Public Server and showing the TestNet Faucet account.
* Click on the `Settings` button and update the XRP Server that you want to connect to. From here you can connect to a local server using Localnet if you have one available. Update the settings for up to three accounts with a name and their account address and click `Save`.
* The screen will refresh to show the current server, ledger and accounts status, and then any transactions subsequently sent/received for each account will also be shown.
* When a new transaction is processed it will display under the relevant account. Clicking on it will display key information about that transaction.
* Both the Account and Transaction windows contain hyperlinks to open the relevant account and/or transaction on the XRPL Explorer where further information is displayed

NOTE: Any errors are reported in the browser console (Press F12 on Chrome). Also, you can update the `monitor.js` app and set the relevant `LOG_RESPONSE = true;` and `LOG_TRANS = true;` variables to see additional data in the console.

## Usage - CLI Apps
The Ripple CLI Apps run in a terminal window/command prompt and provide text-based information about the server, ledger, accounts and transactions. There is also an App for sending XRP between accounts. All of these Apps use the settings stored in a `.env` file.

* Use a text or code editor to navigate to the `/ripple-apps/cli/` directory and edit the `.env_TODO` file. Select the relevant combination of XRPL_SERVER_NAME, XRPL_SERVER_URL and XRPL_EXPLORER that you want to connect to (deleting the other settings) and replace the other 'TODO' details as required (Note XRPL_ACCOUNT is the account name you want to use for the XRPL_ADDRESS). Save this file as `.env`. **NOTE** If you have entered your XRPL_SEED in this file then keep it safe and do NOT copy it up to a public repository.
* Open a terminal window/command prompt and navigate to the `/ripple-apps/cli/` directory
* Run `node` followed by one of application names listed below (e.g. `node getServer.js`) to run the relevant app, which will then display the response to the screen.

The following apps are currently available:
* `createAccount.js` - This will create a new XRP account and display the Account Address and Account Seed to the screen
* `getAccountInfo.js` - This will display account information for the account referenced in `.env` under `XRPL_ADDRESS`. You can also include the specific Account Address in the command line call, e.g. `node getAccountInfo.js rnUP...`
* `getCurrentFee.js` - This will display the estimated transaction fee for the connected server
* `getLedgerInfo.js` - This will display information for the latest validated ledger available on the connected server
* `getServerInfo.js` - This will display information for the connected server
* `getTransactionInfo.js` - This will display information for the transaction setting in `.env` under `XRPL_TRANSACTION`. You can also include the specific Transaction Hash in the command line call, e.g. `node getTransactionInfo.js 9DA07...`
* `sendXRPPayment.js` - This can be used to send XRP between accounts. Edit `.env` and ensure the sending `XRPL_ADDRESS` and associated `XRPL_SEED` are populated, and update the receiving `XRPL_DESTINATION` address and `XRPL_AMT_DROPS` with the XRP amount to send in drops (e.g. 1 XRP = 1000000 drops). If required, also update the `XRPL_DESTINATION_TAG` with the relevant Tag Number provided by the recipient (e.g. when sending XRP to an exchange). The app will first prepare the transaction and confirm the details and fee. Enter "Yes" to proceed where the transaction will be signed. Enter "Yes" again to actually submit the transaction. The app will then wait for the transaction to be processed AND validated and will then display the result. Links are also provided to display the full transaction details using the `getTransaction.js` app above, or to view the transaction on the XRPL Explorer.

## Further Information
All of these apps were developed using the XRPL API's. Further information of these API's can be found at [XRPL Docs](https://xrpl.org/docs.html)
