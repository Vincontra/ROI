# ROI Evaluation Dashboard for Lean Six Sigma (LSS)

A full-stack web application to calculate, visualize, and document ROI for Lean Six Sigma projects. Users can enter project data, view instant ROI results with charts, generate PDF reports, email them, and maintain a small history of past calculations.

## Features
- Real-time ROI calculation
- Metrics visualization
- Savings breakdown charts
- PDF report generation
- Email report sharing
- Stores last few ROI calculations
- Responsive and simple UI
- Client and server-side validation

## Tech Stack
Frontend: HTML, CSS, JavaScript, Chart.js, jsPDF  
Backend: Node.js, Express.js, Nodemailer  
Storage: JSON file

## ROI Calculation Logic
Defect Savings = Baseline Defects × (Defect Reduction % / 100) × Rework Cost per Defect  
Productivity Gains = Investment × (Productivity Increase % / 100)  
Time Savings = Investment × (Cycle Time Reduction % / 100)

Total Savings = Defect Savings + Productivity Gains + Time Savings  
Net Benefit = Total Savings − Investment  
ROI (%) = (Net Benefit / Investment) × 100

## Installation & Run
```bash
npm install
npm start
