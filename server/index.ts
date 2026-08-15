import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Serve each standalone HTML document explicitly so direct route access never falls back to the home page.
  const schoolRoutes = ["shaimaa-educational-complex", "bilal-bin-rabah-secondary", "new-republic-basic-education", "horreya-educational-complex", "osama-bin-zaid-complex", "karama-official-language-school", "nile-egyptian-school-obour", "international-public-school-obour", "ips-rawdet-elobour", "egyptian-japanese-school-obour"].map(s=>`schools/${s}`);
const staticRoutes = ["about", "districts", "transport", "prices", "developers", "buying-guide", "services", "schools", "health", "investment", "mistakes", "compare", "faq", ...schoolRoutes];
  for (const route of staticRoutes) {
    app.get(`/${route}`, (_req, res) => {
      res.sendFile(path.join(staticPath, route, "index.html"));
    });
    app.get(`/${route}/`, (_req, res) => {
      res.sendFile(path.join(staticPath, route, "index.html"));
    });
  }

  // Static HTML site: unknown paths should return the static 404 document.
  app.get("*", (_req, res) => {
    res.status(404).sendFile(path.join(staticPath, "404", "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
