import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  date,
  varchar,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').notNull().$defaultFn(() => new Date()),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').notNull().$defaultFn(() => new Date()),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').notNull().$defaultFn(() => new Date()),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').$defaultFn(() => new Date()),
})

// --- App tables (RT/RW Administration) -------------------------------------

export const families = pgTable('families', {
  id: serial('id').primaryKey(),
  familyCardNumber: varchar('family_card_number', { length: 16 })
    .unique()
    .notNull(),
  address: text('address').notNull(),
  rt: varchar('rt', { length: 3 }).notNull().default('001'),
  rw: varchar('rw', { length: 3 }).notNull().default('001'),
  village: varchar('village', { length: 100 }),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 5 }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

export const residents = pgTable('residents', {
  id: serial('id').primaryKey(),
  familyId: integer('family_id').references(() => families.id, {
    onDelete: 'set null',
  }),
  nik: varchar('nik', { length: 16 }).unique().notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  birthPlace: varchar('birth_place', { length: 100 }),
  birthDate: date('birth_date'),
  gender: varchar('gender', { length: 10 }),
  bloodType: varchar('blood_type', { length: 3 }),
  religion: varchar('religion', { length: 20 }),
  maritalStatus: varchar('marital_status', { length: 30 }),
  occupation: varchar('occupation', { length: 100 }),
  education: varchar('education', { length: 50 }),
  nationality: varchar('nationality', { length: 50 }).default('WNI'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  familyStatus: varchar('family_status', { length: 50 }),
  photoUrl: text('photo_url'),
  residentStatus: varchar('resident_status', { length: 20 }).default('active'),
  entryDate: date('entry_date').$defaultFn(() => new Date().toISOString().split('T')[0]),
  exitDate: date('exit_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

// --- Kas & Iuran Digital ------------------------------------------------

export const kasIuran = pgTable('kas_iuran', {
  id: serial('id').primaryKey(),
  nama: varchar('nama', { length: 255 }).notNull(),
  keterangan: text('keterangan'),
  nominal: integer('nominal').notNull().default(0),
  jenis: varchar('jenis', { length: 6 }).notNull().default('masuk'), // 'masuk' | 'keluar'
  tanggal: date('tanggal').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

// --- E-Surat Pengantar --------------------------------------------------

export const suratPengantar = pgTable('surat_pengantar', {
  id: serial('id').primaryKey(),
  nomorSurat: varchar('nomor_surat', { length: 100 }).notNull(),
  tujuan: varchar('tujuan', { length: 255 }).notNull(),
  perihal: text('perihal').notNull(),
  penerima: varchar('penerima', { length: 255 }).notNull(),
  nik: varchar('nik', { length: 16 }),
  phone: varchar('phone', { length: 20 }),
  nomorRumah: varchar('nomor_rumah', { length: 20 }),
  tanggal: date('tanggal').notNull(),
  status: varchar('status', { length: 10 }).notNull().default('menunggu'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

// --- Pusat Informasi & Polling ------------------------------------------

export const pengumuman = pgTable('pengumuman', {
  id: serial('id').primaryKey(),
  judul: varchar('judul', { length: 255 }).notNull(),
  isi: text('isi').notNull(),
  tanggal: date('tanggal').notNull(),
  kategori: varchar('kategori', { length: 10 }).notNull().default('umum'), // 'umum' | 'penting' | 'acara'
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

export const polls = pgTable('polls', {
  id: serial('id').primaryKey(),
  pertanyaan: text('pertanyaan').notNull(),
  tanggal: date('tanggal').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
})

export const pollOptions = pgTable('poll_options', {
  id: serial('id').primaryKey(),
  pollId: integer('poll_id')
    .notNull()
    .references(() => polls.id, { onDelete: 'cascade' }),
  teks: varchar('teks', { length: 255 }).notNull(),
  suara: integer('suara').notNull().default(0),
})

// Type exports for use in actions and components
export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert
export type Resident = typeof residents.$inferSelect
export type NewResident = typeof residents.$inferInsert

export type KasIuran = typeof kasIuran.$inferSelect
export type NewKasIuran = typeof kasIuran.$inferInsert
export type SuratPengantar = typeof suratPengantar.$inferSelect
export type NewSuratPengantar = typeof suratPengantar.$inferInsert
export type Pengumuman = typeof pengumuman.$inferSelect
export type NewPengumuman = typeof pengumuman.$inferInsert
export type Poll = typeof polls.$inferSelect
export type NewPoll = typeof polls.$inferInsert
export type PollOption = typeof pollOptions.$inferSelect
