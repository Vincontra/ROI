const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Email transporter setup
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host:"smtp.gmail.com",
        port:465,
        secure:true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Utility functions
const readDataFile = async () => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Creating new data file...');
        await fs.writeFile('data.json', '[]');
        return [];
    }
};

const writeDataFile = async (data) => {
    await fs.writeFile('data.json', JSON.stringify(data, null, 2));
};

// ROI Calculation Logic
const calculateROI = (projectData) => {
    const {
        projectName,
        investment,
        baselineDefects,
        defectReduction,
        reworkCost,
        cycleTimeReduction,
        productivityIncrease
    } = projectData;

    // Calculate savings components
    const defectSavings = baselineDefects * (defectReduction / 100) * reworkCost;
    const productivityGains = investment * (productivityIncrease / 100);
    const timeSavings = investment * (cycleTimeReduction / 100);

    // Calculate totals
    const totalSavings = defectSavings + productivityGains + timeSavings;
    const netBenefit = totalSavings - investment;
    const roi = (netBenefit / investment) * 100;

    // Determine status
    let status = 'Neutral project with break-even ROI';
    if (roi > 50) {
        status = 'Excellent project with high ROI';
    } else if (roi > 0) {
        status = 'Profitable project with positive ROI';
    } else if (roi < -50) {
        status = 'Poor project with significant negative ROI';
    } else if (roi < 0) {
        status = 'Project with negative ROI';
    }

    return {
        projectName,
        totalSavings: Math.round(totalSavings),
        netBenefit: Math.round(netBenefit),
        roi: Math.round(roi * 10) / 10,
        status,
        defectSavings: Math.round(defectSavings),
        productivityGains: Math.round(productivityGains),
        timeSavings: Math.round(timeSavings),
        investment: investment
    };
};

// API Routes

