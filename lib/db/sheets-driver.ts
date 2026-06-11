const DB_URL = process.env.DB_URL

if (!DB_URL) {
  console.warn('DB_URL is not set in environment variables. Google Sheets database driver will not work correctly.')
}

export async function sheetsGet(action: string, param?: string) {
  if (!DB_URL) return []
  
  let url = `${DB_URL}?action=${action}`
  if (param) {
    if (action === 'getSuratById') {
      url += `&id=${encodeURIComponent(param)}`
    } else {
      url += `&query=${encodeURIComponent(param)}`
    }
  }

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  } catch (err) {
    console.error(`[Sheets GET ${action}] Error:`, err)
    return []
  }
}

export async function sheetsPost(action: string, payload: any) {
  if (!DB_URL) return null

  try {
    const res = await fetch(DB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
      cache: 'no-store'
    })
    
    // Sometimes Google Apps Script returns an HTML page if there's a redirect or error
    // We try to parse as JSON.
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      if (!json.success) throw new Error(json.error)
      return json.data
    } catch (e) {
      console.error(`[Sheets POST ${action}] Failed to parse JSON. Received:`, text)
      throw new Error('Invalid response from Sheets API')
    }
  } catch (err) {
    console.error(`[Sheets POST ${action}] Error:`, err)
    throw err
  }
}
