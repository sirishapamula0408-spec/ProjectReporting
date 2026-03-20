import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { type AuthUser, canAccessProject, getProjectScope } from '../../shared/dataScope.js';
import { logger } from '../../config/logger.js';

// TODO: Import Aspose.PDF and Aspose.Cells when licenses are available
// import * as AsposePdf from 'aspose.pdf';
// import * as AsposeCells from 'aspose.cells';

async function getProjectOrThrow(projectId: number, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      name: true,
      client: true,
      contractValue: true,
      startDate: true,
      endDate: true,
      status: true,
      businessUnit: true,
      managerId: true,
      manager: { select: { displayName: true } },
    },
  });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');
  if (!canAccessProject(user, project)) throw new AppError(403, 'FORBIDDEN', 'Access denied');
  return project;
}

/**
 * Generate a project PDF report (stub).
 * TODO: Replace with Aspose.PDF generation when license is configured.
 */
export async function generateProjectPdf(projectId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);

  logger.warn('Aspose.PDF is not configured — generating placeholder PDF for project %s', project.code);

  // Stub: generate a simple text-based placeholder
  const content = [
    `PROJECT REPORT — ${project.code}`,
    `========================================`,
    `Name: ${project.name}`,
    `Client: ${project.client}`,
    `Manager: ${project.manager.displayName}`,
    `Status: ${project.status}`,
    `Business Unit: ${project.businessUnit}`,
    `Contract Value: ${project.contractValue.toString()}`,
    `Start Date: ${project.startDate.toISOString().split('T')[0]}`,
    `End Date: ${project.endDate.toISOString().split('T')[0]}`,
    ``,
    `[This is a stub report. Aspose.PDF integration pending.]`,
  ].join('\n');

  const buffer = Buffer.from(content, 'utf-8');

  return {
    buffer,
    filename: `project-${project.code}-report.pdf`,
    contentType: 'application/pdf',
  };
}

/**
 * Generate a project Excel report (stub).
 * TODO: Replace with Aspose.Cells generation when license is configured.
 */
export async function generateProjectExcel(projectId: number, user: AuthUser) {
  const project = await getProjectOrThrow(projectId, user);

  logger.warn('Aspose.Cells is not configured — generating placeholder Excel for project %s', project.code);

  // Stub: generate a simple CSV as placeholder
  const rows = [
    ['Field', 'Value'],
    ['Code', project.code],
    ['Name', project.name],
    ['Client', project.client],
    ['Manager', project.manager.displayName],
    ['Status', project.status],
    ['Business Unit', project.businessUnit],
    ['Contract Value', project.contractValue.toString()],
    ['Start Date', project.startDate.toISOString().split('T')[0]],
    ['End Date', project.endDate.toISOString().split('T')[0]],
  ];

  const csv = rows.map((r) => r.join(',')).join('\n');
  const buffer = Buffer.from(csv, 'utf-8');

  return {
    buffer,
    filename: `project-${project.code}-report.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

/**
 * Generate a portfolio PDF report (stub).
 * TODO: Replace with Aspose.PDF generation when license is configured.
 */
export async function generatePortfolioPdf(user: AuthUser) {
  if (user.role === 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Portfolio exports are not available for PM role');
  }

  logger.warn('Aspose.PDF is not configured — generating placeholder portfolio PDF');

  const where = getProjectScope(user);
  const projects = await prisma.project.findMany({
    where,
    select: {
      code: true,
      name: true,
      status: true,
      businessUnit: true,
      contractValue: true,
      manager: { select: { displayName: true } },
    },
    orderBy: { code: 'asc' },
  });

  const lines = [
    `PORTFOLIO REPORT`,
    `========================================`,
    `Generated: ${new Date().toISOString()}`,
    `Role: ${user.role}`,
    user.businessUnit ? `Business Unit: ${user.businessUnit}` : 'Scope: All Business Units',
    `Total Projects: ${projects.length}`,
    ``,
    ...projects.map(
      (p) =>
        `${p.code} | ${p.name} | ${p.status} | ${p.manager.displayName} | ${p.contractValue.toString()}`,
    ),
    ``,
    `[This is a stub report. Aspose.PDF integration pending.]`,
  ];

  const buffer = Buffer.from(lines.join('\n'), 'utf-8');

  return {
    buffer,
    filename: `portfolio-report.pdf`,
    contentType: 'application/pdf',
  };
}

/**
 * Generate a portfolio Excel report (stub).
 * TODO: Replace with Aspose.Cells generation when license is configured.
 */
export async function generatePortfolioExcel(user: AuthUser) {
  if (user.role === 'PM') {
    throw new AppError(403, 'FORBIDDEN', 'Portfolio exports are not available for PM role');
  }

  logger.warn('Aspose.Cells is not configured — generating placeholder portfolio Excel');

  const where = getProjectScope(user);
  const projects = await prisma.project.findMany({
    where,
    select: {
      code: true,
      name: true,
      status: true,
      businessUnit: true,
      contractValue: true,
      manager: { select: { displayName: true } },
    },
    orderBy: { code: 'asc' },
  });

  const rows = [
    ['Code', 'Name', 'Status', 'Business Unit', 'Manager', 'Contract Value'],
    ...projects.map((p) => [
      p.code,
      p.name,
      p.status,
      p.businessUnit,
      p.manager.displayName,
      p.contractValue.toString(),
    ]),
  ];

  const csv = rows.map((r) => r.join(',')).join('\n');
  const buffer = Buffer.from(csv, 'utf-8');

  return {
    buffer,
    filename: `portfolio-report.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
