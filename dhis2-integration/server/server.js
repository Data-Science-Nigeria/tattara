import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const DHIS2_BASE = process.env.DHIS2_BASE || "https://play.im.dhis2.org/dev-2-40";

const forward = async (path, method = "GET", body, authHeader) => {
  const res = await fetch(`${DHIS2_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, body: data };
  return data;
};

app.get("/me", async (req, res) => {
  try {
    const data = await forward("/api/me", "GET", null, req.headers.authorization);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json(e.body); }
});

app.get("/programs", async (req, res) => {
  try {
    const fields = encodeURIComponent("id,displayName,programType,programStages[id,displayName,programStageDataElements[dataElement[id,displayName,formName,valueType]]]");
    const data = await forward(`/api/programs?fields=${fields}&paging=false`, "GET", null, req.headers.authorization);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json(e.body); }
});

app.post("/events", async (req, res) => {
  try {
    const data = await forward("/api/events", "POST", req.body, req.headers.authorization);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json(e.body); }
});

app.get("/datasets", async (req, res) => {
  try {
    const fields = encodeURIComponent("id,displayName,periodType,dataSetElements[dataElement[id,displayName,valueType,formName]]");
    const data = await forward(`/api/dataSets?fields=${fields}&paging=false`, "GET", null, req.headers.authorization);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json(e.body); }
});

app.post("/dataValueSets", async (req, res) => {
  try {
    const data = await forward("/api/dataValueSets", "POST", req.body, req.headers.authorization);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json(e.body); }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
