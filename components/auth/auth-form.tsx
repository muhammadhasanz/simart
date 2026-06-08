'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Eye, EyeOff, MapPin, Users, FileText } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Terjadi kesalahan')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-svh flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-sidebar-primary translate-x-[-30%] translate-y-[-30%]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-sidebar-primary translate-x-[30%] translate-y-[30%]" />
        </div>

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            SiMart
          </span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight text-balance">
              Sistem Informasi Administrasi RT/RW
            </h2>
            <p className="mt-3 text-sidebar-foreground/60 leading-relaxed">
              Platform terintegrasi untuk pengelolaan data warga, keluarga, dan administrasi lingkungan secara efisien.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Users, label: 'Data Warga', desc: 'Kelola data penduduk secara lengkap dan terstruktur' },
              { icon: MapPin, label: 'Data Keluarga', desc: 'Pantau kartu keluarga dan domisili warga' },
              { icon: FileText, label: 'Laporan', desc: 'Buat laporan kependudukan dengan cepat' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
                  <Icon className="h-4 w-4 text-sidebar-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{label}</p>
                  <p className="text-xs text-sidebar-foreground/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/40 relative z-10">
          &copy; {new Date().getFullYear()} SiMart. Sistem Informasi Warga.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">SiMart</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Buat akun baru' : 'Masuk ke akun'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? 'Daftarkan diri untuk mengakses sistem'
                : 'Masukkan kredensial Anda untuk melanjutkan'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="contoh: Budi Santoso"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nama@contoh.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'Min. 8 karakter' : 'Masukkan password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading
                ? 'Mohon tunggu...'
                : isSignUp
                  ? 'Buat Akun'
                  : 'Masuk'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <Link
              href={isSignUp ? '/login' : '/register'}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Masuk di sini' : 'Daftar sekarang'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
