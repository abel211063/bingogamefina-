class BingoGame {
  constructor() {
    this.reset();
  }

  reset() {
    console.log("🔄 Resetting Bingo Game State");
    this.gameId = `BINGO-${Date.now()}`;
    this.drawnNumbers = new Set();
    this.winningPattern = ["B1", "I22", "N33", "G50", "O71"];
    this.lastWinner = null;
    this.isActive = true;
    this.bets = new Map([
      ['TICKET-1', { ticketId: 'TICKET-1', playerName: 'Alice', amount: 100, status: 'Pending' }],
      ['TICKET-2', { ticketId: 'TICKET-2', playerName: 'Bob', amount: 50, status: 'Pending' }],
      ['TICKET-3', { ticketId: 'TICKET-3', playerName: 'Charlie', amount: 200, status: 'Pending' }],
      ['TICKET-4', { ticketId: 'TICKET-4', playerName: 'Diana', amount: 75, status: 'Pending' }],
    ]);
  }

  drawNumber() {
    if (!this.isActive || this.drawnNumbers.size >= 75) {
      this.isActive = false;
      return null;
    }
    const columns = { B: 15, I: 15, N: 15, G: 15, O: 15 };
    const columnKeys = Object.keys(columns);
    let key;
    do {
      const colIndex = Math.floor(Math.random() * 5);
      const col = columnKeys[colIndex];
      const num = Math.floor(Math.random() * 15) + 1 + colIndex * 15;
      key = `${col}${num}`;
    } while (this.drawnNumbers.has(key));
    this.drawnNumbers.add(key);
    return key;
  }

  submitBet(ticketId, numbers) {
    if (!this.isActive) return { success: false, message: "Game is not active." };
    const isWinner = numbers.every(num => this.winningPattern.includes(num));
    const betData = this.bets.get(ticketId) || { ticketId, playerName: 'New Player', amount: 0 };
    betData.status = isWinner ? 'Winner' : 'Lost';
    if (isWinner) {
      this.lastWinner = ticketId;
      this.isActive = false;
    }
    this.bets.set(ticketId, betData);
    return { success: true, isWinner, ticketId };
  }

  getState() {
    return {
      gameId: this.gameId,
      drawnNumbers: Array.from(this.drawnNumbers),
      winningPattern: this.winningPattern,
      bets: Array.from(this.bets.values()),
      lastWinner: this.lastWinner,
      isActive: this.isActive,
    };
  }
}

const game = new BingoGame();
module.exports = game;