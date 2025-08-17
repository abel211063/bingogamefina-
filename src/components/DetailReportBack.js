// --- START OF FILE DetailedReportPanel.jsx ---
import React, { useState, useEffect } from 'react';

// Helper to format date and time for display
const formatTransactionDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format for consistency with ISO string-like display
    };
    return date.toLocaleString('en-US', options);
};

function DetailedReportPanel({ transactions, initialBalanceForPeriod, onFetchReport }) {
    // State to hold the running balance for detailed view
    const [runningBalance, setRunningBalance] = useState([]);

    // Recalculate running balance whenever transactions or initialBalanceForPeriod change
    useEffect(() => {
        let currentBalance = initialBalanceForPeriod;
        const newRunningBalance = transactions.map(t => {
            let signedAmount = t.amount;
            if (['bet', 'withdrawal', 'deactivation_charge'].includes(t.type)) {
                signedAmount = -t.amount;
            }
            currentBalance += signedAmount;
            return {
                ...t,
                signedAmount: signedAmount,
                runningBalance: currentBalance
            };
        });
        setRunningBalance(newRunningBalance);
    }, [transactions, initialBalanceForPeriod]);

    // Although the parent (ReportsModal) has a refresh, we keep this for consistency
    // and if you want separate refresh logic later.
    const handleRefresh = () => {
        // You might need to expose fromDate/toDate here or re-call parent's fetchReportData directly
        // For now, it's just a placeholder, as the parent triggers fetches.
        if (onFetchReport) {
            // Re-fetch with current date range. You might need to pass the dates from ReportsModal state.
            // For simplicity, let's assume parent already handles initial fetch.
            console.log("Detailed report refresh triggered. Parent component should handle re-fetch.");
        }
    };


  return (
    <div className="flex h-full flex-col justify-between space-y-2 gap-y-4">
      <div className="flex h-full w-full flex-col justify-between rounded-lg bg-[#FFFFFF1A] p-4">
        {/* Header for Detailed Report */}
        <div className="mx-4 my-4 flex items-center justify-between px-2 py-4">
            <h1 className="text-lg font-bold text-white">Detailed Transactions</h1>
            <button
                className="btn btn-warning h-[48px] px-6 py-2 text-white font-semibold rounded-md"
                onClick={handleRefresh}
            >
                Refresh
            </button>
        </div>

        {/* Display Initial Balance for the Period */}
        <div className="mb-4 bg-[#FFFFFF2A] p-3 rounded-lg">
            <p className="text-white text-lg font-semibold">
                Balance at Start of Period: {initialBalanceForPeriod.toFixed(2)} ETB
            </p>
        </div>

        {/* Detailed Transactions Table */}
        <div className="overflow-x-auto flex-grow">
          <table className="table w-full text-white">
            <thead>
              <tr>
                <th className="cashier-options-th text-white">Date/Time</th>
                <th className="cashier-options-th text-white">Type</th>
                <th className="cashier-options-th text-white">Amount (ETB)</th>
                <th className="cashier-options-th text-white">Slip ID</th>
                <th className="cashier-options-th text-white">Game ID</th>
                <th className="cashier-options-th text-white">Running Balance (ETB)</th>
              </tr>
            </thead>
            <tbody>
              {runningBalance.length > 0 ? (
                runningBalance.map((transaction, index) => (
                  <tr key={transaction._id || index} className="cashier-options-tr bg-[#FFFFFF1A]">
                    <td className="cashier-options-td text-white">{formatTransactionDate(transaction.timestamp)}</td>
                    <td className="cashier-options-td text-white uppercase">{transaction.type.replace('_', ' ')}</td>
                    <td className={`cashier-options-td ${transaction.signedAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.signedAmount.toFixed(2)}
                    </td>
                    <td className="cashier-options-td text-white">{transaction.slipId || 'N/A'}</td>
                    <td className="cashier-options-td text-white">{transaction.gameId || 'N/A'}</td>
                    <td className="cashier-options-td text-white">{transaction.runningBalance.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-white">
                    No transactions found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DetailedReportPanel;