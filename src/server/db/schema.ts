import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTableCreator,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const googleSheetData = createTable("google_sheet_data", {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	processId: integer("process_id")
		.notNull()
		.references(() => processes.id, { onDelete: "cascade" }),
	data: jsonb("data").notNull(),
});

export const googleSheetConfig = createTable("google_sheet_config", {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	processId: integer("process_id")
		.notNull()
		.references(() => processes.id, { onDelete: "cascade" }),
	columnName: text("column_name").notNull(),
	isFilterable: boolean("is_filterable").default(false).notNull(),
	displayOrder: integer("display_order").notNull(),
});

export const activities = createTable("activity", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 256 }).notNull(),
	googleSheetId: d.varchar({ length: 255 }).notNull(),
	createdById: text("created_by_id")
		.notNull()
		.references(() => user.id),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const processes = createTable("process", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 256 }).notNull(),
	activityId: d
		.integer("activity_id")
		.notNull()
		.references(() => activities.id, { onDelete: "cascade" }),
	sheetName: d.varchar({ length: 255 }).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const user = createTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	role: text("role", { enum: ["ADMIN", "MANAGER", "VIEWER"] })
		.default("VIEWER")
		.notNull(),
	area: text("area"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = createTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = createTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = createTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const activityRelations = relations(activities, ({ many, one }) => ({
	processes: many(processes),
	creator: one(user, {
		fields: [activities.createdById],
		references: [user.id],
	}),
}));

export const processRelations = relations(processes, ({ one }) => ({
	activity: one(activities, {
		fields: [processes.activityId],
		references: [activities.id],
	}),
}));
