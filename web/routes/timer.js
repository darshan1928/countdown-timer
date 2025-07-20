import { Router } from "express";
import Timer from "../models/Timer.js";
const router = Router();

// POST /api/timers
router.post("/", async (req, res) => {
  try {
    const { shop, productId, startAt, endAt, description,
            displayOptions, urgencySettings } = req.body;

    if (new Date(endAt) <= new Date(startAt)) {
      return res.status(400).json({ error: "End must be after start" });
    }

    const timer = await Timer.create({
      shop,
      productId,
      startAt,
      endAt,
      description,
      displayOptions,
      urgencySettings
    });
    res.status(201).json(timer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/timers?shopId=…&productId=…&active=true
router.get("/", async (req, res) => {
  const { shop, productId, active } = req.query;
  const q = { shop };
  if (productId) q.productId = productId;
  if (active === "true") {
    const now = new Date();
    q.startAt = { $lte: now };
    q.endAt   = { $gte: now };
  }
  res.json(await Timer.find(q));
});

// PUT /api/timers/:id
router.put("/:id", async (req, res) => {
  try {
    const { startAt, endAt } = req.body;
    console.log("req.body===",req.body)
    if (new Date(endAt) <= new Date(startAt)) {
      return res.status(400).json({ error: "End must be after start" });
    }
    const updated = await Timer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/timers/:id
router.delete("/:id", async (req, res) => {
  try {
    await Timer.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
