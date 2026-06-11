/**
 * SIMART GOOGLE SHEETS DATABASE DRIVER
 * 
 * 1. Buat Google Spreadsheet baru.
 * 2. Di menu atas, klik Extensions > Apps Script.
 * 3. Hapus semua kode, lalu Paste semua kode dari file ini.
 * 4. PENTING: Pilih fungsi `setup` di dropdown bagian atas (dekat tombol Run), lalu klik Run. Berikan izin otorisasi. Script akan membuat semua Tab dan Header otomatis.
 * 5. Klik Deploy > New Deployment.
 *    - Select type: Web App
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (SIAPA SAJA)
 * 6. Klik Deploy. Copy "Web app URL" dan masukkan ke file .env Next.js Anda:
 *    DB_URL=https://script.google.com/macros/s/AKfycb.../exec
 *    DB_DRIVER=gas
 */

const SCHEMAS = {
  'Pengumuman': ['id', 'judul', 'isi', 'tanggal', 'kategori'],
  'Polls': ['id', 'pertanyaan', 'tanggal'],
  'PollOptions': ['id', 'poll_id', 'teks', 'suara'],
  'PollVotes': ['id', 'poll_id', 'fingerprint', 'voter_token', 'ip', 'voted_at'],
  'Surat': ['id', 'nomorSurat', 'penerima', 'nik', 'phone', 'nomorRumah', 'tujuan', 'perihal', 'status', 'createdAt'],
  'Families': ['id', 'familyCardNumber', 'address', 'rt', 'rw', 'village', 'district', 'city', 'province', 'postalCode', 'createdAt', 'updatedAt'],
  'Residents': ['id', 'familyId', 'nik', 'fullName', 'birthPlace', 'birthDate', 'gender', 'bloodType', 'religion', 'maritalStatus', 'occupation', 'education', 'nationality', 'phone', 'email', 'familyStatus', 'photoUrl', 'residentStatus', 'entryDate', 'exitDate', 'notes', 'createdAt', 'updatedAt'],
  'KasIuran': ['id', 'nama', 'keterangan', 'nominal', 'jenis', 'tanggal', 'createdAt', 'updatedAt']
};

