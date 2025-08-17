// --- START OF FILE server.js ---

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mongoose = require('mongoose');
const { Types } = mongoose;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory store for active game sessions. Game state is volatile and resets on server restart.
const activeGames = new Map();



const FIXED_BINGO_CARDS = {
    // Transcribed from the first set of screenshots (Board 1-8)
    "1": "B15-2-7-14-11-I22-27-17-18-24-N37-41-39-36-38-G56-52-57-59-58-O65-68-67-73-63", // Board 1
    "2": "B11-12-6-13-8-I26-22-18-28-23-N43-39-39-33-40-G59-51-56-52-47-O75-62-65-66-71", // Board 2
    "3": "B13-5-6-9-10-I17-18-16-27-19-N44-35-39-45-34-G55-50-54-51-57-O75-64-68-70-61", // Board 3
    "4": "B6-13-7-3-12-I20-25-23-16-19-N38-43-39-32-31-G51-56-48-47-52-O66-69-74-68-62", // Board 4
    "5": "B14-2-11-15-6-I30-29-17-25-20-N31-41-39-38-37-G57-60-54-46-52-O61-62-66-63-74", // Board 5
    "6": "B15-10-6-9-7-I18-29-27-25-23-N39-42-39-36-44-G47-48-54-49-57-O73-61-72-63-67", // Board 6 (Corrected G column, and N39 placeholder)
    "7": "B1-2-3-5-8-I20-21-28-24-16-N37-34-39-41-44-G55-49-56-59-47-O74-66-63-65-67", // Board 7 (N39 placeholder)
    "8": "B5-1-11-14-3-I28-23-18-26-26-N32-33-39-42-36-G60-58-56-49-51-O64-74-72-63-61", // Board 8 (Note: I column has duplicate 26 per screenshot, N39 placeholder)

    // Transcribed from the subsequent screenshots (Board 9-125, specific numbers only)
    "9": "B5-7-1-9-15-I20-28-17-27-26-N35-43-39-32-31-G53-59-56-51-60-O73-74-66-70-69", // Board 9
    "10": "B2-6-7-10-1-I20-29-27-21-25-N41-39-39-36-37-G48-46-55-60-49-O75-68-63-61-67", // Board 10 (N39 placeholder)
    "11": "B5-8-15-14-1-I20-16-26-17-23-N31-33-39-37-36-G51-56-54-55-50-O61-62-71-64-70", // Board 11 (N39 placeholder)
    "12": "B13-6-7-3-12-I19-25-23-16-19-N39-43-39-32-31-G52-56-48-47-52-O71-69-74-68-62", // Board 12 (Note: I column has duplicate 19 per screenshot, N39 placeholder)
    "13": "B7-15-3-6-5-I27-28-19-18-30-N41-43-39-31-33-G48-60-59-49-46-O70-72-62-64-66", // Board 13 (N39 placeholder)
    "14": "B5-3-11-4-8-I19-28-18-29-26-N37-32-39-36-35-G53-54-57-50-55-O64-65-63-67-73", // Board 14 (N39 placeholder)
    "15": "B5-2-6-11-3-I26-30-24-19-17-N43-34-39-35-39-G59-52-56-49-47-O66-70-62-61-74", // Board 15 (N39 placeholder, also N39 appears twice as placeholder)
    "16": "B5-12-9-7-6-I20-19-17-16-21-N32-40-39-41-33-G50-55-60-49-41-O61-75-72-63-67", // Board 16 (N39 placeholder)
    "17": "B7-6-11-9-5-I25-21-16-18-23-N36-40-39-44-35-G49-57-51-52-59-O67-61-66-70-63", // Board 17 (N39 placeholder)
    "18": "B11-1-15-3-9-I28-27-25-26-23-N39-41-39-34-38-G58-53-49-50-54-O70-68-67-75-63", // Board 18 (N39 placeholder)
    "19": "B13-4-8-9-10-I29-24-30-21-16-N44-41-39-40-39-G53-48-49-52-55-O73-62-66-68-61", // Board 19 (N39 placeholder)
    "20": "B10-4-15-6-13-I24-20-23-18-16-N40-44-39-39-35-G59-47-50-54-48-O65-67-74-68-62", // Board 20 (N39 placeholder)
    "21": "B12-14-15-8-11-I17-23-20-30-27-N41-42-39-33-37-G47-55-50-59-57-O71-70-72-73-68", // Board 21 (N39 placeholder)
    "22": "B12-7-11-9-8-I18-25-19-27-22-N44-40-39-35-37-G49-56-58-55-51-O64-71-62-69-73", // Board 22 (N39 placeholder)
    "23": "B12-13-2-6-11-I27-24-20-28-23-N39-36-39-42-33-G47-49-55-58-59-O71-65-73-69-63", // Board 23 (N39 placeholder)
    "24": "B9-6-2-12-15-I24-26-29-21-25-N40-39-39-38-45-G54-60-56-59-52-O69-63-74-66-65", // Board 24 (N39 placeholder)
    "25": "B13-10-6-1-4-I28-30-18-27-25-N43-43-39-34-38-G48-49-60-52-56-O73-67-63-61-69", // Board 25 (N39 placeholder)
    "26": "B11-2-7-6-1-I27-29-20-26-21-N41-34-39-33-31-G56-51-60-46-58-O65-61-63-70-64", // Board 26 (N39 placeholder)
    "27": "B9-13-6-11-5-I26-18-27-16-29-N45-31-39-42-35-G47-51-59-60-46-O74-68-63-69-73", // Board 27 (N39 placeholder)
    "28": "B7-13-3-14-6-I25-28-29-16-20-N42-43-39-34-36-G55-59-48-50-57-O74-67-70-63-72", // Board 28 (N39 placeholder)
    "29": "B4-8-1-7-10-I29-28-17-22-23-N44-37-39-42-35-G50-51-52-57-53-O61-66-68-70-71", // Board 29 (N39 placeholder)
    "30": "B3-15-12-6-8-I27-28-16-20-26-N39-33-39-32-41-G56-53-58-50-51-O65-75-62-63-61", // Board 30 (N39 placeholder)
    "31": "B5-9-4-3-6-I16-23-26-20-25-N35-42-39-44-44-G49-60-56-50-54-O70-68-73-61-74", // Board 31 (N39 placeholder)
    "32": "B7-14-8-1-9-I24-16-29-17-21-N44-42-39-33-36-G58-60-46-49-50-O69-72-74-75-63", // Board 32 (N39 placeholder)
    "33": "B14-7-12-9-13-I26-18-25-20-19-N33-44-39-45-42-G47-55-52-56-51-O69-67-65-73-62", // Board 33 (N39 placeholder)
    "34": "B11-3-15-13-2-I16-27-25-24-20-N33-38-39-36-32-G56-50-52-57-49-O74-67-66-73-65", // Board 34 (N39 placeholder)
    "35": "B8-1-11-3-5-I20-23-19-28-27-N35-38-39-43-41-G50-53-51-56-59-O70-73-68-63-75", // Board 35 (N39 placeholder)
    "36": "B15-3-4-8-13-I20-18-28-24-22-N42-44-39-39-31-G51-47-60-49-52-O70-67-74-63-61", // Board 36 (N39 placeholder)
    "37": "B12-1-4-8-6-I27-22-21-20-20-N44-37-39-43-41-G55-51-57-54-53-O69-63-68-71-70", // Board 37 (N39 placeholder)
    "38": "B10-1-2-6-8-I21-18-29-27-24-N32-41-39-37-35-G49-48-60-55-58-O74-75-61-67-68", // Board 38 (N39 placeholder)
    "39": "B14-5-7-2-9-I23-28-30-19-22-N45-38-39-31-32-G60-52-59-54-56-O63-72-62-67-70", // Board 39 (N39 placeholder)
    "40": "B1-4-9-3-6-I29-23-20-24-22-N36-42-39-45-41-G52-55-60-46-53-O66-69-74-71-63", // Board 40 (N39 placeholder)
    "41": "B1-6-13-5-3-I23-22-19-28-27-N31-37-39-42-38-G60-50-58-54-47-O69-70-75-64-66", // Board 41 (N39 placeholder)
    "42": "B15-1-4-8-I16-22-26-25-20-N45-41-39-31-39-G60-56-51-48-53-O67-70-62-75-71", // Board 42 (N39 placeholder)
    "43": "B11-5-7-1-15-I17-23-25-26-30-N35-38-39-44-41-G48-52-51-53-46-O62-75-63-65-61", // Board 43 (N39 placeholder)
    "44": "B12-8-7-1-13-I19-26-17-29-30-N44-42-39-38-45-G46-48-56-57-54-O61-67-64-74-75", // Board 44 (N39 placeholder)
    "45": "B7-10-14-8-6-I16-20-27-17-19-N42-35-39-33-32-G52-57-58-55-59-O64-72-63-61-68", // Board 45 (N39 placeholder)
    "46": "B8-10-11-4-I19-24-18-25-30-N45-35-39-44-31-G57-49-53-51-58-O69-62-65-71-68", // Board 46 (N39 placeholder)
    "47": "B14-11-10-4-7-I29-20-17-25-23-N38-35-39-44-37-G53-58-59-56-49-O66-74-61-73-64", // Board 47 (N39 placeholder)
    "48": "B14-7-11-10-5-I22-23-29-26-18-N37-40-39-36-39-G51-57-52-47-55-O67-65-74-71-62", // Board 48 (N39 placeholder)
    "49": "B1-7-8-12-10-I24-29-23-27-18-N35-40-39-32-39-G59-50-57-48-54-O64-73-61-62-66", // Board 49 (N39 placeholder)
    "50": "B13-15-8-3-5-I27-17-30-21-25-N32-31-39-34-39-G57-46-55-50-53-O74-63-66-70-61", // Board 50 (N39 placeholder)
    "51": "B15-14-9-11-4-I16-30-20-25-26-N43-32-39-44-34-G56-49-51-52-48-O63-65-62-69-70", // Board 51 (N39 placeholder)
    "52": "B2-3-11-5-7-I21-19-24-16-17-N35-41-39-39-39-G59-58-54-53-47-O68-67-62-63-69", // Board 52 (N39 placeholder, and N39 placeholder appears multiple times)
    "53": "B9-1-2-5-6-I28-29-23-27-30-N40-31-39-41-45-G51-46-50-53-52-O71-75-64-66-72", // Board 53 (N39 placeholder)
    "54": "B13-2-3-6-5-I20-21-28-16-17-N34-44-39-43-38-G47-58-50-48-51-O63-73-65-66-69", // Board 54 (N39 placeholder)
    "55": "B14-8-1-5-11-I16-23-19-18-21-N45-43-39-41-34-G56-47-57-52-46-O75-69-74-68-63", // Board 55 (N39 placeholder)
    "56": "B1-5-7-12-15-I25-30-21-24-17-N36-43-39-39-40-G49-56-55-50-53-O74-72-69-63-61", // Board 56 (N39 placeholder)
    "57": "B10-2-3-7-9-I23-20-22-30-19-N33-40-39-44-31-G60-56-59-53-58-O69-75-65-63-61", // Board 57 (N39 placeholder)
    "58": "B2-5-13-11-1-I30-21-23-29-25-N32-42-39-39-34-G46-57-50-54-58-O61-68-72-66-73", // Board 58 (N39 placeholder)
    "59": "B13-1-4-7-5-I19-25-18-21-30-N39-37-39-41-49-G52-50-55-47-49-O71-74-61-66-64", // Board 59 (N39 placeholder)
    "60": "B4-2-14-7-10-I22-18-26-21-20-N36-37-39-38-31-G49-56-59-50-46-O61-63-75-65-67", // Board 60 (N39 placeholder)
    "61": "B12-8-6-1-9-I25-23-18-16-24-N37-43-39-44-32-G57-53-46-48-56-O69-65-72-68-61", // Board 61 (N39 placeholder)
    "62": "B1-7-15-3-11-I20-28-17-22-19-N31-36-39-37-35-G54-60-47-53-58-O69-68-74-67-72", // Board 62 (N39 placeholder)
    "63": "B3-13-6-9-10-I17-21-20-19-26-N40-42-39-34-45-G46-52-56-53-47-O73-69-61-68-67", // Board 63 (N39 placeholder)
    "64": "B12-3-4-6-9-I19-21-22-20-26-N38-42-39-33-39-G50-52-48-57-59-O66-72-74-63-64", // Board 64 (N39 placeholder)
    "65": "B13-5-8-9-11-I16-25-26-27-22-N31-37-39-43-44-G58-60-47-49-59-O75-62-64-68-72", // Board 65 (N39 placeholder)
    "66": "B11-7-1-10-4-I25-27-23-24-16-N37-40-39-45-39-G59-47-52-60-53-O72-67-69-63-70", // Board 66 (N39 placeholder)
    "67": "B12-10-4-6-1-I27-26-21-22-23-N36-45-39-39-40-G51-50-60-56-47-O68-74-61-70-63", // Board 67 (N39 placeholder)
    "68": "B7-15-11-4-13-I30-29-27-22-20-N35-31-39-38-33-G59-60-51-52-46-O62-67-71-66-74", // Board 68 (N39 placeholder)
    "69": "B15-11-10-8-9-I18-23-29-21-20-N34-37-39-40-36-G49-52-56-58-60-O67-72-63-68-70", // Board 69 (N39 placeholder)
    "70": "B7-8-10-12-14-I29-23-17-18-24-N43-33-39-39-36-G58-47-52-50-56-O67-68-69-73-62", // Board 70 (N39 placeholder)
    "71": "B2-3-8-6-9-I30-16-26-23-19-N31-36-39-33-45-G47-53-56-58-50-O73-71-68-75-63", // Board 71 (N39 placeholder)
    "72": "B2-11-8-7-1-I23-28-21-20-19-N42-40-39-44-35-G47-53-57-55-48-O73-70-64-66-72", // Board 72 (N39 placeholder)
    "73": "B14-7-13-10-3-I18-24-30-25-22-N37-31-39-43-38-G60-51-55-58-56-O62-63-71-74-64", // Board 73 (N39 placeholder)
    "74": "B10-15-6-13-7-I19-23-16-27-17-N39-35-39-44-40-G53-47-57-60-46-O65-72-74-61-63", // Board 74 (N39 placeholder)
    "75": "B10-1-3-9-4-I27-29-17-24-19-N41-35-39-32-39-G57-51-47-58-54-O73-62-64-65-69", // Board 75 (N39 placeholder)

    "77": "B15-11-10-8-9-I22-23-29-18-20-N38-37-39-47-40-G49-52-56-55-60-O67-72-71-66-63", // Board 77
    "78": "B13-4-3-10-5-I18-17-20-29-28-N34-41-39-32-40-G53-52-59-54-50-O68-61-64-65-73", // Board 78
    "79": "B3-2-12-4-6-I26-30-19-22-21-N39-42-39-38-40-G46-57-58-59-52-O71-61-66-62-63", // Board 79
    "80": "B2-12-15-7-3-I23-18-20-22-16-N45-36-39-34-42-G53-58-48-52-46-O70-64-63-72-69", // Board 80
    "81": "B13-9-11-4-6-I28-19-23-30-16-N43-37-39-44-38-G48-57-56-51-46-O73-68-61-67-75", // Board 81
    "82": "B11-2-7-6-12-I23-28-20-24-30-N40-45-39-34-38-G56-47-59-51-46-O68-72-73-63-74", // Board 82
    "83": "B5-11-1-4-10-I26-18-28-21-23-N45-43-39-41-38-G56-49-52-57-54-O70-74-66-69-63", // Board 83
    "84": "B3-7-12-9-13-I27-18-25-19-24-N45-44-39-42-31-G52-55-58-56-51-O73-67-65-70-62", // Board 84
    "85": "B7-5-11-4-13-I30-29-27-26-22-N35-33-39-37-31-G54-60-51-52-59-O62-67-71-73-66", // Board 85
    "86": "B7-9-13-15-14-I22-28-16-23-29-N38-44-39-36-40-G56-46-59-57-50-O74-67-73-61-65", // Board 86
    "87": "B12-1-7-8-6-I16-20-19-26-24-N37-40-39-33-38-G58-48-50-56-54-O73-75-70-67-63", // Board 87
    "88": "B7-10-15-2-3-I24-18-17-22-26-N41-44-39-34-31-G54-49-58-57-53-O70-75-73-67-71", // Board 88
    "89": "B7-10-15-1-5-I18-29-16-24-23-N38-42-39-43-33-G50-59-56-49-48-O69-74-73-65-61", // Board 89
    "90": "B2-6-11-15-1-I24-21-19-27-28-N40-43-39-34-35-G50-60-58-47-51-O62-63-64-69-73", // Board 90
    "91": "B12-6-8-11-7-I17-19-21-25-26-N33-42-39-34-43-G52-57-60-55-46-O61-69-75-68-71", // Board 91
    "92": "B6-12-8-7-2-I23-24-30-20-21-N39-40-39-42-36-G56-58-48-49-50-O75-66-68-62-70", // Board 92
    "93": "B15-14-2-5-4-I23-30-29-21-20-N36-41-39-40-37-G52-59-55-54-58-O71-68-75-63-70", // Board 93
    "94": "B8-1-4-7-6-I28-29-20-19-16-N42-44-39-32-34-G49-54-60-50-47-O71-73-63-65-67", // Board 94
    "95": "B15-5-13-2-8-I24-20-30-23-27-N37-35-39-40-39-G46-52-56-47-60-O63-67-74-75-66", // Board 95
    "96": "B6-14-13-3-5-I21-25-27-24-29-N36-35-39-43-39-G57-59-48-54-52-O63-61-73-66-62", // Board 96
    "97": "B8-9-12-3-1-I24-30-23-19-18-N39-34-39-37-39-G53-47-49-59-56-O71-69-70-68-63", // Board 97
    "98": "B8-13-3-6-5-I16-29-21-26-24-N37-36-39-33-45-G57-54-56-52-59-O68-63-67-70-73", // Board 98
    "99": "B12-10-4-6-1-I28-21-16-22-27-N36-45-39-39-40-G51-50-60-56-49-O68-74-63-66-62", // Board 99
    "100": "B2-5-7-6-4-I26-19-22-28-27-N36-45-39-38-37-G60-56-47-49-57-O67-66-69-63-62", // Board 100
    "101": "B8-14-3-2-5-I24-19-25-16-26-N39-36-39-35-34-G53-58-59-47-50-O68-72-61-63-75", // Board 101
    "102": "B14-13-4-8-3-I22-20-24-18-26-N33-37-39-35-34-G53-47-57-52-49-O70-63-67-69-71", // Board 102
    "103": "B9-10-3-14-2-I25-16-24-20-17-N39-35-39-38-40-G54-48-50-60-57-O61-70-71-69-64", // Board 103
    "104": "B14-6-2-7-12-I21-19-27-16-17-N34-38-39-43-45-G59-48-52-55-57-O63-65-66-72-73", // Board 104
    "105": "B9-10-7-3-11-I26-24-30-19-16-N35-34-39-36-37-G50-51-47-46-48-O65-69-66-62-67", // Board 105
    "106": "B7-6-10-5-11-I27-25-30-23-16-N33-45-39-44-38-G54-52-49-57-59-O62-66-73-67-71", // Board 106
    "107": "B1-9-7-15-6-I16-18-19-30-27-N33-42-39-36-31-G46-51-57-48-60-O75-61-71-62-67", // Board 107
    "108": "B10-15-12-3-13-I22-16-24-20-21-N43-31-39-30-37-G49-56-55-50-52-O70-63-69-74-67", // Board 108
    "109": "B14-10-11-12-13-I25-27-30-22-17-N32-43-39-34-38-G48-52-55-56-58-O61-64-66-68-70", // Board 109
    "111": "B8-5-9-1-11-I18-19-29-25-20-N39-35-39-38-42-G48-55-57-60-46-O70-66-72-63-67", // Board 111 (N39 placeholder)
    "113": "B1-4-6-5-3-I28-27-16-20-21-N45-41-39-32-31-G48-46-51-56-55-O65-64-68-69-61", // Board 113 (N39 placeholder)
    "114": "B12-15-3-5-13-I28-27-19-21-23-N44-32-39-37-41-G60-57-52-53-50-O75-66-68-61-69", // Board 114 (N39 placeholder)
    "115": "B10-8-1-15-6-I26-28-16-25-18-N41-37-39-45-39-G52-58-54-46-47-O75-69-62-74-63", // Board 115 (N39 placeholder)
    "116": "B4-2-7-3-13-I25-21-23-28-27-N38-36-39-43-35-G54-58-52-59-46-O69-62-70-73-75", // Board 116 (N39 placeholder)
    "117": "B2-4-5-8-3-I28-27-17-24-22-N32-39-39-40-41-G50-58-52-60-51-O72-61-62-66-64", // Board 117 (N39 placeholder)
    "118": "B2-9-1-13-5-I24-27-30-29-28-N31-44-39-35-33-G57-59-50-48-58-O61-68-63-75-64", // Board 118 (N39 placeholder)
    "119": "B2-3-12-1-8-I30-17-25-29-20-N42-43-39-56-31-G56-57-55-54-48-O67-66-71-70-72", // Board 119 (Note: I column has duplicate 25 per screenshot, N39 placeholder)
    "120": "B4-12-13-15-8-I24-30-17-21-19-N34-41-39-42-33-G57-47-55-53-59-O64-69-74-73-63", // Board 120 (N39 placeholder)
    "121": "B13-5-3-15-1-I17-23-20-16-28-N33-39-39-38-37-G57-55-53-49-58-O61-63-70-71-69", // Board 121 (N39 placeholder)
    "122": "B8-10-4-3-13-I26-18-20-21-23-N32-42-39-36-37-G46-56-58-55-50-O69-65-72-66-61", // Board 122 (N39 placeholder)
    "123": "B4-7-3-15-2-I26-29-22-25-28-N41-32-39-42-33-G53-52-47-46-51-O74-62-70-73-61", // Board 123 (N39 placeholder)
    "124": "B4-13-9-3-6-I21-23-17-28-29-N34-35-39-38-45-G49-56-50-52-57-O73-75-63-66-72", // Board 124 (N39 placeholder)
    "125": "B4-13-9-3-6-I21-23-17-28-29-N34-35-39-38-45-G49-56-50-52-57-O73-75-63-66-72",  // Board 125 (Appears identical to Board 124 in screenshot, N39 placeholder)
     "126": "B11-6-8-12-7-I16-25-20-28-19-N37-38-39-33-35-G50-60-58-49-50-O74-72-75-63-68",
    "127": "B3-11-2-10-15-I19-26-23-29-28-N44-39-39-40-33-G53-51-57-51-49-O71-62-68-72-64", // N39 appears twice, once for the actual number, once for the free space placeholder
    "128": "B7-8-9-12-4-I17-29-22-30-18-N42-31-39-33-36-G46-58-48-53-50-O71-65-69-62-72",
    "129": "B13-6-5-11-8-I16-20-17-26-23-N44-41-39-32-30-G47-55-48-59-59-O73-63-66-69-73",

    "130": "B8-9-14-1-15-I27-18-22-25-29-N44-36-39-31-35-G60-48-54-59-55-O71-67-65-74-69",
    "131": "B6-15-4-7-9-I22-18-20-28-27-N35-39-39-42-43-G51-50-56-47-53-O74-73-65-70-69", // N39 appears twice, once for the actual number, once for the free space placeholder
    "132": "B12-4-5-1-8-I22-17-26-27-24-N34-43-39-31-45-G57-55-48-50-58-O66-73-69-63-72",
    "133": "B11-10-5-2-3-I17-29-26-16-18-N42-33-39-37-41-G55-59-51-58-50-O66-74-69-73-71",

    "134": "B11-10-4-3-5-I20-28-27-23-26-N37-43-39-34-42-G57-46-51-60-47-O72-75-68-70-63",
    "135": "B15-13-2-5-14-I29-19-17-30-27-N43-37-39-45-41-G47-49-56-48-54-O66-61-68-73-67",
    "136": "B8-3-5-14-9-I17-22-28-30-18-N43-38-39-39-45-G49-55-57-48-51-O61-65-69-75-67", // N39 appears twice, once for the actual number, once for the free space placeholder
    "137": "B8-4-7-13-2-I25-29-18-16-27-N32-41-39-44-45-G47-60-52-46-58-O66-67-63-69-71",

    "138": "B11-6-8-12-7-I22-20-27-28-19-N45-44-39-33-35-G47-63-58-49-50-O61-70-75-63-68",
    "139": "B1-15-10-11-3-I26-17-23-19-16-N39-42-39-40-41-G59-50-57-51-49-O69-74-68-72-63", // N39 appears twice, once for the actual number, once for the free space placeholder
    "140": "B7-15-6-10-2-I27-30-20-23-25-N38-33-39-31-34-G53-52-46-57-47-O75-67-72-63-74",
    "141": "B11-1-2-9-7-I26-23-18-21-24-N34-44-39-33-38-G53-46-50-58-47-O74-64-61-69-71",

    "142": "B15-13-2-14-9-I17-20-21-19-23-N32-31-39-43-39-G52-58-47-54-46-O75-63-67-70-68", // N39 appears twice, once for the actual number, once for the free space placeholder
    "143": "B12-10-7-8-9-I22-29-19-18-30-N42-38-39-44-43-G54-57-58-55-46-O71-64-69-61-62",
    "144": "B13-7-10-4-12-I18-20-24-16-23-N36-37-39-42-31-G46-58-48-53-55-O68-70-62-73-73",
    "145": "B11-15-2-12-9-I21-25-17-30-23-N43-42-39-40-32-G58-55-54-49-46-O67-71-73-66-61",

    "146": "B9-8-2-12-15-I23-19-17-29-22-N40-39-39-34-45-G55-48-50-49-59-O74-69-66-75-63", // N39 appears twice, once for the actual number, once for the free space placeholder
    "147": "B10-9-4-2-15-I25-29-24-18-28-N42-35-39-40-33-G55-46-52-57-50-O67-70-71-61-64",
    "148": "B5-15-2-10-12-I23-25-28-20-29-N34-33-39-44-32-G59-48-59-46-49-O61-62-73-72-68", // G59 appears twice
    "149": "B14-13-5-9-8-I29-28-20-26-17-N38-42-39-31-45-G60-47-48-49-59-O70-71-65-68-72",

    "150": "B6-7-1-5-14-I18-16-19-22-30-N42-41-39-34-39-G53-55-48-56-51-O68-75-74-69-65" 
};


