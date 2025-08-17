// --- START OF FILE ReportsModal.jsx ---
import React, { useRef, useEffect, useState, useCallback } from 'react';
// axios is implicitly used via getCashierSummary prop
import SummaryReportPanel from './SummaryReportPanel';
import DetailedReportPanel from './DetailedReportPanel'; // NEW: Import DetailedReportPanel

function ReportsModal({ isOpen, onClose, getCashierSummary }) { // getCashierSummary prop
  const modalRef = useRef(null);
  const [reportData, setReportData] = useState(null); // Summary data
  const [transactionsData, setTransactionsData] = useState([]); // Detailed transactions
  const [initialBalanceForPeriod, setInitialBalanceForPeriod] = useState(0); // Initial balance for the period
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'detailed'

  useEffect(() => {
    if (modalRef.current) {
      if (isOpen) {
        modalRef.current.showModal();
        // Reset state when modal opens
        setReportData(null);
        setTransactionsData([]);
        setInitialBalanceForPeriod(0);
        setIsLoading(false);
        setError(null);
        setActiveTab('summary'); // Default to summary tab on open
      } else {
        modalRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialogElement = modalRef.current;
    if (dialogElement) {
      const handleCancel = () => {
        onClose();
      };
      dialogElement.addEventListener('cancel', handleCancel);

      const handleClickOutside = (event) => {
        if (event.target === dialogElement) {
          onClose();
        }
      };
      dialogElement.addEventListener('click', handleClickOutside);

      return () => {
        dialogElement.removeEventListener('cancel', handleCancel);
        dialogElement.removeEventListener('click', handleClickOutside);
      };
    }
  }, [onClose]);

  const fetchReportData = useCallback(async (fromDate, toDate) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the getCashierSummary prop from apiService
      const response = await getCashierSummary(fromDate, toDate);
      setReportData(response.data);
      setTransactionsData(response.data.transactionsForPeriod || []); // NEW: Store detailed transactions
      setInitialBalanceForPeriod(response.data.startBalance || 0); // NEW: Store initial balance for period

    } catch (err) {
      console.error('Error fetching report:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch report.');
      setReportData(null);
      setTransactionsData([]);
      setInitialBalanceForPeriod(0);
    } finally {
      setIsLoading(false);
    }
  }, [getCashierSummary]);


  return (
    <dialog id="reports_modal" className="modal" ref={modalRef}>
      <div className="modal-box w-[90vw] max-w-6xl rounded-lg bg-[#813535] px-3 py-5">
        <div className="flex h-[66px] items-center justify-between rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2">
          <h1 className="text-lg font-bold uppercase text-white">
            Reports
          </h1>
          <button
            className="btn btn-sm btn-circle btn-ghost text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="min-h-[20vh] p-1">
          {/* Tabs for different reports */}
          <div className="flex h-11 w-full mt-4">
            <div
              className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-l-lg border border-white font-semibold ${
                activeTab === 'summary' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <p>Summary</p>
            </div>
            <div
              className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-r-lg border border-white font-semibold ${
                activeTab === 'detailed' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
              }`}
              onClick={() => setActiveTab('detailed')}
            >
              <p>Detailed</p>
            </div>
          </div>

          {isLoading && (
            <div className="text-center text-white py-4">Loading report...</div>
          )}
          {error && (
            <div className="text-center text-red-400 py-4">Error: {error}</div>
          )}
          
          {activeTab === 'summary' && (
            <SummaryReportPanel
              reportData={reportData}
              initialBalanceForPeriod={initialBalanceForPeriod} // Pass initial balance
              onFetchReport={fetchReportData}
            />
          )}
          {activeTab === 'detailed' && (
            <DetailedReportPanel 
              transactions={transactionsData}
              initialBalanceForPeriod={initialBalanceForPeriod} // Pass initial balance to detailed view
              onFetchReport={fetchReportData} // Allow refreshing detailed report too
            />
          )}
        </div>
      </div>
    </dialog>
  );
}

export default ReportsModal;