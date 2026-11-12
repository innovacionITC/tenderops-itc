import { describe, expect, it } from "vitest";
import { unzip } from "./entity-template";
import { createMemoryRepository, createMemoryStorage } from "./memory-store";
import { identityHash } from "./pii";
import { createProfessionalService, type PerfilesActor } from "./service";
import { buildImportTemplate, readWorkbook } from "./template-excel";
import type { ResumeSelection } from "./contracts";

const orgA = "11111111-1111-1111-1111-111111111111";
const orgB = "22222222-2222-2222-2222-222222222222";

function actor(organizationId: string, role: PerfilesActor["role"] = "gestor"): PerfilesActor {
  return {
    userId: "user-1",
    email: "gestor@example.test",
    role,
    activeOrganizationId: organizationId,
  };
}

function emptySelection(overrides: Partial<ResumeSelection> = {}): ResumeSelection {
  return {
    includeName: true,
    includeIdentification: false,
    includeProfession: true,
    includeSpecialty: true,
    includeCity: true,
    includeContact: false,
    includeSummary: false,
    educationIds: [],
    experienceIds: [],
    certificationIds: [],
    licenseIds: [],
    attachmentIds: [],
    experienceOrder: "reciente",
    summary: "",
    ...overrides,
  };
}

function setup() {
  const repo = createMemoryRepository();
  const storage = createMemoryStorage();
  const service = createProfessionalService(repo, storage);
  return { repo, storage, service };
}

