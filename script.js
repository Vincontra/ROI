// Global variables
let currentProjectData = null;
let beforeAfterChart = null;
let savingsChart = null;

// DOM Elements
const roiForm = document.getElementById('roiForm');
const resultsSection = document.getElementById('resultsSection');
const chartsSection = document.getElementById('chartsSection');
const reportSection = document.getElementById('reportSection');
const sendEmailBtn = document.getElementById('sendEmail');
const emailInput = document.getElementById('emailInput');
const clearHistoryBtn = document.getElementById('clearHistory');
const historyTableBody = document.getElementById('historyTableBody');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadProjectHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    roiForm.addEventListener('submit', handleFormSubmit);
    sendEmailBtn.addEventListener('click', sendEmailReport);
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Form submission handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(roiForm);
    const projectData = {
        projectName: formData.get('projectName'),
        investment: parseFloat(formData.get('investment')),
        baselineDefects: parseInt(formData.get('baselineDefects')),
        defectReduction: parseFloat(formData.get('defectReduction')),
        reworkCost: parseFloat(formData.get('reworkCost')),
        cycleTimeReduction: parseFloat(formData.get('cycleTimeReduction')),
        productivityIncrease: parseFloat(formData.get('productivityIncrease'))
    };
    
    // Validate form data
    if (!validateFormData(projectData)) {
        return;
    }
    
    try {
        showToast('Calculating ROI...', 'info');
        
        // Calculate ROI
        const roiResults = await calculateROI(projectData);
        currentProjectData = { ...projectData, ...roiResults };
        
        // Display results
        displayResults(roiResults);
        createCharts(roiResults);
        
        // Save to history
        await saveToHistory(currentProjectData);
        
        // Show sections
        resultsSection.style.display = 'block';
        chartsSection.style.display = 'block';
        reportSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        showToast('ROI calculated successfully!', 'success');
        
    } catch (error) {
        console.error('Error calculating ROI:', error);
        showToast('Error calculating ROI. Please try again.', 'error');
    }
}

// Form validation
function validateFormData(data) {
    if (!data.projectName.trim()) {
        showToast('Please enter a project name', 'error');
        return false;
    }
    
    if (data.investment <= 0) {
        showToast('Investment cost must be greater than 0', 'error');
        return false;
    }
    
    if (data.baselineDefects < 0) {
        showToast('Baseline defects cannot be negative', 'error');
        return false;
    }
    
    if (data.defectReduction < 0 || data.defectReduction > 100) {
        showToast('Defect reduction must be between 0 and 100%', 'error');
        return false;
    }
    
    if (data.reworkCost < 0) {
        showToast('Rework cost cannot be negative', 'error');
        return false;
    }
    
    if (data.cycleTimeReduction < 0 || data.cycleTimeReduction > 100) {
        showToast('Cycle time reduction must be between 0 and 100%', 'error');
        return false;
    }
    
    if (data.productivityIncrease < 0 || data.productivityIncrease > 100) {
        showToast('Productivity increase must be between 0 and 100%', 'error');
        return false;
    }
    
    return true;
}

// Calculate ROI
async function calculateROI(projectData) {
    try {
        const response = await fetch('/api/calculate-roi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate ROI');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error calling ROI API:', error);
        // Fallback to client-side calculation
        return calculateROIClientSide(projectData);
    }
}

// Client-side ROI calculation (fallback)
function calculateROIClientSide(data) {
    const defectSavings = data.baselineDefects * (data.defectReduction / 100) * data.reworkCost;
    const productivityGains = data.investment * (data.productivityIncrease / 100);
    const timeSavings = data.investment * (data.cycleTimeReduction / 100);
    
    const totalSavings = defectSavings + productivityGains + timeSavings;
    const netBenefit = totalSavings - data.investment;
    const roi = (netBenefit / data.investment) * 100;
    
    let status = 'Neutral';
    if (roi > 0) {
        status = 'Profitable project with positive ROI';
    } else if (roi < 0) {
        status = 'Project with negative ROI';
    }
    
    return {
        projectName: data.projectName,
        totalSavings: Math.round(totalSavings),
        netBenefit: Math.round(netBenefit),
        roi: Math.round(roi * 10) / 10,
        status: status,
        defectSavings: Math.round(defectSavings),
        productivityGains: Math.round(productivityGains),
        timeSavings: Math.round(timeSavings)
    };
}

// Display results
function displayResults(results) {
    // Animate number counters
    animateCounter('totalSavings', results.totalSavings, '₹');
    animateCounter('netBenefit', results.netBenefit, '₹');
    animateCounter('roiPercentage', results.roi, '%');
    
    // Update status
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    statusIndicator.className = 'status-indicator';
    if (results.roi > 0) {
        statusIndicator.classList.add('positive');
        statusText.textContent = 'Profitable';
    } else if (results.roi < 0) {
        statusIndicator.classList.add('negative');
        statusText.textContent = 'Loss';
    } else {
        statusIndicator.classList.add('neutral');
        statusText.textContent = 'Break-even';
    }
}

