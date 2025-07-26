// --- START OF FILE AddPlayersPanel.jsx ---
import React from 'react';

function AddPlayersPanel({ players, searchText, handleSearchChange, currentPage, setCurrentPage, onOpenRemoveSlipModal }) {
  // REMOVED: Dummy players data is no longer needed as the component will always display the 'players' prop.
  // const dummyPlayers = [ ... ];

  // Fix: Always use the 'players' prop. If it's empty, the 'No players found' message will display.
  // The 'players' prop itself will be updated by App.jsx after API calls.
  const playersToDisplay = players; 

  // Filter players based on search text
  const filteredPlayers = playersToDisplay.filter(player =>
    player.slipId.toLowerCase().includes(searchText.toLowerCase()) ||
    player.bingoCard.toLowerCase().includes(searchText.toLowerCase()) ||
    player.status.toLowerCase().includes(searchText.toLowerCase())
  );

  // Pagination logic (simplified)
  const itemsPerPage = 5; // Example
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  return (
    <div className="flex h-full flex-col justify-between space-y-2 gap-y-4">
      <div className="flex h-full w-full flex-col justify-between rounded-lg bg-[#FFFFFF1A] p-4">
        {/* Players Search Input */}
        <div>
          <div className="flex w-full items-center justify-between p-2">
            <p className="text-base font-semibold text-white">Players</p>
            <div className="w-1/2 relative">
                {/* Replaced complex MUI input with a simpler DaisyUI/Tailwind input */}
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    focusable="false"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    data-testid="SearchIcon"
                >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                </svg>
                <input
                    type="text"
                    placeholder="Search"
                    className="input input-bordered w-full pl-10 bg-white text-black"
                    value={searchText}
                    onChange={handleSearchChange}
                />
                {searchText && (
                    <button
                        className="btn btn-ghost btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 text-black" // Added text-black for visibility
                        onClick={() => handleSearchChange({ target: { value: '' } })} // Simulate clearing input
                    >
                        ✕
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="cashier-options-th">Slip ID</th>
                <th className="cashier-options-th">Bingo Card</th>
                <th className="cashier-options-th">Status</th>
                <th className="cashier-options-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.length > 0 ? (
                currentPlayers.map((player) => (
                  <tr key={player.id} className="cashier-options-tr">
                    <td className="cashier-options-td text-white">{player.slipId}</td>
                    <td className="cashier-options-td text-white">{player.bingoCard}</td>
                    <td className="cashier-options-td text-white">{player.status}</td>
                    <td className="cashier-options-td">
                      <button className="btn btn-sm btn-error" onClick={() => onOpenRemoveSlipModal(player.slipId)}>Remove</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-white">
                    No players found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex w-full justify-end mt-4">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button className="join-item btn">Page {currentPage} of {totalPages}</button>
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPlayersPanel;