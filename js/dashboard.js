// Dashboard functionality for JEE Goal Tracker

// Chart instances and data cache
let weeklyChart = null;
let subjectChart = null;

// Store raw chart data separately from chart instances
const chartDataCache = {
    weekly: {
        labels: [],
        datasets: []
    },
    subject: {
        labels: [],
        datasets: []
    }
};

// Store chart configuration separately
const chartConfigs = {
    weekly: {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Daily Study Time (This Week)',
                    font: { size: 14, weight: '600' },
                    padding: { bottom: 10 }
                },
                tooltip: {
                    borderWidth: 1,
                    padding: 10,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            return hours > 0 ? 
                                `${hours}h ${minutes}m (${percentage}%)` : 
                                `${minutes}m (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Study Time' },
                    grid: { drawBorder: false, drawTicks: false },
                    border: { display: false },
                    ticks: {
                        callback: function(value) {
                            return value >= 60 ? 
                                Math.floor(value / 60) + 'h' : 
                                value + 'm';
                        },
                        maxTicksLimit: 6,
                        padding: 8
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false, drawTicks: false },
                    border: { display: false },
                    ticks: { padding: 8, font: { size: 12, weight: '500' } }
                }
            },
            animation: { duration: 800, easing: 'easeOutQuart' }
        }
    },
    subject: {
        type: 'doughnut',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        font: { size: 12, weight: '500' },
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Study Time by Subject',
                    font: { size: 14, weight: '600' },
                    padding: { bottom: 10 }
                },
                tooltip: {
                    borderWidth: 1,
                    padding: 10,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} min (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: { duration: 800, easing: 'easeOutQuart' }
        }
    }
};
let studyPatternsChart = null;
let performanceTrendsChart = null;
let topicMasteryChart = null;
let analyticsTimeChart = null;

// Current week for planner
let currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of current week (Sunday)

// Cache for dashboard data
const dashboardCache = {
    data: null,
    timestamp: 0,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
    
    // Check if cache is valid
    isValid: function() {
        return this.data && (Date.now() - this.timestamp) < this.CACHE_DURATION;
    },
    
    // Set cache data
    set: function(data) {
        this.data = data;
        this.timestamp = Date.now();
    },
    
    // Get cached data
    get: function() {
        return this.data;
    }
};

// Store the last used chart data globally
let lastChartData = {
    weekly: null,
    subject: null
};

// Toggle between light and dark theme
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark'; // Default to dark if not set
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('Toggling theme from', currentTheme, 'to', newTheme);
    
    // Store current chart data before any DOM updates
    if (weeklyChart) {
        lastChartData.weekly = {
            labels: [...weeklyChart.data.labels],
            datasets: JSON.parse(JSON.stringify(weeklyChart.data.datasets))
        };
    }
    
    if (subjectChart) {
        lastChartData.subject = {
            labels: [...subjectChart.data.labels],
            datasets: JSON.parse(JSON.stringify(subjectChart.data.datasets))
        };
    }
    
    // Update theme and save preference
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update all theme-related elements
    updateThemeIcon(newTheme === 'dark');
    updateThemeToggleIcon(newTheme);
    
    // Force a re-render of charts and other theme-dependent elements
    if (isDashboardVisible() && window.currentUser) {
        // Small delay to ensure theme is fully applied
        setTimeout(() => {
            // Re-render charts with stored data if available
            if (lastChartData.weekly && document.getElementById('weeklyChart')) {
                renderChartWithData('weeklyChart', lastChartData.weekly);
            }
            
            if (lastChartData.subject && document.getElementById('subjectChart')) {
                renderChartWithData('subjectChart', lastChartData.subject);
            }
            
            // Update chart colors
            updateChartTextColors();
        }, 50);
    }
    
    return newTheme;
}

// Helper function to render chart with existing data
function renderChartWithData(canvasId, chartData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (canvasId === 'weeklyChart' && weeklyChart) {
        weeklyChart.destroy();
    } else if (canvasId === 'subjectChart' && subjectChart) {
        subjectChart.destroy();
    }
    
    const textColor = getChartTextColor();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee';
    
    const config = {
        type: canvasId === 'weeklyChart' ? 'bar' : 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: canvasId === 'subjectChart',
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: canvasId === 'weeklyChart' ? 'Daily Study Time (This Week)' : 'Study Time by Subject',
                    color: textColor,
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#1e1e1e',
                    titleColor: getChartTextColor(),
                    bodyColor: getChartTextColor(),
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 10,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            
                            if (canvasId === 'weeklyChart') {
                                const hours = Math.floor(value / 60);
                                const minutes = value % 60;
                                return hours > 0 ? 
                                    `${hours}h ${minutes}m (${percentage}%)` : 
                                    `${minutes}m (${percentage}%)`;
                            } else {
                                return `${context.label}: ${value} min (${percentage}%)`;
                            }
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            },
            cutout: canvasId === 'subjectChart' ? '70%' : undefined
        }
    };
    
    // Add scales for bar chart
    if (canvasId === 'weeklyChart') {
        config.options.scales = {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Study Time',
                    color: textColor,
                    font: {
                        weight: '500',
                        size: 12
                    }
                },
                grid: {
                    color: gridColor,
                    drawBorder: false,
                    drawTicks: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: textColor,
                    callback: function(value) {
                        if (value >= 60) {
                            return Math.floor(value / 60) + 'h';
                        }
                        return value + 'm';
                    },
                    maxTicksLimit: 6,
                    padding: 8
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                    drawTicks: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: textColor,
                    padding: 8,
                    font: {
                        size: 12,
                        weight: '500'
                    }
                }
            }
        };
    }
    
    // Create and store the chart instance
    const chart = new Chart(ctx, config);
    
    if (canvasId === 'weeklyChart') {
        weeklyChart = chart;
    } else if (canvasId === 'subjectChart') {
        subjectChart = chart;
    }
    
    return chart;
}

// Update theme icon based on current theme
function updateThemeIcon(isDark) {
    const themeIcons = document.querySelectorAll('.theme-icon, #themeIcon');
    themeIcons.forEach(icon => {
        if (icon) {
            icon.className = isDark ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
        }
    });
}

// Initialize theme toggle
function initThemeToggle() {
    // Check for saved theme preference or use system preference
    let savedTheme = localStorage.getItem('theme');
    
    if (!savedTheme) {
        // If no saved theme, use system preference
        savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        localStorage.setItem('theme', savedTheme);
    }
    
    console.log('Initial theme:', savedTheme);
    
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme === 'dark');
    updateThemeToggleIcon(savedTheme);
    
    // Toggle theme on button click
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Remove any existing event listeners to prevent duplicates
        const newToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newToggle, themeToggle);
        
        // Add new event listener
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const newTheme = toggleTheme();
            // Dispatch a custom event that other components can listen to
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }
    
    // Add a style element to ensure the theme is applied before any content renders
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = `
        :root[data-theme="light"] {
            --background-color: #f5f5f5;
            --surface-color: #ffffff;
            --surface-light: #f0f0f0;
            --surface-lighter: #e0e0e0;
            --text-primary: #212121;
            --text-secondary: #424242;
            --text-disabled: #9e9e9e;
            --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --input-bg: #ffffff;
            --border-color: #ddd;
            --icon-invert: 0;
        }
        :root[data-theme="dark"] {
            --primary-color: #6c63ff;
            --primary-light: #9c94ff;
            --primary-dark: #4a45b1;
            --secondary-color: #4a45b1;
            --background-color: #121212;
            --surface-color: #1e1e1e;
            --surface-light: #2d2d2d;
            --surface-lighter: #3a3a3a;
            --text-primary: #ffffff;
            --text-secondary: #b3b3b3;
            --text-disabled: #6d6d6d;
            --success-color: #4caf50;
            --warning-color: #ff9800;
            --error-color: #f44336;
            --info-color: #2196f3;
            --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            --input-bg: #2d2d2d;
            --border-color: #444;
            --primary-rgb: 108, 99, 255;
            --icon-invert: 1;
        }
    `;
    document.head.appendChild(style);
}

// Update theme toggle icon based on current theme
function updateThemeToggleIcon(theme) {
    const themeIcon = document.querySelector('#themeToggle i');
    if (!themeIcon) return;
    
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Set up navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    
    navLinks.forEach(link => {
        // Skip dropdown toggle links (handled separately)
        if (link.classList.contains('dropdown-toggle')) return;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the section ID from data attribute
            const sectionId = link.getAttribute('data-section');
            if (!sectionId) return; // Skip if no data-section attribute
            
            // Remove active class from all main nav links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected section
            const sectionElement = document.getElementById(`${sectionId}Section`);
            if (sectionElement) {
                sectionElement.style.display = 'block';
                
                // Load data for the section if needed
                switch(sectionId) {
                    case 'dashboard':
                        setTimeout(() => {
                            loadDashboardData().catch(error => {
                                console.error('Error loading dashboard data:', error);
                                showMessage('Error loading dashboard data. Please try again.', true);
                            });
                        }, 50);
                        break;
                    case 'analytics':
                        loadAnalyticsData();
                        break;
                    case 'planner':
                        updatePlannerUI();
                        break;
                    // No need for default case as we only handle specific sections
                }
            } else {
                // Fallback to dashboard if section not found
                document.getElementById('dashboardSection').style.display = 'block';
                document.querySelector('[data-section="dashboard"]').classList.add('active');
                loadDashboardData();
            }
        });
    });
}

// Load dashboard data and render charts
async function loadDashboardData() {
    // Get current user from app.js or auth
    const currentUser = window.currentUser || firebase.auth().currentUser;
    if (!currentUser) {
        console.error('User not authenticated');
        return;
    }
    
    // Show loading state immediately for better UX
    updateLoadingState('dashboard', true);
    
    try {
        let goals = [];
        
        // Check if we have valid cached data
        if (dashboardCache.isValid()) {
            goals = dashboardCache.get();
            updateDashboardFromCache(goals);
            return; // Use cached data
        }
        
        // If no valid cache, fetch fresh data
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        
        // Optimize the query by limiting to last 30 days at most
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setDate(today.getDate() - 30);
        
        // Get goals from the past month (cached for a week)
        
        // Get user's goals from Firestore
        const db = firebase.firestore();
        let userGoalsSnapshot;
        
        try {
            console.log('Fetching goals from Firestore...');
            userGoalsSnapshot = await db.collection('goals')
                .where('userId', '==', currentUser.uid)
                .orderBy('date', 'desc')
                .get();
                
            console.log(`Successfully fetched ${userGoalsSnapshot.size} goals from Firestore`);
            
            // Log the first few goals to verify data
            const sampleGoals = userGoalsSnapshot.docs.slice(0, 3).map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Sample goals:', sampleGoals);
            
        } catch (error) {
            console.error('Firestore query error:', error);
            // Try a more permissive query if the first one fails
            try {
                console.log('Trying alternative query without sorting...');
                userGoalsSnapshot = await db.collection('goals')
                    .where('userId', '==', currentUser.uid)
                    .get();
                console.log(`Alternative query returned ${userGoalsSnapshot.size} goals`);
            } catch (innerError) {
                console.error('Alternative query also failed:', innerError);
                throw new Error('Failed to fetch goals from database. Please check your internet connection and try again.');
            }
        }
            
        const userGoals = userGoalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Fetched ${userGoals.length} goals from Firestore`, userGoals);
        
        if (userGoals.length === 0) {
            console.log('No goals found for user');
            showMessage('No study data found. Start by adding some study goals!', false);
        }
        
        // Update cache
        dashboardCache.set(userGoals);
        
        // Update the dashboard with the fresh data
        updateDashboardStats(userGoals);
        
        // Ensure chart containers exist
        const weeklyChartEl = document.getElementById('weeklyChart');
        const subjectChartEl = document.getElementById('subjectChart');
        
        if (!weeklyChartEl || !subjectChartEl) {
            console.error('Chart containers not found in DOM');
            console.log('weeklyChart element exists:', !!weeklyChartEl);
            console.log('subjectChart element exists:', !!subjectChartEl);
            showMessage('Error: Chart containers not found', true);
            return;
        }
        
        // Clear any existing error messages
        const existingErrors = document.querySelectorAll('.chart-error');
        existingErrors.forEach(el => el.remove());
        
        // Process goals data to ensure consistent format
        const processedGoals = userGoals.map(goal => ({
            ...goal,
            // Ensure timeSpent is a number and convert from hours to minutes if needed
            timeSpent: typeof goal.timeSpent === 'number' ? goal.timeSpent : 
                      (typeof goal.time === 'number' ? goal.time * 60 : 0),
            // Ensure subject exists
            subject: goal.subject || 'Uncategorized'
        }));
        
        console.log('Processed goals for charts:', processedGoals);
        
        // Render charts with the processed data
        try {
            renderWeeklyChart(processedGoals);
            renderSubjectChart(processedGoals);
            
            // Force chart update after a short delay to ensure proper rendering
            setTimeout(() => {
                if (weeklyChart) weeklyChart.update();
                if (subjectChart) subjectChart.update();
                console.log('Charts should now be visible');
            }, 100);
            
        } catch (chartError) {
            console.error('Error rendering charts:', chartError);
            showMessage('Error rendering charts. Please try refreshing the page.', true);
        }
        
    } catch (error) {
        console.error('Error in loadDashboardData:', error);
        showMessage(error.message || 'Failed to load dashboard data. Please try again.', true);
    } finally {
        updateLoadingState('dashboard', false);
    }
}

