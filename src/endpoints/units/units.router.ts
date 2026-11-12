import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateUnitSchema, RegisterUnitSchema, MapStudentAccountSchema } from '../../schema/unit.schema.ts';
import { UnitService } from '../../services/unit.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const unitsRouter = new Hono();

unitsRouter.post('/', zValidator('json', CreateUnitSchema), (c) => {
  const body = c.req.valid('json');
  const unit = UnitService.createUnit(body);
  return c.json(successResponse(unit), 201);
});

unitsRouter.get('/institution/:code', (c) => {
  const code = c.req.param('code');
  const units = UnitService.listUnits(code);
  return c.json(successResponse({ institutionCode: code, units }));
});

unitsRouter.post('/map-student', zValidator('json', MapStudentAccountSchema), (c) => {
  const body = c.req.valid('json');
  const profile = UnitService.mapStudentAccount(body);
  return c.json(successResponse(profile), 201);
});

unitsRouter.post('/register', zValidator('json', RegisterUnitSchema), (c) => {
  const body = c.req.valid('json');
  const enrollment = UnitService.registerStudentForUnit(body);
  return c.json(successResponse(enrollment), 201);
});

unitsRouter.get('/student/:studentId', (c) => {
  const studentId = c.req.param('studentId');
  const profile = UnitService.getStudentProfile(studentId);
  if (!profile) return c.json(errorResponse('NOT_FOUND', 'Student account is not mapped to an institution'), 404);
  return c.json(successResponse(profile));
});
