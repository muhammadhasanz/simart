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
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
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
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  entryDate: date('entry_date').defaultNow(),
  exitDate: date('exit_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Type exports for use in actions and components
export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert
export type Resident = typeof residents.$inferSelect
export type NewResident = typeof residents.$inferInsert
