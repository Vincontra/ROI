// import * as dotenv from "dotenv";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Load .env file explicitly
// dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

// ✅ Setup __dirname manually (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// ---------- Initialize Resend ----------
const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- Data storage ----------
const dataFilePath = path.join(__dirname, "data.json");

async function readData() {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(data);
  } catch {
    await fs.writeFile(dataFilePath, "[]");
    return [];
  }
}

async function writeData(data) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
}

// ---------- ROI Calculation ----------
function calculateROI(data) {
  const {
    projectName,
    investment,
    baselineDefects,
    defectReduction,
    reworkCost,
    cycleTimeReduction,
    productivityIncrease,
  } = data;

  const defectSavings = baselineDefects * (defectReduction / 100) * reworkCost;
  const productivityGains = investment * (productivityIncrease / 100);
  const timeSavings = investment * (cycleTimeReduction / 100);
  const totalSavings = defectSavings + productivityGains + timeSavings;
  const netBenefit = totalSavings - investment;
  const roi = (netBenefit / investment) * 100;

  let status = "Neutral project with break-even ROI";
  if (roi > 50) status = "Excellent project with high ROI";
  else if (roi > 0) status = "Profitable project with positive ROI";
  else if (roi < -50) status = "Poor project with significant negative ROI";
  else if (roi < 0) status = "Project with negative ROI";

  return {
    projectName,
    investment,
    defectSavings: Math.round(defectSavings),
    productivityGains: Math.round(productivityGains),
    timeSavings: Math.round(timeSavings),
    totalSavings: Math.round(totalSavings),
    netBenefit: Math.round(netBenefit),
    roi: Math.round(roi * 10) / 10,
    status,
  };
}

// ---------- HTML Report Generator ----------
function generateHTMLReport(p) {
  const currentDate = new Date().toLocaleDateString();
  const roiClass =
    p.roi > 0 ? "roi-positive" : p.roi < 0 ? "roi-negative" : "roi-neutral";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      .header { background: #0b132b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
      .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #5bc0be; color: white; }
      tr:nth-child(even) { background-color: #f2f2f2; }
      .roi-positive { color: #28a745; font-weight: bold; }
      .roi-negative { color: #dc3545; font-weight: bold; }
      .roi-neutral { color: #6c757d; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>ROI Evaluation Report</h1>
      <h2>${p.projectName}</h2>
      <p>Generated on ${currentDate}</p>
    </div>
    <table class="summary-table">
      <tr><th>Investment</th><td>₹${p.investment.toLocaleString()}</td></tr>
      <tr><th>Total Savings</th><td>₹${p.totalSavings.toLocaleString()}</td></tr>
      <tr><th>Net Benefit</th><td>₹${p.netBenefit.toLocaleString()}</td></tr>
      <tr><th>ROI</th><td class="${roiClass}">${p.roi}%</td></tr>
      <tr><th>Status</th><td>${p.status}</td></tr>
    </table>
  </body>
  </html>
  `;
}

// ---------- API Routes ----------

// ROI Calculation
app.post("/api/calculate-roi", (req, res) => {
  try {
    const data = req.body;
    const roiResult = calculateROI(data);
    res.json(roiResult);
  } catch (err) {
    console.error("ROI error:", err);
    res.status(500).json({ error: "Failed to calculate ROI" });
  }
});

// ---------- Send Email Report (Resend) ----------
app.post("/api/send-report", async (req, res) => {
  try {
    const { projectData, email } = req.body;
    if (!projectData || !email)
      return res.status(400).json({ error: "Missing project data or email" });

    const html = generateHTMLReport(projectData);

    const response = await resend.emails.send({
      from: "ROI Dashboard <onboarding@resend.dev>",
      to: email,
      subject: `ROI Report - ${projectData.projectName}`,
      html,
    });

    console.log("✅ Resend email response:", response);
    res.json({ message: "Email sent successfully", response });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ---------- Project History ----------
app.get("/api/history", async (req, res) => {
  try {
    res.json(await readData());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read history" });
  }
});

app.post("/api/save-history", async (req, res) => {
  try {
    const entry = { ...req.body, date: new Date().toISOString().split("T")[0] };
    const data = await readData();
    data.unshift(entry);
    await writeData(data.slice(0, 10));
    res.json({ message: "History saved", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save history" });
  }
});

app.post("/api/clear-history", async (req, res) => {
  try {
    await writeData([]);
    res.json({ message: "History cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// ---------- Health Check ----------
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

// ---------- Fallback ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📧 Email service: ${
      process.env.RESEND_API_KEY ? "Configured" : "Not configured"
    }`
  );
});
