// --- START OF FILE ReportsModal.jsx ---
import React, { useRef, useEffect, useState, useCallback } from 'react';
import SummaryReportPanel from './SummaryReportPanel';
import DetailedReportPanel from './DetailedReportPanel';
import jsPDF from 'jspdf';
// 1. CHANGE the import style for the autotable plugin
import autoTable from 'jspdf-autotable';

function ReportsModal({ isOpen, onClose, getCashierSummary }) {
  const modalRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [transactionsData, setTransactionsData] = useState([]);
  const [initialBalanceForPeriod, setInitialBalanceForPeriod] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (modalRef.current) {
      if (isOpen) {
        modalRef.current.showModal();
        setReportData(null);
        setTransactionsData([]);
        setInitialBalanceForPeriod(0);
        setIsLoading(false);
        setError(null);
        setActiveTab('summary');
      } else {
        modalRef.current.close();
      }
    }
  }, [isOpen]);

  const fetchReportData = useCallback(async (fromDate, toDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCashierSummary(fromDate, toDate);
      setReportData(response.data);
      setTransactionsData(response.data.transactionsForPeriod || []);
      setInitialBalanceForPeriod(response.data.startBalance || 0);
    } catch (err) {
      console.error('Error fetching report:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch report.');
    } finally {
      setIsLoading(false);
    }
  }, [getCashierSummary]);

  const handleExportSummaryPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const { retailUser, fromDate, toDate, ...summary } = reportData;
    doc.text('Cashier Summary Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`User: ${retailUser}`, 14, 30);
    doc.text(`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, 14, 36);
    const tableBody = [
      ['Start Balance', summary.startBalance.toFixed(2)],
      ['Deposits', summary.deposits.toFixed(2)],
      ['Bets', summary.bets.toFixed(2)],
      ['Cancellations', summary.cancellations.toFixed(2)],
      ['Redeemed', summary.redeemed.toFixed(2)],
      ['Withdraws', summary.withdraws.toFixed(2)],
      ['End Balance', summary.endBalance.toFixed(2)],
      ['', ''],
      ['Retailer Share', summary.retailerShare.toFixed(2)],
      ['Web Dev Share', summary.webDeveloperShare.toFixed(2)],
    ];
    // 2. CHANGE the function call from doc.autoTable to autoTable(doc, ...)
    autoTable(doc, { startY: 45, head: [['Item', 'Amount (ETB)']], body: tableBody });
    doc.save(`summary-report_${retailUser}.pdf`);
  };

  const handleExportDetailedPDF = () => {
    if (!transactionsData || transactionsData.length === 0) return;
    const doc = new jsPDF('landscape');
    const { retailUser, fromDate, toDate } = reportData;
    doc.text('Detailed Transaction Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`User: ${retailUser}`, 14, 30);
    doc.text(`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, 14, 36);
    
    let currentBalance = initialBalanceForPeriod;
    const body = transactionsData.map(t => {
      let signedAmount = t.amount;
      if (['bet', 'withdrawal', 'deactivation_charge'].includes(t.type)) signedAmount = -t.amount;
      else if (['deposit', 'win', 'cancellation'].includes(t.type)) signedAmount = t.amount;
      currentBalance += signedAmount;
      return [
        new Date(t.timestamp).toLocaleString(), t.type.replace('_', ' ').toUpperCase(),
        signedAmount.toFixed(2), t.slipId || 'N/A', t.gameId || 'N/A', currentBalance.toFixed(2)
      ];
    });

    const head = [['Date/Time', 'Type', 'Amount', 'Slip ID', 'Game ID', 'Running Balance']];
    // 3. CHANGE the function call here as well
    autoTable(doc, {
      startY: 45, head, body,
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 10);
      }
    });
    doc.save(`detailed-report_${retailUser}.pdf`);
  };

  return (
    <dialog id="reports_modal" className="modal" ref={modalRef}>
      <div className="modal-box w-[90vw] max-w-6xl rounded-lg bg-[#813535] px-3 py-5">
        <div className="flex h-[66px] items-center justify-between rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2">
          <h1 className="text-lg font-bold uppercase text-white">Reports</h1>
          <button className="btn btn-sm btn-circle btn-ghost text-white" onClick={onClose}>✕</button>
        </div>
        <div className="min-h-[20vh] p-1">
          <div className="flex h-11 w-full mt-4">
            <div
              className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-l-lg border border-white font-semibold ${activeTab === 'summary' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'}`}
              onClick={() => setActiveTab('summary')}
            >
              <p>Summary</p>
            </div>
            <div
              className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-r-lg border border-white font-semibold ${activeTab === 'detailed' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'}`}
              onClick={() => setActiveTab('detailed')}
            >
              <p>Detailed</p>
            </div>
          </div>
          {isLoading && <div className="text-center text-white py-4">Loading...</div>}
          {error && <div className="text-center text-red-400 py-4">Error: {error}</div>}
          
          {activeTab === 'summary' && (
            <SummaryReportPanel
              reportData={reportData}
              initialBalanceForPeriod={initialBalanceForPeriod}
              onFetchReport={fetchReportData}
              onExportPDF={handleExportSummaryPDF} 
            />
          )}
          {activeTab === 'detailed' && (
            <DetailedReportPanel 
              transactions={transactionsData}
              initialBalanceForPeriod={initialBalanceForPeriod}
              onFetchReport={fetchReportData} 
              onExportPDF={handleExportDetailedPDF}
            />
          )}
        </div>
      </div>
    </dialog>
  );
}

export default ReportsModal;