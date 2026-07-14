-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."app_role" AS ENUM('administrador', 'director', 'gestor', 'consultor', 'lectura');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"full_name" text,
	"email" text,
	"avatar_url" text,
	"status" text DEFAULT 'activo' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_key" UNIQUE("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financial_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"category" text,
	"unit" text,
	"description" text,
	"min_threshold" numeric,
	"max_threshold" numeric,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_indicators" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financial_indicator_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"indicator_id" uuid,
	"company_id" uuid,
	"period_type" text,
	"year" integer,
	"month" integer,
	"quarter" integer,
	"value" numeric,
	"source" text,
	"comment" text,
	"status" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_indicator_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_id" uuid,
	"process_id" uuid,
	"requirement_text" text NOT NULL,
	"source_document" text,
	"source_section" text,
	"requirement_type" text,
	"nature" text,
	"responsible_user_id" uuid,
	"due_date" date,
	"status" text DEFAULT 'pendiente',
	"support_document_id" uuid,
	"risk_level" text,
	"ai_observation" text,
	"team_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requirements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"document_type" text,
	"modality" text,
	"template_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crm_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"crm_record_id" text,
	"crm_url" text,
	"status" text DEFAULT 'pendiente',
	"modality" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_opportunities_process_id_key" UNIQUE("process_id")
);
--> statement-breakpoint
ALTER TABLE "crm_opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"process_id" uuid,
	"task_id" uuid,
	"title" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"event_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"requirement_id" uuid,
	"task_id" uuid,
	"user_id" uuid,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"module" text,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integration_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" text NOT NULL,
	"process_id" uuid,
	"error_message" text,
	"status" text DEFAULT 'abierto',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "integration_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secop_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secop_id" text NOT NULL,
	"title" text NOT NULL,
	"entity_name" text,
	"description" text,
	"modality" text,
	"status" text,
	"estimated_value" numeric,
	"publish_date" date,
	"closing_date" timestamp with time zone,
	"sector" text,
	"category" text,
	"location" text,
	"secop_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "secop_processes_secop_id_key" UNIQUE("secop_id")
);
--> statement-breakpoint
ALTER TABLE "secop_processes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sharepoint_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"crm_opportunity_id" uuid,
	"site_url" text,
	"library_name" text,
	"folder_url" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"status" text DEFAULT 'activo'
);
--> statement-breakpoint
ALTER TABLE "sharepoint_repositories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "global_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"followed_by" uuid,
	"followed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"unfollowed_by" uuid,
	"unfollowed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "global_followups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"process_id" uuid,
	"task_id" uuid,
	"title" text NOT NULL,
	"message" text,
	"type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"summary" text,
	"opportunity_level" text,
	"risk_level" text,
	"complexity_level" text,
	"fit_intelecto" text,
	"fit_xrm" text,
	"critical_requirements" jsonb,
	"alerts" jsonb,
	"recommendation" text,
	"justification" text,
	"suggested_modality" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'borrador'
);
--> statement-breakpoint
ALTER TABLE "ai_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"requirement_id" uuid,
	"task_id" uuid,
	"document_type" text,
	"file_name" text,
	"source" text,
	"source_url" text,
	"sharepoint_url" text,
	"drive_item_id" text,
	"status" text,
	"created_by" uuid,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"template_id" uuid,
	"document_name" text,
	"generated_by_ai" boolean DEFAULT true,
	"status" text,
	"sharepoint_url" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"code" text,
	"type" text,
	"nit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge_base_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"title" text NOT NULL,
	"type" text,
	"description" text,
	"document_url" text,
	"tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"status" text DEFAULT 'publicado'
);
--> statement-breakpoint
ALTER TABLE "knowledge_base_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "requirements_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"generated_by_ai" boolean DEFAULT true,
	"status" text DEFAULT 'borrador',
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "requirements_matrix" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenderops_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secop_process_id" uuid,
	"internal_status" text DEFAULT 'detectado' NOT NULL,
	"priority" text DEFAULT 'media',
	"responsible_user_id" uuid,
	"is_relevant" boolean,
	"decision_status" text DEFAULT 'pendiente',
	"participation_modality" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"decision_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tenderops_processes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"crm_opportunity_id" uuid,
	"task_id" uuid,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"visibility" text DEFAULT 'equipo' NOT NULL,
	"status" text DEFAULT 'activa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_key" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_credentials_key_key" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "api_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monitored_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"alias" text,
	"nit" text,
	"department" text,
	"city" text,
	"keywords" text[] DEFAULT '{""}' NOT NULL,
	"unspsc" text[] DEFAULT '{""}' NOT NULL,
	"modalities" text[] DEFAULT '{""}' NOT NULL,
	"min_value" numeric,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_new_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitored_entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secop_watch_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "secop_watch_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secop_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"detected_process_id" uuid,
	"entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_by" uuid[] DEFAULT '{""}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "secop_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_process_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"process_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notify_on_change" boolean DEFAULT true NOT NULL,
	"followed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unfollowed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unfollow_reason" text,
	CONSTRAINT "user_process_followups_user_id_process_id_key" UNIQUE("user_id","process_id")
);
--> statement-breakpoint
ALTER TABLE "user_process_followups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid,
	"requirement_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" uuid,
	"assigned_by" uuid,
	"priority" text DEFAULT 'media',
	"status" text DEFAULT 'pendiente',
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "detected_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secop_id" text NOT NULL,
	"entity_id" uuid,
	"dataset" text DEFAULT 'secop_ii' NOT NULL,
	"title" text,
	"entity_name" text,
	"objeto" text,
	"modalidad" text,
	"estado" text,
	"valor" numeric,
	"fecha_publicacion" timestamp with time zone,
	"fecha_cierre" timestamp with time zone,
	"secop_url" text,
	"is_new" boolean DEFAULT true NOT NULL,
	"promoted_to_followup" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb,
	"discarded" boolean DEFAULT false NOT NULL,
	"discarded_at" timestamp with time zone,
	"discarded_by" uuid,
	"discard_reason" text,
	CONSTRAINT "detected_processes_secop_id_key" UNIQUE("secop_id")
);
--> statement-breakpoint
ALTER TABLE "detected_processes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secop_api_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text DEFAULT 'api.secop.query' NOT NULL,
	"dataset" text NOT NULL,
	"endpoint" text NOT NULL,
	"soql" text NOT NULL,
	"request_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"result" text DEFAULT 'ok' NOT NULL,
	"status" integer,
	"duration_ms" integer,
	"row_count" integer,
	"response_preview" jsonb,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "secop_api_calls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_indicators" ADD CONSTRAINT "financial_indicators_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_indicator_values" ADD CONSTRAINT "financial_indicator_values_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_indicator_values" ADD CONSTRAINT "financial_indicator_values_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_indicator_values" ADD CONSTRAINT "financial_indicator_values_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "public"."financial_indicators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_indicator_values" ADD CONSTRAINT "financial_indicator_values_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_matrix_id_fkey" FOREIGN KEY ("matrix_id") REFERENCES "public"."requirements_matrix"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_errors" ADD CONSTRAINT "integration_errors_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharepoint_repositories" ADD CONSTRAINT "sharepoint_repositories_crm_opportunity_id_fkey" FOREIGN KEY ("crm_opportunity_id") REFERENCES "public"."crm_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharepoint_repositories" ADD CONSTRAINT "sharepoint_repositories_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_followups" ADD CONSTRAINT "global_followups_followed_by_fkey" FOREIGN KEY ("followed_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_followups" ADD CONSTRAINT "global_followups_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_followups" ADD CONSTRAINT "global_followups_unfollowed_by_fkey" FOREIGN KEY ("unfollowed_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_items" ADD CONSTRAINT "knowledge_base_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements_matrix" ADD CONSTRAINT "requirements_matrix_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements_matrix" ADD CONSTRAINT "requirements_matrix_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenderops_processes" ADD CONSTRAINT "tenderops_processes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenderops_processes" ADD CONSTRAINT "tenderops_processes_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenderops_processes" ADD CONSTRAINT "tenderops_processes_secop_process_id_fkey" FOREIGN KEY ("secop_process_id") REFERENCES "public"."secop_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secop_watch_runs" ADD CONSTRAINT "secop_watch_runs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."monitored_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secop_alerts" ADD CONSTRAINT "secop_alerts_detected_process_id_fkey" FOREIGN KEY ("detected_process_id") REFERENCES "public"."detected_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secop_alerts" ADD CONSTRAINT "secop_alerts_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."monitored_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."tenderops_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_processes" ADD CONSTRAINT "detected_processes_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."monitored_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_crm_process" ON "crm_opportunities" USING btree ("process_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_crm_status" ON "crm_opportunities" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_logs" USING btree ("entity_type" text_ops,"entity_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_closing" ON "secop_processes" USING btree ("closing_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_status" ON "secop_processes" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sp_process" ON "sharepoint_repositories" USING btree ("process_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notif_user_unread" ON "notifications" USING btree ("user_id" bool_ops,"is_read" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_topp_responsible" ON "tenderops_processes" USING btree ("responsible_user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_topp_secop" ON "tenderops_processes" USING btree ("secop_process_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_topp_status" ON "tenderops_processes" USING btree ("internal_status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_crm" ON "notes" USING btree ("crm_opportunity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_process" ON "notes" USING btree ("process_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_task" ON "notes" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_user" ON "notes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_upf_active" ON "user_process_followups" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_upf_process" ON "user_process_followups" USING btree ("process_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_upf_user" ON "user_process_followups" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "detected_processes_discarded_idx" ON "detected_processes" USING btree ("discarded" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_detected_entity" ON "detected_processes" USING btree ("entity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_detected_is_new" ON "detected_processes" USING btree ("is_new" bool_ops) WHERE (is_new = true);--> statement-breakpoint
CREATE INDEX "idx_secop_api_calls_action" ON "secop_api_calls" USING btree ("action" text_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_api_calls_created_at" ON "secop_api_calls" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_api_calls_dataset" ON "secop_api_calls" USING btree ("dataset" text_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_api_calls_result" ON "secop_api_calls" USING btree ("result" text_ops);--> statement-breakpoint
CREATE INDEX "idx_secop_api_calls_user" ON "secop_api_calls" USING btree ("user_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE POLICY "profiles admin all" ON "profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "profiles read admin" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles read own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles read privileged" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles update own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "user_roles admin manage" ON "user_roles" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "user_roles read admin" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "user_roles read own" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "fi admin" ON "financial_indicators" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "fi read" ON "financial_indicators" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "fiv admin" ON "financial_indicator_values" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "fiv read" ON "financial_indicator_values" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "req read" ON "requirements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "req write" ON "requirements" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "dtpl admin" ON "document_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "dtpl read" ON "document_templates" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "crm read" ON "crm_opportunities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crm write" ON "crm_opportunities" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "cal own all" ON "calendar_events" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "cal own select" ON "calendar_events" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "comments insert" ON "comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "comments read" ON "comments" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "comments update own" ON "comments" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "audit insert own" ON "audit_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id IS NOT NULL) AND (user_id = auth.uid())));--> statement-breakpoint
CREATE POLICY "audit privileged read" ON "audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "ierr admin" ON "integration_errors" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "secop read auth" ON "secop_processes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "secop write" ON "secop_processes" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "sp read" ON "sharepoint_repositories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "sp write" ON "sharepoint_repositories" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "follow read auth" ON "global_followups" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "follow write" ON "global_followups" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "notif create" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id = auth.uid()) OR has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role])));--> statement-breakpoint
CREATE POLICY "notif own select" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "notif own update" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "aieval read" ON "ai_evaluations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "aieval write" ON "ai_evaluations" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "docs read" ON "documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "docs write" ON "documents" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "gdocs read" ON "generated_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "gdocs write" ON "generated_documents" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "companies admin manage" ON "companies" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "companies read auth" ON "companies" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "orgs admin manage" ON "organizations" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "orgs read auth" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "kb admin" ON "knowledge_base_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "kb read" ON "knowledge_base_items" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "rm read" ON "requirements_matrix" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "rm write" ON "requirements_matrix" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "topp read auth" ON "tenderops_processes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "topp write" ON "tenderops_processes" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "notes own all" ON "notes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "notes team read" ON "notes" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "settings admin write" ON "app_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "settings read" ON "app_settings" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "api_credentials admin all" ON "api_credentials" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "me read auth" ON "monitored_entities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "me write" ON "monitored_entities" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "swr read auth" ON "secop_watch_runs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "sa read auth" ON "secop_alerts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "sa update privileged" ON "secop_alerts" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "upf admin read" ON "user_process_followups" AS PERMISSIVE FOR SELECT TO "authenticated" USING (has_role(auth.uid(), 'administrador'::app_role));--> statement-breakpoint
CREATE POLICY "upf own delete" ON "user_process_followups" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "upf own insert" ON "user_process_followups" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "upf own select" ON "user_process_followups" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "upf own update" ON "user_process_followups" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "upf staff read" ON "user_process_followups" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "tasks manage" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role])) WITH CHECK (has_any_role(auth.uid(), ARRAY['administrador'::app_role, 'director'::app_role, 'gestor'::app_role]));--> statement-breakpoint
CREATE POLICY "tasks own update" ON "tasks" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "tasks read auth" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "dp read auth" ON "detected_processes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "dp update privileged" ON "detected_processes" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Admins and auditors can view all secop api calls" ON "secop_api_calls" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'director'::app_role)));--> statement-breakpoint
CREATE POLICY "Users can view their own secop api calls" ON "secop_api_calls" AS PERMISSIVE FOR SELECT TO "authenticated";
*/