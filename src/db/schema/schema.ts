import { pgTable, foreignKey, pgPolicy, uuid, text, timestamp, unique, index, jsonb, numeric, date, boolean, varchar, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { usersInAuth as users } from "./auth-users"

export { usersInAuth } from "./auth-users"

export const appRole = pgEnum("app_role", ['administrador', 'director', 'gestor', 'consultor', 'lectura'])


export const perfiles = pgTable("perfiles", {
	id: uuid().primaryKey().notNull(),
	organizacionId: uuid("organizacion_id"),
	nombreCompleto: text("nombre_completo"),
	email: text(),
	urlAvatar: text("url_avatar"),
	estado: text().default('activo').notNull(),
	fechaUltimoLogin: timestamp("fecha_ultimo_login", { withTimezone: true, mode: 'string' }),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("profiles update own", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(id = auth.uid())` }),
	pgPolicy("profiles admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
	pgPolicy("profiles read own", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("profiles read admin", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("profiles read privileged", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const rolesUsuario = pgTable("roles_usuario", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	rol: appRole().notNull(),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_roles_user_id_role_key").on(table.usuarioId, table.rol),
	pgPolicy("user_roles admin manage", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
	pgPolicy("user_roles read own", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("user_roles read admin", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const eventosCalendario = pgTable("eventos_calendario", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	procesoId: uuid("proceso_id"),
	tareaId: uuid("tarea_id"),
	titulo: text().notNull(),
	fechaInicio: timestamp("fecha_inicio", { withTimezone: true, mode: 'string' }).notNull(),
	fechaFin: timestamp("fecha_fin", { withTimezone: true, mode: 'string' }),
	tipoEvento: text("tipo_evento"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.procesoId],
			foreignColumns: [procesos.id],
			name: "calendar_events_process_id_fkey"
		}),
	foreignKey({
			columns: [table.tareaId],
			foreignColumns: [tareas.id],
			name: "calendar_events_task_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [users.id],
			name: "calendar_events_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("cal own select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(usuario_id = auth.uid())` }),
	pgPolicy("cal own all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const registrosAuditoria = pgTable("registros_auditoria", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	accion: text().notNull(),
	modulo: text(),
	tipoEntidad: text("tipo_entidad"),
	entidadId: uuid("entidad_id"),
	metadatos: jsonb(),
	resultado: text(),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_entity").using("btree", table.tipoEntidad.asc().nullsLast().op("text_ops"), table.entidadId.asc().nullsLast().op("text_ops")),
	index("idx_audit_user").using("btree", table.usuarioId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_fkey"
		}),
	pgPolicy("audit insert own", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`((usuario_id IS NOT NULL) AND (usuario_id = auth.uid()))`  }),
	pgPolicy("audit privileged read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const procesosSecop = pgTable("procesos_secop", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secopId: text("secop_id").notNull(),
	titulo: text().notNull(),
	nombreEntidad: text("nombre_entidad"),
	descripcion: text(),
	modalidad: text(),
	estado: text(),
	valorEstimado: numeric("valor_estimado"),
	fechaPublicacion: date("fecha_publicacion"),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }),
	sector: text(),
	categoria: text(),
	ubicacion: text(),
	urlSecop: text("url_secop"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	creadoPor: uuid("creado_por"),
}, (table) => [
	index("idx_secop_closing").using("btree", table.fechaCierre.asc().nullsLast().op("timestamptz_ops")),
	index("idx_secop_status").using("btree", table.estado.asc().nullsLast().op("text_ops")),
	unique("secop_processes_secop_id_key").on(table.secopId),
	pgPolicy("secop read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("secop write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const notificaciones = pgTable("notificaciones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	procesoId: uuid("proceso_id"),
	tareaId: uuid("tarea_id"),
	titulo: text().notNull(),
	mensaje: text(),
	tipo: text(),
	leido: boolean().default(false).notNull(),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notif_user_unread").using("btree", table.usuarioId.asc().nullsLast().op("bool_ops"), table.leido.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.procesoId],
			foreignColumns: [procesos.id],
			name: "notifications_process_id_fkey"
		}),
	foreignKey({
			columns: [table.tareaId],
			foreignColumns: [tareas.id],
			name: "notifications_task_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("notif own select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(usuario_id = auth.uid())` }),
	pgPolicy("notif own update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("notif create", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);

export const evaluacionesIa = pgTable("evaluaciones_ia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	procesoId: uuid("proceso_id").notNull(),
	resumen: text(),
	nivelOportunidad: text("nivel_oportunidad"),
	nivelRiesgo: text("nivel_riesgo"),
	nivelComplejidad: text("nivel_complejidad"),
	fitIntelecto: text("fit_intelecto"),
	fitXrm: text("fit_xrm"),
	requisitosCriticos: jsonb("requisitos_criticos"),
	alertas: jsonb(),
	recomendacion: text(),
	justificacion: text(),
	modalidadSugerida: text("modalidad_sugerida"),
	creadoPor: uuid("creado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	estado: text().default('borrador'),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "ai_evaluations_created_by_fkey"
		}),
	foreignKey({
			columns: [table.procesoId],
			foreignColumns: [procesos.id],
			name: "ai_evaluations_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("aieval read", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("aieval write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const procesos = pgTable("procesos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	procesoSecopId: uuid("proceso_secop_id"),
	estadoInterno: text("estado_interno").default('detectado').notNull(),
	prioridad: text().default('media'),
	usuarioResponsableId: uuid("usuario_responsable_id"),
	esRelevante: boolean("es_relevante"),
	estadoDecision: text("estado_decision").default('pendiente'),
	modalidadParticipacion: text("modalidad_participacion"),
	aprobadoPor: uuid("aprobado_por"),
	fechaAprobacion: timestamp("fecha_aprobacion", { withTimezone: true, mode: 'string' }),
	notasDecision: text("notas_decision"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	creadoPor: uuid("creado_por"),
}, (table) => [
	index("idx_topp_responsible").using("btree", table.usuarioResponsableId.asc().nullsLast().op("uuid_ops")),
	index("idx_topp_secop").using("btree", table.procesoSecopId.asc().nullsLast().op("uuid_ops")),
	index("idx_topp_status").using("btree", table.estadoInterno.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.aprobadoPor],
			foreignColumns: [users.id],
			name: "tenderops_processes_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.usuarioResponsableId],
			foreignColumns: [users.id],
			name: "tenderops_processes_responsible_user_id_fkey"
		}),
	foreignKey({
			columns: [table.procesoSecopId],
			foreignColumns: [procesosSecop.id],
			name: "tenderops_processes_secop_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("topp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("topp write", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const credencialesApi = pgTable("credenciales_api", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clave: text().notNull(),
	valor: text(),
	descripcion: text(),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("api_credentials_key_key").on(table.clave),
	pgPolicy("api_credentials admin all", { as: "permissive", for: "all", to: ["authenticated"], using: sql`has_role(auth.uid(), 'administrador'::app_role)`, withCheck: sql`has_role(auth.uid(), 'administrador'::app_role)`  }),
]);

export const seguimientosProceso = pgTable("seguimientos_proceso", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	procesoId: uuid("proceso_id").notNull(),
	activo: boolean().default(true).notNull(),
	notificarCambios: boolean("notificar_cambios").default(true).notNull(),
	fechaSeguimiento: timestamp("fecha_seguimiento", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaDejarSeguimiento: timestamp("fecha_dejar_seguimiento", { withTimezone: true, mode: 'string' }),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	razonDejarSeguimiento: text("razon_dejar_seguimiento"),
}, (table) => [
	index("idx_upf_active").using("btree", table.activo.asc().nullsLast().op("bool_ops")),
	index("idx_upf_process").using("btree", table.procesoId.asc().nullsLast().op("uuid_ops")),
	index("idx_upf_user").using("btree", table.usuarioId.asc().nullsLast().op("uuid_ops")),
	unique("user_process_followups_user_id_process_id_key").on(table.usuarioId, table.procesoId),
	pgPolicy("upf own select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(usuario_id = auth.uid())` }),
	pgPolicy("upf own insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("upf own update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("upf own delete", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("upf admin read", { as: "permissive", for: "select", to: ["authenticated"] }),
	pgPolicy("upf staff read", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const tareas = pgTable("tareas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	procesoId: uuid("proceso_id"),
	requisitoId: uuid("requisito_id"),
	titulo: text().notNull(),
	descripcion: text(),
	asignadoA: uuid("asignado_a"),
	asignadoPor: uuid("asignado_por"),
	prioridad: text().default('media'),
	estado: text().default('pendiente'),
	fechaVencimiento: timestamp("fecha_vencimiento", { withTimezone: true, mode: 'string' }),
	fechaCompletado: timestamp("fecha_completado", { withTimezone: true, mode: 'string' }),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completadoPor: uuid("completado_por"),
}, (table) => [
	foreignKey({
			columns: [table.asignadoPor],
			foreignColumns: [users.id],
			name: "tasks_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.asignadoA],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_fkey"
		}),
	foreignKey({
			columns: [table.procesoId],
			foreignColumns: [procesos.id],
			name: "tasks_process_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("tasks read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("tasks own update", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("tasks manage", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const procesosDetectados = pgTable("procesos_detectados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	secopId: text("secop_id").notNull(),
	entidadId: uuid("entidad_id"),
	dataset: text().default('secop_ii').notNull(),
	titulo: text(),
	nombreEntidad: text("nombre_entidad"),
	objeto: text(),
	modalidad: text(),
	estado: text(),
	valor: numeric(),
	fechaPublicacion: timestamp("fecha_publicacion", { withTimezone: true, mode: 'string' }),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }),
	urlSecop: text("url_secop"),
	esNuevo: boolean("es_nuevo").default(true).notNull(),
	promovidoASeguimiento: boolean("promovido_a_seguimiento").default(false).notNull(),
	fechaPrimeraDeteccion: timestamp("fecha_primera_deteccion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaUltimaDeteccion: timestamp("fecha_ultima_deteccion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	datosOriginales: jsonb("datos_originales"),
	descartado: boolean().default(false).notNull(),
	fechaDescarte: timestamp("fecha_descarte", { withTimezone: true, mode: 'string' }),
	descartadoPor: uuid("descartado_por"),
	razonDescarte: text("razon_descarte"),
}, (table) => [
	index("detected_processes_discarded_idx").using("btree", table.descartado.asc().nullsLast().op("bool_ops")),
	index("idx_detected_entity").using("btree", table.entidadId.asc().nullsLast().op("uuid_ops")),
	index("idx_detected_is_new").using("btree", table.esNuevo.asc().nullsLast().op("bool_ops")).where(sql`(es_nuevo = true)`),
	unique("detected_processes_secop_id_key").on(table.secopId),
	pgPolicy("dp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("dp update privileged", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const departamentos = pgTable("departamentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: varchar().notNull(),
}, (table) => [
	unique("departamentos_nombre_key").on(table.nombre),
	pgPolicy("dep read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("dep admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const ciudades = pgTable("ciudades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: varchar().notNull(),
	departamentoId: uuid("departamento_id"),
}, (table) => [
	foreignKey({
			columns: [table.departamentoId],
			foreignColumns: [departamentos.id],
			name: "ciudades_departamento_id_fkey"
		}).onDelete("cascade"),
	unique("ciudades_departamento_id_nombre_key").on(table.nombre, table.departamentoId),
	pgPolicy("ciu read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("ciu admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const parametricaParametros = pgTable("parametrica_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	habilitado: boolean().default(true).notNull(),
	datasetSecopI: boolean("dataset_secop_i").default(false).notNull(),
	datasetSecopIi: boolean("dataset_secop_ii").default(true).notNull(),
	diasHaciaAtras: integer("dias_hacia_atras").notNull(),
	intervalosCronMin: integer("intervalos_cron_min").notNull(),
	maxResultadosConsulta: integer("max_resultados_consulta").notNull(),
	valorMinimo: numeric("valor_minimo"),
	valorMaximo: numeric("valor_maximo"),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "parametrica_parametros_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "parametrica_parametros_modificado_por_fkey"
		}).onDelete("set null"),
	pgPolicy("pp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("pp admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const palabrasClave = pgTable("palabras_clave", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	palabraClave: varchar("palabra_clave").notNull(),
	estado: boolean().default(true),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "palabras_clave_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "palabras_clave_modificado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "palabras_clave_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("palabras_clave_parametrica_parametros_id_palabra_clave_key").on(table.parametricaParametrosId, table.palabraClave),
	pgPolicy("pc read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("pc admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const modalidadParametros = pgTable("modalidad_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	modalidadId: uuid("modalidad_id"),
}, (table) => [
	foreignKey({
			columns: [table.modalidadId],
			foreignColumns: [modalidades.id],
			name: "modalidad_parametros_modalidad_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "modalidad_parametros_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("modalidad_parametros_pp_id_modalidad_id_key").on(table.parametricaParametrosId, table.modalidadId),
	pgPolicy("mp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("mp admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const modalidades = pgTable("modalidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	descripcion: varchar(),
	codigo: varchar(),
	estado: boolean().default(true),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "modalidades_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "modalidades_modificado_por_fkey"
		}).onDelete("set null"),
	unique("modalidades_codigo_key").on(table.codigo),
	pgPolicy("mod read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("mod admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const entidadesParametros = pgTable("entidades_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	entidadId: uuid("entidad_id"),
}, (table) => [
	foreignKey({
			columns: [table.entidadId],
			foreignColumns: [entidades.id],
			name: "entidades_parametros_entidad_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "entidades_parametros_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("entidades_parametros_pp_id_entidad_id_key").on(table.parametricaParametrosId, table.entidadId),
	pgPolicy("ep read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("ep admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const entidades = pgTable("entidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: varchar().notNull(),
	estado: boolean().default(true),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "entidades_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "entidades_modificado_por_fkey"
		}).onDelete("set null"),
	unique("entidades_nombre_key").on(table.nombre),
	pgPolicy("ent read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("ent admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const unspscParametros = pgTable("unspsc_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	codigoUnspscId: uuid("codigo_unspsc_id"),
}, (table) => [
	foreignKey({
			columns: [table.codigoUnspscId],
			foreignColumns: [codigosUnspsc.id],
			name: "unspsc_parametros_codigo_unspsc_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "unspsc_parametros_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("unspsc_parametros_pp_id_codigo_unspsc_id_key").on(table.parametricaParametrosId, table.codigoUnspscId),
	pgPolicy("up read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("up admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const codigosUnspsc = pgTable("codigos_unspsc", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar().notNull(),
	descripcion: varchar(),
}, (table) => [
	unique("codigos_unspsc_codigo_key").on(table.codigo),
	pgPolicy("cu read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("cu admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const estadoSecopParametros = pgTable("estado_secop_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	estadoSecopId: uuid("estado_secop_id"),
}, (table) => [
	foreignKey({
			columns: [table.estadoSecopId],
			foreignColumns: [estadosSecop.id],
			name: "estado_secop_parametros_estado_secop_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "estado_secop_parametros_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("estado_secop_parametros_pp_id_estado_secop_id_key").on(table.parametricaParametrosId, table.estadoSecopId),
	pgPolicy("esp read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("esp admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const estadosSecop = pgTable("estados_secop", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: varchar().notNull(),
	estado: boolean().default(true),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "estados_secop_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "estados_secop_modificado_por_fkey"
		}).onDelete("set null"),
	unique("estados_secop_nombre_key").on(table.nombre),
	pgPolicy("es read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("es admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const nits = pgTable("nits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nit: varchar().notNull(),
	descripcion: varchar(),
	estado: boolean().default(true),
	creadoPor: uuid("creado_por"),
	modificadoPor: uuid("modificado_por"),
	fechaCreacion: timestamp("fecha_creacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fechaModificacion: timestamp("fecha_modificacion", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creadoPor],
			foreignColumns: [users.id],
			name: "nits_creado_por_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modificadoPor],
			foreignColumns: [users.id],
			name: "nits_modificado_por_fkey"
		}).onDelete("set null"),
	unique("nits_nit_key").on(table.nit),
	pgPolicy("nit read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("nit admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const nitParametros = pgTable("nit_parametros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	parametricaParametrosId: uuid("parametrica_parametros_id"),
	nitId: uuid("nit_id"),
}, (table) => [
	foreignKey({
			columns: [table.nitId],
			foreignColumns: [nits.id],
			name: "nit_parametros_nit_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parametricaParametrosId],
			foreignColumns: [parametricaParametros.id],
			name: "nit_parametros_parametrica_parametros_id_fkey"
		}).onDelete("cascade"),
	unique("nit_parametros_pp_id_nit_id_key").on(table.parametricaParametrosId, table.nitId),
	pgPolicy("np read auth", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("np admin all", { as: "permissive", for: "all", to: ["authenticated"] }),
]);
