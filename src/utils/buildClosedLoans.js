const { Web3 } = require('web3');
const db = require('./connectDb');

const web3 = new Web3('https://rpc.ankr.com/eth');
const contractBlockCreated = 18220510;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase();
const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase();
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase();

function splitString(str) {
  if (str.length !== 512) {
    throw new Error('String length must be 512 characters');
  }

  const result = [];
  for (let i = 0; i < 512; i += 64) {
    result.push(str.slice(i, i + 64));
  }

  return result;
}

async function insertRepaidLoanData(loanId, loanActualRepaid) {
  return new Promise((resolve, reject) => {
    const queryLoans =
      'INSERT INTO loans (loan_id, loan_actual_repaid) VALUES (?, ?) ON CONFLICT(loan_id) DO UPDATE SET loan_actual_repaid = ?';
    db.run(queryLoans, [loanId, loanActualRepaid, loanActualRepaid], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function insertForeclosedLoanData(loanId, loanForeclosed) {
  return new Promise((resolve, reject) => {
    const queryLoans =
      'INSERT INTO loans (loan_id, loan_foreclosed) VALUES (?, ?) ON CONFLICT(loan_id) DO UPDATE SET loan_foreclosed = ?';
    db.run(queryLoans, [loanId, loanForeclosed, loanForeclosed], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function fetchPaybacks(block) {
  const url = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=${block}&toBlock=99999999&address=0xd0a40eB7FD94eE97102BA8e9342243A2b2E22207&topic0=0x3687d64f40b11dd1c102a76882ac1735891c546a96ae27935eb5c7865b9d86fa&page=1&offset=1000&apikey=${etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (Array.isArray(data.result) && data.result.length > 0) {
    for (let i = 0; i < data.result.length; i++) {
      const dataToDecode = data.result[i].data.slice(2);
      const decodedData = splitString(dataToDecode);
      const loanId = parseInt(data.result[i].topics[1], 16);
      let repaidCurrency = `0x${decodedData[7].slice(24)}`;
      let ethUnit = 'ether';
      if (repaidCurrency === usdcAddress) {
        ethUnit = 'mwei';
        repaidCurrency = 'USDC';
      } else if (repaidCurrency === daiAddress) {
        repaidCurrency = 'DAI';
      } else if (repaidCurrency === wethAddress) {
        repaidCurrency = 'WETH';
      }
      const repaidAmount = web3.utils.fromWei(
        String(BigInt(parseInt(decodedData[2], 16))),
        ethUnit,
      );

      await insertRepaidLoanData(loanId, repaidAmount);
    }
  }
  return console.log('Finished fetching repaid loans');
}

async function fetchLiquidations(block) {
  const url = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=${block}&toBlock=99999999&address=0xd0a40eB7FD94eE97102BA8e9342243A2b2E22207&topic0=0x4fac0ff43299a330bce57d0579985305af580acf256a6d7977083ede81be1326&page=1&offset=1000&apikey=${etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  for (let i = 0; i < data.result.length; i++) {
    const loanId = parseInt(data.result[i].topics[1], 16);
    await insertForeclosedLoanData(loanId, true);
  }
  return console.log('Finished fetching liquidations');
}

async function buildClosedLoans() {
  await fetchPaybacks(contractBlockCreated);
  await fetchLiquidations(contractBlockCreated);
  console.log('Finished Fetching Closed Loans');
}

module.exports = {
  buildClosedLoans,
};
