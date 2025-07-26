// src/api/apiService.js
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

// Map your provided functions to hl calls
// Note: 'e' is token, 't' is data, 'r' is other params like gameId/slipId based on previous context

// Function: OAe(e) -> GET /bingo-card/default
export async function getBingoCardDefault() {
  return hl('GET', '/bingo-card/default', true); // token 'e' from original hl function is passed as `true`
}

// Function: RAe(e, t) -> POST /bingo-card/activate-tickets with ticketIds: e
// Renamed to activateTickets to be more descriptive
export async function activateTickets(ticketIds) {
  return hl('POST', '/bingo-card/activate-tickets', true, { ticketIds });
}

// Function: kAe(e) -> GET /cashier-config?game_type=BINGO
export async function getCashierConfig() {
  return hl('GET', '/cashier-config?game_type=BINGO', true);
}

// Function: PAe(e, t) -> PATCH /cashier-config with 'e' as body, 't' is token
// Renamed to updateCashierConfig
export async function updateCashierConfig(configData) {
  return hl('PATCH', '/cashier-config', true, configData);
}

// Function: IAe(e, t) -> PATCH /bingo-game/pattern with 'e' as body, 't' is token
// Renamed to updateGamePattern
export async function updateGamePattern(patternData) { // patternData will contain { gameId, pattern }
  const { gameId, pattern } = patternData;
  return hl('PATCH', `/bingo-game/${gameId}/pattern`, true, { pattern });
}

// Function: MJ(e) -> PATCH /bingo-game/finish, 'e' is token
// Renamed to finishGame
export async function finishGame(gameId) {
  return hl('PATCH', `/bingo-game/${gameId}/finish`, true);
}

// Function: MAe(e, t) -> PATCH /bingo-game/disqualify-bet with card_id: Number(e), 't' is token
// Renamed to disqualifyBet
export async function disqualifyBet(gameId, cardId) {
  return hl('PATCH', `/bingo-game/${gameId}/disqualify-bet`, true, { card_id: Number(cardId) });
}

// Function: $Ae(e, t) -> PATCH /bingo-card/unassign/ + e (slipId), 't' is token
// Renamed to unassignBingoCard
export async function unassignBingoCard(gameId, slipId) {
  return hl('PATCH', `/bingo-card/${gameId}/unassign/${slipId}`, true);
}

// Function: BAe(e) -> GET /bingo-game/generate, 'e' is token
// Renamed to generateBingoGame (this replaces start-game conceptually for frontend)
export async function generateBingoGame(gameSettings) {
  return hl('POST', '/bingo-game/generate', true, gameSettings); // Changed to POST for consistency with start-game's data
}

// Function: NAe(e) -> GET /users/profile, 'e' is token
export async function getUserProfile() {
  return hl('GET', '/users/profile', true);
}

// Function: LAe(e, t, r) -> GET /cashiers/summary?from=${t}&to=${r}, 'e' is token
export async function getCashierSummary(fromDate, toDate) {
  // axios.get automatically handles params object for query strings
  return hl('GET', `/cashiers/summary?from=${fromDate}&to=${toDate}`, true);
}

// Function: jAe(e, t, r) -> POST /bingo-game/verify-bet with card_id: Number(e), sequence_index: t, 'r' is token
// Renamed to verifyBet (this is the check claim function)
export async function verifyBet(gameId, slipId, sequenceIndex) {
  return hl('POST', `/bingo-game/${gameId}/verify-bet`, true, { card_id: Number(slipId), sequence_index: sequenceIndex });
}

// --- Specific additions for existing App.jsx calls not in the list but needed ---

// For login (no token needed for login itself)
export async function loginUser(username, password) {
  return axios.post(`${API_BASE_URL}/login`, { username, password });
}

// For register-with-balance (no token needed for this specific setup)
export async function registerAdminWithBalance(username, password, initialBalance) {
  return axios.post(`${API_BASE_URL}/initial-admin-setup`, { username, password, initialBalance });
}

// For call-number (explicitly not in the provided list, but central to game)
export async function callNextNumber(gameId) {
  return hl('POST', `/bingo-game/${gameId}/call-number`, true);
}