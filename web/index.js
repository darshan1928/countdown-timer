// @ts-check
import express from "express";
import { join } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { createServer } from "http";
dotenv.config();
import serveStatic from "serve-static";
import timersRouter from "./routes/timer.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import { connectDb } from "./db/index.js";
import productsRouter from './routes/products.js';
import cors from 'cors'


const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
const STATIC_PATH =
process.env.NODE_ENV === "production"
? `${process.cwd()}/frontend/dist`
: `${process.cwd()}/frontend/`;

const app = express();
const server = createServer(app);
app.use(cors())
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }))
// ─── CONNECT TO MONGODB ─────────────────────────────────────────────────────────
connectDb().catch((err) => {
  console.error("Failed to connect to MongoDB, exiting.", err);
  process.exit(1);
});




// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);



app.use("/api/*", shopify.validateAuthenticatedSession());
app.use("/api/timers", timersRouter);
app.use('/api/products',productsRouter)

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY ?? "")
    );
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
