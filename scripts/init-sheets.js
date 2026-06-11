const { google } = require('googleapis');

const GOOGLE_SERVICE_ACCOUNT_EMAIL = "nextjs-simart@mindful-phalanx-469908-n2.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDFOlIcZR9uTpfe\nvCt4nyO2gHM8depp84hmiF/NM7cUgJ8rz9vd4bl9+jrq2z+sDdyCiLD8Wrh18bT9\n9jx9zrRdOqvmoxXfFOqXSW0LPUP/P2+av9KLGz1bq1nXnzMlCC5UdBgA55R7WXee\nZTPi+KdL2ASS8a1T6eyYstHedEzbwMVnLVEaSkGar1fAZv9w9tHduEBfhQGOyMTS\nfp/5MXUQ4P3TdGS0+UzmK5mIQ95cgw51RG02H/ooajGr2WvtMIRybvdRAaZP2t+2\nvYeWwOuHdyTgRAudtvMg5fvhr2D8j3/5BWJvaK9vNGQzXRqj2TdZ/E2aEBaACl+t\ndOPBdHEHAgMBAAECggEAYX9WpwXQV1nP1sJjpQHaiDYQgWNzKcRDehhRb6Hwj9iT\nlvduo82Zwm6IYKBY5geGKhtDjsSUKm39wIvQ1Ipx/CJsZxvYzIpM+9PG7YbwTcaA\nt9m6zZx+JQpcY+ylvllAeexYD15rttx/9xPlZf7wyNv1SuTg/7oEhWnkuJj6g6j2\nUwubEvGbbEe8zHuIxM1IRGSW5KBjdqxAD9Ynp04bKQtMgS0zbf3EvKq+P6D2BzLo\ndpuczv93gIImmULOybedt0my/AZaKOQe4Vrp8DAsOtzH+EomP87KNA+wbs/bz88C\n3ewtNvA//gLvvLVpUR8swAdYVH0zwSx6GmDYRI09nQKBgQDmQU0vl9IEZ6h/eOYv\nOqJPNxNEawmbvlvr/B9COx9V5T13DqClYEUZ0kgeSbas5khYU+nX0skBBKj+pdfs\nMyqZtlCxlK/NFwXnSsdFSmGBSHe18rGeE3DHiSXzeM9pYklIPsoI7YYc2fKHh4p6\n5xsHB+U8pbZafk6KGZvgtK0ipQKBgQDbR6oSzMsCCwW65QIMyf/Xb7VBe0wPnczi\nWbwqX3W/nL39ROD8cDJh3G8BRL6zcyn3Vg//qr8ckl0N79WCTGraBvMLEAqCW+r3\njHvORE/cY1CIAQN2pbiJnC8U2uVsJUbraHSO0vthh7/oA1y2Yz0iBUqUV/4WPixQ\nmjycC9aROwKBgD2kU86e/WmSeqiNrEoOj29Xlj/ly++2+ZLmr1Oi0lPDiD38W4OK\nj1VHV2lMYKxPBiUnad4OnyM3pSpvKawhUpFOHrI71Qi51inCejCRpiLfTLUYIPbp\ny3KPw+o3eIeE+Ytuy9WyCQpmSqh/39HhVvn94h/nWTdGwy3zhyiUFhnFAoGASNOm\nUpQdoFIU1xuT8Ldt9xkss9DFVDJuh4aSDeiibL8cAm/L4UtKEGJro5o3U9Ydy/2T\nVrBYxJ5/tU9ANAQ5QKwqMDRlqSHqCclonPrnIyUA7AqaId+sSFfM8zo4FBDVWv3Y\nKE8+GghB3kavlgujlBb5zAblZnHDuglfs9viqV0CgYAssvN1QP3XywyyMEDTp03u\nhBHyOaOMaE9MDuEE1NuYIPtEySN2NecQNdTQoFas/znQbvrBH15ITYxAaOBdCCok\npz1uPXOtaC2UXUXRGUVyl9uFDqRy0D61g0d7I5HARskgugtvxDwTa/xEd1wUFiLr\nec6Sn3ee80kJis0PitvzaA==\n-----END PRIVATE KEY-----\n";
const GOOGLE_SPREADSHEET_ID = "16BldvyP44ZR9sLCWmQ1PM9SyiDKCmBuwwXW_qP1ZSDA";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

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

async function setup() {
  console.log("Fetching spreadsheet data...");
  const doc = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SPREADSHEET_ID });
  const existingSheets = doc.data.sheets.map(s => s.properties.title);

  const requests = [];

  for (const sheetName of Object.keys(SCHEMAS)) {
    if (!existingSheets.includes(sheetName)) {
      console.log(`Adding sheet: ${sheetName}`);
      requests.push({
        addSheet: {
          properties: {
            title: sheetName,
            gridProperties: { frozenRowCount: 1 }
          }
        }
      });
    }
  }

  if (requests.length > 0) {
    console.log("Creating sheets...");
    const addResp = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      requestBody: { requests }
    });
    console.log("Sheets created successfully.");

    // Update headers for new sheets
    for (const reply of addResp.data.replies) {
      if (reply.addSheet && reply.addSheet.properties) {
        const sheetName = reply.addSheet.properties.title;
        const keys = SCHEMAS[sheetName];
        const headers = keys.map(k => LABELS[k] || (k === 'id' ? 'ID' : k));
        
        console.log(`Writing headers to ${sheetName}...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SPREADSHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers]
          }
        });

        // Apply bold formatting to the header row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SPREADSHEET_ID,
          requestBody: {
            requests: [{
              repeatCell: {
                range: {
                  sheetId: reply.addSheet.properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.95, green: 0.95, blue: 0.96 }, // #f3f4f6 approx
                    textFormat: { bold: true }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }]
          }
        });
      }
    }
  } else {
    console.log("All sheets already exist.");
  }
}

setup().catch(console.error);
