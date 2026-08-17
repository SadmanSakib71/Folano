import { Request, Response } from "express";
import db from "../config/database";

const productColumns = [
  "products.id",
  "products.category_id",
  "products.name",
  "products.slug",
  "products.description",
  "products.unit",
  "products.price",
  "products.image_url",
  "products.is_seasonal",
  "products.is_preorder_only",
  "products.stock_quantity",
  "products.is_active",
  "products.created_at",
  "products.updated_at",
  "categories.name as category_name",
];

function productsWithCategory() {
  return db("products")
    .join("categories", "products.category_id", "categories.id")
    .select(productColumns);
}

export async function getAllProducts(req: Request, res: Response) {
  try {
    const query = productsWithCategory().where("products.is_active", true);

    const categoryId = req.query.category_id;

    if (categoryId !== undefined) {
      query.andWhere("products.category_id", categoryId);
    }

    const products = await query;
    return res.json(products);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const product = await productsWithCategory()
      .where("products.id", req.params.id)
      .first();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const {
      category_id,
      name,
      slug,
      description,
      unit,
      price,
      image_url,
      is_seasonal,
      is_preorder_only,
      stock_quantity,
      is_active,
    } = req.body;

    if (
      name === undefined ||
      name === null ||
      name === "" ||
      category_id === undefined ||
      category_id === null ||
      category_id === "" ||
      slug === undefined ||
      slug === null ||
      slug === "" ||
      unit === undefined ||
      unit === null ||
      unit === "" ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        error: "name, category_id, slug, unit, and price are required",
      });
    }

    const category = await db("categories").where({ id: category_id }).first();

    if (!category) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    const existingSlug = await db("products").where({ slug }).first();

    if (existingSlug) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const [created] = await db("products")
      .insert({
        category_id,
        name,
        slug,
        description: description ?? null,
        unit,
        price,
        image_url: image_url ?? null,
        is_seasonal: is_seasonal ?? false,
        is_preorder_only: is_preorder_only ?? false,
        stock_quantity: stock_quantity ?? 0,
        is_active: is_active ?? true,
      })
      .returning("id");

    const product = await productsWithCategory()
      .where("products.id", created.id)
      .first();

    return res.status(201).json(product);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const existing = await db("products").where({ id: req.params.id }).first();

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    const allowedFields = [
      "name",
      "slug",
      "category_id",
      "description",
      "unit",
      "price",
      "image_url",
      "is_seasonal",
      "is_preorder_only",
      "stock_quantity",
      "is_active",
    ] as const;

    const updates: {
      name?: unknown;
      slug?: unknown;
      category_id?: unknown;
      description?: unknown;
      unit?: unknown;
      price?: unknown;
      image_url?: unknown;
      is_seasonal?: unknown;
      is_preorder_only?: unknown;
      stock_quantity?: unknown;
      is_active?: unknown;
      updated_at?: ReturnType<typeof db.fn.now>;
    } = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.category_id !== undefined) {
      const category = await db("categories")
        .where({ id: updates.category_id })
        .first();

      if (!category) {
        return res.status(400).json({ error: "Category does not exist" });
      }
    }

    if (updates.slug !== undefined && updates.slug !== existing.slug) {
      const slugTaken = await db("products")
        .where({ slug: updates.slug })
        .whereNot({ id: existing.id })
        .first();

      if (slugTaken) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = db.fn.now();
      await db("products").where({ id: existing.id }).update(updates);
    }

    const product = await productsWithCategory()
      .where("products.id", existing.id)
      .first();

    return res.json(product);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const existing = await db("products").where({ id: req.params.id }).first();

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    await db("products").where({ id: existing.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    });

    const product = await productsWithCategory()
      .where("products.id", existing.id)
      .first();

    return res.json({
      message: "Product deleted",
      product,
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}
