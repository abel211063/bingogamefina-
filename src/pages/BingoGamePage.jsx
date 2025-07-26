import React, { useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { useBingoAPI } from '../hooks/useBingoAPI';
import GameBoard from '../components/GameBoard';
import DataTable from '../components/DataTable';
import BingoReport from '../components/BingoReport';
import { useAuth } from '../context/AuthContext';

export default function BingoGamePage() {
  const { gameState, isLoading, drawNumber, resetGame, submitBet, isPending } = useBingoAPI();

  const { logout } = useAuth();

  const columns = useMemo(() => [
    { accessorKey: 'ticketId', header: 'Ticket ID' },
    { accessorKey: 'playerName', header: 'Player Name' },
    { accessorKey: 'amount', header: 'Bet Amount', cell: info => `$${info.getValue()}` },
    {
      accessorKey: 'status', header: 'Status',
      cell: info => {
        const status = info.getValue();
        const statusClass = status === 'Winner' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>{status}</span>;
      },
    },
  ], []);

  const handleDummySubmit = (ticketId, isWinner = false) => {
    const numbers = isWinner ? ["B1", "I22", "N33", "G50", "O71"] : ["B2", "I23", "N34", "G51", "O72"];
    submitBet({ ticketId, numbers });
  };

  if (isLoading && !gameState) return <div className="p-10 text-center">Connecting to Game Server...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <header className="bg-white shadow-md rounded-lg p-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Bingo Live</h1>
              <p className="text-sm text-gray-500">Game ID: {gameState?.gameId}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-white font-semibold ${gameState?.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                {gameState?.isActive ? 'ACTIVE' : 'GAME OVER'}
              </div>
              {gameState && (
                <Button variant="contained" color="secondary">
                  <PDFDownloadLink document={<BingoReport gameState={gameState} />} fileName={`bingo-report-${gameState.gameId}.pdf`}>
                    {({ loading }) => (loading ? 'Generating...' : 'Download Report')}
                  </PDFDownloadLink>
                </Button>
              )}
            </div>
            <Button onClick={logout} color="warning" variant="contained">Logout</Button>
          </header>
        </motion.div>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Drawn Numbers ({gameState?.drawnNumbers.length}/75)</h2>
            <GameBoard drawnNumbers={gameState?.drawnNumbers} />
          </section>

          <aside className="bg-white shadow-md rounded-lg p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Game Controls</h2>
            <Button onClick={drawNumber} variant="contained" disabled={isPending || !gameState?.isActive}>Draw Number</Button>
            <Button onClick={resetGame} variant="outlined" color="error" disabled={isPending}>Reset Game</Button>
            <Button onClick={() => handleDummySubmit('TICKET-1', true)} variant="outlined" color="success" disabled={isPending || !gameState?.isActive}>Make TICKET-1 a Winner</Button>
            {gameState?.lastWinner && (
              <div className="mt-auto p-3 bg-yellow-100 text-yellow-800 rounded-md text-center">
                <p className="font-bold">Winner: {gameState.lastWinner}</p>
              </div>
            )}
          </aside>
        </main>

        <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Betting History</h2>
          <div className="bg-white rounded-lg shadow-md">
            <DataTable data={gameState?.bets || []} columns={columns} />
          </div>
        </motion.section>
      </div>
    </div>
  );
}