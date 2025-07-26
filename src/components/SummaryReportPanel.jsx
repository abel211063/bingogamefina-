// --- START OF FILE SummaryReportPanel.jsx ---
import React, { useState, useEffect } from 'react';

// Helper to format date for datetime-local input (YYYY-MM-DDTHH:MM)
const formatDateTimeLocal = (date) => {
  const dt = new Date(date);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset()); 
  return dt.toISOString().slice(0, 16);
};

// Helper to format date for display in the table (e.g., 01-02-2025 12:00 AM)
const formatDisplayDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-US', options).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$1-$2-$3').replace(',', '');
};


function SummaryReportPanel({ reportData, onFetchReport, initialBalanceForPeriod }) { // Receive initialBalanceForPeriod
  // MODIFIED: Set default dates to cover a wider, more current range
  const defaultStartDate = new Date('2024-01-01T00:00:00'); // Start of 2024
  const defaultEndDate = new Date(); // Current date and time

  const [fromDate, setFromDate] = useState(formatDateTimeLocal(defaultStartDate));
  const [toDate, setToDate] = useState(formatDateTimeLocal(defaultEndDate));

  useEffect(() => {
    onFetchReport(fromDate, toDate);
  }, [onFetchReport, fromDate, toDate]); // Depend on fromDate/toDate to re-fetch when they change

  const handleRefresh = () => {
    onFetchReport(fromDate, toDate);
  };

  return (
    <div className="flex h-full flex-col justify-between space-y-2 gap-y-4">
      <div className="flex h-full w-full flex-col justify-between rounded-lg bg-[#FFFFFF1A] p-4">
        {/* Date Filters and Refresh Button */}
        <div className="mx-4 my-4 flex items-center justify-between rounded-[10px] border border-[#FFFFFF33] px-2 py-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white mb-2">Summary</h1> 
            <div className="flex gap-4">
              <div>
                <label htmlFor="from-date" className="block text-white text-sm font-semibold mb-1">From Date</label>
                <input
                  type="datetime-local"
                  id="from-date"
                  className="input input-bordered w-full bg-white text-black"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="to-date" className="block text-white text-sm font-semibold mb-1">To Date</label>
                <input
                  type="datetime-local"
                  id="to-date"
                  className="input input-bordered w-full bg-white text-black"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button
            className="btn btn-warning mt-auto h-[48px] px-6 py-2 text-white font-semibold rounded-md"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto flex-grow">
          <table className="table w-full text-white">
            <thead>
              <tr>
                <th className="cashier-options-th text-white">Retail User</th>
                <th className="cashier-options-th text-white">From Date</th>
                <th className="cashier-options-th text-white">To Date</th>
                <th className="cashier-options-th text-white">Start Balance</th>
                <th className="cashier-options-th text-white">Deposits</th>
                <th className="cashier-options-th text-white">Bets</th>
                <th className="cashier-options-th text-white">Cancellations</th>
                <th className="cashier-options-th text-white">Redeemed</th>
                <th className="cashier-options-th text-white">Withdraws</th>
                <th className="cashier-options-th text-white">End Balance</th>
                <th className="cashier-options-th text-white">Retailer Share</th>
                <th className="cashier-options-th text-white">Web Dev Share</th>
              </tr>
            </thead>
            <tbody>
              {reportData ? (
                <tr className="cashier-options-tr bg-[#FFFFFF1A]">
                  <td className="cashier-options-td text-white">{reportData.retailUser}</td>
                  <td className="cashier-options-td text-white">{formatDisplayDate(reportData.fromDate)}</td>
                  <td className="cashier-options-td text-white">{formatDisplayDate(reportData.toDate)}</td>
                  <td className="cashier-options-td text-white">{initialBalanceForPeriod.toFixed(2)}</td> 
                  <td className="cashier-options-td text-white">{reportData.deposits.toFixed(2)}</td>
                  <td className="cashier-options-td text-white">{reportData.bets.toFixed(2)}</td>
                  <td className="cashier-options-td text-white">{reportData.cancellations.toFixed(2)}</td>
                  <td className="cashier-options-td text-white">{reportData.redeemed.toFixed(2)}</td>
                  <td className="cashier-options-td text-white">{reportData.withdraws.toFixed(2)}</td>
                  <td className="cashier-options-td text-white">{reportData.endBalance.toFixed(2)}</td>
                  <td className="cashier-options-td text-green-400">{reportData.retailerShare.toFixed(2)}</td>
                  <td className="cashier-options-td text-yellow-400">{reportData.webDeveloperShare.toFixed(2)}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-white">
                    No report data available. Select a date range and click Refresh.
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

export default SummaryReportPanel;