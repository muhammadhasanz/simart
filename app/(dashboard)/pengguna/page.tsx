import { UserTable } from '@/components/users/user-table'
import { UserCog } from 'lucide-react'

export const metadata = {
  title: 'Pengguna - Administrasi RT/RW',
}

export default function PenggunaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <UserCog className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola akun pengguna yang dapat mengakses sistem administrasi ini.
          </p>
        </div>
      </div>

      <UserTable />
    </div>
  )
}
