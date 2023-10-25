const abiDecoder = require('abi-decoder');
const loanContractAbi = require('./LoanContractAbi.json');
const db = require('./connectDb');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

abiDecoder.addABI(loanContractAbi);

const insertAddress = (address) => {
  const query = `INSERT INTO addresses (address) VALUES (?) ON CONFLICT(address) DO NOTHING`;
  db.run(query, address, (err) => {
    if (err) {
      console.error('Could not insert address', err.message);
    }
  });
};

async function insertLoan(loanId, lenderAddress) {
  return new Promise((resolve, reject) => {
    const query =
      'INSERT INTO loans (loan_id, address_id) VALUES (?, ?) ON CONFLICT(loan_id) DO NOTHING';
    db.run(query, [loanId, lenderAddress], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function fetchTxns(address) {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=MHIBVX65N6TTQ4FQZIM5YWP2U2ZTZ9F7EN`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function fetchLoan(block) {
  const url = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=${block}&toBlock=${block}&address=0xd0a40eB7FD94eE97102BA8e9342243A2b2E22207&topic0=0x42cc7f53ef7b494c5dd6f0095175f7d07b5d3d7b2a03f34389fea445ba4a3a8b&page=1&offset=1000&apikey=MHIBVX65N6TTQ4FQZIM5YWP2U2ZTZ9F7EN`;
  const response = await fetch(url);
  const data = await response.json();
  const loanId = parseInt(data.result[0].topics[1], 16);
  const lenderAddress = `0x${data.result[0].topics[3].slice(26)}`;
  return [loanId, lenderAddress];
}

const fetchLenders = async (address) => {
  try {
    const data = await fetchTxns(address);
    if (data.result && Array.isArray(data.result)) {
      const acceptedOffers = data.result.filter(
        (transaction) =>
          transaction.methodId.includes('0x56efe98c') &&
          transaction.isError === '0' &&
          transaction.txreceipt_status === '1',
      );
      const lenderList = [];
      const blockList = [];

      acceptedOffers.forEach(async (transaction) => {
        const lenderAddress = abiDecoder.decodeMethod(transaction.input)
          .params[1].value.signer;

        blockList.push(transaction.blockNumber);

        if (!lenderList.includes(lenderAddress)) {
          lenderList.push(lenderAddress);
          insertAddress(lenderAddress.toLowerCase());
        }
      });
      return blockList;
    }
    console.error('Unexpected response structure', data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

async function buildLenders() {
  const blocks = await fetchLenders(
    '0xd0a40eB7FD94eE97102BA8e9342243A2b2E22207',
  );
  const results = await blocks.reduce(async (prevPromise, block) => {
    const resultsSoFar = await prevPromise;
    await sleep(200); // Wait 200ms to adhere to rate limit
    const [loanId, lenderAddress] = await fetchLoan(block);
    const addressExists = await checkAddressExists(lenderAddress);
    if (addressExists) {
      await insertLoan(loanId, lenderAddress);
    }
    return [
      ...resultsSoFar,
      { loanId, lenderAddress, inserted: addressExists },
    ];
  }, Promise.resolve([]));

  return results;
}

async function checkAddressExists(lenderAddress) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT 1 FROM addresses WHERE address = ? LIMIT 1';
    db.get(query, [lenderAddress], (err, row) => {
      if (err) return reject(err);
      resolve(!!row); // Converts row to boolean: true if row exists, false otherwise
    });
  });
}

module.exports = {
  buildLenders,
};
