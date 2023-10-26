import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Meta } from '@/layouts/Meta';
import { Main } from '@/templates/Main';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function AddressPage() {
  const router = useRouter();
  const { address } = router.query;
  const [addressDetails, setAddressDetails] = useState(null);
  const tableItemStyle =
    'border-2 border-black px-4 py-2 text-center text-base';

  useEffect(() => {
    if (address) {
      fetch(`/api/addresses`)
        .then((response) => response.json())
        .then((data) => {
          for (let i = 0; i < data.result.length; i++) {
            if (data.result[i].address === address) {
              setAddressDetails(data.result[i]);
              break;
            }
          }
        });
    }
  }, [address]);

  if (!addressDetails) {
    return (
      <div className="flex h-screen w-screen flex-col items-center bg-black/90 text-xl text-white">
        Loading...
      </div>
    );
  }

  return (
    <Main
      meta={
        <Meta
          title="Nftfi Sandbox Address Details"
          description="Details for an address."
        />
      }
    >
      <div className="flex h-full min-h-screen w-full flex-row justify-end overflow-x-auto">
        <div className="fixed left-4 m-1 w-1/3 p-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex items-center justify-center rounded-md border-2 border-black bg-purple-900 px-2 py-1 font-semibold"
          >
            Back
          </button>
          <div className="flex h-auto w-auto flex-col rounded-md border-2 border-black bg-purple-400 p-4">
            <h1 className="text-base font-bold">{addressDetails.address}</h1>
            <p>Loans Given: {addressDetails.loan_count}</p>
            <p>Amount Lent: {formatter.format(addressDetails.USD)}</p>
            <p>Foreclosed Loans: {addressDetails.foreclosed_loan_count}</p>
            <p>Interest Earned: {formatter.format(addressDetails.interest_earned)}</p>
          </div>
        </div>
        <div className="h-full w-2/3 p-4">
          <table className="ml-4 table-auto border-collapse overflow-hidden rounded-lg bg-purple-900">
            <thead>
              <tr>
                <th className={tableItemStyle}>Loan ID</th>
                <th className={tableItemStyle}>Loan Amount</th>
                <th className={tableItemStyle}>Loan Currency</th>
                <th className={tableItemStyle}>Repay Amount</th>
                <th className={tableItemStyle}>Collateral NFT</th>
                <th className={tableItemStyle}>Duration (Days)</th>
                <th className={tableItemStyle}>Start Time</th>
                <th className={tableItemStyle}>Active</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(addressDetails.loan_details).map((loanId, index) => {
                const loan = addressDetails.loan_details[loanId];
                return (
                  <tr
                    className={
                      index % 2 === 0 ? 'bg-purple-300' : 'bg-purple-400'
                    }
                    key={index}
                  >
                    <td className={tableItemStyle}>{loanId}</td>
                    <td className={tableItemStyle}>{loan.loan_amount}</td>
                    <td className={tableItemStyle}>{loan.loan_currency}</td>
                    <td className={tableItemStyle}>{loan.loan_repay_amount}</td>
                    <td className={tableItemStyle}>
                      {/* Collateral NFT Here */}
                    </td>
                    <td className={tableItemStyle}>
                      {loan.loan_duration / 86400}
                    </td>
                    <td className={tableItemStyle}>
                      {new Date(loan.loan_start_time * 1000).toLocaleString()}
                    </td>
                    <td className={tableItemStyle}>
                      {loan.loan_active ? 'Yes' : 'No'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Main>
  );
}

export default AddressPage;