// Update dashboard from cached data
function updateDashboardFromCache(goals) {
    if (!goals || !goals.length) return;
    updateDashboardStats(goals);
    
    // Only update charts if they're already rendered
    if (document.getElementById('weeklyChart')) {
        renderWeeklyChart(goals);
    }
    if (document.getElementById('subjectChart')) {
        renderSubjectChart(goals);
    }
}

// Load analytics data
async function loadAnalyticsData() {
    if (!currentUser) return;
    
    try {
        updateLoadingState('analytics', true);
        
        // Try to get cached data first
        if (dashboardCache.isValid()) {
            const goals = dashboardCache.get();
            updateAnalyticsCharts(goals);
            return;
        }
        
        // If no cache, fetch fresh data
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const goalsSnapshot = await db.collection('goals')
            .where('userId', '==', currentUser.uid)
            .where('date', '>=', oneMonthAgo.toISOString().split('T')[0])
            .orderBy('date')
            .get({ source: 'cache' })
            .catch(() => 
                db.collection('goals')
                    .where('userId', '==', currentUser.uid)
                    .where('date', '>=', oneMonthAgo.toISOString().split('T')[0])
                    .orderBy('date')
                    .get()
            );
        
        const goals = [];
        goalsSnapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });
        
        // Update charts
        updateAnalyticsCharts(goals);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showMessage('Failed to load analytics data. Please try again.', true);
    } finally {
        updateLoadingState('analytics', false);
    }
}