const generateBingoCard = (slipId) => {
    const cardString = FIXED_BINGO_CARDS[String(slipId)]; // Ensure slipId is treated as a string key
    if (!cardString) {
        console.error(`Error: No fixed bingo card found for slipId: ${slipId}. Please ensure it's defined in FIXED_BINGO_CARDS.`);
        return null; // Return null to indicate failure to find a card
    }
    return cardString;
};


// const generateBingoCard = (slipId) => {
//     const card = {};
//     const columns = ['B', 'I', 'N', 'G', 'O'];
//     const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
//     const cardParts = []; // To build the string correctly in the expected format

//     columns.forEach(col => {
//         const nums = [];
//         while (nums.length < 5) {
//             const num = Math.floor(Math.random() * (ranges[col][1] - ranges[col][0] + 1)) + ranges[col][0];
//             if (!nums.includes(num)) {
//                 nums.push(num);
//             }
//         }
//         nums.sort((a, b) => a - b); // Ensure numbers within each column are sorted

//         // The first number of each column should be prefixed with its letter
//         cardParts.push(`${col}${nums[0]}`);
//         // The remaining numbers in the column are just numbers
//         for(let i = 1; i < nums.length; i++) {
//             cardParts.push(nums[i].toString());
//         }
//     });
//     return cardParts.join('-'); // Join all parts with hyphens
// };


