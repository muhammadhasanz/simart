import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getUsers } from '@/app/actions/users'
import { UserTable } from '@/components/users/user-table'
import { UserCog } from 'lucide-react'

export const metadata = {
  title: 'Pengguna - Administrasi RT/RW',
}

export default async function PenggunaPage() {
  const [session, users] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getUsers(),
  ])

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

      <UserTable
        users={users}
        currentUserId={session?.user.id ?? ''}
      />
    </div>
  )
}