// Update analytics charts with data
function updateAnalyticsCharts(goals) {
    if (!goals || !goals.length) {
        showMessage('No data available for analytics yet. Complete some study goals first!');
        return;
    }
    
    // Render or update charts
    renderAnalyticsTimeChart(goals);
    renderPerformanceTrendsChart(goals);
    renderTopicMasteryChart(goals);
    renderStudyPatternsChart(goals);
}

// Initialize the study planner
function initializePlanner() {
    // Set up initial planner UI
    updatePlannerUI();
}

// Update the planner UI with the current week
function updatePlannerUI() {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Update week range display
    const weekRangeEl = document.getElementById('currentWeekRange');
    if (weekRangeEl) {
        weekRangeEl.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }
    
    // Generate day cards for the week
    generateWeekView(weekStart);
}

// Generate the week view for the planner
function generateWeekView(startDate) {
    const plannerEl = document.getElementById('weeklyPlanner');
    if (!plannerEl) return;
    
    // Clear existing content
    plannerEl.innerHTML = '';
    
    // Generate a day card for each day of the week
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `
            <h4>${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</h4>
            <ul class="task-list" id="tasks-${formatDate(currentDate, 'YYYY-MM-DD')}">
                <li class="task-item">
                    <span>No tasks scheduled</span>
                </li>
            </ul>
            <button class="btn btn-sm btn-outline mt-2 add-task" data-date="${formatDate(currentDate, 'YYYY-MM-DD')}">
                <i class="fas fa-plus"></i> Add Task
            </button>
        `;
        
        plannerEl.appendChild(dayCard);
    }
    
    // Add event listeners to the new task buttons
    document.querySelectorAll('.add-task').forEach(button => {
        button.addEventListener('click', (e) => {
            const date = e.target.getAttribute('data-date');
            addNewTask(date);
        });
    });
}

