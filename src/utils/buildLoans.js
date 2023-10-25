const { Web3 } = require('web3');
const db = require('./connectDb');
const loanContractAbi = require('./LoanContractAbi.json');

const web3 = new Web3('https://rpc.ankr.com/eth');

const contractAddress = '0xd0a40eB7FD94eE97102BA8e9342243A2b2E22207';
const nftfiContract = new web3.eth.Contract(loanContractAbi, contractAddress);

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

async function insertLoanDetails(
  loanId,
  loanDuration,
  loanStartTime,
  nftContract,
  nftId,
  loanAmount,
  loanCurrency,
  loanRepayAmount,
  loanActive,
) {
  return new Promise((resolve, reject) => {
    const query =
      'INSERT INTO loans (loan_id, loan_duration, loan_start_time, nft_contract, nft_id, loan_amount, loan_currency, loan_repay_amount, loan_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(loan_id) DO UPDATE SET loan_duration = ?, loan_start_time = ?, nft_contract = ?, nft_id = ?, loan_amount = ?, loan_currency = ?, loan_repay_amount = ?, loan_active = ?';
    db.run(
      query,
      [
        loanId,
        loanDuration,
        loanStartTime,
        nftContract,
        nftId,
        loanAmount,
        loanCurrency,
        loanRepayAmount,
        loanActive,
        loanDuration,
        loanStartTime,
        nftContract,
        nftId,
        loanAmount,
        loanCurrency,
        loanRepayAmount,
        loanActive,
      ],
      (err) => {
        if (err) return reject(err);
        resolve();
      },
    );
  });
}

async function loanDetails(loanId) {
  try {
    const result = await nftfiContract.methods.loanIdToLoan(loanId).call();
    const loanActive = !(await nftfiContract.methods
      .loanRepaidOrLiquidated(loanId)
      .call());
    const duration = Number(result.loanDuration);
    const startTime = Number(result.loanStartTime);
    const nftContract = result.nftCollateralContract;
    const nftId = String(result.nftCollateralId);
    let loanCurrency = result.loanERC20Denomination;
    let ethUnit = 'ether';
    if (loanCurrency === usdcAddress) {
      ethUnit = 'mwei';
      loanCurrency = 'USDC';
    } else if (loanCurrency === daiAddress) {
      loanCurrency = 'DAI';
    } else if (loanCurrency === wethAddress) {
      loanCurrency = 'WETH';
    }
    const loanAmount = web3.utils.fromWei(
      String(result.loanPrincipalAmount),
      ethUnit,
    );
    const loanRepayAmount = web3.utils.fromWei(
      String(result.maximumRepaymentAmount),
      ethUnit,
    );

    await insertLoanDetails(
      loanId,
      duration,
      startTime,
      nftContract,
      nftId,
      loanAmount,
      loanCurrency,
      loanRepayAmount,
      loanActive,
    );

    return result;
  } catch (error) {
    return console.error('Error calling loanIdToLoan:', error);
  }
}

function getUniqueLoanIds() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT DISTINCT loan_id FROM loans';
    db.all(query, (err, rows) => {
      if (err) return reject(err);

      const loanIds = rows.map((row) => row.loan_id);
      resolve(loanIds);
    });
  });
}

async function buildLoans() {
  try {
    const loanIds = await getUniqueLoanIds();

    for (let i = 0; i < loanIds.length; i++) {
      const loanId = loanIds[i];
      await loanDetails(loanId);
    }

    console.log('All loan details updated.');
  } catch (error) {
    console.error('Error updating loan details:', error);
  }
}

module.exports = {
  buildLoans,
};