const LABELS = {
  'judul': 'Judul Pengumuman', 'isi': 'Deskripsi / Isi', 'tanggal': 'Tanggal', 'kategori': 'Kategori',
  'pertanyaan': 'Pertanyaan Polling', 'poll_id': 'ID Polling', 'teks': 'Opsi Pilihan', 'suara': 'Jumlah Suara',
  'fingerprint': 'Fingerprint', 'voter_token': 'Token Pemilih', 'ip': 'IP Address', 'voted_at': 'Waktu Vote',
  'nomorSurat': 'Nomor Surat', 'penerima': 'Nama Pemohon', 'nik': 'NIK Pemohon', 'phone': 'Nomor HP', 'nomorRumah': 'Nomor Rumah',
  'tujuan': 'Tujuan Surat', 'perihal': 'Keperluan', 'status': 'Status', 'createdAt': 'Dibuat Pada', 'updatedAt': 'Diperbarui Pada',
  'familyCardNumber': 'Nomor Kartu Keluarga (KK)', 'address': 'Alamat Lengkap', 'rt': 'RT', 'rw': 'RW', 'village': 'Desa / Kelurahan',
  'district': 'Kecamatan', 'city': 'Kota / Kabupaten', 'province': 'Provinsi', 'postalCode': 'Kode Pos',
  'familyId': 'ID Keluarga', 'fullName': 'Nama Lengkap Warga', 'birthPlace': 'Tempat Lahir', 'birthDate': 'Tanggal Lahir',
  'gender': 'Jenis Kelamin', 'bloodType': 'Golongan Darah', 'religion': 'Agama', 'maritalStatus': 'Status Perkawinan',
  'occupation': 'Pekerjaan', 'education': 'Pendidikan', 'nationality': 'Kewarganegaraan', 'email': 'Email',
  'familyStatus': 'Status dalam Keluarga', 'photoUrl': 'URL Foto', 'residentStatus': 'Status Warga',
  'entryDate': 'Tanggal Masuk', 'exitDate': 'Tanggal Keluar', 'notes': 'Catatan Tambahan',
  'nama': 'Nama Transaksi', 'keterangan': 'Keterangan Transaksi', 'nominal': 'Nominal Rupiah', 'jenis': 'Jenis Transaksi'
};

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Jalankan script ini dari dalam Spreadsheet (Extensions > Apps Script)");
  
  // Save ID so doGet/doPost can find it even if getActiveSpreadsheet() fails in Web App mode
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());

  for (const sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const keys = SCHEMAS[sheetName];
      const headers = keys.map(k => LABELS[k] || (k === 'id' ? 'ID' : k));
      sheet.appendRow(headers);
      
      // Make header bold and styled
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }
  }

  // Delete default 'Sheet1' if it exists and is empty
  const sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result = null;

    if (action === 'getPengumuman') {
      result = getPengumuman();
    } else if (action === 'getPolls') {
      result = getPolls();
    } else if (action === 'searchSurat') {
      result = searchSurat(e.parameter.query);
    } else if (action === 'getSuratList') {
      result = getSuratList();
    } else if (action === 'getSuratById') {
      result = getSuratById(e.parameter.id);
    } else if (action === 'getFamilies') {
      result = readSheet('Families');
    } else if (action === 'getResidents') {
      result = readSheet('Residents');
    } else if (action === 'getKasIuran') {
      result = readSheet('KasIuran');
    } else {
      return responseError('Invalid GET action');
    }

    return responseSuccess(result);
  } catch (error) {
    return responseError(error.message);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result = null;

    if (action === 'createPengumuman') {
      result = createPengumuman(payload.data);
    } else if (action === 'updatePengumuman') {
      result = updatePengumuman(payload.data);
    } else if (action === 'deletePengumuman') {
      result = deletePengumuman(payload.id);
    } else if (action === 'createPoll') {
      result = createPoll(payload.data);
    } else if (action === 'deletePoll') {
      result = deletePoll(payload.id);
    } else if (action === 'castVote') {
      // payload now contains { optionId, identity }
      result = castVote(payload);
    } else if (action === 'createSurat') {
      result = createSurat(payload.data);
    } else if (action === 'updateSurat') {
      result = updateSurat(payload.data);
    } else if (action === 'deleteSurat') {
      result = deleteSurat(payload.id);
    } else if (action === 'createFamily') {
      result = createGeneric('Families', payload.data);
    } else if (action === 'updateFamily') {
      result = updateGeneric('Families', payload.data);
    } else if (action === 'deleteFamily') {
      result = deleteRowById('Families', payload.id);
    } else if (action === 'createResident') {
      result = createGeneric('Residents', payload.data);
    } else if (action === 'updateResident') {
      result = updateGeneric('Residents', payload.data);
    } else if (action === 'deleteResident') {
      result = deleteRowById('Residents', payload.id);
    } else if (action === 'createKasIuran') {
      result = createGeneric('KasIuran', payload.data);
    } else if (action === 'updateKasIuran') {
      result = updateGeneric('KasIuran', payload.data);
    } else if (action === 'deleteKasIuran') {
      result = deleteRowById('KasIuran', payload.id);
    } else {
      return responseError('Invalid POST action');
    }

    return responseSuccess(result);
  } catch (error) {
    return responseError(error.message);
  }
}

// ==========================================
// PENGUMUMAN
// Columns: id, judul, isi, tanggal, kategori
// ==========================================
function getPengumuman() {
  return readSheet('Pengumuman');
}

function createPengumuman(data) {
  const id = generateId();
  appendRow('Pengumuman', [id, data.judul, data.isi, data.tanggal, data.kategori]);
  return { id };
}

function updatePengumuman(data) {
  const sheet = getSheet('Pengumuman');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[data.judul, data.isi, data.tanggal, data.kategori]]);
      return { success: true };
    }
  }
  throw new Error("Pengumuman tidak ditemukan");
}

function deletePengumuman(id) {
  deleteRowById('Pengumuman', id);
  return { success: true };
}

// ==========================================
// POLLING
// Polls Columns: id, pertanyaan, tanggal
// PollOptions Columns: id, poll_id, teks, suara
// ==========================================
function getPolls() {
  const polls = readSheet('Polls');
  const options = readSheet('PollOptions');

  // Relate options to polls
  return polls.map(p => {
    p.opsi = options.filter(o => o.poll_id == p.id);
    // Convert suara to integer
    p.opsi.forEach(o => o.suara = parseInt(o.suara) || 0);
    return p;
  });
}

function createPoll(data) {
  const pollId = generateId();
  appendRow('Polls', [pollId, data.pertanyaan, data.tanggal]);

  data.opsi.forEach(optTeks => {
    const optId = generateId();
    appendRow('PollOptions', [optId, pollId, optTeks, 0]);
  });

  return { id: pollId };
}

function deletePoll(id) {
  deleteRowById('Polls', id);
  // Also delete options
  const sheet = getSheet('PollOptions');
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][1] == id) { // col 1 is poll_id
      sheet.deleteRow(i + 1);
    }
  }
  return { success: true };
}

