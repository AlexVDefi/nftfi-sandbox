import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const tableItemStyle = 'border-2 border-black px-4 py-2 text-center text-base';

const AscIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 7L5 3L9 7"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DescIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 3L5 7L9 3"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function LeaderBoardTable() {
  const [sortedData, setSortedData] = useState([]);
  const [sortField, setSortField] = useState('USD');
  const [sortDirection, setSortDirection] = useState('desc');

  const sortData = (data, field, direction) => {
    return [...data].sort((a, b) => {
      const valueA =
        field === 'USD'
          ? a.USD
          : field === 'loan_count'
          ? a.loan_count
          : field === 'foreclosed_loan_count'
          ? a.foreclosed_loan_count
          : a.interest_earned;
      const valueB =
        field === 'USD'
          ? b.USD
          : field === 'loan_count'
          ? b.loan_count
          : field === 'foreclosed_loan_count'
          ? b.foreclosed_loan_count
          : b.interest_earned;
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };

  useEffect(() => {
    // Fetch data from your API
    fetch('/api/addresses')
      .then((response) => response.json())
      .then((newData) => {
        const sorted = sortData(newData.result, sortField, sortDirection);
        setSortedData(sorted); // Set the sorted data
      });
  }, []);

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(direction);
    const sorted = sortData(sortedData, field, direction);
    setSortedData(sorted);
  };

  return (
    <table className="h-full w-auto table-auto border-collapse border-black bg-purple-900">
      <thead>
        <tr>
          <th className={tableItemStyle}>Address</th>
          <th className={tableItemStyle} onClick={() => handleSort('USD')}>
            Amount Lent
            {sortField === 'USD' &&
              (sortDirection === 'asc' ? <AscIcon /> : <DescIcon />)}
          </th>
          <th
            className={tableItemStyle}
            onClick={() => handleSort('loan_count')}
          >
            Loans Given
            {sortField === 'loan_count' &&
              (sortDirection === 'asc' ? <AscIcon /> : <DescIcon />)}
          </th>
          <th
            className={tableItemStyle}
            onClick={() => handleSort('foreclosed_loan_count')}
          >
            Foreclosed Loans
            {sortField === 'foreclosed_loan_count' &&
              (sortDirection === 'asc' ? <AscIcon /> : <DescIcon />)}
          </th>
          <th
            className={tableItemStyle}
            onClick={() => handleSort('interest_earned')}
          >
            Total Interest Earned
            {sortField === 'interest_earned' &&
              (sortDirection === 'asc' ? <AscIcon /> : <DescIcon />)}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item, index) => (
          <tr
            className={index % 2 === 0 ? 'bg-purple-300' : 'bg-purple-400'}
            key={index}
          >
            <td className={tableItemStyle}>
              <Link href={`/address/${item.address}`}>{item.address}</Link>
            </td>
            <td className={tableItemStyle}>
              {formatter.format(item.USD.toFixed(2))}
            </td>
            <td className={tableItemStyle}>{item.loan_count}</td>
            <td className={tableItemStyle}>{item.foreclosed_loan_count}</td>
            <td className={tableItemStyle}>
              {formatter.format(item.interest_earned.toFixed(2))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default LeaderBoardTable;
