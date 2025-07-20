// routes/products.js
import express from "express";
import shopify from "../shopify.js";
import Timer from "../models/Timer.js";

const router = express.Router();

router.get("/no-active-timers", async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) return res.status(400).json({ error: "Missing shop" });
    console.log("shop===", shop);
    // 1. Fetch all products via Shopify Admin REST
    const client = new shopify.api.clients.Rest({
      session: res.locals.shopify.session,
    });
    const productsRes = await client.get({
      path: "products",
      query: { limit: 250 },
    });
    const products = productsRes.body.products;

    // 2. Find which productIds have *active* timers
    const now = new Date();
    const activeTimers = await Timer.find({
      shop,
      startAt: { $lte: now },
      endAt: { $gt: now },
    }).distinct("productId");

    // 3. Filter out those products
    const noTimerProducts = products
      .filter((p) => !activeTimers.includes(String(p.id)))
      .map((p) => ({ id: String(p.id), title: p.title }));

    res.json(noTimerProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/timers-summary", async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).json({ error: "Missing shop parameter" });

  const now = new Date();

  try {
    // 1) Fetch Shopify product titles in one batch
    const client = new shopify.api.clients.Rest({
      session: res.locals.shopify.session,
    });
    const productsRes = await client.get({
      path: "products",
      query: { limit: 250 },
    });
    const products = productsRes.body.products;
    // Map productId→title
    const titleMap = products.reduce((map, p) => {
      map[String(p.id)] = p.title;
      return map;
    }, {});

    // 2) Helper to fetch timers by filter
    async function fetchTimers(filter) {
      const docs = await Timer.find(filter).lean();
      return docs.map((d) => ({
        _id: d._id,
        productId: d.productId,
        description: d.description,
        productName: titleMap[d.productId] || "Unknown",
        startAt: d.startAt,
        endAt: d.endAt,
        displayOptions: d.displayOptions, 
        urgencySettings: d.urgencySettings,
      }));
    }

    // 3) Build each category
    const [upcoming, current, past] = await Promise.all([
      fetchTimers({ shop, startAt: { $gt: now } }),
      fetchTimers({ shop, startAt: { $lte: now }, endAt: { $gt: now } }),
      fetchTimers({ shop, endAt: { $lte: now } }),
    ]);

    // 4) Return combined summary
    res.json({ upcoming, current, past });
  } catch (err) {
    console.error("Error in timers-summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
