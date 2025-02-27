import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/get_moving_cabs", async (req, res) => {
  try {
    const response = await fetch(
      "https://rodbez.in/account_api/v0/get_moving_cabs",
      {
        method: "POST",
        headers: {
          Authorization:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0aW1lIjoxNzM5MzQ3NzE1LCJhcGlfa2V5IjoibXlkcmVhbSIsImFkbWluX3JvbGUiOiJhY2NvdW50IiwiYWRtaW5faWQiOiI0OSIsImFkbWluX25hbWUiOiJNdXJhcmkiLCJBUElfVElNRSI6MTczOTM0NzcxNX0.vt4U_e2XbtbLQOafVtG7LRjIbEH7MTq_OeYnfkRbWgY",
          Cookie: "ci_session=fbbf6196c1025ffcb4571a51c5e505dc8dcd4397",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ category: "Operational" }),
      }
    );

    const data = await response.json();
    console.log("🛠 API Response:", data);

    if (!data.status || !data.data) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid Token or No Data" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching taxis:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
