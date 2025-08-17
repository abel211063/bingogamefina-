// --- START OF FILE apiService.js ---
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get the auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Internal helper for API calls, matching the structure of your `hl` function
async function hl(method, urlPath, tokenRequired, data = null) {
  const config = tokenRequired ? getAuthHeaders() : {};
  const url = `${API_BASE_URL}${urlPath}`;

  try {
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(url, config);
        break;
      case 'post':
        response = await axios.post(url, data, config);
        break;
      case 'patch':
        response = await axios.patch(url, data, config);
        break;
      case 'delete':
        response = await axios.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return response;
  } catch (error) {
    console.error(`API Error - ${method} ${urlPath}:`, error.response?.data?.message || error.message);
    throw error; // Re-throw to be caught by the calling component
  }
}

// User Authentication
export async function loginUser(username, password) {
  return axios.post(`${API_BASE_URL}/login`, { username, password });
}

// Admin Setup (No Token Required for initial setup)
export async function registerAdminWithBalance(username, password, initialBalance) {
  return axios.post(`${API_BASE_URL}/initial-admin-setup`, { username, password, initialBalance });
}

// --- ADMIN MANAGEMENT ENDPOINTS ---
// FIX: Added 'export' keyword
export async function registerRetailUser(username, password, initialBalance) {
  return hl('POST', '/admin/register-retail-user', true, { username, password, initialBalance });
}

// FIX: Added 'export' keyword
export async function getAllRetailUsers() {
  return hl('GET', '/admin/retail-users', true);
}

// FIX: Added 'export' keyword
export async function getRetailUserBalance(userId) {
  return hl('GET', `/admin/users/${userId}/balance`, true);
}

// FIX: Added 'export' keyword
export async function rechargeRetailUser(userId, amount) {
  return hl('POST', `/admin/users/${userId}/recharge`, true, { amount });
}

// FIX: Added 'export' keyword
export async function updateRetailUserStatus(userId, isActive) {
  return hl('PATCH', `/admin/users/${userId}/status`, true, { isActive });
}

// --- GAME-SPECIFIC ENDPOINTS (Aligned with your provided list) ---

export async function getBingoCardDefault() {
  return hl('GET', '/bingo-card/default', true);
}

export async function activateTickets(gameId, ticketIds) { // ADD gameId parameter
  return hl('POST', `/bingo-card/activate-tickets/${gameId}`, true, { ticketIds }); // Include gameId in the URL path
}

export async function getCashierConfig() {
  return hl('GET', '/cashier-config?game_type=BINGO', true);
}

export async function updateCashierConfig(configData) {
  return hl('PATCH', '/cashier-config', true, configData);
}

export async function updateGamePattern(gameId, pattern) {
  return hl('PATCH', `/bingo-game/${gameId}/pattern`, true, { pattern });
}

export async function finishGame(gameId) {
  return hl('PATCH', `/bingo-game/${gameId}/finish`, true);
}

export async function disqualifyBet(gameId, cardId) {
  return hl('PATCH', `/bingo-game/${gameId}/disqualify-bet`, true, { card_id: Number(cardId) });
}

export async function unassignBingoCard(gameId, slipId) {
  return hl('PATCH', `/bingo-card/${gameId}/unassign/${slipId}`, true);
}

export async function generateBingoGame(gameSettings) {
  return hl('POST', '/bingo-game/generate', true, gameSettings);
}

export async function getUserProfile() {
  return hl('GET', '/users/profile', true);
}

export async function getCashierSummary(fromDate, toDate) {
  return hl('GET', `/cashiers/summary?from=${fromDate}&to=${toDate}`, true);
}

export async function verifyBet(gameId, slipId, sequenceIndex) {
const response = await hl('POST', `/bingo-game/${gameId}/verify-bet`, true, { card_id: Number(slipId) });
  return response.data; // Return the data directly
}

export async function callNextNumber(gameId) {
  return hl('POST', `/bingo-game/${gameId}/call-number`, true);
}


// NEW: Function to call the shuffle endpoint on the server
export async function shuffleGameDeck(gameId) {
  return hl('POST', `/bingo-game/${gameId}/shuffle`, true);
}

export async function getBingoCardDetails(gameId, slipId) {
  return hl('GET', `/bingo-game/${gameId}/card/${slipId}`, true);
}



export async function getCommissionTiers() {
  return hl('GET', '/retail/commission-tiers', true);
}

// Replaces the singular update function to be more efficient
export async function updateCommissionTiers(tiers) {
  return hl('PUT', '/retail/commission-tiers', true, tiers);
}

// Gets the user's preference (Tiered vs. Manual system)
export async function getCommissionSystemStatus() {
  return hl('GET', '/retail/commission-system-status', true);
}

// Updates the user's preference (Tiered vs. Manual system)
export async function updateCommissionSystemStatus(status) {
  return hl('PUT', '/retail/commission-system-status', true, { useTieredCommission: status });
}