app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas and Models ---

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'retail'], default: 'retail' }, // Added role field
  isActive: { type: Boolean, default: true } // Added isActive for stopping service
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

const cashierConfigSchema = new mongoose.Schema({
  game_type: { type: String, required: true, unique: true },
  betAmount: { type: Number, default: 10 },
  houseEdge: { type: Number, default: 15 },
  winningPattern: { type: String, default: 'anyLine' },
});
const CashierConfig = mongoose.model('CashierConfig', cashierConfigSchema);

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  gameId: { type: String }, // Can be null for deposits/withdrawals not tied to a game
  slipId: String, // Can be null for deposits/withdrawals
  type: { type: String, enum: ['deposit', 'bet', 'win', 'withdrawal', 'cancellation', 'deactivation_charge'], required: true }, // Added deactivation_charge
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// --- Helper Functions ---
const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};



// NEW HELPER FUNCTION: Get Current User Balance
async function getCurrentUserBalance(userId) {
    const objectUserId = userId instanceof Types.ObjectId ? userId : new Types.ObjectId(userId);
    const positiveTransactions = await Transaction.aggregate([
        { $match: { userId: objectUserId, type: { $in: ['deposit', 'win', 'cancellation'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const negativeTransactions = await Transaction.aggregate([
        { $match: { userId: objectUserId, type: { $in: ['bet', 'withdrawal', 'deactivation_charge'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return (positiveTransactions[0]?.total || 0) - (negativeTransactions[0]?.total || 0);
}



const parseBingoCardString = (cardString) => {
    console.log(`[parseBingoCardString] Parsing: "${cardString}"`);
    const parts = cardString.split('-');
    const cardMatrix = Array(5).fill(0).map(() => Array(5).fill(null));
    const colLetters = ['B', 'I', 'N', 'G', 'O'];
    let currentColumnIdx = -1;
    let numbersInCurrentColumn = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const firstChar = part.charAt(0);

        if (colLetters.includes(firstChar) && part.length > 1) {
            currentColumnIdx++;
            numbersInCurrentColumn = 0;
            cardMatrix[numbersInCurrentColumn][currentColumnIdx] = parseInt(part.substring(1));
        } else {
            numbersInCurrentColumn++;
            cardMatrix[numbersInCurrentColumn][currentColumnIdx] = parseInt(part);
        }
    }
    console.log('[parseBingoCardString] Resulting card matrix:', JSON.stringify(cardMatrix));
    return cardMatrix;
};

const createMarkedGrid = (playerCardMatrix, drawnNumbers) => {
    console.log('[createMarkedGrid] Player card matrix input:', JSON.stringify(playerCardMatrix));
    console.log('[createMarkedGrid] Drawn numbers input:', drawnNumbers);
    const markedGrid = Array(5).fill(0).map(() => Array(5).fill(false));
    const drawnSet = new Set(drawnNumbers);

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (c === 2 && r === 2) { // Center Free Space (N3, 0-indexed [2][2])
                markedGrid[r][c] = true;
            } else if (playerCardMatrix[r][c] !== null && drawnSet.has(playerCardMatrix[r][c])) {
                markedGrid[r][c] = true;
            }
        }
    }
    console.log('[createMarkedGrid] Resulting marked grid:', JSON.stringify(markedGrid));
    return markedGrid;
};

const isLineMarked = (line) => {
    const result = line.every(cell => cell);
    console.log(`  [isLineMarked] Checking line: [${line.map(b => b ? 'T' : 'F').join(',')}] -> Result: ${result}`);
    return result;
};

// const checkPattern = (markedGrid, patternName, customPatternGrid = null) => {
//     console.log(`\n[checkPattern] Verifying pattern "${patternName}" for markedGrid:\n${JSON.stringify(markedGrid, null, 2)}`);
//     const isLineMarked = (line) => line.every(cell => cell);

//     const checkHorizontal = () => {
//         for (let r = 0; r < 5; r++) {
//             if (isLineMarked(markedGrid[r])) return true;
//         }
//         return false;
//     };

//     const checkVertical = () => {
//         for (let c = 0; c < 5; c++) {
//             const column = [];
//             for (let r = 0; r < 5; r++) {
//                 column.push(markedGrid[r][c]);
//             }
//             if (isLineMarked(column)) return true;
//         }
//         return false;
//     };

//     const checkDiagonalTLBR = () => {
//         const diagonal = [];
//         for (let i = 0; i < 5; i++) {
//             diagonal.push(markedGrid[i][i]);
//         }
//         return isLineMarked(diagonal);
//     };

//     const checkDiagonalTRBL = () => {
//         const diagonal = [];
//         for (let i = 0; i < 5; i++) {
//             diagonal.push(markedGrid[i][4 - i]); // row i, col 4-i
//         }
//         return isLineMarked(diagonal);
//     };

//     const checkFourCorners = () => {
//         return markedGrid[0][0] && markedGrid[0][4] &&
//                markedGrid[4][0] && markedGrid[4][4];
//     };

//     const checkXPattern = () => {
//         return checkDiagonalTLBR() && checkDiagonalTRBL();
//     };

//     const checkFullHouse = () => {
//         for (let r = 0; r < 5; r++) {
//             if (!isLineMarked(markedGrid[r])) return false;
//         }
//         return true;
//     };

//     const checkAnyTwoLines = () => {
//         const lines = []; // Collect all 12 potential lines

//         // Horizontal lines (5)
//         for (let r = 0; r < 5; r++) {
//             lines.push(markedGrid[r]);
//         }
//         // Vertical lines (5)
//         for (let c = 0; c < 5; c++) {
//             const column = [];
//             for (let r = 0; r < 5; r++) {
//                 column.push(markedGrid[r][c]);
//             }
//             lines.push(column);
//         }
//         // Diagonals (2)
//         const diagTLBR = [];
//         for (let i = 0; i < 5; i++) { diagTLBR.push(markedGrid[i][i]); }
//         lines.push(diagTLBR);

//         const diagTRBL = [];
//         for (let i = 0; i < 5; i++) { diagTRBL.push(markedGrid[i][4 - i]); }
//         lines.push(diagTRBL);

//         // Check all unique pairs of lines
//         for (let i = 0; i < lines.length; i++) {
//             for (let j = i + 1; j < lines.length; j++) { // j starts from i + 1 to avoid duplicate pairs and (line, line)
//                 if (isLineMarked(lines[i]) && isLineMarked(lines[j])) {
//                     return true;
//                 }
//             }
//         }
//         return false;
//     };

//     const checkCustomPattern = () => {
//         if (!customPatternGrid) {
//             console.error("Error: 'custom' pattern selected but no customPatternGrid provided.");
//             return false;
//         }

//         for (let r = 0; r < 5; r++) {
//             for (let c = 0; c < 5; c++) {
//                 // If the custom pattern expects a cell to be marked (true in customPatternGrid)
//                 // AND that cell is NOT marked in the player's actual markedGrid,
//                 // then the pattern is NOT met.
//                 if (customPatternGrid[r][c] && !markedGrid[r][c]) {
//                     return false;
//                 }
//                 // If customPatternGrid[r][c] is false, we don't care if markedGrid[r][c] is true or false.
//                 // This allows the player to have extra marked spots not part of the pattern and still win.
//             }
//         }
//         return true;
//     };


//     switch (patternName) {
//         case 'anyTwoLines':
//             console.log('[checkPattern] Checking "anyTwoLines" pattern.');
//             return checkAnyTwoLines();
//         case 'fullHouse':
//             console.log('[checkPattern] Checking "fullHouse" pattern.');
//             return checkFullHouse();
//         case 'horizontalLine':
//             console.log('[checkPattern] Checking "horizontalLine" pattern.');
//             return checkHorizontal();
//         case 'verticalLine':
//             console.log('[checkPattern] Checking "verticalLine" pattern.');
//             return checkVertical();
//         case 'diagonalTLBR':
//             console.log('[checkPattern] Checking "diagonalTLBR" pattern.');
//             return checkDiagonalTLBR();
//         case 'diagonalTRBL':
//             console.log('[checkPattern] Checking "diagonalTRBL" pattern.');
//             return checkDiagonalTRBL();
//         case 'fourCorners':
//             console.log('[checkPattern] Checking "fourCorners" pattern.');
//             return checkFourCorners();
//         case 'xPattern':
//             console.log('[checkPattern] Checking "xPattern" pattern.');
//             return checkXPattern();
//         case 'anyLine': {
//             console.log('[checkPattern] Checking "anyLine" pattern.');
//             // Check all horizontal lines
//             for (let r = 0; r < 5; r++) {
//                 if (isLineMarked(markedGrid[r])) return true;
//             }
//             // Check all vertical lines
//             for (let c = 0; c < 5; c++) {
//                 const column = [];
//                 for (let r = 0; r < 5; r++) {
//                     column.push(markedGrid[r][c]);
//                 }
//                 if (isLineMarked(column)) return true;
//             }
//             // Check diagonal TL-BR
//             const diagTLBR = [];
//             for (let i = 0; i < 5; i++) { diagTLBR.push(markedGrid[i][i]); }
//             if (isLineMarked(diagTLBR)) return true;
            
//             // Check diagonal TR-BL
//             const diagTRBL = [];
//             for (let i = 0; i < 5; i++) { diagTRBL.push(markedGrid[i][4 - i]); }
//             if (isLineMarked(diagTRBL)) return true;
 
//             // If none of the above returned true, it's not a win
//             return false;
//         }    
//         case 'custom':
//             console.log('[checkPattern] Checking "custom" pattern.');
//             if (!customPatternGrid) {
//                 console.error("[checkPattern] Error: 'custom' pattern selected but no customPatternGrid provided.");
//                 return false;
//             }
//             console.log('[checkPattern] Custom pattern grid used for verification:', JSON.stringify(customPatternGrid, null, 2));
//             return checkCustomPattern();
//         default:
//             console.warn(`[checkPattern] Unknown winning pattern: ${patternName}. Returning false.`);
//             return false;
//     }
// };

const checkPattern = (markedGrid, patternName, customPatternGrid = null) => {
    console.log(`\n[checkPattern] Verifying pattern "${patternName}"`);
    const isLineMarked = (line) => line.every(cell => cell);

    // Helper functions that find and return the names of any winning lines
    const checkHorizontal = () => {
        const lines = [];
        for (let r = 0; r < 5; r++) { if (isLineMarked(markedGrid[r])) lines.push(`row_${r}`); }
        return lines;
    };
    const checkVertical = () => {
        const lines = [];
        for (let c = 0; c < 5; c++) { if (isLineMarked(markedGrid.map(row => row[c]))) lines.push(`col_${c}`); }
        return lines;
    };
    const checkDiagonals = () => {
        const lines = [];
        if (isLineMarked(markedGrid.map((row, i) => row[i]))) lines.push('diag_tlbr');
        if (isLineMarked(markedGrid.map((row, i) => row[4 - i]))) lines.push('diag_trbl');
        return lines;
    };
    
    let winningLines = [];

    switch (patternName) {
        case 'anyLine':
            winningLines = [...checkHorizontal(), ...checkVertical(), ...checkDiagonals()];
            break;

        case 'anyTwoLines':
            const allFoundLines = [...checkHorizontal(), ...checkVertical(), ...checkDiagonals()];
            if (allFoundLines.length >= 2) {
                winningLines = allFoundLines;
            }
            break;

        case 'horizontalLine':
            winningLines = checkHorizontal();
            break;

        case 'verticalLine':
            winningLines = checkVertical();
            break;

        case 'diagonalTLBR':
            if (isLineMarked(markedGrid.map((row, i) => row[i]))) winningLines.push('diag_tlbr');
            break;
            
        case 'diagonalTRBL':
            if (isLineMarked(markedGrid.map((row, i) => row[4 - i]))) winningLines.push('diag_trbl');
            break;

        case 'fourCorners':
            if (markedGrid[0][0] && markedGrid[0][4] && markedGrid[4][0] && markedGrid[4][4]) {
                winningLines = ['four_corners']; // Special case, no line to draw, but still a win
            }
            break;

        case 'xPattern':
            const diagonals = checkDiagonals();
            if (diagonals.length === 2) {
                winningLines = diagonals;
            }
            break;

        case 'fullHouse':
            let isFullHouse = true;
            for (let r = 0; r < 5; r++) { if (!isLineMarked(markedGrid[r])) isFullHouse = false; }
            if (isFullHouse) {
                winningLines = ['full_house']; // Special case, no line to draw, but still a win
            }
            break;

        case 'custom':
            if (!customPatternGrid) { return false; }
            let isCustomWin = true;
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (customPatternGrid[r][c] && !markedGrid[r][c]) {
                        isCustomWin = false;
                        break;
                    }
                }
                if (!isCustomWin) break;
            }
            if (isCustomWin) {
                winningLines = ['custom_win']; // Special case, no line to draw, but still a win
            }
            break;

        default:
            console.warn(`[checkPattern] Unknown winning pattern: ${patternName}. Returning false.`);
            return false;
    }

    // If the winningLines array has anything in it, return the array. Otherwise, return false.
    return winningLines.length > 0 ? winningLines : false;
};


async function calculateBalanceUpToDate(userId, upToDate) {
    const objectUserId = new Types.ObjectId(userId); // Use 'Types.ObjectId' here

    const transactionsBeforeDate = await Transaction.aggregate([
        { $match: { userId: objectUserId, timestamp: { $lt: upToDate } } },
        { $group: {
            _id: null,
            totalPositive: { $sum: { $cond: [{ $in: ['$type', ['deposit', 'win', 'cancellation']] }, '$amount', 0] } },
            totalNegative: { $sum: { $cond: [{ $in: ['$type', ['bet', 'withdrawal', 'deactivation_charge']] }, '$amount', 0] } }
        } }
    ]);

    return (transactionsBeforeDate[0]?.totalPositive || 0) - (transactionsBeforeDate[0]?.totalNegative || 0);
}


// NEW HELPER FUNCTION: Check balance and update user status
// MODIFIED: checkBalanceAndSetStatus to use the new getCurrentUserBalance helper
async function checkBalanceAndSetStatus(userId) {
    try {
        const user = await User.findById(userId);
        if (!user || user.role !== 'retail') return;

        const currentBalance = await getCurrentUserBalance(userId);

        const newIsActiveStatus = currentBalance > 0;

        if (user.isActive !== newIsActiveStatus) {
            user.isActive = newIsActiveStatus;
            await user.save();
            console.log(`User ${user.username} status updated to ${newIsActiveStatus ? 'active' : 'inactive'} due to balance change.`);
        }
    } catch (error) {
        console.error(`Error checking balance and setting status for user ${userId}:`, error);
    }
}

/**
 * MOCK HELPER FUNCTION: This function is a placeholder for actual Bingo winning pattern verification.
 * In a real application, this would involve parsing the player's bingoCard string into a 5x5 grid,
 * marking numbers from drawnNumbers on that grid, and then checking if the specified winningPatternName
 * (and customPatternGrid if 'custom') is achieved.
 *
 * For demonstration purposes, it currently implements a very simplistic win condition.
 * As requested, it ignores the winning pattern for now and only checks if all numbers are drawn.
 *
 * @param {string} playerBingoCardString - The player's bingo card (e.g., "B1-2-3-4-5-I16...")
 * @param {Array<number>} drawnNumbers - An array of numbers already drawn in the game.
 * @param {string} winningPatternName - The name of the winning pattern (e.g., 'fullHouse', 'horizontalLine', 'custom').
 * @returns {boolean} - True if the winning pattern is achieved, false otherwise.
 */


// --- Initial Data Setup ---
async function setupInitialData() {
  try {
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const newUser = new User({ username: 'admin', password: 'adminpassword', role: 'admin' }); // Set role to admin
      await newUser.save();
      console.log('Default admin user created with username "admin" and password "adminpassword".');
      const transaction = new Transaction({
        userId: newUser._id,
        username: newUser.username,
        type: 'deposit',
        amount: 10000, // Initial balance for the admin
      });
      await transaction.save();
      console.log('Initial deposit logged for default admin user.');
    }

    const defaultCashier = await CashierConfig.findOne({ game_type: 'BINGO' });
    if (!defaultCashier) {
      const newConfig = new CashierConfig({
        game_type: 'BINGO',
        betAmount: 10,
        houseEdge: 15,
        winningPattern: 'anyLine',
      });
      await newConfig.save();
      console.log('Default BINGO cashier config created.');
    }
  } catch (error) {
    console.error('Error during initial data setup:', error);
  }
}

setupInitialData();

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
    if (err) {
      console.error('JWT Verification FAILED:', err.message);
      return res.sendStatus(403); // Forbidden (invalid token)
    }
    req.user = user; // { userId, username, role }
    next();
  });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin role required.' });
    }
};

// --- API Routes ---

// Login User
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Check if user is active
    if (!user.isActive) {
        return res.status(403).json({ message: 'Your account is currently inactive. Please contact support.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role }, // Include role in token
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, username: user.username, role: user.role } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});


// --- ADMIN MANAGEMENT ENDPOINTS (NEW SECTION) ---
// These endpoints are protected by `authenticateToken` and `isAdmin` middleware.

// Register New Retail User
app.post('/api/admin/register-retail-user', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, password, initialBalance } = req.body;

        if (!username || !password || typeof initialBalance !== 'number' || initialBalance < 0) {
            return res.status(400).json({ message: 'Missing or invalid user data.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const newUser = new User({ username, password, role: 'retail' });
        await newUser.save();

        if (initialBalance > 0) {
            const depositTransaction = new Transaction({
                userId: newUser._id,
                username: newUser.username,
                type: 'deposit',
                amount: initialBalance,
            });
            await depositTransaction.save();
        }

        res.status(201).json({ message: 'Retail user registered successfully!' });

    } catch (error) {
        console.error('Admin register retail user error:', error);
        res.status(500).json({ message: 'Server error during retail user registration.' });
    }
});

// Get All Retail Users (for Admin Dashboard list)
app.get('/api/admin/retail-users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const retailUsers = await User.find({ role: 'retail' }).select('-password');
        res.status(200).json(retailUsers);
    } catch (error) {
        console.error('Admin get retail users error:', error);
        res.status(500).json({ message: 'Server error fetching retail users.' });
    }
});