function castVote(payload) {
  const optionId = payload.optionId || payload;
  const identity = payload.identity || {};
  
  const sheetOpt = getSheet('PollOptions');
  const values = sheetOpt.getDataRange().getValues();
  
  let pollId = null;
  let optRowIndex = -1;
  let currentVotes = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == optionId) {
      pollId = values[i][1];
      optRowIndex = i;
      currentVotes = parseInt(values[i][3]) || 0;
      break;
    }
  }
  
  if (!pollId) {
    throw new Error("Opsi tidak ditemukan");
  }
  
  // Check PollVotes sheet for duplicates
  try {
    const sheetVotes = getSheet('PollVotes');
    const voteValues = sheetVotes.getDataRange().getValues();
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
  } catch (e) {
    if (e.message === "ALREADY_VOTED") throw e;
    // If PollVotes sheet doesn't exist, we can't check. Ignore or throw.
    // For now we assume they will create the sheet.
  }

  // Record the vote
  try {
    appendRow('PollVotes', [
      generateId(), 
      pollId, 
      identity.fingerprint || '', 
      identity.voterToken || '', 
      identity.ip || '', 
      new Date().toISOString()
    ]);
  } catch (e) {
    // Ignore if sheet missing, though it means anti-duplication won't work next time
  }

  sheetOpt.getRange(optRowIndex + 1, 4).setValue(currentVotes + 1); // col 4 is suara
  return { success: true };
}

// ==========================================
// SURAT PENGANTAR
// Columns: id, nomorSurat, penerima, nik, phone, nomorRumah, tujuan, perihal, status, createdAt
// ==========================================
function getSuratList() {
  return readSheet('Surat');
}

function getSuratById(id) {
  const suratList = readSheet('Surat');
  return suratList.find(s => s.id == id) || null;
}

function createSurat(data) {
  const id = generateId();
  const date = new Date();
  // Format nomor surat: SRT/YYYY/MM/ID
  const nomorSurat = `SRT/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${id.toString().substring(0,4)}`;
  const status = 'menunggu';
  
  appendRow('Surat', [
    id, nomorSurat, data.penerima, data.nik, data.phone, data.nomorRumah, data.tujuan, data.perihal, status, date.toISOString()
  ]);

  return { id, nomorSurat };
}

function updateSurat(data) {
  const sheet = getSheet('Surat');
  const values = sheet.getDataRange().getValues();
  const keys = SCHEMAS['Surat'];
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      // Create a copy of the row
      const newRow = [...values[i]];
      // Update fields that are provided
      for (const key in data) {
        if (key === 'id') continue;
        const colIdx = keys.indexOf(key);
        if (colIdx !== -1) {
          newRow[colIdx] = data[key];
        }
      }
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { success: true };
    }
  }
  throw new Error("Surat tidak ditemukan");
}

function deleteSurat(id) {
  deleteRowById('Surat', id);
  return { success: true };
}

function searchSurat(query) {
  const suratList = readSheet('Surat');
  const q = query.toLowerCase().trim();
  return suratList.filter(s => 
    (s.nik && s.nik.toString().toLowerCase().includes(q)) || 
    (s.phone && s.phone.toString().toLowerCase().includes(q)) || 
    (s.nomorRumah && s.nomorRumah.toString().toLowerCase().includes(q))
  );
}

// ==========================================
// ==========================================
// GENERIC HELPERS
// ==========================================

function createGeneric(sheetName, data) {
  const id = generateId();
  const date = new Date().toISOString();
  
  const sheet = getSheet(sheetName);
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
  
  sheet.appendRow(newRow);
  return { id };
}

function updateGeneric(sheetName, data) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const keys = SCHEMAS[sheetName];
  
  if (keys.includes('updatedAt')) {
    data.updatedAt = new Date().toISOString();
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      const newRow = [...values[i]];
      for (const key in data) {
        if (key === 'id') continue;
        const colIdx = keys.indexOf(key);
        if (colIdx !== -1) {
          newRow[colIdx] = data[key];
        }
      }
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { success: true };
    }
  }
  throw new Error(sheetName + " tidak ditemukan");
}

function getSS() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
    if (id) ss = SpreadsheetApp.openById(id);
  }
  if (!ss) throw new Error("Spreadsheet tidak ditemukan. Silakan jalankan fungsi setup() ulang.");
  return ss;
}

function getSheet(name) {
  const ss = getSS();
  let sheet = ss.getSheetByName(name);
  if (!sheet && SCHEMAS[name]) {
    sheet = ss.insertSheet(name);
    const keys = SCHEMAS[name];
    const headers = keys.map(k => LABELS[k] || (k === 'id' ? 'ID' : k));
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const keys = SCHEMAS[sheetName] || data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    keys.forEach((key, index) => {
      obj[key] = row[index];
    });
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(rowData);
}

function deleteRowById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function generateId() {
  return Math.floor(Math.random() * 1000000000).toString();
}

function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message
  })).setMimeType(ContentService.MimeType.JSON);
}
