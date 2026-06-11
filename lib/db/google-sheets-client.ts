import { google } from 'googleapis';

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Handle newlines in the private key which can be escaped as \n string in env vars
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
export const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export let sheets: ReturnType<typeof google.sheets> | null = null;

if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SPREADSHEET_ID) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheets = google.sheets({ version: 'v4', auth });
} else {
  console.warn('Google Sheets API credentials are not fully set up in environment variables.');
}

/**
 * Utility to get values from a specific range.
 */
export async function getSheetValues(range: string) {
  if (!sheets || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets client is not initialized');
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range,
  });

  return response.data.values || [];
}

/**
 * Utility to append values to a specific sheet.
 */
export async function appendSheetValues(range: string, values: any[][]) {
  if (!sheets || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets client is not initialized');
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  return response.data;
}

/**
 * Utility to update values in a specific range.
 */
export async function updateSheetValues(range: string, values: any[][]) {
  if (!sheets || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets client is not initialized');
  }

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  return response.data;
}

/**
 * Utility to clear values in a specific range.
 */
export async function clearSheetValues(range: string) {
  if (!sheets || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets client is not initialized');
  }

  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range,
  });

  return response.data;
}
