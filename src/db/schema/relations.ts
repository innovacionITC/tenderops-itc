import { relations } from "drizzle-orm/relations";
import { usersInAuth, perfiles, rolesUsuario, procesos, eventosCalendario, tareas, registrosAuditoria, notificaciones, evaluacionesIa, procesosSecop, departamentos, ciudades, parametricaParametros, palabrasClave, modalidades, modalidadParametros, entidades, entidadesParametros, codigosUnspsc, unspscParametros, estadosSecop, estadoSecopParametros } from "./schema";

export const perfilesRelations = relations(perfiles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [perfiles.id],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	perfiles: many(perfiles),
	rolesUsuarios: many(rolesUsuario),
	eventosCalendarios: many(eventosCalendario),
	registrosAuditorias: many(registrosAuditoria),
	notificaciones: many(notificaciones),
	evaluacionesIas: many(evaluacionesIa),
	procesos_aprobadoPor: many(procesos, {
		relationName: "procesos_aprobadoPor_usersInAuth_id"
	}),
	procesos_usuarioResponsableId: many(procesos, {
		relationName: "procesos_usuarioResponsableId_usersInAuth_id"
	}),
	tareas_asignadoPor: many(tareas, {
		relationName: "tareas_asignadoPor_usersInAuth_id"
	}),
	tareas_asignadoA: many(tareas, {
		relationName: "tareas_asignadoA_usersInAuth_id"
	}),
	parametricaParametros_creadoPor: many(parametricaParametros, {
		relationName: "parametricaParametros_creadoPor_usersInAuth_id"
	}),
	parametricaParametros_modificadoPor: many(parametricaParametros, {
		relationName: "parametricaParametros_modificadoPor_usersInAuth_id"
	}),
	palabrasClaves_creadoPor: many(palabrasClave, {
		relationName: "palabrasClave_creadoPor_usersInAuth_id"
	}),
	palabrasClaves_modificadoPor: many(palabrasClave, {
		relationName: "palabrasClave_modificadoPor_usersInAuth_id"
	}),
	modalidades_creadoPor: many(modalidades, {
		relationName: "modalidades_creadoPor_usersInAuth_id"
	}),
	modalidades_modificadoPor: many(modalidades, {
		relationName: "modalidades_modificadoPor_usersInAuth_id"
	}),
	entidades_creadoPor: many(entidades, {
		relationName: "entidades_creadoPor_usersInAuth_id"
	}),
	entidades_modificadoPor: many(entidades, {
		relationName: "entidades_modificadoPor_usersInAuth_id"
	}),
	estadosSecops_creadoPor: many(estadosSecop, {
		relationName: "estadosSecop_creadoPor_usersInAuth_id"
	}),
	estadosSecops_modificadoPor: many(estadosSecop, {
		relationName: "estadosSecop_modificadoPor_usersInAuth_id"
	}),
}));

export const rolesUsuarioRelations = relations(rolesUsuario, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [rolesUsuario.usuarioId],
		references: [usersInAuth.id]
	}),
}));

export const eventosCalendarioRelations = relations(eventosCalendario, ({one}) => ({
	proceso: one(procesos, {
		fields: [eventosCalendario.procesoId],
		references: [procesos.id]
	}),
	tarea: one(tareas, {
		fields: [eventosCalendario.tareaId],
		references: [tareas.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [eventosCalendario.usuarioId],
		references: [usersInAuth.id]
	}),
}));

export const procesosRelations = relations(procesos, ({one, many}) => ({
	eventosCalendarios: many(eventosCalendario),
	notificaciones: many(notificaciones),
	evaluacionesIas: many(evaluacionesIa),
	usersInAuth_aprobadoPor: one(usersInAuth, {
		fields: [procesos.aprobadoPor],
		references: [usersInAuth.id],
		relationName: "procesos_aprobadoPor_usersInAuth_id"
	}),
	usersInAuth_usuarioResponsableId: one(usersInAuth, {
		fields: [procesos.usuarioResponsableId],
		references: [usersInAuth.id],
		relationName: "procesos_usuarioResponsableId_usersInAuth_id"
	}),
	procesosSecop: one(procesosSecop, {
		fields: [procesos.procesoSecopId],
		references: [procesosSecop.id]
	}),
	tareas: many(tareas),
}));

export const tareasRelations = relations(tareas, ({one, many}) => ({
	eventosCalendarios: many(eventosCalendario),
	notificaciones: many(notificaciones),
	usersInAuth_asignadoPor: one(usersInAuth, {
		fields: [tareas.asignadoPor],
		references: [usersInAuth.id],
		relationName: "tareas_asignadoPor_usersInAuth_id"
	}),
	usersInAuth_asignadoA: one(usersInAuth, {
		fields: [tareas.asignadoA],
		references: [usersInAuth.id],
		relationName: "tareas_asignadoA_usersInAuth_id"
	}),
	proceso: one(procesos, {
		fields: [tareas.procesoId],
		references: [procesos.id]
	}),
}));

export const registrosAuditoriaRelations = relations(registrosAuditoria, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [registrosAuditoria.usuarioId],
		references: [usersInAuth.id]
	}),
}));

export const notificacionesRelations = relations(notificaciones, ({one}) => ({
	proceso: one(procesos, {
		fields: [notificaciones.procesoId],
		references: [procesos.id]
	}),
	tarea: one(tareas, {
		fields: [notificaciones.tareaId],
		references: [tareas.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [notificaciones.usuarioId],
		references: [usersInAuth.id]
	}),
}));

export const evaluacionesIaRelations = relations(evaluacionesIa, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [evaluacionesIa.creadoPor],
		references: [usersInAuth.id]
	}),
	proceso: one(procesos, {
		fields: [evaluacionesIa.procesoId],
		references: [procesos.id]
	}),
}));

