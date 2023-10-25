import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

import db from '../../utils/connectDb';

async function getWethPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
    );
    const data = await response.json();
    return data.USD;
  } catch (error) {
    console.error('Error fetching WETH price:', error);
    throw error; // Re-throw the error to be handled by the calling function
  }
}

interface LoanDetails {
  loan_start_time: number;
  loan_duration: number;
  loan_amount: number;
  loan_repay_amount: number;
  loan_currency: string;
  loan_active: number;
}

interface AddressData {
  total_loan_amount: Record<string, number>;
  loan_ids: string[];
  loan_details: Record<string, LoanDetails>;
  loan_count: number;
  USD: number;
  interest_earned: number;
  foreclosed_loan_count: number;
}

async function getAddressesWithLoanIds(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT
      addresses.address,
      loans.loan_currency,
      loans.loan_id,
      loans.loan_start_time,
      loans.loan_duration,
      loans.loan_amount,
      loans.loan_active,
      loans.loan_repay_amount,
      loans.loan_actual_repaid,
      loans.loan_foreclosed
    FROM
      addresses
    JOIN
      loans
    ON
      addresses.address = loans.address_id
    `;

    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function processAndFormatData(): Promise<AddressData[]> {
  const addressesData: Record<string, AddressData> = {};
  const rows = await getAddressesWithLoanIds();
  const wethPrice = await getWethPrice();
  for (const row of rows) {
    const {
      address,
      loan_currency,
      loan_id,
      loan_start_time,
      loan_duration,
      loan_amount,
      loan_repay_amount,
      loan_active,
      loan_actual_repaid,
      loan_foreclosed,
    } = row;

    if (!addressesData[address]) {
      addressesData[address] = {
        total_loan_amount: {},
        loan_ids: [],
        loan_details: {},
        loan_count: 0,
        USD: 0,
        interest_earned: 0,
        foreclosed_loan_count: 0,
      };
    }

    addressesData[address].loan_ids.push(loan_id);
    addressesData[address].loan_details[loan_id] = {
      loan_start_time,
      loan_duration,
      loan_amount,
      loan_repay_amount,
      loan_currency,
      loan_active,
    };

    if (!loan_active && !loan_foreclosed) {
      if (loan_currency === 'WETH') {
        addressesData[address].interest_earned +=
          loan_actual_repaid * wethPrice - loan_amount;
      } else {
        addressesData[address].interest_earned +=
          loan_actual_repaid - loan_amount;
      }
    } else if (!loan_active && loan_foreclosed) {
      addressesData[address].foreclosed_loan_count++;
    }

    if (!addressesData[address].total_loan_amount[loan_currency]) {
      addressesData[address].total_loan_amount[loan_currency] = 0;
    }
    addressesData[address].total_loan_amount[loan_currency] += loan_amount;
    addressesData[address].loan_count++;

    if (loan_currency === 'WETH') {
      addressesData[address].USD +=
        addressesData[address].total_loan_amount[loan_currency] * wethPrice;
    } else if (loan_currency === 'DAI' || loan_currency === 'USDC') {
      addressesData[address].USD +=
        addressesData[address].total_loan_amount[loan_currency];
    }
  }

  return Object.keys(addressesData).map((address) => ({
    address,
    ...addressesData[address],
  }));
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      const result = await processAndFormatData();
      res.status(200).json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' }); // Handle methods other than GET
  }
};
