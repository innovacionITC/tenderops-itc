import { relations } from "drizzle-orm/relations";
import { usersInAuth, profiles, organizations, userRoles, companies, financialIndicators, financialIndicatorValues, requirementsMatrix, requirements, tenderopsProcesses, documentTemplates, crmOpportunities, calendarEvents, tasks, comments, auditLogs, integrationErrors, sharepointRepositories, globalFollowups, notifications, aiEvaluations, documents, generatedDocuments, knowledgeBaseItems, secopProcesses, monitoredEntities, secopWatchRuns, detectedProcesses, secopAlerts } from "./schema";

export const profilesRelations = relations(profiles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id]
	}),
	organization: one(organizations, {
		fields: [profiles.organizationId],
		references: [organizations.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	profiles: many(profiles),
	userRoles: many(userRoles),
	financialIndicatorValues_createdBy: many(financialIndicatorValues, {
		relationName: "financialIndicatorValues_createdBy_usersInAuth_id"
	}),
	financialIndicatorValues_updatedBy: many(financialIndicatorValues, {
		relationName: "financialIndicatorValues_updatedBy_usersInAuth_id"
	}),
	requirements: many(requirements),
	crmOpportunities: many(crmOpportunities),
	calendarEvents: many(calendarEvents),
	comments: many(comments),
	auditLogs: many(auditLogs),
	globalFollowups_followedBy: many(globalFollowups, {
		relationName: "globalFollowups_followedBy_usersInAuth_id"
	}),
	globalFollowups_unfollowedBy: many(globalFollowups, {
		relationName: "globalFollowups_unfollowedBy_usersInAuth_id"
	}),
	notifications: many(notifications),
	aiEvaluations: many(aiEvaluations),
	documents: many(documents),
	generatedDocuments: many(generatedDocuments),
	requirementsMatrices: many(requirementsMatrix),
	tenderopsProcesses_approvedBy: many(tenderopsProcesses, {
		relationName: "tenderopsProcesses_approvedBy_usersInAuth_id"
	}),
	tenderopsProcesses_responsibleUserId: many(tenderopsProcesses, {
		relationName: "tenderopsProcesses_responsibleUserId_usersInAuth_id"
	}),
	tasks_assignedBy: many(tasks, {
		relationName: "tasks_assignedBy_usersInAuth_id"
	}),
	tasks_assignedTo: many(tasks, {
		relationName: "tasks_assignedTo_usersInAuth_id"
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	profiles: many(profiles),
	companies: many(companies),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userRoles.userId],
		references: [usersInAuth.id]
	}),
}));

export const financialIndicatorsRelations = relations(financialIndicators, ({one, many}) => ({
	company: one(companies, {
		fields: [financialIndicators.companyId],
		references: [companies.id]
	}),
	financialIndicatorValues: many(financialIndicatorValues),
}));

export const companiesRelations = relations(companies, ({one, many}) => ({
	financialIndicators: many(financialIndicators),
	financialIndicatorValues: many(financialIndicatorValues),
	documentTemplates: many(documentTemplates),
	organization: one(organizations, {
		fields: [companies.organizationId],
		references: [organizations.id]
	}),
	knowledgeBaseItems: many(knowledgeBaseItems),
}));

export const financialIndicatorValuesRelations = relations(financialIndicatorValues, ({one}) => ({
	company: one(companies, {
		fields: [financialIndicatorValues.companyId],
		references: [companies.id]
	}),
	usersInAuth_createdBy: one(usersInAuth, {
		fields: [financialIndicatorValues.createdBy],
		references: [usersInAuth.id],
		relationName: "financialIndicatorValues_createdBy_usersInAuth_id"
	}),
	financialIndicator: one(financialIndicators, {
		fields: [financialIndicatorValues.indicatorId],
		references: [financialIndicators.id]
	}),
	usersInAuth_updatedBy: one(usersInAuth, {
		fields: [financialIndicatorValues.updatedBy],
		references: [usersInAuth.id],
		relationName: "financialIndicatorValues_updatedBy_usersInAuth_id"
	}),
}));