// Calculate ROI endpoint
app.post('/api/calculate-roi', async (req, res) => {
    try {
        const projectData = req.body;
        
        // Validate required fields
        const requiredFields = [
            'projectName', 'investment', 'baselineDefects', 
            'defectReduction', 'reworkCost', 'cycleTimeReduction', 
            'productivityIncrease'
        ];
        
        for (const field of requiredFields) {
            if (projectData[field] === undefined || projectData[field] === null) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`
                });
            }
        }

        // Validate data types and ranges
        if (typeof projectData.investment !== 'number' || projectData.investment <= 0) {
            return res.status(400).json({
                error: 'Investment must be a positive number'
            });
        }

        if (typeof projectData.baselineDefects !== 'number' || projectData.baselineDefects < 0) {
            return res.status(400).json({
                error: 'Baseline defects must be a non-negative number'
            });
        }

        if (typeof projectData.defectReduction !== 'number' || 
            projectData.defectReduction < 0 || projectData.defectReduction > 100) {
            return res.status(400).json({
                error: 'Defect reduction must be between 0 and 100'
            });
        }

        if (typeof projectData.reworkCost !== 'number' || projectData.reworkCost < 0) {
            return res.status(400).json({
                error: 'Rework cost must be a non-negative number'
            });
        }

        if (typeof projectData.cycleTimeReduction !== 'number' || 
            projectData.cycleTimeReduction < 0 || projectData.cycleTimeReduction > 100) {
            return res.status(400).json({
                error: 'Cycle time reduction must be between 0 and 100'
            });
        }

        if (typeof projectData.productivityIncrease !== 'number' || 
            projectData.productivityIncrease < 0 || projectData.productivityIncrease > 100) {
            return res.status(400).json({
                error: 'Productivity increase must be between 0 and 100'
            });
        }

        const roiResults = calculateROI(projectData);
        res.json(roiResults);

    } catch (error) {
        console.error('Error calculating ROI:', error);
        res.status(500).json({
            error: 'Internal server error while calculating ROI'
        });
    }
});

// Send email report endpoint
app.post('/api/send-report', async (req, res) => {
    try {
        const { projectData, email } = req.body;

        if (!projectData || !email) {
            return res.status(400).json({
                error: 'Project data and email are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS in environment variables.'
            });
        }

        const transporter = createEmailTransporter();

        // Generate HTML report
        const htmlReport = generateHTMLReport(projectData);

        // Email options
        const mailOptions = {
            from: `ROI Dashboard <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `ROI Report for ${projectData.projectName}`,
            html: htmlReport,
            attachments: []
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({
            message: 'Email report sent successfully',
            email: email
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: 'Failed to send email report'
        });
    }
});

// Get project history endpoint
app.get('/api/history', async (req, res) => {
    try {
        const history = await readDataFile();
        res.json(history);
    } catch (error) {
        console.error('Error reading history:', error);
        res.status(500).json({
            error: 'Failed to retrieve project history'
        });
    }
});

// Save to history endpoint
app.post('/api/save-history', async (req, res) => {
    try {
        const historyEntry = req.body;
        
        // Validate required fields
        if (!historyEntry.projectName || 
            historyEntry.investment === undefined || 
            historyEntry.roi === undefined || 
            historyEntry.netBenefit === undefined) {
            return res.status(400).json({
                error: 'Missing required fields for history entry'
            });
        }

        const history = await readDataFile();
        
        // Add timestamp if not provided
        if (!historyEntry.date) {
            historyEntry.date = new Date().toISOString().split('T')[0];
        }

        // Add to beginning of array and keep only last 10 entries
        history.unshift(historyEntry);
        const trimmedHistory = history.slice(0, 10);

        await writeDataFile(trimmedHistory);

        res.json({
            message: 'History saved successfully',
            entry: historyEntry
        });

    } catch (error) {
        console.error('Error saving history:', error);
        res.status(500).json({
            error: 'Failed to save project history'
        });
    }
});

// Clear history endpoint
app.post('/api/clear-history', async (req, res) => {
    try {
        await writeDataFile([]);
        res.json({
            message: 'History cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({
            error: 'Failed to clear project history'
        });
    }
});

// Generate HTML report for email
function generateHTMLReport(projectData) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>ROI Report - ${projectData.projectName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { background: #0b132b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { margin: 20px 0; }
            .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .summary-table th { background-color: #5bc0be; color: white; }
            .summary-table tr:nth-child(even) { background-color: #f2f2f2; }
            .roi-positive { color: #28a745; font-weight: bold; }
            .roi-negative { color: #dc3545; font-weight: bold; }
            .roi-neutral { color: #6c757d; font-weight: bold; }
            .footer { margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ROI Evaluation Report</h1>
            <h2>${projectData.projectName}</h2>
            <p>Generated on ${currentDate}</p>
        </div>
        
        <div class="content">
            <h3>Project Summary</h3>
            <table class="summary-table">
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Investment</td>
                    <td>₹${projectData.investment.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Total Savings</td>
                    <td>₹${projectData.totalSavings.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Net Benefit</td>
                    <td>₹${projectData.netBenefit.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>ROI</td>
                    <td class="${projectData.roi > 0 ? 'roi-positive' : projectData.roi < 0 ? 'roi-negative' : 'roi-neutral'}">${projectData.roi}%</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td>${projectData.status}</td>
                </tr>
            </table>
            
            <h3>Savings Breakdown</h3>
            <table class="summary-table">
                <tr>
                    <th>Savings Component</th>
                    <th>Amount (₹)</th>
                </tr>
                <tr>
                    <td>Defect Reduction Savings</td>
                    <td>₹${projectData.defectSavings.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Productivity Gains</td>
                    <td>₹${projectData.productivityGains.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Time Savings</td>
                    <td>₹${projectData.timeSavings.toLocaleString()}</td>
                </tr>
            </table>
            
            <h3>Analysis</h3>
            <p>This Lean Six Sigma project demonstrates ${projectData.roi > 0 ? 'positive' : 'negative'} ROI of ${projectData.roi}%. 
            The total investment of ₹${projectData.investment.toLocaleString()} resulted in ${projectData.roi > 0 ? 'net benefits' : 'net losses'} of ₹${Math.abs(projectData.netBenefit).toLocaleString()}.</p>
            
            ${projectData.roi > 0 ? 
                '<p><strong>Recommendation:</strong> This project shows positive returns and should be considered for implementation or expansion.</p>' :
                '<p><strong>Recommendation:</strong> This project shows negative returns. Consider reviewing the approach or identifying additional benefits not captured in this analysis.</p>'
            }
        </div>
        
        <div class="footer">
            <p>Generated using ROI Evaluation Framework for Lean Six Sigma Projects in Software Development</p>
            <p>This report was automatically generated by the ROI Dashboard system.</p>
        </div>
    </body>
    </html>
    `;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve the main HTML file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ROI Evaluation Dashboard server running on port ${PORT}`);
    console.log(`📊 Access the dashboard at: http://localhost:${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    console.log(`📁 Data storage: ${__dirname}/data.json`);
});

module.exports = app;
