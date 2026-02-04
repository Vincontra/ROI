# ROI Evaluation Dashboard for Lean Six Sigma (LSS) Projects

A comprehensive full-stack web application that enables users to input Lean Six Sigma project data, calculate ROI dynamically, visualize results, and generate shareable PDF/email reports for documentation.

##  Features

- **Interactive ROI Calculator**: Real-time calculation of Return on Investment for LSS projects
- **Dynamic Visualizations**: Before/After metrics and savings breakdown charts using Chart.js
- **PDF Report Generation**: Automated PDF reports with embedded charts using jsPDF
- **Email Integration**: Send ROI reports directly via email using Nodemailer
- **Project History**: Track and display the last 10 ROI calculations
- **Responsive Design**: Modern, mobile-friendly interface with Poppins font
- **Form Validation**: Comprehensive client and server-side validation

##  Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for data visualization
- jsPDF for PDF generation
- Modern CSS with Flexbox/Grid

### Backend
- Node.js with Express.js
- Nodemailer for email functionality
- JSON file storage for data persistence
- CORS enabled for cross-origin requests

##  Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Gmail account (for email functionality)

## 🔧 Installation & Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd roi-evaluation-dashboard

# Or extract the downloaded files to a directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Email Settings (Optional)
Create a `.env` file in the root directory:
```env
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=yourapppassword
PORT=3000
NODE_ENV=development
```

**Note**: For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

### 4. Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 5. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:3000
```

##  How to Use

### 1. Input Project Data
Fill out the form with your Lean Six Sigma project details:
- **Project Name**: Descriptive name for your project
- **Investment Cost**: Total cost of implementing the LSS project
- **Baseline Defects**: Current number of defects in the system
- **Defect Reduction (%)**: Expected percentage reduction in defects
- **Rework Cost per Defect**: Cost to fix each defect
- **Cycle Time Reduction (%)**: Expected reduction in cycle time
- **Productivity Increase (%)**: Expected increase in productivity

### 2. Calculate ROI
Click "Calculate ROI" to:
- Compute total savings from defect reduction, productivity gains, and time savings
- Calculate net benefit and ROI percentage
- Display results with color-coded status indicators

### 3. View Analytics
Interactive charts show:
- **Before vs After Metrics**: Bar chart comparing baseline vs improved metrics
- **Savings Contribution**: Pie chart breaking down different savings components

### 4. Generate Reports
- **PDF Report**: Click "Generate PDF Report" to download a comprehensive report
- **Email Report**: Enter email address and click "Send Email" to receive the report

### 5. Track History
View the last 10 ROI calculations in the history table, including:
- Project name, ROI percentage, investment, net benefit, and date

##  ROI Calculation Formula

The application uses the following formula to calculate ROI:

```
Defect Savings = Baseline Defects × (Defect Reduction % / 100) × Rework Cost per Defect
Productivity Gains = Investment × (Productivity Increase % / 100)
Time Savings = Investment × (Cycle Time Reduction % / 100)

Total Savings = Defect Savings + Productivity Gains + Time Savings
Net Benefit = Total Savings - Investment
ROI = (Net Benefit / Investment) × 100
```

##  Project Structure

```
roi-evaluation-dashboard/
├── index.html          # Main HTML file with complete UI
├── style.css           # Modern CSS styling with responsive design
├── script.js           # Frontend JavaScript with all functionality
├── server.js           # Node.js/Express backend server
├── package.json        # Node.js dependencies and scripts
├── data.json           # JSON file for storing project history
├── env.example         # Example environment variables file
└── README.md           # This documentation file
```

## 🔌 API Endpoints

### POST /api/calculate-roi
Calculate ROI for a given project data set.

**Request Body:**
```json
{
  "projectName": "Defect Reduction A",
  "investment": 150000,
  "baselineDefects": 500,
  "defectReduction": 35,
  "reworkCost": 800,
  "cycleTimeReduction": 10,
  "productivityIncrease": 20
}
```

**Response:**
```json
{
  "projectName": "Defect Reduction A",
  "totalSavings": 220000,
  "netBenefit": 70000,
  "roi": 46.6,
  "status": "Profitable project with positive ROI"
}
```

### POST /api/send-report
Send ROI report via email.

### GET /api/history
Retrieve project calculation history.

### POST /api/save-history
Save a new project calculation to history.

### POST /api/clear-history
Clear all project history.

### GET /api/health
Health check endpoint.

##  Design Features

- **Color Palette**: Professional color scheme with dark blue (#0b132b), teal (#5bc0be) accents
- **Typography**: Google Fonts Poppins for modern, readable text
- **Responsive**: Mobile-first design with Flexbox and CSS Grid
- **Animations**: Smooth transitions, hover effects, and animated counters
- **Accessibility**: Proper form labels, keyboard navigation, and semantic HTML

## Security Features

- Input validation on both client and server side
- Email format validation
- CORS protection
- Environment variable protection for sensitive data
- Error handling and logging

## Troubleshooting

### Common Issues

1. **Email not sending**: Ensure Gmail credentials are correctly configured in `.env`
2. **Charts not displaying**: Check browser console for JavaScript errors
3. **PDF generation failing**: Ensure jsPDF library is loaded correctly
4. **Server not starting**: Verify Node.js version and all dependencies are installed

### Debug Mode
Set `NODE_ENV=development` in your `.env` file for detailed error logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on IEEE Paper on ROI for Lean Six Sigma in Software Development
- Chart.js for data visualization
- jsPDF for PDF generation
- Google Fonts for typography

## Support

For support or questions, please create an issue in the repository or contact the development team.

---
