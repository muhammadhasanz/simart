import { getSheetValues, appendSheetValues, updateSheetValues, sheets, GOOGLE_SPREADSHEET_ID } from './google-sheets-client'

const SCHEMAS: Record<string, string[]> = {
  'Pengumuman': ['id', 'judul', 'isi', 'tanggal', 'kategori'],
  'Polls': ['id', 'pertanyaan', 'tanggal'],
  'PollOptions': ['id', 'poll_id', 'teks', 'suara'],
  'PollVotes': ['id', 'poll_id', 'fingerprint', 'voter_token', 'ip', 'voted_at'],
  'Surat': ['id', 'nomorSurat', 'penerima', 'nik', 'phone', 'nomorRumah', 'tujuan', 'perihal', 'status', 'createdAt'],
  'Families': ['id', 'familyCardNumber', 'address', 'rt', 'rw', 'village', 'district', 'city', 'province', 'postalCode', 'createdAt', 'updatedAt'],
  'Residents': ['id', 'familyId', 'nik', 'fullName', 'birthPlace', 'birthDate', 'gender', 'bloodType', 'religion', 'maritalStatus', 'occupation', 'education', 'nationality', 'phone', 'email', 'familyStatus', 'photoUrl', 'residentStatus', 'entryDate', 'exitDate', 'notes', 'createdAt', 'updatedAt'],
  'KasIuran': ['id', 'nama', 'keterangan', 'nominal', 'jenis', 'tanggal', 'createdAt', 'updatedAt']
};

function generateId() {
  return Math.floor(Math.random() * 1000000000).toString();
}

async function readSheet(sheetName: string) {
  const values = await getSheetValues(`${sheetName}!A:Z`);
  if (!values || values.length < 2) return [];
  const keys = SCHEMAS[sheetName] || values[0];
  const rows = values.slice(1);
  return rows.map((row: any[]) => {
    const obj: any = {};
    keys.forEach((key: string, index: number) => {
      obj[key] = row[index] || '';
    });
    return obj;
  });
}

async function deleteRowById(sheetName: string, id: string | number) {
  const values = await getSheetValues(`${sheetName}!A:Z`);
  if (!values) return { success: false };
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      const spreadsheet = await sheets?.spreadsheets.get({ spreadsheetId: GOOGLE_SPREADSHEET_ID });
      const sheet = spreadsheet?.data.sheets?.find(s => s.properties?.title === sheetName);
      const sheetId = sheet?.properties?.sheetId;
      if (sheetId !== undefined) {
        await sheets?.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SPREADSHEET_ID as string,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: i,
                  endIndex: i + 1
                }
              }
            }]
          }
        });
        return { success: true };
      }
    }
  }
  return { success: false };
}

async function createGeneric(sheetName: string, data: any) {
  const id = generateId();
  const date = new Date().toISOString();
  
  const keys = SCHEMAS[sheetName];
  const newRow = new Array(keys.length).fill('');
  
  data.id = id;
  if (keys.includes('createdAt') && !data.createdAt) data.createdAt = date;
  if (keys.includes('updatedAt') && !data.updatedAt) data.updatedAt = date;
  
  for (const key in data) {
    const colIdx = keys.indexOf(key);
    if (colIdx !== -1) {
      newRow[colIdx] = data[key];
    }
  }
  
  await appendSheetValues(`${sheetName}!A:Z`, [newRow]);
  return { id };
}

async function updateGeneric(sheetName: string, data: any) {
  const values = await getSheetValues(`${sheetName}!A:Z`);
  const keys = SCHEMAS[sheetName];
  
  if (keys.includes('updatedAt')) {
    data.updatedAt = new Date().toISOString();
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      const newRow = [...values[i]];
      // Fill missing columns in the row array if needed
      while (newRow.length < keys.length) newRow.push('');
      
      for (const key in data) {
        if (key === 'id') continue;
        const colIdx = keys.indexOf(key);
        if (colIdx !== -1) {
          newRow[colIdx] = data[key];
        }
      }
      // i is 0-indexed in array, but row in sheet is i+1 (because array is 0-indexed but we started searching from 1).
      // values[0] is header (row 1). values[i] is row i+1.
      const rowIndex = i + 1;
      await updateSheetValues(`${sheetName}!A${rowIndex}:Z${rowIndex}`, [newRow]);
      return { success: true };
    }
  }
  throw new Error(`${sheetName} tidak ditemukan`);
}

