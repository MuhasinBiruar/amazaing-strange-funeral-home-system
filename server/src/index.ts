import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.ts";
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import deceasedrecordsSchema from "./schemas/deceasedrecords.ts";
import validate from "./middleware/validate.ts";

const app = express();
const PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 4000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], //added Authorization header to allow token-based auth
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

// Better Auth's own routes — must come BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));
//app.all("/api/auth/:path(.*)", toNodeHandler(auth));

app.use(express.json());

//#region /deceasedrecords
app.get("/deceasedrecords", async (_req, res) => {
  try {
    // 2. Run the query when someone visits this route
    const result = await pool.query("SELECT * from DeceasedRecord");

    // 3. Send the database rows back as JSON
    res.json({
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/deceasedrecords/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM DeceasedRecord WHERE caseid = $1", [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/deceasedrecords", validate(deceasedrecordsSchema), async (req, res) => {
  try {
    const parsed = deceasedrecordsSchema.parse(req.body);

    const result = await pool.query(`
      INSERT INTO deceasedrecord (
        firstname,
        middlename,
        lastname,
        causeofdeath,
        typeofdeath,
        physicaldescription,
        servicestatus,
        hasmaturedlifeplan,
        plantype,
        datecreated,
        managedby
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING caseid;`,
      [
        parsed.firstname,
        parsed.middlename,
        parsed.lastname,
        parsed.causeofdeath,
        parsed.typeofdeath,
        parsed.physicaldescription,
        parsed.servicestatus,
        parsed.hasmaturedlifeplan,
        parsed.plantype,
        parsed.datecreated,
        parsed.managedby
      ]);

    return res.status(201).json({
      message: "Record created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//#endregion

//#region /staff
app.get("/staff", async (_req, res) => {
  try {
    // 2. Run the query when someone visits this route
    const result = await pool.query("SELECT * from Staff");

    // 3. Send the database rows back as JSON
    res.json({
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching staff members:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/staff/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query("SELECT * FROM Staff WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//#endregion

//#region /documents
app.get("/documents", async (_req, res) => {
  try {
    // 2. Run the query when someone visits this route
    const result = await pool.query("SELECT * from Document");

    // 3. Send the database rows back as JSON
    res.json({
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Document WHERE documentid = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//#endregion

//get session data of logged in user
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1 from DeceasedRecord");
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed", error);
  }
});
