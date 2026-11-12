import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PhoneLoginSchema, RegisterUserSchema, VerifyOtpSchema } from '../../schema/auth.schema.ts';
import { AuthService } from '../../services/auth.service.ts';
import { successResponse, errorResponse } from '../../utils/response.ts';

export const authRouter = new Hono();

authRouter.post('/register', zValidator('json', RegisterUserSchema), async (c) => {
  const body = c.req.valid('json');
  const existing = AuthService.findByPhone(body.phoneNumber);
  if (existing) {
    return c.json(errorResponse('DUPLICATE_PHONE', 'Phone number is already registered'), 409);
  }

  const passwordHash = await AuthService.hashPassword(body.password);
  const user = AuthService.registerUser({ ...body, passwordHash });
  const token = AuthService.signToken({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    role: user.role,
    organizationId: user.organizationId,
    country: user.country,
  });

  return c.json(successResponse({ user: { id: user.id, fullName: user.fullName, phoneNumber: user.phoneNumber }, token }), 201);
});

authRouter.post('/login', zValidator('json', PhoneLoginSchema), async (c) => {
  const { phoneNumber, password } = c.req.valid('json');
  const user = AuthService.findByPhone(phoneNumber);
  if (!user) {
    return c.json(errorResponse('INVALID_CREDENTIALS', 'Invalid phone number or password'), 401);
  }

  const isValid = await AuthService.comparePassword(password, user.passwordHash);
  if (!isValid) {
    return c.json(errorResponse('INVALID_CREDENTIALS', 'Invalid phone number or password'), 401);
  }

  const token = AuthService.signToken({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    role: user.role,
    organizationId: user.organizationId,
    country: user.country,
  });

  return c.json(successResponse({ token, user: { id: user.id, fullName: user.fullName, phoneNumber: user.phoneNumber } }));
});

authRouter.post('/verify-otp', zValidator('json', VerifyOtpSchema), (c) => {
  const { phoneNumber, code } = c.req.valid('json');
  // Verified simulation of 6-digit OTP confirmation
  const isCorrect = code === '123456' || code.length === 6;
  return c.json(successResponse({ verified: isCorrect, phoneNumber }));
});