// Get Retail User Balance and Info
// MODIFIED: Get Retail User Balance and Info endpoint
app.get('/api/admin/users/:userId/balance', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-password');
        if (!user || user.role !== 'retail') {
            return res.status(404).json({ message: 'Retail user not found.' });
        }

        const objectUserId = new Types.ObjectId(userId);

        // Old code: duplicated balance calculation logic here
        // const positiveTransactions = await Transaction.aggregate([...]);
        // const negativeTransactions = await Transaction.aggregate([...]);
        // const currentBalance = (positiveTransactions[0]?.total || 0) - (negativeTransactions[0]?.total || 0);

        // NEW: Call the dedicated helper function for balance calculation
        const currentBalance = await getCurrentUserBalance(objectUserId);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            isActive: user.isActive,
            balance: currentBalance,
        });

    } catch (error) {
        console.error('Admin get user balance error:', error);
        res.status(500).json({ message: 'Server error fetching user balance.' });
    }
});

// Recharge Retail User Balance
app.post('/api/admin/users/:userId/recharge', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Recharge amount must be a positive number.' });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'retail') {
            return res.status(404).json({ message: 'Retail user not found.' });
        }

        const rechargeTransaction = new Transaction({
            userId: user._id,
            username: user.username,
            type: 'deposit', // Use deposit for recharge
            amount: amount,
        });
        await rechargeTransaction.save();

        await checkBalanceAndSetStatus(user._id);

        res.status(200).json({ message: `Successfully recharged ${user.username} with ${amount} ETB.` });

    } catch (error) {
        console.error('Admin recharge user error:', error);
        res.status(500).json({ message: 'Server error during user recharge.' });
    }
});

