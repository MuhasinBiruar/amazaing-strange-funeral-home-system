import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

//placeholder data
app.get("/", async (_req, res) => {
  try {
    // 2. Run the query when someone visits this route
    const result = await pool.query("SELECT * from DeceasedRecord");

    // 3. Send the database rows back as JSON
    res.json({
      message: "YOOOOOOOOO I AM HERE.",
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT * from DeceasedRecord");
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed", error);
  }
});
