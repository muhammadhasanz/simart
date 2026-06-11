import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  if (!ip) {
    ip = 'unknown'
  }

  return NextResponse.json({ ip })
}
