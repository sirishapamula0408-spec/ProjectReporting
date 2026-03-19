import bcrypt from 'bcrypt';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/AppError.js';
import { logger } from '../../config/logger.js';
import type { LoginInput } from './validation.js';

export interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  businessUnit: string | null;
}

export async function authenticateUser(input: LoginInput): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (!user || !user.isActive) {
    logger.warn(`Login failed: user not found or inactive - ${input.username}`);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    logger.warn(`Login failed: invalid password - ${input.username}`);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }

  logger.info(`Login successful: ${user.username} (${user.role})`);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    businessUnit: user.businessUnit,
  };
}

export async function getUserById(id: number): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      businessUnit: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    businessUnit: user.businessUnit,
  };
}