// Add a new task to the planner
function addNewTask(date) {
    // In a real implementation, this would open a modal or form
    // For now, we'll just log the action
    console.log(`Adding new task for ${date}`);
    showMessage('Click "Generate Plan" to automatically create a study plan for the week.');
}

// Generate a study plan for the week
async function generateStudyPlan() {
    if (!currentUser) return;
    
    try {
        // Show loading state
        const generateBtn = document.getElementById('generatePlan');
        const originalText = generateBtn.innerHTML;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Simulate API call or complex calculation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        showMessage('Study plan generated successfully!', false);
        
        // In a real implementation, this would update the planner with the generated tasks
        // For now, we'll just show a message
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            list.innerHTML = `
                <li class="task-item">
                    <span>Mathematics: 2 hours</span>
                    <div class="task-actions">
                        <button class="btn-icon" title="Mark as complete"><i class="far fa-check-circle"></i></button>
                    </div>
                </li>
                <li class="task-item">
                    <span>Physics: 1.5 hours</span>
                    <div class="task-actions">
                        <button class="btn-icon" title="Mark as complete"><i class="far fa-check-circle"></i></button>
                    </div>
                </li>
            `;
        });
        
    } catch (error) {
        console.error('Error generating study plan:', error);
        showMessage('Failed to generate study plan. Please try again.', true);
    } finally {
        const generateBtn = document.getElementById('generatePlan');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Plan';
        }
    }
}

// Set up event listeners for dashboard
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Planner navigation
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const generatePlanBtn = document.getElementById('generatePlan');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updatePlannerUI();
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updatePlannerUI();
        });
    }
    
    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', generateStudyPlan);
    }
    
    // Add task buttons (delegated event listener for dynamically added elements)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-task')) {
            const button = e.target.closest('.add-task');
            const date = button.getAttribute('data-date');
            addNewTask(date);
        }
        
        // Handle task completion
        if (e.target.closest('.task-actions .btn-icon')) {
            const button = e.target.closest('.btn-icon');
            const taskItem = button.closest('.task-item');
            if (taskItem) {
                taskItem.classList.toggle('completed');
                // Add your task completion logic here
            }
        }
    });
}