// Animate counter
function animateCounter(elementId, targetValue, prefix = '') {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(targetValue * progress);
        
        element.textContent = prefix + currentValue.toLocaleString();
        element.classList.add('animated');
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.classList.remove('animated');
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Create charts
function createCharts(results) {
    createBeforeAfterChart(results);
    createSavingsChart(results);
}

// Create before vs after chart
function createBeforeAfterChart(results) {
    const ctx = document.getElementById('beforeAfterChart').getContext('2d');
    
    if (beforeAfterChart) {
        beforeAfterChart.destroy();
    }
    
    const baselineData = {
        defects: currentProjectData.baselineDefects,
        cycleTime: 100,
        productivity: 100
    };
    
    const afterData = {
        defects: currentProjectData.baselineDefects * (1 - currentProjectData.defectReduction / 100),
        cycleTime: 100 - currentProjectData.cycleTimeReduction,
        productivity: 100 + currentProjectData.productivityIncrease
    };
    
    beforeAfterChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Defects', 'Cycle Time (%)', 'Productivity (%)'],
            datasets: [{
                label: 'Before',
                data: [baselineData.defects, baselineData.cycleTime, baselineData.productivity],
                backgroundColor: '#dc3545',
                borderColor: '#c82333',
                borderWidth: 1
            }, {
                label: 'After',
                data: [afterData.defects, afterData.cycleTime, afterData.productivity],
                backgroundColor: '#28a745',
                borderColor: '#1e7e34',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Before vs After Metrics'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create savings contribution chart
function createSavingsChart(results) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    if (savingsChart) {
        savingsChart.destroy();
    }
    
    savingsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Defect Reduction', 'Productivity Gains', 'Time Savings'],
            datasets: [{
                data: [results.defectSavings, results.productivityGains, results.timeSavings],
                backgroundColor: ['#5bc0be', '#3a506b', '#1c2541'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Savings Contribution Breakdown'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}


// Send Email Report
async function sendEmailReport() {
    if (!currentProjectData) {
        showToast('No project data available. Please calculate ROI first.', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    if (!email) {
        showToast('Please enter an email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        sendEmailBtn.classList.add('loading');
        sendEmailBtn.disabled = true;
        
        showToast('Sending email report...', 'info');
        
        const response = await fetch('/api/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectData: currentProjectData,
                email: email
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send email');
        }
        
        showToast('Email report sent successfully!', 'success');
        emailInput.value = '';
        
    } catch (error) {
        console.error('Error sending email:', error);
        showToast('Error sending email. Please try again.', 'error');
    } finally {
        sendEmailBtn.classList.remove('loading');
        sendEmailBtn.disabled = false;
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Save to history
async function saveToHistory(projectData) {
    try {
        const historyEntry = {
            projectName: projectData.projectName,
            investment: projectData.investment,
            roi: projectData.roi,
            netBenefit: projectData.netBenefit,
            date: new Date().toISOString().split('T')[0]
        };
        
        const response = await fetch('/api/save-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyEntry)
        });
        
        if (response.ok) {
            loadProjectHistory();
        }
    } catch (error) {
        console.error('Error saving to history:', error);
        // Fallback to localStorage
        saveToLocalStorage(projectData);
    }
}

// Fallback localStorage save
function saveToLocalStorage(projectData) {
    const historyEntry = {
        projectName: projectData.projectName,
        investment: projectData.investment,
        roi: projectData.roi,
        netBenefit: projectData.netBenefit,
        date: new Date().toISOString().split('T')[0]
    };
    
    let history = JSON.parse(localStorage.getItem('roiHistory') || '[]');
    history.unshift(historyEntry);
    history = history.slice(0, 5); // Keep only last 5 entries
    localStorage.setItem('roiHistory', JSON.stringify(history));
    
    loadProjectHistory();
}

// Load project history
async function loadProjectHistory() {
    try {
        const response = await fetch('/api/history');
        if (response.ok) {
            const history = await response.json();
            displayHistory(history);
        } else {
            // Fallback to localStorage
            const history = JSON.parse(localStorage.getItem('roiHistory') || '[]');
            displayHistory(history);
        }
    } catch (error) {
        console.error('Error loading history:', error);
        // Fallback to localStorage
        const history = JSON.parse(localStorage.getItem('roiHistory') || '[]');
        displayHistory(history);
    }
}

// Display history
function displayHistory(history) {
    historyTableBody.innerHTML = '';
    
    if (history.length === 0) {
        const row = historyTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No project history available';
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
        cell.style.color = '#6c757d';
        return;
    }
    
    history.forEach(entry => {
        const row = historyTableBody.insertRow();
        
        row.insertCell().textContent = entry.projectName;
        
        const roiCell = row.insertCell();
        const roiValue = parseFloat(entry.roi);
        roiCell.textContent = `${roiValue}%`;
        roiCell.style.color = roiValue > 0 ? '#28a745' : roiValue < 0 ? '#dc3545' : '#6c757d';
        roiCell.style.fontWeight = '600';
        
        row.insertCell().textContent = `₹${parseInt(entry.investment).toLocaleString()}`;
        row.insertCell().textContent = `₹${parseInt(entry.netBenefit).toLocaleString()}`;
        row.insertCell().textContent = entry.date;
    });
}

// Clear history
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all project history?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-history', {
            method: 'POST'
        });
        
        if (response.ok) {
            localStorage.removeItem('roiHistory');
            loadProjectHistory();
            showToast('History cleared successfully', 'success');
        } else {
            throw new Error('Failed to clear history');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        localStorage.removeItem('roiHistory');
        loadProjectHistory();
        showToast('History cleared successfully', 'success');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Export functions for testing
window.ROIApp = {
    calculateROIClientSide,
    validateFormData,
    isValidEmail,
    formatCurrency
};