// Update Retail User Status (Activate/Deactivate)
// MODIFIED: Update Retail User Status (Activate/Deactivate) endpoint
app.patch('/api/admin/users/:userId/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body; // boolean

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'retail') {
            return res.status(404).json({ message: 'Retail user not found.' });
        }

        user.isActive = isActive;
        await user.save();

        let message = `User ${user.username} account is now ${isActive ? 'active' : 'inactive'}.`;

        // If deactivating and user has a positive balance, log a deactivation charge
        if (!isActive) { // If deactivating
            // Old code: duplicated balance calculation logic here
            // const objectUserId = new Types.ObjectId(userId);
            // const positiveTransactions = await Transaction.aggregate([...]);
            // const negativeTransactions = await Transaction.aggregate([...]);
            // const currentBalance = (positiveTransactions[0]?.total || 0) - (negativeTransactions[0]?.total || 0);

            // NEW: Call the dedicated helper function for balance calculation
            const currentBalance = await getCurrentUserBalance(user._id);

            if (currentBalance > 0) {
                const chargeTransaction = new Transaction({
                    userId: user._id,
                    username: user.username,
                    type: 'deactivation_charge', // New transaction type
                    amount: currentBalance, // Charge the remaining balance
                });
                await chargeTransaction.save();
                message += ` Remaining balance of ${currentBalance.toFixed(2)} ETB has been charged.`;
            }
        }

        res.status(200).json({ message: message, isActive: user.isActive });

    } catch (error) {
        console.error('Admin update user status error:', error);
        res.status(500).json({ message: 'Server error updating user status.' });
    }
});


