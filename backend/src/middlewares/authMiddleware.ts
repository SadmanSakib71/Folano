import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthUser = {
  id: number;
  phone: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as {
    id?: unknown;
    phone?: unknown;
    role?: unknown;
  };

  return (
    typeof payload.id === "number" &&
    typeof payload.phone === "string" &&
    typeof payload.role === "string"
  );
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header is missing or malformed",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      error: "Authorization header is missing or malformed",
    });
  }

  try {
    const decoded: unknown = verifyToken(token);

    if (!isAuthUser(decoded)) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
