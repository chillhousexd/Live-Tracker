import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/get_cabs", async (req, res) => {
  try {
    const response = await fetch("https://rodbez.in/account_api/v0/get_moving_cabs", {
      method: "POST",
      headers: {
        Authorization:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0aW1lIjoxNzM5MzQ3NzE1LCJhcGlfa2V5IjoibXlkcmVhbSIsImFkbWluX3JvbGUiOiJhY2NvdW50IiwiYWRtaW5faWQiOiI0OSIsImFkbWluX25hbWUiOiJNdXJhcmkiLCJBUElfVElNRSI6MTczOTM0NzcxNX0.vt4U_e2XbtbLQOafVtG7LRjIbEH7MTq_OeYnfkRbWgY",
        Cookie: "ci_session=fbbf6196c1025ffcb4571a51c5e505dc8dcd4397",
      },
      body: new URLSearchParams({ category: "Operational" }),
    });

    const data = await response.json();
    console.log("Full API Response:", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error("Error fetching taxi data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