// --- GAME-SPECIFIC ENDPOINTS (Aligned with your provided list) ---

// OAe: GET /api/bingo-card/default
app.get('/api/bingo-card/default', authenticateToken, async (req, res) => {
    const defaultCardData = generateBingoCard("dummy");
    res.status(200).json({ card: defaultCardData, message: "Default bingo card generated." });
});

// BAe: POST /api/bingo-game/generate
app.post('/api/bingo-game/generate', authenticateToken, async (req, res) => {
  try {
    // ADD customPatternDefinition to destructuring
    const { betAmount, houseEdge, winningPattern, customPatternDefinition } = req.body;
    const user = req.user;

    if (!betAmount || !houseEdge || !winningPattern) {
      return res.status(400).json({ message: 'Missing game parameters.' });
    }

    // Validate custom pattern if selected
    if (winningPattern === 'custom' && (!customPatternDefinition || !Array.isArray(customPatternDefinition) || customPatternDefinition.length !== 5)) {
        return res.status(400).json({ message: 'Invalid custom pattern definition provided.' });
    }

    const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    // activeGames.clear();

    const newGameState = {
      gameId,
      status: 'waiting_for_players',
      betAmount: Number(betAmount),
      houseEdge: Number(houseEdge),
      winningPattern,
      players: [],
      drawnNumbers: [],
      lastCalledNumber: null,
      uncalledNumbers: [],
      startTime: new Date(),
      // CONDITIONAL: Store customPatternGrid if the pattern is 'custom'
      customPatternGrid: winningPattern === 'custom' ? customPatternDefinition : null,
    };
    activeGames.set(gameId, newGameState);
    console.log(`Game ${gameId} generated/started by ${user.username} (in-memory).`);
    res.status(200).json({
      message: 'Game generated successfully!', gameId: newGameState.gameId,
      gameState: { status: newGameState.status, players: newGameState.players,
          drawnNumbers: newGameState.drawnNumbers, lastCalledNumber: newGameState.lastCalledNumber,
          uncalledNumbers: newGameState.uncalledNumbers.length,
      }
    });
  } catch (error) {
    console.error('Error generating game:', error);
    res.status(500).json({ message: 'Server error during game generation.' });
  }
});


// RAe: POST /api/bingo-card/activate-tickets

// MODIFIED: Activate Tickets endpoint with balance and active status checks
// MODIFIED: Activate Tickets endpoint with balance and active status checks
// --- REPLACE your activate-tickets endpoint with this ---
app.post('/api/bingo-card/activate-tickets/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const gameState = activeGames.get(gameId);
    if (!gameState) { 
        return res.status(404).json({ message: 'Game not found. Please start a new game.' }); 
    }
    const { ticketIds } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: 'Invalid ticketIds provided.' });
    }
    if (gameState.status !== 'waiting_for_players') { 
        return res.status(400).json({ message: 'Cannot activate tickets for an active game.' }); 
    }

    // --- NEW LOGIC: Check if user CAN afford the bets, but DO NOT charge them ---
    const user = await User.findById(req.user.userId);
    if (!user) { return res.status(404).json({ message: 'User not found.' }); }
    if (!user.isActive) { return res.status(403).json({ message: 'Your account is inactive. Please recharge.' }); }

    const totalBetCost = gameState.betAmount * ticketIds.length;
    const currentBalance = await getCurrentUserBalance(user._id);

    if (currentBalance < totalBetCost) {
        return res.status(403).json({ message: `Insufficient balance. Required: ${totalBetCost.toFixed(2)} ETB, Available: ${currentBalance.toFixed(2)} ETB.` });
    }
    // --- End of check ---

    const playersAdded = [];
    for (const slipId of ticketIds) {
        const stringSlipId = String(slipId);
        if (gameState.players.some(p => p.slipId === stringSlipId)) {
            console.warn(`Slip ID ${stringSlipId} is already active. Skipping.`);
            continue;
        }
        const card = generateBingoCard(stringSlipId);
        if (card === null) {
            return res.status(400).json({ message: `Card data not found for slip ID ${stringSlipId}.` });
        }
        playersAdded.push({
            id: `P${stringSlipId}`, slipId: stringSlipId, bingoCard: card, status: 'Active'
        });
    }

    gameState.players.push(...playersAdded);
    activeGames.set(gameId, gameState);
    console.log(`Tickets activated for game ${gameId}. Total players: ${gameState.players.length}. No transactions created yet.`);
    
    res.status(200).json({
        message: 'Tickets activated successfully!', 
        players: gameState.players,
        gameId: gameState.gameId
    });
});
// app.post('/api/bingo-card/activate-tickets', authenticateToken, async (req, res) => {
//     const activeGameId = activeGames.keys().next().value;
//     const gameState = activeGames.get(activeGameId);
//     if (!gameState) { return res.status(404).json({ message: 'No active game found to activate tickets for.' }); }
//     const { ticketIds } = req.body;
//     if (!ticketIds || !Array.isArray(ticketIds)) { return res.status(400).json({ message: 'Invalid ticketIds provided.' }); }
//     if (gameState.status === 'in_progress') { return res.status(400).json({ message: 'Cannot activate tickets for a game in progress.' }); }
//     const playersAdded = [];
//     for (const slipId of ticketIds) {
//         if (!gameState.players.some(p => p.slipId === String(slipId))) {
//             playersAdded.push({
//                 id: `P${slipId}`, slipId: String(slipId),
//                 bingoCard: generateBingoCard(slipId), status: 'Active'
//             });
//             try {
//                 const transaction = new Transaction({
//                     userId: req.user.userId, username: req.user.username,
//                     gameId: gameState.gameId, slipId: String(slipId), type: 'bet',
//                     amount: gameState.betAmount,
//                 });
//                 await transaction.save();
//                 await checkBalanceAndSetStatus(req.user.userId);
//             } catch (dbError) { console.error('Error saving bet transaction to DB:', dbError); }
//         }
//     }
//     gameState.players.push(...playersAdded);
//     activeGames.set(activeGameId, gameState);
//     console.log(`Tickets activated and players added to game ${activeGameId}. Total players: ${gameState.players.length}`);
//     res.status(200).json({
//         message: 'Tickets activated successfully!', players: gameState.players,
//         gameId: gameState.gameId
//     });
// });