export const requirementsRelations = relations(requirements, ({one, many}) => ({
	requirementsMatrix: one(requirementsMatrix, {
		fields: [requirements.matrixId],
		references: [requirementsMatrix.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [requirements.processId],
		references: [tenderopsProcesses.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [requirements.responsibleUserId],
		references: [usersInAuth.id]
	}),
	comments: many(comments),
	documents: many(documents),
	tasks: many(tasks),
}));

export const requirementsMatrixRelations = relations(requirementsMatrix, ({one, many}) => ({
	requirements: many(requirements),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [requirementsMatrix.processId],
		references: [tenderopsProcesses.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [requirementsMatrix.validatedBy],
		references: [usersInAuth.id]
	}),
}));

export const tenderopsProcessesRelations = relations(tenderopsProcesses, ({one, many}) => ({
	requirements: many(requirements),
	crmOpportunities: many(crmOpportunities),
	calendarEvents: many(calendarEvents),
	comments: many(comments),
	integrationErrors: many(integrationErrors),
	sharepointRepositories: many(sharepointRepositories),
	globalFollowups: many(globalFollowups),
	notifications: many(notifications),
	aiEvaluations: many(aiEvaluations),
	documents: many(documents),
	generatedDocuments: many(generatedDocuments),
	requirementsMatrices: many(requirementsMatrix),
	usersInAuth_approvedBy: one(usersInAuth, {
		fields: [tenderopsProcesses.approvedBy],
		references: [usersInAuth.id],
		relationName: "tenderopsProcesses_approvedBy_usersInAuth_id"
	}),
	usersInAuth_responsibleUserId: one(usersInAuth, {
		fields: [tenderopsProcesses.responsibleUserId],
		references: [usersInAuth.id],
		relationName: "tenderopsProcesses_responsibleUserId_usersInAuth_id"
	}),
	secopProcess: one(secopProcesses, {
		fields: [tenderopsProcesses.secopProcessId],
		references: [secopProcesses.id]
	}),
	tasks: many(tasks),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({one, many}) => ({
	company: one(companies, {
		fields: [documentTemplates.companyId],
		references: [companies.id]
	}),
	generatedDocuments: many(generatedDocuments),
}));

export const crmOpportunitiesRelations = relations(crmOpportunities, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [crmOpportunities.createdBy],
		references: [usersInAuth.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [crmOpportunities.processId],
		references: [tenderopsProcesses.id]
	}),
	sharepointRepositories: many(sharepointRepositories),
}));

