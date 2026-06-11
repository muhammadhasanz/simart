import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, isValid } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Resident } from '@/lib/db/schema'

interface RecentResidentsProps {
  residents: Resident[]
}

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  moved: 'Pindah',
  deceased: 'Meninggal',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  moved: 'secondary',
  deceased: 'destructive',
}

export function RecentResidents({ residents }: RecentResidentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Warga Terbaru
        </CardTitle>
        <Link
          href="/warga"
          className="text-sm text-primary hover:underline"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent>
        {residents.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data warga terdaftar
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/warga/${resident.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {resident.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {resident.nik}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const d = resident.createdAt ? new Date(resident.createdAt) : null
                      return d && isValid(d)
                        ? format(d, 'd MMM yyyy', { locale: id })
                        : '-'
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[resident.residentStatus || 'active']}>
                      {statusLabels[resident.residentStatus || 'active']}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