// Helper function to format dates
function formatDate(date, format = 'MMM D, YYYY') {
    if (!date) return '';
    const d = new Date(date);
    
    // Simple formatting - in a real app, use a library like date-fns or moment.js
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    if (format === 'YYYY-MM-DD') {
        return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    return `${month} ${day}, ${year}`;
}

// Update dashboard statistics
function updateDashboardStats(goals) {
    // Update UI immediately with available data
    if (!goals || !goals.length) {
        // Set default values if no goals found
        document.getElementById('totalStudyTime').textContent = '0h 0m';
        document.getElementById('goalsCompleted').textContent = '0';
        document.getElementById('focusSubject').textContent = '-';
        document.getElementById('focusSubjectTime').textContent = '0h this week';
        document.getElementById('currentStreak').textContent = '0 days';
        return;
    }
    
    // Calculate total study time
    const totalMinutes = goals.reduce((total, goal) => {
        return total + (parseInt(goal.timeSpent) || 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Update UI
    document.getElementById('totalStudyTime').textContent = `${hours}h ${minutes}m`;
    
    // Calculate completed goals
    const completedGoals = goals.filter(goal => goal.completed).length;
    document.getElementById('goalsCompleted').textContent = completedGoals;
    
    // Calculate focus subject (most time spent)
    const subjectTime = {};
    goals.forEach(goal => {
        if (!goal.subject) return;
        
        const subject = goal.subject.trim();
        const time = parseInt(goal.timeSpent) || 0;
        
        if (!subjectTime[subject]) {
            subjectTime[subject] = 0;
        }
        subjectTime[subject] += time;
    });
    
    let focusSubject = 'None';
    let maxTime = 0;
    
    Object.entries(subjectTime).forEach(([subject, time]) => {
        if (time > maxTime) {
            maxTime = time;
            focusSubject = subject;
        }
    });
    
    document.getElementById('focusSubject').textContent = focusSubject;
    document.getElementById('focusSubjectTime').textContent = `${Math.round(maxTime / 60 * 10) / 10}h this week`;
    
    // Calculate streak (simplified - would need more complex logic with dates)
    document.getElementById('currentStreak').textContent = '1 day';
    
    // Update change indicators (simplified)
    const studyTimeChange = document.getElementById('studyTimeChange');
    const goalsChange = document.getElementById('goalsChange');
    
    if (studyTimeChange && goalsChange) {
        // These would be calculated by comparing with previous period
        const timeChange = 12; // percentage
        const goalsChangePercent = 8; // percentage
        
        studyTimeChange.innerHTML = `<i class="fas fa-arrow-${timeChange >= 0 ? 'up' : 'down'}"></i> ${Math.abs(timeChange)}% from last week`;
        goalsChange.innerHTML = `<i class="fas fa-arrow-${goalsChangePercent >= 0 ? 'up' : 'down'}"></i> ${Math.abs(goalsChangePercent)}% from last week`;
        
        if (timeChange < 0) {
            studyTimeChange.classList.add('negative');
        } else {
            studyTimeChange.classList.remove('negative');
        }
        
        if (goalsChangePercent < 0) {
            goalsChange.classList.add('negative');
        } else {
            goalsChange.classList.remove('negative');
        }
    }
}

// Render weekly study time chart with optimizations
function renderWeeklyChart(goals) {
    console.log('=== RENDER WEEKLY CHART ===');
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) {
        console.error('Weekly chart container not found');
        return;
    }
    
    // Get theme colors
    const textColor = getChartTextColor();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee';
    const tooltipBg = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#1e1e1e';
    
    // Update chart configuration with current theme
    const config = {
        ...chartConfigs.weekly,
        options: {
            ...chartConfigs.weekly.options,
            plugins: {
                ...chartConfigs.weekly.options.plugins,
                title: {
                    ...chartConfigs.weekly.options.plugins.title,
                    color: textColor
                },
                tooltip: {
                    ...chartConfigs.weekly.options.plugins.tooltip,
                    backgroundColor: tooltipBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor
                }
            },
            scales: {
                ...chartConfigs.weekly.options.scales,
                y: {
                    ...chartConfigs.weekly.options.scales.y,
                    title: {
                        ...chartConfigs.weekly.options.scales.y.title,
                        color: textColor
                    },
                    grid: {
                        ...chartConfigs.weekly.options.scales.y.grid,
                        color: gridColor
                    },
                    ticks: {
                        ...chartConfigs.weekly.options.scales.y.ticks,
                        color: textColor
                    }
                },
                x: {
                    ...chartConfigs.weekly.options.scales.x,
                    ticks: {
                        ...chartConfigs.weekly.options.scales.x.ticks,
                        color: textColor
                    }
                }
            }
        }
    };
    
    // Destroy existing chart if it exists
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    // Process data for the current week (7 days)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    console.log(`Processing data for current week: ${startOfWeek.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // Initialize daily data for current week
    const dailyData = {};
    const dayLabels = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize each day of the week
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const dayKey = currentDate.toISOString().split('T')[0];
        const dayLabel = weekdays[currentDate.getDay()];
        
        dayLabels.push(dayLabel);
        dailyData[dayKey] = {
            label: dayLabel,
            total: 0,
            date: new Date(currentDate)
        };
    }
    
    // Store the labels in our cache
    chartDataCache.weekly.labels = dayLabels;
    
    console.log('Initialized daily data for current week:', dailyData);
    
    // Process each goal
    if (Array.isArray(goals)) {
        console.log(`Processing ${goals.length} goals`);
        let goalsInRange = 0;
        
        goals.forEach((goal, index) => {
            if (!goal.date) {
                console.warn(`Goal at index ${index} has no date`, goal);
                return;
            }
            
            // Parse the goal date and normalize to start of day for comparison
            let goalDate;
            if (typeof goal.date === 'string') {
                // Handle both YYYY-MM-DD and full ISO strings
                goalDate = new Date(goal.date);
                if (goal.date.includes('T')) {
                    goalDate = new Date(goal.date.split('T')[0]);
                }
            } else if (goal.date.toDate) {
                // Handle Firestore Timestamp
                goalDate = goal.date.toDate();
            } else if (goal.date instanceof Date) {
                goalDate = new Date(goal.date);
            } else {
                console.warn(`Invalid date format for goal at index ${index}:`, goal.date);
                return;
            }
            
            if (isNaN(goalDate.getTime())) {
                console.warn(`Invalid date for goal at index ${index}:`, goal.date);
                return;
            }
            
            // Normalize to start of day for comparison
            goalDate.setHours(0, 0, 0, 0);
            const goalDateStr = goalDate.toISOString().split('T')[0];
            
            // Skip if not in the current week
            if (goalDate < startOfWeek || goalDate > today) {
                return;
            }
            
            // Add to daily data
            const timeSpent = parseInt(goal.timeSpent) || 0;
            if (dailyData[goalDateStr]) {
                dailyData[goalDateStr].total += timeSpent;
                console.log(`Added ${timeSpent} minutes to ${goalDateStr} (${dailyData[goalDateStr].label})`);
            } else {
                console.log(`Goal on ${goalDateStr} is outside the current week view`);
            }
            
            goalsInRange++;
        });
        
        console.log(`Processed ${goalsInRange} goals within date range`);
        console.log('Daily data after processing:', dailyData);
    } else {
        console.warn('Goals is not an array:', goals);
    }
    
    // Convert to arrays for chart
    const studyTimes = dayLabels.map(dayLabel => {
        const dayData = Object.values(dailyData).find(d => d.label === dayLabel);
        return dayData ? dayData.total : 0;
    });
    
    // Store the dataset in our cache
    chartDataCache.weekly.datasets = [{
        label: 'Study Time',
        data: studyTimes,
        backgroundColor: 'rgba(108, 99, 255, 0.6)',
        borderColor: 'rgba(108, 99, 255, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9
    }];

    try {
        // Create the chart with our configuration and cached data
        weeklyChart = new Chart(ctx.getContext('2d'), {
            ...config,
            data: {
                labels: chartDataCache.weekly.labels,
                datasets: chartDataCache.weekly.datasets
            },
            options: {
                ...config.options,
                // Ensure we have the latest theme colors
                plugins: {
                    ...config.options.plugins,
                    tooltip: {
                        ...config.options.plugins.tooltip,
                        borderColor: gridColor,
                        backgroundColor: tooltipBg,
                        titleColor: textColor,
                        bodyColor: textColor
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Daily Study Time (This Week)',
                        color: textColor,
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: {
                            bottom: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const hours = Math.floor(context.raw / 60);
                                const minutes = context.raw % 60;
                                const timeString = hours > 0 ? 
                                    `${hours} hr ${minutes} min` : 
                                    `${minutes} min`;
                                return timeString;
                            },
                            title: function(context) {
                                const dayIndex = context[0].dataIndex;
                                const dayData = dailyData[Object.keys(dailyData)[dayIndex]];
                                if (dayData) {
                                    const dateStr = dayData.date.toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    });
                                    return dateStr;
                                }
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Study Time',
                            color: textColor,
                            font: {
                                weight: '500',
                                size: 12
                            }
                        },
                        grid: {
                            color: gridColor,
                            drawBorder: false,
                            drawTicks: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                if (value >= 60) {
                                    return Math.floor(value / 60) + 'h';
                                }
                                return value + 'm';
                            },
                            maxTicksLimit: 6,
                            padding: 8
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false,
                            drawTicks: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            padding: 8,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        right: 15,
                        left: 15,
                        bottom: 10
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error rendering weekly chart:', error);
        showMessage('Error loading study time data. Please try refreshing the page.', true);
    }
}

// Render subject distribution chart
function renderSubjectChart(goals) {
    console.log('=== RENDER SUBJECT CHART ===');
    
    // Get theme colors
    const textColor = getChartTextColor();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee';
    const tooltipBg = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#1e1e1e';
    
    // Get the chart container and clear any existing content
    const chartContainer = document.getElementById('subjectChart').parentElement;
    const existingCanvas = document.getElementById('subjectChart');
    const existingMessages = chartContainer.querySelectorAll('.error-message, .no-data-message');
    
    // Clear any previous content
    existingMessages.forEach(el => el.remove());
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Create new canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'subjectChart';
    chartContainer.appendChild(canvas);
    
    // Filter out goals without subjects or time spent
    const validGoals = (goals || []).filter(goal => 
        goal && 
        goal.subject && 
        typeof goal.timeSpent === 'number' && 
        goal.timeSpent > 0
    );
    
    if (validGoals.length === 0) {
        console.warn('No valid subject data to display');
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'no-data-message';
        noDataMessage.innerHTML = `
            <i class="fas fa-chart-pie"></i>
            <h4>No Subject Data Available</h4>
            <p>Start adding study goals with subjects to see your study distribution.</p>
            <a href="#goals" class="btn btn-primary">Add Study Goal</a>
        `;
        chartContainer.appendChild(noDataMessage);
        return;
    }
    
    // Group by subject and calculate total time spent
    const subjectData = {};
    validGoals.forEach(goal => {
        if (!subjectData[goal.subject]) {
            subjectData[goal.subject] = 0;
        }
        subjectData[goal.subject] += goal.timeSpent;
    });
    
    // Convert to arrays for chart and sort by time spent (descending)
    const sortedSubjects = Object.entries(subjectData)
        .map(([subject, time]) => ({
            subject,
            time,
            hours: (time / 60).toFixed(1) + 'h'  // Convert minutes to hours for display
        }))
        .sort((a, b) => b.time - a.time);
    
    // Take top 5 subjects for the chart
    const topSubjects = sortedSubjects.slice(0, 5);
    
    // Check if we have any data to display
    if (topSubjects.length === 0) {
        console.log('No subject data available for the chart');
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'no-data-message';
        noDataMessage.style.color = 'var(--text-secondary)';
        noDataMessage.style.padding = '20px';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.innerHTML = 'No subject data available.<br>Complete some study goals to see your subject distribution.';
        
        // Hide the canvas and show the message
        canvas.style.display = 'none';
        chartContainer.appendChild(noDataMessage);
        return;
    }
    
    // Show the canvas if it was hidden
    canvas.style.display = 'block';
    
    // Prepare chart data
    const labels = topSubjects.map(item => item.subject);
    const data = topSubjects.map(item => item.time);
    
    // Store the data in our cache
    chartDataCache.subject.labels = labels;
    
    // Generate colors for each subject
    const backgroundColors = [
        'rgba(108, 99, 255, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)'
    ];
    
    // Store the dataset in our cache
    chartDataCache.subject.datasets = [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
        hoverOffset: 4
    }];
    
    console.log('Processed subject data:', sortedSubjects);
    
    // Get the chart context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context for subject chart');
        return;
    }
    
    // Update chart configuration with current theme
    const config = {
        ...chartConfigs.subject,
        data: {
            labels: chartDataCache.subject.labels,
            datasets: chartDataCache.subject.datasets
        },
        options: {
            ...chartConfigs.subject.options,
            plugins: {
                ...chartConfigs.subject.options.plugins,
                title: {
                    ...chartConfigs.subject.options.plugins.title,
                    color: textColor
                },
                legend: {
                    ...chartConfigs.subject.options.plugins.legend,
                    labels: {
                        ...chartConfigs.subject.options.plugins.legend.labels,
                        color: textColor
                    }
                },
                tooltip: {
                    ...chartConfigs.subject.options.plugins.tooltip,
                    backgroundColor: tooltipBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor
                }
            }
        }
    };
    
    // Destroy existing chart if it exists
    if (subjectChart) {
        subjectChart.destroy();
    }
    
    // Create the chart
    try {
        console.log('Creating new subject chart with configuration:', config);
        subjectChart = new Chart(ctx, config);
    } catch (error) {
        console.error('Error rendering subject chart:', error);
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.color = 'var(--error-color)';
        errorMessage.style.padding = '15px';
        errorMessage.style.margin = '10px 0';
        errorMessage.style.borderRadius = '4px';
        errorMessage.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        errorMessage.style.textAlign = 'center';
        errorMessage.textContent = 'Error loading chart data. Please refresh the page or try again later.';
        
        // Hide the canvas and show the error message
        ctx.canvas.style.display = 'none';
        ctx.canvas.parentElement.appendChild(errorMessage);
    }
}

// Update loading state for a section
function updateLoadingState(sectionId, isLoading) {
    const section = document.getElementById(`${sectionId}Section`);
    if (!section) return;
    
    if (isLoading) {
        section.classList.add('loading');
    } else {
        section.classList.remove('loading');
    }
}

// Analytics data loading is handled by the main loadAnalyticsData function above

// Load study planner (placeholder for now)
function loadStudyPlanner() {
    // This would be implemented to load and display the study planner
    console.log('Loading study planner...');
}

// Show a message to the user
function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = isError ? 'error' : 'success';
        messageDiv.style.display = 'block';

        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Change password functionality
function setupChangePassword() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (!changePasswordBtn) return;

    changePasswordBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent dropdown from closing
        
        // Close any open dropdowns
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        // Create modal for change password
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        modal.innerHTML = `
            <div class="modal-content" style="background: var(--bg-color); padding: 20px; border-radius: 8px; width: 90%; max-width: 500px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Change Password</h3>
                    <button type="button" class="btn-close" id="closeChangePassword" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <form id="changePasswordForm">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="currentPassword" style="display: block; margin-bottom: 5px;">Current Password</label>
                        <input type="password" id="currentPassword" required style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="newPassword" style="display: block; margin-bottom: 5px;">New Password</label>
                        <input type="password" id="newPassword" required minlength="6" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="confirmPassword" style="display: block; margin-bottom: 5px;">Confirm New Password</label>
                        <input type="password" id="confirmPassword" required minlength="6" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                    </div>
                    <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn btn-secondary" id="cancelChangePassword" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Update Password</button>
                    </div>
                </form>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#changePasswordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showMessage('New passwords do not match', true);
                return;
            }
            
            try {
                const user = firebase.auth().currentUser;
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );
                
                // Re-authenticate user
                await user.reauthenticateWithCredential(credential);
                
                // Update password
                await user.updatePassword(newPassword);
                
                showMessage('Password updated successfully!');
                modal.remove();
            } catch (error) {
                console.error('Error updating password:', error);
                showMessage(error.message || 'Failed to update password', true);
            }
        });
        
        // Handle cancel button
        const cancelBtn = modal.querySelector('#cancelChangePassword');
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    });
}

// Export functions that need to be accessible from other files
window.dashboardFunctions = {
    loadDashboardData,
    updatePlannerUI,
    generateStudyPlan,
    showMessage,
    setupChangePassword,
    getChartTextColor,
    updateChartTextColors
};

// Set chart text colors based on theme
function getChartTextColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
}

// Update chart text colors when theme changes
function updateChartTextColors() {
    const textColor = getChartTextColor();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee';
    const tooltipBg = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#1e1e1e';
    const tooltipText = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff';
    
    // Update weekly chart if it exists
    if (weeklyChart) {
        // Store current data and options
        const data = weeklyChart.data;
        const options = weeklyChart.options;
        
        // Update colors in options
        options.scales.x.ticks.color = textColor;
        options.scales.y.ticks.color = textColor;
        options.scales.x.title.color = textColor;
        options.scales.y.title.color = textColor;
        options.scales.x.grid.color = gridColor;
        options.scales.y.grid.color = gridColor;
        
        // Update tooltip colors
        if (!options.plugins) options.plugins = {};
        if (!options.plugins.tooltip) options.plugins.tooltip = {};
        if (!options.plugins.tooltip.mode) options.plugins.tooltip.mode = 'index';
        if (!options.plugins.tooltip.intersect) options.plugins.tooltip.intersect = false;
        
        options.plugins.tooltip.backgroundColor = tooltipBg;
        options.plugins.tooltip.titleColor = tooltipText;
        options.plugins.tooltip.bodyColor = tooltipText;
        options.plugins.tooltip.borderColor = gridColor;
        
        // Update legend if it exists
        if (options.plugins.legend) {
            options.plugins.legend.labels.color = textColor;
        }
        
        // Update title if it exists
        if (options.plugins.title) {
            options.plugins.title.color = textColor;
        }
        
        // Update the chart with preserved data and updated options
        weeklyChart.update('none');
    }
    
    // Update subject chart if it exists
    if (subjectChart) {
        try {
            if (subjectChart.options && subjectChart.options.plugins && subjectChart.options.plugins.legend) {
                subjectChart.options.plugins.legend.labels.color = textColor;
                subjectChart.update();
            }
        } catch (error) {
            console.error('Error updating subject chart colors:', error);
        }
    }
    
    // Update study patterns chart if it exists
    if (studyPatternsChart) {
        try {
            if (studyPatternsChart.options && studyPatternsChart.options.scales) {
                if (studyPatternsChart.options.scales.x) {
                    studyPatternsChart.options.scales.x.ticks = studyPatternsChart.options.scales.x.ticks || {};
                    studyPatternsChart.options.scales.x.ticks.color = textColor;
                    studyPatternsChart.options.scales.x.grid = studyPatternsChart.options.scales.x.grid || {};
                    studyPatternsChart.options.scales.x.grid.color = gridColor;
                }
                if (studyPatternsChart.options.scales.y) {
                    studyPatternsChart.options.scales.y.ticks = studyPatternsChart.options.scales.y.ticks || {};
                    studyPatternsChart.options.scales.y.ticks.color = textColor;
                    studyPatternsChart.options.scales.y.grid = studyPatternsChart.options.scales.y.grid || {};
                    studyPatternsChart.options.scales.y.grid.color = gridColor;
                }
                studyPatternsChart.update();
            }
        } catch (error) {
            console.error('Error updating study patterns chart colors:', error);
        }
    }
}

// Function to check if dashboard section is visible
function isDashboardVisible() {
    const dashboardSection = document.getElementById('dashboardSection');
    return dashboardSection && window.getComputedStyle(dashboardSection).display !== 'none';
}

// Function to handle dashboard visibility changes
function handleDashboardVisibility() {
    if (isDashboardVisible() && window.currentUser) {
        console.log('Dashboard section became visible, loading data...');
        loadDashboardData().catch(error => {
            console.error('Error loading dashboard data:', error);
            showMessage('Error loading dashboard data. Please try refreshing the page.', true);
        });
    }
}

// Chart instances are declared at the top of the file

// Clean up dashboard resources
function cleanupDashboard() {
    console.log('Cleaning up dashboard resources...');
    
    // Destroy all chart instances
    if (weeklyChart) {
        weeklyChart.destroy();
        weeklyChart = null;
    }
    if (subjectChart) {
        subjectChart.destroy();
        subjectChart = null;
    }
    if (studyPatternsChart) {
        studyPatternsChart.destroy();
        studyPatternsChart = null;
    }
    if (performanceTrendsChart) {
        performanceTrendsChart.destroy();
        performanceTrendsChart = null;
    }
    if (topicMasteryChart) {
        topicMasteryChart.destroy();
        topicMasteryChart = null;
    }
    if (analyticsTimeChart) {
        analyticsTimeChart.destroy();
        analyticsTimeChart = null;
    }
    
    // Clear any intervals or timeouts
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
        window.dashboardRefreshInterval = null;
    }
    
    console.log('Dashboard resources cleaned up');
}

// Initialize dashboard components
function initializeDashboard() {
    console.log('Initializing dashboard components...');
    
    // Clean up any existing resources first
    cleanupDashboard();
    
    // Initialize UI components
    initThemeToggle();
    setupNavigation();
    setupEventListeners();
    setupChangePassword();
    initializePlanner();
    
    // Set up theme change listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.removeEventListener('click', handleThemeToggle);
        themeToggle.addEventListener('click', handleThemeToggle);
    }
    
    console.log('Dashboard components initialized');
    
    // Return a promise that resolves when initialization is complete
    return Promise.resolve();
}

// Handle theme toggle with proper cleanup
function handleThemeToggle() {
    const newTheme = toggleTheme();
    
    // Update chart text colors
    updateChartTextColors();
    
    // If dashboard is visible, reload data to update charts
    if (isDashboardVisible()) {
        // Small delay to ensure theme is fully applied
        setTimeout(() => {
            loadDashboardData().catch(console.error);
        }, 50);
    }
    
    // Dispatch event for other components to update
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
}

// Function to check if dashboard is visible
function isDashboardVisible() {
    const dashboardSection = document.getElementById('dashboardSection');
    return dashboardSection && window.getComputedStyle(dashboardSection).display !== 'none';
}

// Function to handle dashboard visibility changes
function handleDashboardVisibility() {
    if (isDashboardVisible() && window.currentUser) {
        console.log('Dashboard section became visible, loading data...');
        loadDashboardData().catch(error => {
            console.error('Error loading dashboard data:', error);
            showMessage('Error loading dashboard data. Please try refreshing the page.', true);
        });
    }
}

// Make functions available globally
window.loadDashboardData = loadDashboardData;
window.initializeDashboard = initializeDashboard;
window.isDashboardVisible = isDashboardVisible;
window.handleDashboardVisibility = handleDashboardVisibility;

// Function to handle dashboard data reloading
function reloadDashboardData() {
    if (!isDashboardVisible() || !window.currentUser) return;
    
    console.log('Reloading dashboard data...');
    // Clear any cached data to force a fresh load
    dashboardCache.set(null);
    
    // Destroy existing charts before reloading
    cleanupDashboard();
    
    // Load fresh data
    return loadDashboardData().catch(error => {
        console.error('Error reloading dashboard data:', error);
        showMessage('Error loading dashboard data. Please try refreshing the page.', true);
    });
}

// Initialize dashboard when the script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');
    
    // Initialize the dashboard
    initializeDashboard().then(() => {
        // If dashboard is already visible, load data
        if (isDashboardVisible() && window.currentUser) {
            console.log('Initial dashboard load...');
            reloadDashboardData();
        }
        
        // Listen for section changes to handle navigation
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'dashboard' && window.currentUser) {
                console.log('Dashboard section activated, reinitializing and refreshing data...');
                // Small delay to ensure the section is fully visible
                setTimeout(() => {
                    initializeDashboard().then(() => {
                        reloadDashboardData();
                    });
                }, 50);
            }
        });
    });
});
