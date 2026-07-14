import { pgTable, foreignKey, pgPolicy, uuid, text, timestamp, unique, numeric, boolean, integer, date, index, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { usersInAuth as users } from "./auth-users"

export { usersInAuth } from "./auth-users"

export const appRole = pgEnum("app_role", ['administrador', 'director', 'gestor', 'consultor', 'lectura'])


export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	organizationId: uuid("organization_id"),
	fullName: text("full_name"),
	email: text(),
	avatarUrl: text("avatar_url"),
	status: text().default('activo').notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "profiles_organization_id_fkey"
		}),
	pgPolicy("profiles admin all", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("profiles read admin", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("profiles read own", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("profiles read privileged", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("profiles update own", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_roles_user_id_role_key").on(table.userId, table.role),
	pgPolicy("user_roles admin manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("user_roles read admin", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("user_roles read own", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const financialIndicators = pgTable("financial_indicators", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	name: text().notNull(),
	category: text(),
	unit: text(),
	description: text(),
	minThreshold: numeric("min_threshold"),
	maxThreshold: numeric("max_threshold"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "financial_indicators_company_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("fi admin", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("fi read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const financialIndicatorValues = pgTable("financial_indicator_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	indicatorId: uuid("indicator_id"),
	companyId: uuid("company_id"),
	periodType: text("period_type"),
	year: integer(),
	month: integer(),
	quarter: integer(),
	value: numeric(),
	source: text(),
	comment: text(),
	status: text(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "financial_indicator_values_company_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "financial_indicator_values_created_by_fkey"
		}),
	foreignKey({
			columns: [table.indicatorId],
			foreignColumns: [financialIndicators.id],
			name: "financial_indicator_values_indicator_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "financial_indicator_values_updated_by_fkey"
		}),
	pgPolicy("fiv admin", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("fiv read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const requirements = pgTable("requirements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matrixId: uuid("matrix_id"),
	processId: uuid("process_id"),
	requirementText: text("requirement_text").notNull(),
	sourceDocument: text("source_document"),
	sourceSection: text("source_section"),
	requirementType: text("requirement_type"),
	nature: text(),
	responsibleUserId: uuid("responsible_user_id"),
	dueDate: date("due_date"),
	status: text().default('pendiente'),
	supportDocumentId: uuid("support_document_id"),
	riskLevel: text("risk_level"),
	aiObservation: text("ai_observation"),
	teamComment: text("team_comment"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.matrixId],
			foreignColumns: [requirementsMatrix.id],
			name: "requirements_matrix_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "requirements_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.responsibleUserId],
			foreignColumns: [users.id],
			name: "requirements_responsible_user_id_fkey"
		}),
	pgPolicy("req read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("req write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const documentTemplates = pgTable("document_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	name: text().notNull(),
	documentType: text("document_type"),
	modality: text(),
	templateUrl: text("template_url"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "document_templates_company_id_fkey"
		}),
	pgPolicy("dtpl admin", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("dtpl read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const crmOpportunities = pgTable("crm_opportunities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id").notNull(),
	crmRecordId: text("crm_record_id"),
	crmUrl: text("crm_url"),
	status: text().default('pendiente'),
	modality: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_crm_process").using("btree", table.processId.asc().nullsLast().op("uuid_ops")),
	index("idx_crm_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "crm_opportunities_created_by_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "crm_opportunities_process_id_fkey"
		}).onDelete("cascade"),
	unique("crm_opportunities_process_id_key").on(table.processId),
	pgPolicy("crm read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("crm write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const calendarEvents = pgTable("calendar_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	processId: uuid("process_id"),
	taskId: uuid("task_id"),
	title: text().notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	eventType: text("event_type"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "calendar_events_process_id_fkey"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "calendar_events_task_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "calendar_events_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("cal own all", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(user_id = auth.uid())`, withCheck: sql`(user_id = auth.uid())`  }),
	pgPolicy("cal own select", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	requirementId: uuid("requirement_id"),
	taskId: uuid("task_id"),
	userId: uuid("user_id"),
	comment: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "comments_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requirementId],
			foreignColumns: [requirements.id],
			name: "comments_requirement_id_fkey"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "comments_task_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey"
		}),
	pgPolicy("comments insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(user_id = auth.uid())`  }),
	pgPolicy("comments read", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("comments update own", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	action: text().notNull(),
	module: text(),
	entityType: text("entity_type"),
	entityId: uuid("entity_id"),
	metadata: jsonb(),
	result: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("idx_audit_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_fkey"
		}),
	pgPolicy("audit insert own", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((user_id IS NOT NULL) AND (user_id = auth.uid()))`  }),
	pgPolicy("audit privileged read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const integrationErrors = pgTable("integration_errors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	serviceName: text("service_name").notNull(),
	processId: uuid("process_id"),
	errorMessage: text("error_message"),
	status: text().default('abierto'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "integration_errors_process_id_fkey"
		}),
	pgPolicy("ierr admin", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
]);

export const secopProcesses = pgTable("secop_processes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secopId: text("secop_id").notNull(),
	title: text().notNull(),
	entityName: text("entity_name"),
	description: text(),
	modality: text(),
	status: text(),
	estimatedValue: numeric("estimated_value"),
	publishDate: date("publish_date"),
	closingDate: timestamp("closing_date", { withTimezone: true, mode: 'string' }),
	sector: text(),
	category: text(),
	location: text(),
	secopUrl: text("secop_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_secop_closing").using("btree", table.closingDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_secop_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("secop_processes_secop_id_key").on(table.secopId),
	pgPolicy("secop read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("secop write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const sharepointRepositories = pgTable("sharepoint_repositories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	crmOpportunityId: uuid("crm_opportunity_id"),
	siteUrl: text("site_url"),
	libraryName: text("library_name"),
	folderUrl: text("folder_url"),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	status: text().default('activo'),
}, (table) => [
	index("idx_sp_process").using("btree", table.processId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.crmOpportunityId],
			foreignColumns: [crmOpportunities.id],
			name: "sharepoint_repositories_crm_opportunity_id_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "sharepoint_repositories_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("sp read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("sp write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const globalFollowups = pgTable("global_followups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id").notNull(),
	followedBy: uuid("followed_by"),
	followedAt: timestamp("followed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	unfollowedBy: uuid("unfollowed_by"),
	unfollowedAt: timestamp("unfollowed_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followedBy],
			foreignColumns: [users.id],
			name: "global_followups_followed_by_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "global_followups_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.unfollowedBy],
			foreignColumns: [users.id],
			name: "global_followups_unfollowed_by_fkey"
		}),
	pgPolicy("follow read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("follow write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	processId: uuid("process_id"),
	taskId: uuid("task_id"),
	title: text().notNull(),
	message: text(),
	type: text(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notif_user_unread").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "notifications_process_id_fkey"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "notifications_task_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("notif create", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((user_id = auth.uid()) OR has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role]))`  }),
	pgPolicy("notif own select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("notif own update", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const aiEvaluations = pgTable("ai_evaluations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id").notNull(),
	summary: text(),
	opportunityLevel: text("opportunity_level"),
	riskLevel: text("risk_level"),
	complexityLevel: text("complexity_level"),
	fitIntelecto: text("fit_intelecto"),
	fitXrm: text("fit_xrm"),
	criticalRequirements: jsonb("critical_requirements"),
	alerts: jsonb(),
	recommendation: text(),
	justification: text(),
	suggestedModality: text("suggested_modality"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: text().default('borrador'),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "ai_evaluations_created_by_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "ai_evaluations_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("aieval read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("aieval write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	requirementId: uuid("requirement_id"),
	taskId: uuid("task_id"),
	documentType: text("document_type"),
	fileName: text("file_name"),
	source: text(),
	sourceUrl: text("source_url"),
	sharepointUrl: text("sharepoint_url"),
	driveItemId: text("drive_item_id"),
	status: text(),
	createdBy: uuid("created_by"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "documents_created_by_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "documents_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requirementId],
			foreignColumns: [requirements.id],
			name: "documents_requirement_id_fkey"
		}),
	pgPolicy("docs read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("docs write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const generatedDocuments = pgTable("generated_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	templateId: uuid("template_id"),
	documentName: text("document_name"),
	generatedByAi: boolean("generated_by_ai").default(true),
	status: text(),
	sharepointUrl: text("sharepoint_url"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "generated_documents_created_by_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "generated_documents_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [documentTemplates.id],
			name: "generated_documents_template_id_fkey"
		}),
	pgPolicy("gdocs read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("gdocs write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id"),
	name: text().notNull(),
	code: text(),
	type: text(),
	nit: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "companies_organization_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("companies admin manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("companies read auth", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	domain: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	pgPolicy("orgs admin manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("orgs read auth", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const knowledgeBaseItems = pgTable("knowledge_base_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	title: text().notNull(),
	type: text(),
	description: text(),
	documentUrl: text("document_url"),
	tags: text().array(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	status: text().default('publicado'),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "knowledge_base_items_company_id_fkey"
		}),
	pgPolicy("kb admin", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("kb read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const requirementsMatrix = pgTable("requirements_matrix", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id").notNull(),
	generatedByAi: boolean("generated_by_ai").default(true),
	status: text().default('borrador'),
	validatedBy: uuid("validated_by"),
	validatedAt: timestamp("validated_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "requirements_matrix_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.validatedBy],
			foreignColumns: [users.id],
			name: "requirements_matrix_validated_by_fkey"
		}),
	pgPolicy("rm read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("rm write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const tenderopsProcesses = pgTable("tenderops_processes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secopProcessId: uuid("secop_process_id"),
	internalStatus: text("internal_status").default('detectado').notNull(),
	priority: text().default('media'),
	responsibleUserId: uuid("responsible_user_id"),
	isRelevant: boolean("is_relevant"),
	decisionStatus: text("decision_status").default('pendiente'),
	participationModality: text("participation_modality"),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	decisionNotes: text("decision_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_topp_responsible").using("btree", table.responsibleUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_topp_secop").using("btree", table.secopProcessId.asc().nullsLast().op("uuid_ops")),
	index("idx_topp_status").using("btree", table.internalStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "tenderops_processes_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.responsibleUserId],
			foreignColumns: [users.id],
			name: "tenderops_processes_responsible_user_id_fkey"
		}),
	foreignKey({
			columns: [table.secopProcessId],
			foreignColumns: [secopProcesses.id],
			name: "tenderops_processes_secop_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("topp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("topp write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const notes = pgTable("notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	crmOpportunityId: uuid("crm_opportunity_id"),
	taskId: uuid("task_id"),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	visibility: text().default('equipo').notNull(),
	status: text().default('activa').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notes_crm").using("btree", table.crmOpportunityId.asc().nullsLast().op("uuid_ops")),
	index("idx_notes_process").using("btree", table.processId.asc().nullsLast().op("uuid_ops")),
	index("idx_notes_task").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("idx_notes_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	pgPolicy("notes own all", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(user_id = auth.uid())`, withCheck: sql`(user_id = auth.uid())`  }),
	pgPolicy("notes team read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const appSettings = pgTable("app_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: text().notNull(),
	value: jsonb(),
	description: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("app_settings_key_key").on(table.key),
	pgPolicy("settings admin write", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("settings read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const apiCredentials = pgTable("api_credentials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: text().notNull(),
	value: text(),
	description: text(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("api_credentials_key_key").on(table.key),
	pgPolicy("api_credentials admin all", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
]);

export const monitoredEntities = pgTable("monitored_entities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	alias: text(),
	nit: text(),
	department: text(),
	city: text(),
	keywords: text().array().default([""]).notNull(),
	unspsc: text().array().default([""]).notNull(),
	modalities: text().array().default([""]).notNull(),
	minValue: numeric("min_value"),
	isActive: boolean("is_active").default(true).notNull(),
	lastRunAt: timestamp("last_run_at", { withTimezone: true, mode: 'string' }),
	lastNewCount: integer("last_new_count").default(0).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("me read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("me write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const secopWatchRuns = pgTable("secop_watch_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	status: text().default('running').notNull(),
	newCount: integer("new_count").default(0).notNull(),
	updatedCount: integer("updated_count").default(0).notNull(),
	errorMessage: text("error_message"),
}, (table) => [
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [monitoredEntities.id],
			name: "secop_watch_runs_entity_id_fkey"
		}).onDelete("set null"),
	pgPolicy("swr read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const secopAlerts = pgTable("secop_alerts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	detectedProcessId: uuid("detected_process_id"),
	entityId: uuid("entity_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	readBy: uuid("read_by").array().default([""]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.detectedProcessId],
			foreignColumns: [detectedProcesses.id],
			name: "secop_alerts_detected_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [monitoredEntities.id],
			name: "secop_alerts_entity_id_fkey"
		}).onDelete("set null"),
	pgPolicy("sa read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("sa update privileged", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const userProcessFollowups = pgTable("user_process_followups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	processId: uuid("process_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	notifyOnChange: boolean("notify_on_change").default(true).notNull(),
	followedAt: timestamp("followed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	unfollowedAt: timestamp("unfollowed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	unfollowReason: text("unfollow_reason"),
}, (table) => [
	index("idx_upf_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_upf_process").using("btree", table.processId.asc().nullsLast().op("uuid_ops")),
	index("idx_upf_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("user_process_followups_user_id_process_id_key").on(table.userId, table.processId),
	pgPolicy("upf admin read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)` }),
	pgPolicy("upf own delete", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("upf own insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("upf own select", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("upf own update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("upf staff read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	processId: uuid("process_id"),
	requirementId: uuid("requirement_id"),
	title: text().notNull(),
	description: text(),
	assignedTo: uuid("assigned_to"),
	assignedBy: uuid("assigned_by"),
	priority: text().default('media'),
	status: text().default('pendiente'),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedBy: uuid("completed_by"),
}, (table) => [
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "tasks_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_fkey"
		}),
	foreignKey({
			columns: [table.processId],
			foreignColumns: [tenderopsProcesses.id],
			name: "tasks_process_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requirementId],
			foreignColumns: [requirements.id],
			name: "tasks_requirement_id_fkey"
		}),
	pgPolicy("tasks manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role])`, withCheck: sql`has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role])`  }),
	pgPolicy("tasks own update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("tasks read auth", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const detectedProcesses = pgTable("detected_processes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secopId: text("secop_id").notNull(),
	entityId: uuid("entity_id"),
	dataset: text().default('secop_ii').notNull(),
	title: text(),
	entityName: text("entity_name"),
	objeto: text(),
	modalidad: text(),
	estado: text(),
	valor: numeric(),
	fechaPublicacion: timestamp("fecha_publicacion", { withTimezone: true, mode: 'string' }),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }),
	secopUrl: text("secop_url"),
	isNew: boolean("is_new").default(true).notNull(),
	promotedToFollowup: boolean("promoted_to_followup").default(false).notNull(),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	raw: jsonb(),
	discarded: boolean().default(false).notNull(),
	discardedAt: timestamp("discarded_at", { withTimezone: true, mode: 'string' }),
	discardedBy: uuid("discarded_by"),
	discardReason: text("discard_reason"),
}, (table) => [
	index("detected_processes_discarded_idx").using("btree", table.discarded.asc().nullsLast().op("bool_ops")),
	index("idx_detected_entity").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_detected_is_new").using("btree", table.isNew.asc().nullsLast().op("bool_ops")).where(sql`(is_new = true)`),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [monitoredEntities.id],
			name: "detected_processes_entity_id_fkey"
		}).onDelete("set null"),
	unique("detected_processes_secop_id_key").on(table.secopId),
	pgPolicy("dp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("dp update privileged", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const secopApiCalls = pgTable("secop_api_calls", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: text().default('api.secop.query').notNull(),
	dataset: text().notNull(),
	endpoint: text().notNull(),
	soql: text().notNull(),
	requestParams: jsonb("request_params").default({}).notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	result: text().default('ok').notNull(),
	status: integer(),
	durationMs: integer("duration_ms"),
	rowCount: integer("row_count"),
	responsePreview: jsonb("response_preview"),
	errorMessage: text("error_message"),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_secop_api_calls_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_secop_api_calls_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_secop_api_calls_dataset").using("btree", table.dataset.asc().nullsLast().op("text_ops")),
	index("idx_secop_api_calls_result").using("btree", table.result.asc().nullsLast().op("text_ops")),
	index("idx_secop_api_calls_user").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	pgPolicy("Admins and auditors can view all secop api calls", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'director'::app_role))` }),
	pgPolicy("Users can view their own secop api calls", { as: "permissive", for: "select", to: ["authenticated"] }),
]);
