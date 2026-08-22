import { Request, Response } from "express";
import db from "../config/database";

export async function getAllCategories(_req: Request, res: Response) {
  try {
    const categories = await db("categories")
      .where({ is_active: true })
      .select("*");
    return res.status(200).json(categories);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getAdminCategories(_req: Request, res: Response) {
  try {
    const categories = await db("categories").select("*");
    return res.status(200).json(categories);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, description, is_active } = req.body;

    if (
      name === undefined ||
      name === null ||
      name === "" ||
      slug === undefined ||
      slug === null ||
      slug === ""
    ) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    const existingSlug = await db("categories").where({ slug }).first();

    if (existingSlug) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const [category] = await db("categories")
      .insert({
        name,
        slug,
        description: description ?? null,
        is_active: is_active ?? true,
      })
      .returning("*");

    return res.status(201).json(category);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function categoryHasProducts(categoryId: number) {
  const product = await db("products").where({ category_id: categoryId }).first();
  return Boolean(product);
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const existing = await db("categories").where({ id: req.params.id }).first();

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    const allowedFields = ["name", "slug", "description", "is_active"] as const;

    const updates: {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      is_active?: unknown;
      updated_at?: ReturnType<typeof db.fn.now>;
    } = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.slug !== undefined && updates.slug !== existing.slug) {
      const slugTaken = await db("categories")
        .where({ slug: updates.slug })
        .whereNot({ id: existing.id })
        .first();

      if (slugTaken) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    if (updates.is_active === false && existing.is_active !== false) {
      if (await categoryHasProducts(existing.id)) {
        return res.status(400).json({
          error: "Cannot delete category with existing products",
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = db.fn.now();
      await db("categories").where({ id: existing.id }).update(updates);
    }

    const category = await db("categories").where({ id: existing.id }).first();

    return res.status(200).json(category);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const existing = await db("categories").where({ id: req.params.id }).first();

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (await categoryHasProducts(existing.id)) {
      return res.status(400).json({
        error: "Cannot delete category with existing products",
      });
    }

    await db("categories").where({ id: existing.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    });

    const category = await db("categories").where({ id: existing.id }).first();

    return res.status(200).json({
      message: "Category deleted",
      category,
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}