// ==========================================
// PENGUMUMAN
// ==========================================
async function getPengumuman() {
  return readSheet('Pengumuman');
}
async function createPengumuman(data: any) {
  return createGeneric('Pengumuman', data);
}
async function updatePengumuman(data: any) {
  return updateGeneric('Pengumuman', data);
}
async function deletePengumuman(id: string) {
  return deleteRowById('Pengumuman', id);
}

// ==========================================
// POLLING
// ==========================================
async function getPolls() {
  const polls = await readSheet('Polls');
  const options = await readSheet('PollOptions');
  
  return polls.map(p => {
    p.opsi = options.filter(o => o.poll_id == p.id);
    p.opsi.forEach((o: any) => o.suara = parseInt(o.suara) || 0);
    return p;
  });
}

async function createPoll(data: any) {
  const pollId = generateId();
  await appendSheetValues('Polls!A:Z', [[pollId, data.pertanyaan, data.tanggal]]);
  
  if (data.opsi && Array.isArray(data.opsi)) {
    const opsiRows = data.opsi.map((optTeks: string) => [generateId(), pollId, optTeks, 0]);
    await appendSheetValues('PollOptions!A:Z', opsiRows);
  }
  return { id: pollId };
}

async function deletePoll(id: string) {
  await deleteRowById('Polls', id);
  // Optional: Delete options. To safely delete multiple we'd need batchUpdate in reverse or filter,
  // but for simplicity and following the original logic, we will fetch sheet and delete.
  const options = await getSheetValues('PollOptions!A:Z');
  if (options) {
    const spreadsheet = await sheets?.spreadsheets.get({ spreadsheetId: GOOGLE_SPREADSHEET_ID });
    const sheetId = spreadsheet?.data.sheets?.find(s => s.properties?.title === 'PollOptions')?.properties?.sheetId;
    if (sheetId !== undefined) {
      const requests = [];
      for (let i = options.length - 1; i >= 1; i--) {
        if (options[i][1] == id) {
          requests.push({
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: i, endIndex: i + 1 }
            }
          });
        }
      }
      if (requests.length > 0) {
        await sheets?.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SPREADSHEET_ID as string,
          requestBody: { requests }
        });
      }
    }
  }
  return { success: true };
}

async function castVote(payload: any) {
  const optionId = payload.optionId || payload;
  const identity = payload.identity || {};
  
  const optValues = await getSheetValues('PollOptions!A:Z');
  let pollId = null;
  let optRowIndex = -1;
  let currentVotes = 0;
  
  for (let i = 1; i < optValues.length; i++) {
    if (optValues[i][0] == optionId) {
      pollId = optValues[i][1];
      optRowIndex = i;
      currentVotes = parseInt(optValues[i][3]) || 0;
      break;
    }
  }
  
  if (!pollId) throw new Error("Opsi tidak ditemukan");
  
  const voteValues = await getSheetValues('PollVotes!A:Z');
  if (voteValues) {
    for (let i = 1; i < voteValues.length; i++) {
      const vPollId = voteValues[i][1];
      if (vPollId == pollId) {
        const vFingerprint = voteValues[i][2];
        const vToken = voteValues[i][3];
        const vIp = voteValues[i][4];
        if (
          (identity.fingerprint && vFingerprint == identity.fingerprint) || 
          (identity.voterToken && vToken == identity.voterToken) || 
          (identity.ip && vIp == identity.ip)
        ) {
          throw new Error("ALREADY_VOTED");
        }
      }
    }
  }
  
  await appendSheetValues('PollVotes!A:Z', [[
    generateId(), pollId, identity.fingerprint || '', identity.voterToken || '', identity.ip || '', new Date().toISOString()
  ]]);
  
  const rowIndex = optRowIndex + 1;
  await updateSheetValues(`PollOptions!D${rowIndex}`, [[currentVotes + 1]]);
  return { success: true };
}

