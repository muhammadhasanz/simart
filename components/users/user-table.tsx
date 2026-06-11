'use client'

import { useState, useTransition, useEffect } from 'react'
import { createUser, deleteUser, getUsers } from '@/app/actions/users'
import { useSession } from '@/lib/auth-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'

type UserRow = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: Date | string | null
}

export function UserTable() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? ''

  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = () => {
    setFormError(null)
    startTransition(async () => {
      try {
        await createUser(form)
        const fresh = await getUsers()
        setUsers(fresh)
        setShowAdd(false)
        setForm({ name: '', email: '', password: '' })
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Gagal membuat pengguna')
      }
    })
  }

  const handleDelete = (u: UserRow) => {
    startTransition(async () => {
      try {
        await deleteUser(u.id)
        const fresh = await getUsers()
        setUsers(fresh)
        setConfirmDelete(null)
      } catch {
        // silently ignore — page will stay the same
      }
    })
  }

  const formatDate = (val: Date | string | null) => {
    if (!val) return '-'
    const d = new Date(val as string)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    let mounted = true
    getUsers()
      .then(res => {
        if (mounted) {
          setUsers(res)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {users.length} pengguna terdaftar
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status Email</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Belum ada pengguna
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const initials = u.name
                  ? u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                  : u.email[0].toUpperCase()
                const isSelf = u.id === currentUserId

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{u.name || '-'}</span>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">Anda</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      {u.emailVerified ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <ShieldCheck className="h-3 w-3" />
                          Terverifikasi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                          <ShieldOff className="h-3 w-3" />
                          Belum Verifikasi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isSelf || isPending}
                        onClick={() => setConfirmDelete(u)}
                        aria-label={`Hapus pengguna ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add user dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Pengguna baru akan dapat masuk ke sistem menggunakan email dan password yang diisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nama Lengkap</Label>
              <Input
                id="new-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="contoh: Siti Rahayu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@contoh.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 karakter"
                minLength={8}
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !form.email || !form.password}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun{' '}
              <span className="font-medium text-foreground">{confirmDelete?.name || confirmDelete?.email}</span>{' '}
              akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={isPending}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={isPending}
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
