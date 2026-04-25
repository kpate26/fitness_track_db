import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/constants.js';
import { validateLoginBody, validateSignupBody } from '../utils/validators.js';
import { createHttpError } from '../utils/httpError.js';

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function buildAuthResponse(user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return {
    token,
    user: serializeUser(user),
  };
}

export async function signup(req, res) {
  const payload = validateSignupBody(req.body);
  const passwordHash = await bcrypt.hash(payload.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
      },
    });
    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createHttpError(409, 'email already exists');
    }
    throw error;
  }
}

export async function login(req, res) {
  const payload = validateLoginBody(req.body);
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw createHttpError(401, 'invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
  if (!passwordMatches) {
    throw createHttpError(401, 'invalid email or password');
  }

  return res.status(200).json(buildAuthResponse(user));
}