export const procesosSecopRelations = relations(procesosSecop, ({many}) => ({
	procesos: many(procesos),
}));

export const ciudadesRelations = relations(ciudades, ({one}) => ({
	departamento: one(departamentos, {
		fields: [ciudades.departamentoId],
		references: [departamentos.id]
	}),
}));

export const departamentosRelations = relations(departamentos, ({many}) => ({
	ciudades: many(ciudades),
}));

export const parametricaParametrosRelations = relations(parametricaParametros, ({one, many}) => ({
	usersInAuth_creadoPor: one(usersInAuth, {
		fields: [parametricaParametros.creadoPor],
		references: [usersInAuth.id],
		relationName: "parametricaParametros_creadoPor_usersInAuth_id"
	}),
	usersInAuth_modificadoPor: one(usersInAuth, {
		fields: [parametricaParametros.modificadoPor],
		references: [usersInAuth.id],
		relationName: "parametricaParametros_modificadoPor_usersInAuth_id"
	}),
	palabrasClaves: many(palabrasClave),
	modalidadParametros: many(modalidadParametros),
	entidadesParametros: many(entidadesParametros),
	unspscParametros: many(unspscParametros),
	estadoSecopParametros: many(estadoSecopParametros),
}));

export const palabrasClaveRelations = relations(palabrasClave, ({one}) => ({
	usersInAuth_creadoPor: one(usersInAuth, {
		fields: [palabrasClave.creadoPor],
		references: [usersInAuth.id],
		relationName: "palabrasClave_creadoPor_usersInAuth_id"
	}),
	usersInAuth_modificadoPor: one(usersInAuth, {
		fields: [palabrasClave.modificadoPor],
		references: [usersInAuth.id],
		relationName: "palabrasClave_modificadoPor_usersInAuth_id"
	}),
	parametricaParametro: one(parametricaParametros, {
		fields: [palabrasClave.parametricaParametrosId],
		references: [parametricaParametros.id]
	}),
}));

export const modalidadParametrosRelations = relations(modalidadParametros, ({one}) => ({
	modalidade: one(modalidades, {
		fields: [modalidadParametros.modalidadId],
		references: [modalidades.id]
	}),
	parametricaParametro: one(parametricaParametros, {
		fields: [modalidadParametros.parametricaParametrosId],
		references: [parametricaParametros.id]
	}),
}));

export const modalidadesRelations = relations(modalidades, ({one, many}) => ({
	modalidadParametros: many(modalidadParametros),
	usersInAuth_creadoPor: one(usersInAuth, {
		fields: [modalidades.creadoPor],
		references: [usersInAuth.id],
		relationName: "modalidades_creadoPor_usersInAuth_id"
	}),
	usersInAuth_modificadoPor: one(usersInAuth, {
		fields: [modalidades.modificadoPor],
		references: [usersInAuth.id],
		relationName: "modalidades_modificadoPor_usersInAuth_id"
	}),
}));

export const entidadesParametrosRelations = relations(entidadesParametros, ({one}) => ({
	entidade: one(entidades, {
		fields: [entidadesParametros.entidadId],
		references: [entidades.id]
	}),
	parametricaParametro: one(parametricaParametros, {
		fields: [entidadesParametros.parametricaParametrosId],
		references: [parametricaParametros.id]
	}),
}));

export const entidadesRelations = relations(entidades, ({one, many}) => ({
	entidadesParametros: many(entidadesParametros),
	usersInAuth_creadoPor: one(usersInAuth, {
		fields: [entidades.creadoPor],
		references: [usersInAuth.id],
		relationName: "entidades_creadoPor_usersInAuth_id"
	}),
	usersInAuth_modificadoPor: one(usersInAuth, {
		fields: [entidades.modificadoPor],
		references: [usersInAuth.id],
		relationName: "entidades_modificadoPor_usersInAuth_id"
	}),
}));

export const unspscParametrosRelations = relations(unspscParametros, ({one}) => ({
	codigosUnspsc: one(codigosUnspsc, {
		fields: [unspscParametros.codigoUnspscId],
		references: [codigosUnspsc.id]
	}),
	parametricaParametro: one(parametricaParametros, {
		fields: [unspscParametros.parametricaParametrosId],
		references: [parametricaParametros.id]
	}),
}));

export const codigosUnspscRelations = relations(codigosUnspsc, ({many}) => ({
	unspscParametros: many(unspscParametros),
}));

export const estadoSecopParametrosRelations = relations(estadoSecopParametros, ({one}) => ({
	estadosSecop: one(estadosSecop, {
		fields: [estadoSecopParametros.estadoSecopId],
		references: [estadosSecop.id]
	}),
	parametricaParametro: one(parametricaParametros, {
		fields: [estadoSecopParametros.parametricaParametrosId],
		references: [parametricaParametros.id]
	}),
}));

export const estadosSecopRelations = relations(estadosSecop, ({one, many}) => ({
	estadoSecopParametros: many(estadoSecopParametros),
	usersInAuth_creadoPor: one(usersInAuth, {
		fields: [estadosSecop.creadoPor],
		references: [usersInAuth.id],
		relationName: "estadosSecop_creadoPor_usersInAuth_id"
	}),
	usersInAuth_modificadoPor: one(usersInAuth, {
		fields: [estadosSecop.modificadoPor],
		references: [usersInAuth.id],
		relationName: "estadosSecop_modificadoPor_usersInAuth_id"
	}),
}));