export const calendarEventsRelations = relations(calendarEvents, ({one}) => ({
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [calendarEvents.processId],
		references: [tenderopsProcesses.id]
	}),
	task: one(tasks, {
		fields: [calendarEvents.taskId],
		references: [tasks.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [calendarEvents.userId],
		references: [usersInAuth.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	calendarEvents: many(calendarEvents),
	comments: many(comments),
	notifications: many(notifications),
	usersInAuth_assignedBy: one(usersInAuth, {
		fields: [tasks.assignedBy],
		references: [usersInAuth.id],
		relationName: "tasks_assignedBy_usersInAuth_id"
	}),
	usersInAuth_assignedTo: one(usersInAuth, {
		fields: [tasks.assignedTo],
		references: [usersInAuth.id],
		relationName: "tasks_assignedTo_usersInAuth_id"
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [tasks.processId],
		references: [tenderopsProcesses.id]
	}),
	requirement: one(requirements, {
		fields: [tasks.requirementId],
		references: [requirements.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [comments.processId],
		references: [tenderopsProcesses.id]
	}),
	requirement: one(requirements, {
		fields: [comments.requirementId],
		references: [requirements.id]
	}),
	task: one(tasks, {
		fields: [comments.taskId],
		references: [tasks.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [comments.userId],
		references: [usersInAuth.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [auditLogs.userId],
		references: [usersInAuth.id]
	}),
}));

export const integrationErrorsRelations = relations(integrationErrors, ({one}) => ({
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [integrationErrors.processId],
		references: [tenderopsProcesses.id]
	}),
}));

export const sharepointRepositoriesRelations = relations(sharepointRepositories, ({one}) => ({
	crmOpportunity: one(crmOpportunities, {
		fields: [sharepointRepositories.crmOpportunityId],
		references: [crmOpportunities.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [sharepointRepositories.processId],
		references: [tenderopsProcesses.id]
	}),
}));

export const globalFollowupsRelations = relations(globalFollowups, ({one}) => ({
	usersInAuth_followedBy: one(usersInAuth, {
		fields: [globalFollowups.followedBy],
		references: [usersInAuth.id],
		relationName: "globalFollowups_followedBy_usersInAuth_id"
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [globalFollowups.processId],
		references: [tenderopsProcesses.id]
	}),
	usersInAuth_unfollowedBy: one(usersInAuth, {
		fields: [globalFollowups.unfollowedBy],
		references: [usersInAuth.id],
		relationName: "globalFollowups_unfollowedBy_usersInAuth_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [notifications.processId],
		references: [tenderopsProcesses.id]
	}),
	task: one(tasks, {
		fields: [notifications.taskId],
		references: [tasks.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [notifications.userId],
		references: [usersInAuth.id]
	}),
}));

export const aiEvaluationsRelations = relations(aiEvaluations, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [aiEvaluations.createdBy],
		references: [usersInAuth.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [aiEvaluations.processId],
		references: [tenderopsProcesses.id]
	}),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [documents.createdBy],
		references: [usersInAuth.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [documents.processId],
		references: [tenderopsProcesses.id]
	}),
	requirement: one(requirements, {
		fields: [documents.requirementId],
		references: [requirements.id]
	}),
}));

export const generatedDocumentsRelations = relations(generatedDocuments, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [generatedDocuments.createdBy],
		references: [usersInAuth.id]
	}),
	tenderopsProcess: one(tenderopsProcesses, {
		fields: [generatedDocuments.processId],
		references: [tenderopsProcesses.id]
	}),
	documentTemplate: one(documentTemplates, {
		fields: [generatedDocuments.templateId],
		references: [documentTemplates.id]
	}),
}));

export const knowledgeBaseItemsRelations = relations(knowledgeBaseItems, ({one}) => ({
	company: one(companies, {
		fields: [knowledgeBaseItems.companyId],
		references: [companies.id]
	}),
}));

export const secopProcessesRelations = relations(secopProcesses, ({many}) => ({
	tenderopsProcesses: many(tenderopsProcesses),
}));

export const secopWatchRunsRelations = relations(secopWatchRuns, ({one}) => ({
	monitoredEntity: one(monitoredEntities, {
		fields: [secopWatchRuns.entityId],
		references: [monitoredEntities.id]
	}),
}));

export const monitoredEntitiesRelations = relations(monitoredEntities, ({many}) => ({
	secopWatchRuns: many(secopWatchRuns),
	secopAlerts: many(secopAlerts),
	detectedProcesses: many(detectedProcesses),
}));

export const secopAlertsRelations = relations(secopAlerts, ({one}) => ({
	detectedProcess: one(detectedProcesses, {
		fields: [secopAlerts.detectedProcessId],
		references: [detectedProcesses.id]
	}),
	monitoredEntity: one(monitoredEntities, {
		fields: [secopAlerts.entityId],
		references: [monitoredEntities.id]
	}),
}));

export const detectedProcessesRelations = relations(detectedProcesses, ({one, many}) => ({
	secopAlerts: many(secopAlerts),
	monitoredEntity: one(monitoredEntities, {
		fields: [detectedProcesses.entityId],
		references: [monitoredEntities.id]
	}),
}));