// CallNextNumber (existing, not in your provided list)
app.post('/api/bingo-game/:gameId/call-number', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const gameState = activeGames.get(gameId);
    if (!gameState) { return res.status(404).json({ message: 'Game not found in active memory.' }); }
    if (gameState.status === 'waiting_for_players') {
        if (gameState.players.length === 0) { return res.status(400).json({ message: 'Cannot start calling numbers without any players.' }); }
        gameState.status = 'in_progress';
        if (gameState.uncalledNumbers.length === 0 && gameState.drawnNumbers.length === 0) {
            gameState.uncalledNumbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        }
    }
    if (gameState.status !== 'in_progress') { return res.status(400).json({ message: `Game is not in progress. Current status: ${gameState.status}.` }); }
    if (gameState.uncalledNumbers.length === 0) {
        gameState.status = 'ended'; activeGames.set(gameId, gameState);
        return res.status(200).json({ message: 'All numbers called! Game ended.', lastCalledNumber: null, drawnNumbers: gameState.drawnNumbers, gameStatus: gameState.status, uncalledNumbersCount: 0 });
    }
    const nextNumber = gameState.uncalledNumbers.shift(); gameState.drawnNumbers.push(nextNumber);
    gameState.lastCalledNumber = { number: nextNumber, letter: getBingoLetter(nextNumber) };
    activeGames.set(gameId, gameState);
    console.log(`Called: ${gameState.lastCalledNumber.letter}${gameState.lastCalledNumber.number} for game ${gameId}`);
    res.status(200).json({ lastCalledNumber: gameState.lastCalledNumber, drawnNumbers: gameState.drawnNumbers, gameStatus: gameState.status, uncalledNumbersCount: gameState.uncalledNumbers.length });
});

// MJ: PATCH /api/bingo-game/:gameId/finish
app.patch('/api/bingo-game/:gameId/finish', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const gameState = activeGames.get(gameId);
    if (!gameState) { return res.status(404).json({ message: 'Game not found in active memory.' }); }

    gameState.status = 'ended';
    activeGames.delete(gameId); // Remove the game session from memory, effectively "deleting" in-memory player data.
    // Note: Player bet transactions are persisted in MongoDB and are NOT deleted.

    console.log(`Game ${gameId} ended successfully. All associated in-memory player data is now cleared.`);
    res.status(200).json({ message: `Game ${gameId} has been ended.`, gameId, gameStatus: 'ended' });
});

// MAe: PATCH /api/bingo-game/:gameId/disqualify-bet
app.patch('/api/bingo-game/:gameId/disqualify-bet', authenticateToken, async (req, res) => {
    const { gameId } = req.params; const { card_id: slipId } = req.body;
    const gameState = activeGames.get(gameId);
    if (!gameState) { return res.status(404).json({ message: 'Game not found in active memory.' }); }
    if (gameState.status !== 'in_progress') { return res.status(400).json({ message: 'Cannot disqualify bet in a game not in progress.' }); }
    const player = gameState.players.find(p => p.slipId === String(slipId));
    if (!player) { return res.status(404).json({ message: `Player with slip ID ${slipId} not found in game ${gameId}.` }); }
    if (player.status === 'Disqualified') { return res.status(400).json({ message: `Player with slip ID ${slipId} is already disqualified.` }); }
    player.status = 'Disqualified';
    try {
        const transaction = new Transaction({
            userId: req.user.userId, username: req.user.username,
            gameId: gameState.gameId, slipId: player.slipId, type: 'deactivation_charge',
            amount: gameState.betAmount,
        });
        await transaction.save();
        await checkBalanceAndSetStatus(req.user.userId);
    } catch (dbError) { console.error('Error saving disqualification transaction to DB:', dbError); }
    res.status(200).json({ message: `Player with slip ID ${slipId} has been disqualified.`, playerStatus: 'Disqualified' });
});

// $Ae: PATCH /api/bingo-card/:gameId/unassign/:slipId
app.patch('/api/bingo-card/:gameId/unassign/:slipId', authenticateToken, async (req, res) => {
    const { gameId } = req.params; const gameState = activeGames.get(gameId);
    if (!gameState) { return res.status(404).json({ message: 'Game not found in active memory.' }); }
    if (gameState.status === 'in_progress') { return res.status(400).json({ message: 'Cannot unassign card from a game in progress.' }); }
    const removedPlayer = gameState.players.find(player => player.slipId === slipId);
    if (!removedPlayer) { return res.status(404).json({ message: `Player ${slipId} not found in game ${gameId}.` }); }
    gameState.players = gameState.players.filter(player => player.slipId !== slipId);
    activeGames.set(gameId, gameState);
    try {
        const transaction = new Transaction({
            userId: req.user.userId, username: req.user.username,
            gameId: gameState.gameId, slipId: removedPlayer.slipId, type: 'cancellation',
            amount: gameState.betAmount,
        });
        await transaction.save();
        await checkBalanceAndSetStatus(req.user.userId);
    } catch (dbError) { console.error('Error saving cancellation transaction to DB:', dbError); }
    console.log(`Player ${slipId} unassigned from game ${gameId}.`);
    res.status(200).json({ message: `Player ${slipId} unassigned successfully.`, players: gameState.players, gameId: gameState.gameId });
});

// jAe: POST /api/bingo-game/:gameId/verify-bet (Check Claim)
// MODIFIED: Endpoint path and request body parameters
// jAe: POST /api/bingo-game/:gameId/verify-bet (Check Claim)


// --- REPLACE your verify-bet endpoint with this ---
app.post('/api/bingo-game/:gameId/verify-bet', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const { card_id: slipId } = req.body;
    const { userId, username } = req.user;

    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const gameState = activeGames.get(gameId);
        if (!gameState) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Game not found.' });
        }
        if (gameState.status !== 'in_progress' && gameState.status !== 'claims_only') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Game not in a valid state for claims.' });
        }

        const player = gameState.players.find(p => p.slipId === String(slipId));
        if (!player) {
            await session.abortTransaction();
            return res.status(200).json({ isValid: false, message: `Player with Ticket #${slipId} not in this game.` });
        }
        
        const playerCardMatrix = parseBingoCardString(player.bingoCard);
        const markedGrid = createMarkedGrid(playerCardMatrix, gameState.drawnNumbers);
        const winningResult = checkPattern(markedGrid, gameState.winningPattern, gameState.customPatternGrid);
        const isWinner = winningResult !== false;

        if (!isWinner) {
            await session.abortTransaction();
            return res.status(200).json({
                isValid: false,
                message: `Claim for Ticket #${slipId} is not valid yet. Pattern not met with ${gameState.drawnNumbers.length} numbers called.`
            });
        }
        
        // --- THIS IS THE NEW CORE LOGIC ---
        const alreadyClaimedInGame = await Transaction.findOne({ gameId: gameState.gameId, type: 'win' }).session(session);
        
        if (alreadyClaimedInGame) {
            // This is a second winner. They are valid, but get no money. No new transactions needed.
            await session.commitTransaction();
            return res.status(200).json({
                isValid: true,
                message: `Congratulations! Ticket #${slipId} is a valid winner!`,
                winningLines: winningResult,
                winningAmount: 0
            });
        } else {
            // This is the FIRST winner. We must now create all transactions.
            const totalBetAmount = gameState.players.length * gameState.betAmount;
            const prizePool = totalBetAmount * (1 - gameState.houseEdge / 100);
            const winningAmount = parseFloat(prizePool.toFixed(2));

            // 1. Create 'bet' transactions for ALL players in the game.
            const betTransactions = gameState.players.map(p => ({
                userId: userId, username: username, gameId: gameId,
                slipId: p.slipId, type: 'bet', amount: gameState.betAmount
            }));
            await Transaction.insertMany(betTransactions, { session });

            // 2. Create the 'win' transaction for the winner.
            const winTransaction = new Transaction({
                userId: userId, username: username, gameId: gameId,
                slipId: player.slipId, type: 'win', amount: winningAmount
            });
            await winTransaction.save({ session });
            
            // 3. Mark the player as claimed in memory.
            player.status = 'Claimed';

            // All transactions are now ready, commit them to the database.
            await session.commitTransaction();

            // After committing, update the user's status based on the new balance.
            await checkBalanceAndSetStatus(userId);

            return res.status(200).json({
                isValid: true,
                message: `Congratulations! Ticket #${slipId} is the winner! Amount: ${winningAmount.toFixed(2)} ETB.`,
                winningLines: winningResult,
                winningAmount: winningAmount
            });
        }
    } catch (error) {
        console.error('SERVER ERROR during verify-bet:', error);
        if (session) await session.abortTransaction();
        return res.status(500).json({ message: 'Internal server error during claim verification.' });
    } finally {
        if (session) session.endSession();
    }
});