describe("banco de perfiles", () => {
  it("crea un profesional y lo vuelve a leer", async () => {
    const { service } = setup();
    const saved = await service.save(actor(orgA), {
      givenName: "Ana",
      familyName: "López",
      profession: "Ingeniería de Sistemas",
      documentNumber: "123456",
    });
    const list = await service.list(actor(orgA), {}, 1, 25);
    expect(list.total).toBe(1);
    expect(list.items[0]?.fullName).toBe("Ana López");
    expect(list.items[0]?.documentNumberMasked).toBe("****3456");
    const loaded = await service.get(actor(orgA), saved.id);
    expect(loaded.professional.fullName).toBe("Ana López");
  });

  it("aísla organizaciones", async () => {
    const { service } = setup();
    const saved = await service.save(actor(orgA), { givenName: "Ana", familyName: "López" });
    const listB = await service.list(actor(orgB), {}, 1, 25);
    expect(listB.total).toBe(0);
    await expect(service.get(actor(orgB), saved.id)).rejects.toMatchObject({ status: 404 });
  });

  it("impide a lectura modificar", async () => {
    const { service } = setup();
    await expect(
      service.save(actor(orgA, "lectura"), { givenName: "Ana", familyName: "López" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("importa varios profesionales con estudios y experiencias", async () => {
    const { service } = setup();
    const template = await buildImportTemplate();
    const sheets = await readWorkbook(template);
    expect(sheets.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Profesionales", "Formación", "Experiencias", "Instrucciones"]),
    );
    const result = await service.commitExcel(actor(orgA), template, {}, "actualizar");
    expect(result.stats.created).toBeGreaterThanOrEqual(1);
    const list = await service.list(actor(orgA), { search: "María" }, 1, 25);
    expect(list.total).toBe(1);
    const record = await service.get(actor(orgA), list.items[0]!.id);
    expect(record.education.length).toBeGreaterThanOrEqual(1);
    expect(record.experiences.length).toBeGreaterThanOrEqual(1);
    expect(record.certifications.length).toBeGreaterThanOrEqual(1);
  });

  it("genera un DOCX solo con las experiencias seleccionadas y conserva versiones", async () => {
    const { service, storage } = setup();
    const saved = await service.save(actor(orgA), { givenName: "Ana", familyName: "López", profession: "Ingeniera" });
    await service.saveConsent(actor(orgA), saved.id, { store: true, consult: true, present: true });
    await service.saveExperiences(actor(orgA), saved.id, [
      {
        id: "exp-keep-a",
        externalId: "a",
        client: "Cliente A",
        employer: "Cliente A",
        project: "Proyecto A",
        role: "Arquitecta",
        startedOn: "2018-01-01",
        endedOn: "2019-12-31",
        current: false,
        functions: "Arquitectura",
        activities: [],
        technologies: ["Azure"],
        sector: "",
        projectType: "",
        contractObject: "",
        supportRef: "soporte-a",
        verification: "verificado",
        monthsVerified: 24,
      },
      {
        id: "exp-keep-b",
        externalId: "b",
        client: "Cliente B",
        employer: "Cliente B",
        project: "Proyecto B",
        role: "Líder",
        startedOn: "2019-06-01",
        endedOn: "2021-12-31",
        current: false,
        functions: "Liderazgo",
        activities: [],
        technologies: [".NET"],
        sector: "",
        projectType: "",
        contractObject: "",
        supportRef: "soporte-b",
        verification: "verificado",
        monthsVerified: 31,
      },
      {
        id: "exp-skip",
        externalId: "c",
        client: "Cliente C",
        employer: "Cliente C",
        project: "Proyecto secreto",
        role: "Pasante",
        startedOn: "2015-01-01",
        endedOn: "2015-12-31",
        current: false,
        functions: "No debe aparecer",
        activities: [],
        technologies: [],
        sector: "",
        projectType: "",
        contractObject: "",
        supportRef: null,
        verification: "pendiente",
        monthsVerified: 12,
      },
    ]);
    const generated = await service.generateResume(actor(orgA), {
      professionalId: saved.id,
      proposedRoleName: "Arquitecta de software",
      selection: emptySelection({ experienceIds: ["exp-keep-a", "exp-keep-b"] }),
      format: "corporativo",
    });
    expect(generated.resume.snapshot.experiences).toHaveLength(2);
    expect(generated.resume.snapshot.experiences.map((item) => item.role)).toEqual(["Líder", "Arquitecta"]);
    expect(generated.resume.snapshot.selectedExperienceMonths).toBe(48);
    const file = await service.downloadResume(actor(orgA), saved.id, generated.resume.id);
    const xml = unzip(file.bytes)
      .find((entry) => entry.name === "word/document.xml")
      ?.data.toString("utf8");
    expect(xml).toContain("Arquitecta");
    expect(xml).toContain("Líder");
    expect(xml).not.toContain("Pasante");
    expect(xml).not.toContain("Proyecto secreto");
    expect(storage.files.has(generated.resume.storagePath!)).toBe(true);

    const second = await service.regenerateResume(actor(orgA), saved.id, generated.resume.id);
    const history = await service.get(actor(orgA), saved.id);
    expect(history.generatedResumes).toHaveLength(2);
    expect(second.resume.version).toBe(2);
    expect(history.generatedResumes.some((item) => item.status === "obsoleto")).toBe(true);
  });

  it("exige consentimiento de presentación", async () => {
    const { service } = setup();
    const saved = await service.save(actor(orgA), { givenName: "Ana", familyName: "López" });
    await expect(
      service.generateResume(actor(orgA), {
        professionalId: saved.id,
        proposedRoleName: "Cargo",
        selection: emptySelection(),
        format: "corporativo",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("calcula huella de identidad estable", () => {
    const left = identityHash(orgA, "cc", "123");
    const right = identityHash(orgA, "CC", "123");
    expect(left).toBe(right);
    expect(identityHash(orgB, "CC", "123")).not.toBe(left);
  });

  it("no sobrescribe experiencias ya verificadas al reimportar", async () => {
    const { service } = setup();
    const template = await buildImportTemplate();
    await service.commitExcel(actor(orgA), template, {}, "actualizar");
    const list = await service.list(actor(orgA), { search: "María" }, 1, 25);
    const id = list.items[0]!.id;
    const record = await service.get(actor(orgA), id);
    const verified = record.experiences.map((item) => ({
      ...item,
      verification: "verificado" as const,
      functions: "Funciones verificadas que no deben perderse",
    }));
    await service.saveExperiences(actor(orgA), id, verified);
    await service.commitExcel(actor(orgA), template, {}, "actualizar");
    const reloaded = await service.get(actor(orgA), id);
    expect(reloaded.experiences.some((item) => item.functions === "Funciones verificadas que no deben perderse")).toBe(true);
    expect(reloaded.experiences.filter((item) => item.verification === "verificado").length).toBeGreaterThanOrEqual(1);
  });

  it("busca en persistencia, no solo en la página actual", async () => {
    const { service } = setup();
    await service.save(actor(orgA), { givenName: "Ana", familyName: "López", profession: "Ingeniería" });
    await service.save(actor(orgA), { givenName: "Bruno", familyName: "Díaz", profession: "Arquitectura" });
    const page = await service.list(actor(orgA), { search: "bruno" }, 1, 1);
    expect(page.total).toBe(1);
    expect(page.items[0]?.fullName).toContain("Bruno");
  });
});
