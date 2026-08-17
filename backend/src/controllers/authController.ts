import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../config/database";
import { generateToken } from "../utils/jwt";

function toPublicUser(user: {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  };
}

export async function register(req: Request, res: Response) {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        error: "Name, phone, and password are required",
      });
    }

    const existingUser = await db("users").where({ phone }).first();

    if (existingUser) {
      return res.status(400).json({
        error: "A user with this phone number already exists",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [user] = await db("users")
      .insert({
        name,
        phone,
        email: email || null,
        password_hash,
        role: "customer",
      })
      .returning(["id", "name", "phone", "email", "role"]);

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    return res.status(201).json({
      user: toPublicUser(user),
      token,
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        error: "Phone and password are required",
      });
    }

    const user = await db("users").where({ phone }).first();

    if (!user) {
      return res.status(401).json({
        error: "Invalid phone or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid phone or password",
      });
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    return res.json({
      user: toPublicUser(user),
      token,
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}
