import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateInstitutionSchema, AddBranchSchema, CreateStaffLecturerSchema } from '../../schema/institution.schema.ts';
import { InstitutionService } from '../../services/institution.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const institutionsRouter = new Hono();

institutionsRouter.post('/', zValidator('json', CreateInstitutionSchema), (c) => {
  const body = c.req.valid('json');
  const institution = InstitutionService.registerInstitution(body);
  return c.json(successResponse(institution), 201);
});

institutionsRouter.post('/:code/branches', zValidator('json', AddBranchSchema), (c) => {
  const code = c.req.param('code');
  const body = c.req.valid('json');
  const branch = InstitutionService.addBranch(code, body);
  return c.json(successResponse(branch), 201);
});

institutionsRouter.post('/:code/staff', zValidator('json', CreateStaffLecturerSchema), async (c) => {
  const code = c.req.param('code');
  const body = c.req.valid('json');
  const staff = await InstitutionService.createStaffLecturer(code, body);
  return c.json(successResponse(staff), 201);
});

institutionsRouter.get('/:code', (c) => {
  const code = c.req.param('code');
  const institution = InstitutionService.getInstitution(code);
  if (!institution) return c.json(errorResponse('NOT_FOUND', 'Institution not found'), 404);
  return c.json(successResponse(institution));
});

institutionsRouter.get('/:code/staff', (c) => {
  const code = c.req.param('code');
  const staffMembers = InstitutionService.listStaff(code);
  return c.json(successResponse({ institutionCode: code, staffMembers }));
});