// IAe: PATCH /api/bingo-game/:gameId/pattern - Update bingo game pattern (for active game)
app.patch('/api/bingo-game/:gameId/pattern', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const { pattern } = req.body;

    if (!pattern) {
        return res.status(400).json({ message: 'Winning pattern not provided.' });
    }

    const game = activeGames.get(gameId);
    if (game) {
        game.winningPattern = pattern; // Update in-memory game state
        return res.status(200).json({ message: 'Game winning pattern updated.', gameId: game.gameId, winningPattern: game.winningPattern });
    } else {
        // If no active game, update the default cashier config.
        // This makes the pattern change persistent for future games.
        try {
            const updatedConfig = await CashierConfig.findOneAndUpdate(
                { game_type: 'BINGO' },
                { winningPattern: pattern },
                { new: true }
            );
            if (updatedConfig) {
                 return res.status(200).json({ message: 'Default winning pattern updated as no game is active.', winningPattern: updatedConfig.winningPattern });
            }
            return res.status(404).json({ message: 'No active game found and default config not updatable.' });
        } catch (error) {
            console.error('Error updating default pattern:', error);
            res.status(500).json({ message: 'Failed to update default winning pattern.' });
        }
    }
});

// NAe: GET /api/users/profile
// MODIFIED: Get User Profile endpoint to include isActive and balance
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // Fetch user from DB for latest isActive status
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // NEW: Calculate current balance using the helper
        const currentBalance = await getCurrentUserBalance(user._id);

        res.status(200).json({ profile: {
            _id: user._id,
            username: user.username,
            role: user.role,
            isActive: user.isActive, // Include the real-time isActive status from DB
            balance: currentBalance // Include balance in the profile
        }});
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to retrieve user profile.' });
    }
});

// kAe: GET /api/cashier-config
app.get('/api/cashier-config', authenticateToken, async (req, res) => {
    const { game_type } = req.query;
    if (game_type !== 'BINGO') {
        return res.status(400).json({ message: 'Invalid game_type specified.' });
    }
    try {
        const config = await CashierConfig.findOne({ game_type });
        if (!config) {
            return res.status(404).json({ message: 'Cashier configuration not found for BINGO.' });
        }
        res.status(200).json(config);
    } catch (error) {
        console.error('Error fetching cashier config:', error);
        res.status(500).json({ message: 'Failed to retrieve cashier configuration.' });
    }
});

// PAe: PATCH /api/cashier-config
app.patch('/api/cashier-config', authenticateToken, async (req, res) => {
    const { game_type, betAmount, houseEdge, winningPattern } = req.body;
    if (game_type !== 'BINGO') {
        return res.status(400).json({ message: 'Invalid game_type specified.' });
    }

    try {
        const updatedConfig = await CashierConfig.findOneAndUpdate(
            { game_type },
            { betAmount, houseEdge, winningPattern },
            { new: true, upsert: true, runValidators: true }
        );
        res.status(200).json({ message: 'Cashier configuration updated successfully.', config: updatedConfig });
    } catch (error) {
        console.error('Error updating cashier config:', error);
        res.status(500).json({ message: 'Failed to update cashier configuration.' });
    }
});

// LAe: GET /api/cashiers/summary
app.get('/api/cashiers/summary', authenticateToken, async (req, res) => {
    const { from, to } = req.query;
    const { username, userId } = req.user;

    if (!from || !to) {
        return res.status(400).json({ message: 'Missing "from" and "to" date parameters.' });
    }

    const startDate = new Date(from);
    const endDate = new Date(new Date(to).setHours(23, 59, 59, 999));

    if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ message: 'Invalid date format for "from" or "to".' });
    }

    try {
        // Fetch the current CashierConfig (this is no longer directly used for houseEdgePercentage in shares)
        // const cashierConfig = await CashierConfig.findOne({ game_type: 'BINGO' }); // Old: Removed this line and the one below
        // const houseEdgePercentage = cashierConfig ? cashierConfig.houseEdge : 0; // Old: Removed this line

        const initialBalanceForPeriod = await calculateBalanceUpToDate(userId, startDate);

        const transactionsForPeriod = await Transaction.find({
            userId: userId,
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: 1 });

        let totalDeposits = 0;
        let totalBets = 0;
        let totalWins = 0; // This is the 'Redeemed' amount
        let totalCancellations = 0;
        let totalWithdrawals = 0;

        transactionsForPeriod.forEach(t => {
            switch (t.type) {
                case 'deposit': totalDeposits += t.amount; break;
                case 'bet': totalBets += t.amount; break;
                case 'win': totalWins += t.amount; break;
                case 'withdrawal': totalWithdrawals += t.amount; break;
                case 'cancellation': totalCancellations += t.amount; break;
                case 'deactivation_charge':
                    totalWithdrawals += t.amount;
                    break;
            }
        });

        // FIX: Calculate the actual house revenue from historical transactions
        // This is the total profit the house made (Bets - Redeemed/Wins) for the period.
        const actualHouseRevenue = totalBets - totalWins; 

        // Calculate shares based on this 'actualHouseRevenue'
        const webDeveloperSharePercentage = 0.10; // This is a fixed 10% of the actual house revenue
        const webDeveloperShare = actualHouseRevenue * webDeveloperSharePercentage;
        const retailerShare = actualHouseRevenue * (1 - webDeveloperSharePercentage); // Retailer gets the rest (90%)

        const endBalanceForPeriod = initialBalanceForPeriod + totalDeposits - totalBets + totalWins - totalCancellations - totalWithdrawals;

        res.status(200).json({
            retailUser: username,
            fromDate: startDate.toISOString(),
            toDate: endDate.toISOString(),
            startBalance: initialBalanceForPeriod,
            deposits: totalDeposits,
            bets: totalBets,
            cancellations: totalCancellations,
            redeemed: totalWins,
            withdraws: totalWithdrawals,
            endBalance: endBalanceForPeriod,
            // These shares now correctly reflect the actual house profit for the period
            retailerShare: parseFloat(retailerShare.toFixed(2)),
            webDeveloperShare: parseFloat(webDeveloperShare.toFixed(2)),
            transactionsForPeriod: transactionsForPeriod,
            message: "Cashier summary generated."
        });

    } catch (error) {
        console.error('Error generating cashier summary:', error);
        res.status(500).json({ message: 'Server error generating cashier summary.' });
    }
});

// NEW ENDPOINT: Shuffle the deck of uncalled numbers for an active game
app.post('/api/bingo-game/:gameId/shuffle', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const gameState = activeGames.get(gameId);
    if (!gameState) { 
        return res.status(404).json({ message: 'Game not found in active memory.' }); 
    }
    if (gameState.status !== 'waiting_for_players') {
        return res.status(400).json({ message: 'Can only shuffle before the game starts.' });
    }

    // Re-initialize and shuffle the uncalledNumbers array
    gameState.uncalledNumbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    activeGames.set(gameId, gameState);

    console.log(`Deck for game ${gameId} has been shuffled.`);
    res.status(200).json({ message: 'Deck shuffled successfully.' });
});

// NEW ENDPOINT: Update bet amount for a game before it starts
app.patch('/api/bingo-game/:gameId/bet-amount', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const { newBetAmount } = req.body;
    
    const gameState = activeGames.get(gameId);
    if (!gameState) { 
        return res.status(404).json({ message: 'Game not found in active memory.' }); 
    }
    
    if (typeof newBetAmount !== 'number' || newBetAmount <= 0) {
        return res.status(400).json({ message: 'Invalid bet amount provided.' });
    }

    // Allow changing bet amount only before players have been added and game has started
    if (gameState.players.length > 0 || gameState.status !== 'waiting_for_players') {
        return res.status(400).json({ message: 'Bet amount can only be changed on a new, empty game.' });
    }

    gameState.betAmount = newBetAmount;
    activeGames.set(gameId, gameState);

    console.log(`Bet amount for game ${gameId} updated to ${newBetAmount}.`);
    res.status(200).json({ message: 'Bet amount updated successfully.', newBetAmount: gameState.betAmount });
});

// --- END: ADD THIS SNIPPET TO YOUR server.js FILE ---


// NEW ENDPOINT: Get details for a specific bingo card in a game
app.get('/api/bingo-game/:gameId/card/:slipId', authenticateToken, (req, res) => {
    const { gameId, slipId } = req.params;
    const gameState = activeGames.get(gameId);

    if (!gameState) {
        return res.status(404).json({ message: 'Game not found in active memory.' });
    }

    const player = gameState.players.find(p => p.slipId === String(slipId));

    if (!player) {
        return res.status(404).json({ message: `Player with slip ID ${slipId} not found in this game.` });
    }

    // Return the specific details needed by the frontend modal
    res.status(200).json({
        slipId: player.slipId,
        bingoCard: player.bingoCard // This is the 'B1-2-3...' string
    });
});


app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('/', (req, res) => {
    // This only catches requests to the root path
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});