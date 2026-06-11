'use client'

import { useEffect, useState } from 'react'
import type { SuratPengantar } from '@/lib/db/schema'
import { getSuratByToken } from '@/app/actions/surat-pengantar'
import { Skeleton } from '@/components/ui/skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function terbilangBulan(d: string | null | undefined) {
  if (!d) return ''
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const date = new Date(d)
  return months[date.getMonth()]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrintView({ token }: { token: string }) {
  const [surat, setSurat] = useState<SuratPengantar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getSuratByToken(token).then((res) => {
      if (!mounted) return
      if (res.error) {
        setError(res.error)
      } else if (res.surat) {
        setSurat(res.surat as SuratPengantar)
      }
      setIsLoading(false)
    }).catch(() => {
      if (mounted) {
        setError('not_found')
        setIsLoading(false)
      }
    })
    return () => { mounted = false }
  }, [token])

  // Trigger the browser print dialog automatically on mount when data is loaded
  useEffect(() => {
    if (!isLoading && !error && surat) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [isLoading, error, surat])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center min-h-screen p-8 bg-gray-100">
        <div className="w-full max-w-[794px] bg-white p-16 shadow-lg min-h-[1123px]">
          {/* Header Skeleton */}
          <div className="flex items-center gap-6 border-b-4 border-double border-gray-800 pb-4 mb-8">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-3 w-96 mt-2" />
            </div>
          </div>
          
          {/* Title Skeleton */}
          <div className="flex flex-col items-center mb-8 gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            
            <div className="pl-8 space-y-3 my-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-32 shrink-0" />
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>

            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Signature Skeleton */}
          <div className="flex justify-end mt-16">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-16" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !surat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dokumen Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">
            {error === 'not_ready' 
              ? 'Surat ini belum selesai diproses oleh admin.' 
              : 'Tautan surat tidak valid atau surat telah dihapus.'}
          </p>
          <a href="/portal" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Kembali ke Portal
          </a>
        </div>
      </div>
    )
  }

  const tanggalFormatted = formatDate(surat.tanggal)
  const bulan = terbilangBulan(surat.tanggal)
  const tahun = surat.tanggal ? new Date(surat.tanggal).getFullYear() : new Date().getFullYear()

  return (
    <>
      {/* ── Print-only global styles injected via a style tag ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f5f5f5;
          font-family: 'Times New Roman', Times, serif;
          color: #111;
        }

        .page-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 32px 16px 64px;
        }

        .no-print-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          max-width: 794px;
          margin-bottom: 16px;
        }

        .no-print-bar p {
          font-family: system-ui, sans-serif;
          font-size: 13px;
          color: #555;
        }

        .btn-print {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 18px;
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-print:hover { background: #1e40af; }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: transparent;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
        }

        .btn-back:hover { background: #f3f4f6; }

        /* A4 paper card */
        .paper {
          width: 794px;
          min-height: 1123px;
          background: #fff;
          padding: 64px 72px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }

        /* Letterhead */
        .letterhead {
          display: flex;
          align-items: center;
          gap: 18px;
          padding-bottom: 14px;
          border-bottom: 3px double #111;
        }

        .letterhead-logo {
          width: 72px;
          height: 72px;
          border: 2px solid #111;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 28px;
          font-weight: 700;
          color: #111;
        }

        .letterhead-text { flex: 1; text-align: center; }

        .letterhead-text .instansi {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .letterhead-text .nama-rt {
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          line-height: 1.2;
        }

        .letterhead-text .alamat {
          font-size: 10px;
          margin-top: 2px;
          color: #444;
        }

        /* Title block */
        .title-block {
          text-align: center;
          margin: 22px 0 0;
        }

        .title-block .doc-type {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .title-block .nomor-surat {
          font-size: 12px;
          margin-top: 4px;
        }

        /* Opening paragraph */
        .opening {
          font-size: 12px;
          margin-top: 22px;
          line-height: 1.8;
        }

        /* Data table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 14px;
          line-height: 1.7;
        }

        .data-table td { vertical-align: top; padding: 1px 0; }
        .data-table td:first-child { width: 140px; padding-right: 4px; }
        .data-table td:nth-child(2) { width: 12px; text-align: center; }
        .data-table td:last-child { padding-left: 4px; font-weight: 500; }

        /* Closing paragraph */
        .closing {
          font-size: 12px;
          margin-top: 20px;
          line-height: 1.8;
        }

        /* Signature block */
        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 32px;
        }

        .signature-block {
          text-align: center;
          font-size: 12px;
          width: 220px;
        }

        .signature-block .place-date { margin-bottom: 4px; }

        .signature-block .role {
          font-weight: 600;
        }

        .signature-space {
          height: 72px;
        }

        .signature-block .name {
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Footer note */
        .footer-note {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 9px;
          color: #666;
          text-align: center;
          font-style: italic;
        }

        /* Print overrides */
        @media print {
          body { background: #fff; }
          .no-print-bar { display: none !important; }
          .page-wrapper { padding: 0; background: #fff; }
          .paper {
            box-shadow: none;
            width: 100%;
            min-height: unset;
            padding: 40px 56px;
          }
        }

        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      <div className="page-wrapper">
        {/* ── Toolbar (hidden on print) ─────────────────────────── */}
        <div className="no-print-bar">
          <a href="/portal" className="btn-back">
            &#8592; Kembali ke Portal
          </a>
          <p>Pratinjau Surat Pengantar &mdash; <strong>{surat.nomorSurat}</strong></p>
          <button
            className="btn-print"
            onClick={() => window.print()}
            type="button"
          >
            &#128438; Cetak / Simpan PDF
          </button>
        </div>

        {/* ── A4 Paper ─────────────────────────────────────────── */}
        <article className="paper" aria-label="Surat Pengantar">

          {/* Letterhead */}
          <header className="letterhead">
            <div className="letterhead-logo" aria-hidden="true">RT</div>
            <div className="letterhead-text">
              <p className="instansi">Pemerintah Kelurahan / Desa</p>
              <p className="nama-rt">Rukun Tetangga (RT) &amp; Rukun Warga (RW)</p>
              <p className="alamat">
                Jl. Contoh No. 1, RT 001 / RW 001 &mdash; Kel. Contoh, Kec. Contoh, Kota Contoh
              </p>
            </div>
          </header>

          {/* Title */}
          <div className="title-block">
            <p className="doc-type">Surat Pengantar</p>
            <p className="nomor-surat">Nomor: {surat.nomorSurat}</p>
          </div>

          {/* Opening */}
          <p className="opening">
            Yang bertanda tangan di bawah ini, Ketua Rukun Tetangga (RT) menerangkan bahwa:
          </p>

          {/* Resident data */}
          <table className="data-table" aria-label="Data pemohon">
            <tbody>
              <tr>
                <td>Nama Lengkap</td>
                <td>:</td>
                <td>{surat.penerima}</td>
              </tr>
              {surat.nik && (
                <tr>
                  <td>NIK</td>
                  <td>:</td>
                  <td>{surat.nik}</td>
                </tr>
              )}
              {surat.phone && (
                <tr>
                  <td>No. HP</td>
                  <td>:</td>
                  <td>{surat.phone}</td>
                </tr>
              )}
              {surat.nomorRumah && (
                <tr>
                  <td>No. Rumah</td>
                  <td>:</td>
                  <td>{surat.nomorRumah}</td>
                </tr>
              )}
              <tr>
                <td>Perihal</td>
                <td>:</td>
                <td>{surat.perihal}</td>
              </tr>
            </tbody>
          </table>

          {/* Closing */}
          <p className="closing">
            adalah benar warga RT/RW setempat dan membutuhkan surat pengantar ini sebagai
            kelengkapan administrasi untuk keperluan{' '}
            <strong>{surat.perihal}</strong>.
            <br /><br />
            Surat pengantar ini ditujukan kepada{' '}
            <strong>{surat.tujuan}</strong>.
            Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Signature */}
          <div className="signature-section">
            <div className="signature-block">
              <p className="place-date">
                ........., {tanggalFormatted}
              </p>
              <p className="role">Ketua RT</p>
              <div className="signature-space" />
              <p className="name">( ________________________ )</p>
            </div>
          </div>

          {/* Footer note */}
          <p className="footer-note">
            Surat ini diterbitkan secara digital melalui Portal Warga &mdash; {surat.nomorSurat} &mdash; {tanggalFormatted}
          </p>
        </article>
      </div>
    </>
  )
}