// ==========================================
// SURAT PENGANTAR
// ==========================================
async function getSuratList() {
  return readSheet('Surat');
}

async function getSuratById(id: string) {
  const suratList = await readSheet('Surat');
  return suratList.find((s: any) => s.id == id) || null;
}

async function createSurat(data: any) {
  const id = generateId();
  const date = new Date();
  const nomorSurat = `SRT/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${id.toString().substring(0,4)}`;
  const status = 'menunggu';
  
  await appendSheetValues('Surat!A:Z', [[
    id, nomorSurat, data.penerima, data.nik, data.phone, data.nomorRumah, data.tujuan, data.perihal, status, date.toISOString()
  ]]);
  return { id, nomorSurat };
}

async function updateSurat(data: any) {
  return updateGeneric('Surat', data);
}

async function deleteSurat(id: string) {
  return deleteRowById('Surat', id);
}

async function searchSurat(query: string) {
  const suratList = await readSheet('Surat');
  const q = query.toLowerCase().trim();
  return suratList.filter((s: any) => 
    (s.nik && s.nik.toString().toLowerCase().includes(q)) || 
    (s.phone && s.phone.toString().toLowerCase().includes(q)) || 
    (s.nomorRumah && s.nomorRumah.toString().toLowerCase().includes(q))
  );
}

// ==========================================
// EXPORTS
// ==========================================

export async function sheetsGet(action: string, param?: string) {
  try {
    let result = null;
    if (action === 'getPengumuman') result = await getPengumuman();
    else if (action === 'getPolls') result = await getPolls();
    else if (action === 'searchSurat') result = await searchSurat(param || '');
    else if (action === 'getSuratList') result = await getSuratList();
    else if (action === 'getSuratById') result = await getSuratById(param || '');
    else if (action === 'getFamilies') result = await readSheet('Families');
    else if (action === 'getResidents') result = await readSheet('Residents');
    else if (action === 'getKasIuran') result = await readSheet('KasIuran');
    else throw new Error('Invalid GET action');
    
    return result;
  } catch (err) {
    console.error(`[Sheets GET ${action}] Error:`, err);
    return [];
  }
}

export async function sheetsPost(action: string, payload: any) {
  try {
    let result = null;
    if (action === 'createPengumuman') result = await createPengumuman(payload.data);
    else if (action === 'updatePengumuman') result = await updatePengumuman(payload.data);
    else if (action === 'deletePengumuman') result = await deletePengumuman(payload.id);
    else if (action === 'createPoll') result = await createPoll(payload.data);
    else if (action === 'deletePoll') result = await deletePoll(payload.id);
    else if (action === 'castVote') result = await castVote(payload);
    else if (action === 'createSurat') result = await createSurat(payload.data);
    else if (action === 'updateSurat') result = await updateSurat(payload.data);
    else if (action === 'deleteSurat') result = await deleteSurat(payload.id);
    else if (action === 'createFamily') result = await createGeneric('Families', payload.data);
    else if (action === 'updateFamily') result = await updateGeneric('Families', payload.data);
    else if (action === 'deleteFamily') result = await deleteRowById('Families', payload.id);
    else if (action === 'createResident') result = await createGeneric('Residents', payload.data);
    else if (action === 'updateResident') result = await updateGeneric('Residents', payload.data);
    else if (action === 'deleteResident') result = await deleteRowById('Residents', payload.id);
    else if (action === 'createKasIuran') result = await createGeneric('KasIuran', payload.data);
    else if (action === 'updateKasIuran') result = await updateGeneric('KasIuran', payload.data);
    else if (action === 'deleteKasIuran') result = await deleteRowById('KasIuran', payload.id);
    else throw new Error('Invalid POST action');

    return result;
  } catch (err) {
    console.error(`[Sheets POST ${action}] Error:`, err);
    throw err;
  }
}
