// DOM Elements
const goalForm = document.getElementById('goalForm');
const todayGoalsContainer = document.getElementById('todayGoals');
const historyGoalsContainer = document.getElementById('historyGoals');
const historyDateInput = document.getElementById('historyDate');
const changeNameBtn = document.getElementById('changeNameBtn');
const changeNameModal = document.getElementById('changeNameModal');
const closeNameModal = document.getElementById('closeNameModal');
const cancelNameChange = document.getElementById('cancelNameChange');
const changeNameForm = document.getElementById('changeNameForm');
const newDisplayNameInput = document.getElementById('newDisplayName');
const nameChangeMessage = document.getElementById('nameChangeMessage');
const accountIcon = document.getElementById('accountIcon');
const accountDropdown = document.getElementById('accountDropdown');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const changePasswordForm = document.getElementById('changePasswordForm');
const logoutBtn = document.getElementById('logoutBtn');
const subjectPriorityChart = document.getElementById('subjectPriorityChart');
const addGoalBtn = document.getElementById('addGoalBtn');
const addGoalModal = document.getElementById('addGoalModal');
const closeAddGoalModal = document.getElementById('closeAddGoalModal');
const cancelAddGoal = document.getElementById('cancelAddGoal');

// Elements that might not be present on all pages
let toggleChartBtn = null;
let closeChartBtn = null;

// Edit Goal Modal Elements
const editGoalModal = document.getElementById('editGoalModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEdit = document.getElementById('cancelEdit');
const editGoalForm = document.getElementById('editGoalForm');
const editGoalId = document.getElementById('editGoalId');
const editSubject = document.getElementById('editSubject');
const editTopic = document.getElementById('editTopic');
const editTarget = document.getElementById('editTarget');
const editTime = document.getElementById('editTime');

// Chart Elements - Managed by chart module

// Debug: Log all modal elements
console.log('Modal Elements:', {
    changePasswordModal: document.getElementById('changePasswordModal'),
    closePasswordModal: document.getElementById('closePasswordModal'),
    changeNameModal: document.getElementById('changeNameModal'),
    closeNameModal: document.getElementById('closeNameModal')
});

// Global variables
let currentUser = null;
let db = null;

// Show message to user
function showMessage(message, isError = true) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        console.log(message);
        return;
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = isError ? 'rgba(255, 107, 107, 0.1)' : 'rgba(76, 175, 80, 0.1)';
    messageDiv.style.borderLeft = `3px solid ${isError ? '#ff6b6b' : '#4caf50'}`;
    messageDiv.style.color = isError ? '#ff6b6b' : '#4caf50';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Event delegation for goal actions
document.addEventListener('click', (e) => {
    // Handle complete button clicks
    if (e.target.closest('.complete-btn')) {
        const button = e.target.closest('.complete-btn');
        const goalId = button.dataset.id;
        if (goalId) {
            toggleComplete(goalId, button);
        }
    }
    
    // Handle delete button clicks
    if (e.target.closest('.delete-btn')) {
        const button = e.target.closest('.delete-btn');
        const goalId = button.dataset.id;
        if (goalId) {
            deleteGoal(goalId);
        }
    }
    
    // Close account dropdown when clicking outside
    if (!e.target.closest('.account-menu')) {
        accountDropdown.style.display = 'none';
    }
});

// Format date to a readable string (e.g., '17 Jul 2023')
function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Return the original string if formatting fails
    }
}

// Toggle subject priority chart
function toggleChart(show) {
    const chartContainer = document.getElementById('subjectPriorityContainer');
    const toggleBtn = document.getElementById('toggleChartBtn');
    
    if (show === undefined) {
        show = chartContainer.style.display === 'none' || !chartContainer.style.display;
    }
    
    chartContainer.style.display = show ? 'block' : 'none';
    toggleBtn.textContent = show ? 'Hide Chart' : 'Show Subject Priority';
    
    // If showing the chart and it hasn't been initialized yet, initialize it
    if (show && subjectChart === null) {
        updateSubjectPriorityChart();
    }
}

// Open edit goal modal
function openEditModal(goal) {
    if (!goal || !goal.id) {
        console.error('Invalid goal data:', goal);
        showMessage('Error: Could not edit goal. Invalid data.', true);
        return;
    }
    
    // If goal data is already available, use it directly
    if (goal.subject && goal.topic && goal.target && goal.time !== undefined) {
        editGoalId.value = goal.id;
        editSubject.value = goal.subject;
        editTopic.value = goal.topic;
        editTarget.value = goal.target;
        editTime.value = goal.time;
        editGoalModal.style.display = 'block';
        return;
    }
    
    // If goal data is incomplete, fetch it from Firestore
    if (!db) {
        showMessage('Error: Database not initialized. Please refresh the page.', true);
        return;
    }
    
    showMessage('Loading goal details...', false);
    
    db.collection('goals').doc(goal.id).get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('Goal not found');
            }
            
            const goalData = doc.data();
            editGoalId.value = doc.id;
            editSubject.value = goalData.subject || '';
            editTopic.value = goalData.topic || '';
            editTarget.value = goalData.target || '';
            editTime.value = goalData.time || 0;
            editGoalModal.style.display = 'block';
        })
        .catch((error) => {
            console.error('Error loading goal:', error);
            showMessage(`Failed to load goal: ${error.message}`, true);
        });
}

// Handle edit goal form submission
function handleEditGoal(e) {
    e.preventDefault();
    
    if (!db || !currentUser) {
        showMessage('Error: Database not initialized. Please refresh the page.', true);
        return;
    }
    
    const goalId = editGoalId.value;
    const today = new Date().toISOString().split('T')[0];
    const goalRef = db.collection('goals').doc(goalId);
    
    // Get the current goal to preserve the completion status
    goalRef.get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('Goal not found');
            }
            
            const currentGoal = doc.data();
            
            // Update the goal with the new data
            return goalRef.update({
                subject: editSubject.value,
                topic: editTopic.value,
                target: editTarget.value,
                time: parseFloat(editTime.value),
                // Preserve the existing completion status
                completed: currentGoal.completed,
                // Update the timestamp
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                // Keep the original date
                date: currentGoal.date || today
            });
        })
        .then(() => {
            editGoalModal.style.display = 'none';
            showMessage('Goal updated successfully!', false);
            
            // Force a refresh of the goals list
            loadGoals(today);
            updateSubjectPriorityChart();
            
            // Close any open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        })
        .catch((error) => {
            console.error('Error updating goal:', error);
            showMessage(`Failed to update goal: ${error.message}`, true);
        });
}

// Chart instance is now managed by the chart module
// and is available as window.subjectChart

// Initialize chart (handled by the chart module)
async function initChart() {
    try {
        console.log('Initializing chart container...');
        
        // Ensure chart container is visible and has dimensions
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) {
            console.error('❌ Chart container not found in DOM');
            return false;
        }
        
        // Make sure container is visible
        chartContainer.style.display = 'flex';
        chartContainer.style.visibility = 'visible';
        chartContainer.style.opacity = '1';
        chartContainer.style.width = '100%';
        chartContainer.style.height = '400px';
        
        // Force layout to ensure container is visible and has dimensions
        void chartContainer.offsetHeight;
        
        // Ensure canvas exists and has proper dimensions
        const chartElement = document.getElementById('subjectPriorityChart');
        if (!chartElement) {
            console.error('❌ Chart canvas element not found');
            return false;
        }
        
        chartElement.style.width = '100%';
        chartElement.style.height = '100%';
        chartElement.style.display = 'block';
        
        // Log container and canvas dimensions for debugging
        console.log('Chart container dimensions:', {
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight,
            style: window.getComputedStyle(chartContainer).display
        });
        
        console.log('Chart canvas dimensions:', {
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight,
            style: window.getComputedStyle(chartElement).display
        });
        
        // The actual chart initialization is now handled by the chart module
        console.log('✅ Chart container initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing chart container:', error);
        return false;
    }
}

// Update chart type (handled by the chart module)
async function updateChartType(type) {
    try {
        const chart = window.subjectChart;
        if (!chart) {
            console.error('Chart module not available');
            return;
        }
        
        // Update active button state
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Delegate chart type update to the chart module
        if (chart.updateType) {
            await chart.updateType(type);
            console.log('Chart type updated to:', type);
        }
        
        // The chart module will handle the update with appropriate animations
        console.log('Chart type updated to:', type);
                
        // Update active button state
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            if (btn) {
                btn.classList.toggle('active', btn.dataset.chartType === type);
            }
        });
        
    } catch (error) {
        console.error('Error updating chart type:', error);
    }
}

// Update subject priority chart based on goals
async function updateSubjectPriorityChart() {
    try {
        console.log('=== Starting chart update ===');
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.log('User not authenticated - skipping chart update');
            return;
        }
        
        // Get the chart instance from the module
        const chart = window.subjectChart;
        if (!chart) {
            console.error('Chart module not available');
            return;
        }
        
        // Ensure chart is initialized
        if (!chart.initialized) {
            console.log('Chart not initialized yet, initializing...');
            try {
                await chart.init();
                // Small delay to ensure chart is fully initialized
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (!chart.initialized) {
                    throw new Error('Failed to initialize chart');
                }
            } catch (initError) {
                console.error('❌ Failed to initialize chart:', initError);
                // Try to reinitialize after a delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                return updateSubjectPriorityChart();
            }
        }

        // Make sure chart container is visible and accessible
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) {
            console.error('❌ Chart container not found in DOM');
            return;
        }
        
        // Make sure chart container is visible
        if (chartContainer.offsetParent === null) {
            console.log('ℹ️ Chart container was hidden - making it visible');
            chartContainer.style.display = 'flex';
            chartContainer.style.visibility = 'visible';
            chartContainer.style.opacity = '1';
            // Force reflow to ensure container is visible before rendering
            void chartContainer.offsetHeight;
        }
        
        // Get all goal items from the DOM
        const goalItems = document.querySelectorAll('.goal-item');
        console.log(`Found ${goalItems.length} goal items in the DOM`);
        
        // Initialize subject time tracking
        const subjectTime = {};
        
        // Calculate total time spent on each subject
        let hasData = false;
        goalItems.forEach((item, index) => {
            const subject = item.querySelector('.goal-subject')?.textContent?.trim();
            const timeText = item.querySelector('.goal-time')?.textContent?.match(/(\d+\.?\d*)/);
            const time = timeText ? parseFloat(timeText[1]) : 0;
            
            console.log(`Goal ${index + 1}: Subject=${subject}, Time=${time}`);
            
            if (subject) {
                if (!subjectTime[subject]) {
                    subjectTime[subject] = 0;
                }
                subjectTime[subject] += time;
                if (time > 0) hasData = true;
            }
        });
        
        console.log('Aggregated time by subject:', subjectTime);
        console.log('Has data with time > 0:', hasData);

        // If no data, show empty state
        if (!hasData) {
            console.log('ℹ️ No data available for chart, showing empty state');
            // Update the chart with empty state using the chart module
            await chart.update({});
            updateChartLegend({});
            return;
        }
        
        // Convert subjectTime to array of goals format expected by the chart
        const goals = [];
        Object.entries(subjectTime).forEach(([subject, time]) => {
            if (time > 0) {
                goals.push({
                    subject,
                    timeSpent: time,
                    completed: true  // Only completed goals should be in the chart
                });
            }
        });
        
        // Update the chart with the collected data
        try {
            console.log('Updating chart with data:', goals);
            await chart.update(goals);
            console.log('✅ Chart updated successfully');
            
            // Update the legend with the current data
            updateChartLegend(subjectTime);
            
        } catch (updateError) {
            console.error('❌ Error updating chart:', updateError);
            // If update fails, try to reinitialize the chart
            if (chart.destroy) {
                chart.destroy();
            }
            
            // Reinitialize the chart
            if (chart.init) {
                await chart.init();
                console.log('🔄 Retrying chart update after reinitialization...');
                setTimeout(updateSubjectPriorityChart, 300);
            }
        }
    } catch (error) {
        console.error('❌ Error in updateSubjectPriorityChart:', error);
        // If chart exists but there's an error, try to reinitialize it
        if (subjectChart) {
            if (subjectChart.destroy) {
                subjectChart.destroy();
            }
            
            // Reinitialize the chart
            if (subjectChart.init) {
                await subjectChart.init();
                console.log('🔄 Retrying chart update after reinitialization...');
                setTimeout(updateSubjectPriorityChart, 300);
            }
        }
    }
}

// Update chart legend
function updateChartLegend(subjects) {
    try {
        const legendContainer = document.getElementById('chartLegend');
        if (!legendContainer) {
            console.warn('Legend container not found');
            return;
        }
        
        // Clear existing legend
        while (legendContainer.firstChild) {
            legendContainer.removeChild(legendContainer.firstChild);
        }
        
        // If no subjects or empty object, show a message
        if (!subjects || Object.keys(subjects).length === 0) {
            console.log('No subject data available for legend');
            const noData = document.createElement('div');
            noData.className = 'legend-item';
            noData.textContent = 'No data available';
            legendContainer.appendChild(noData);
            return;
        }
        
        console.log('Updating chart legend with subjects:', subjects);
        
        // Sort subjects by time spent (descending)
        const sortedSubjects = Object.entries(subjects)
            .filter(([_, time]) => time > 0) // Only include subjects with time > 0
            .sort((a, b) => b[1] - a[1]);
        
        if (sortedSubjects.length === 0) {
            console.log('No subjects with time > 0 to display in legend');
            const noData = document.createElement('div');
            noData.className = 'legend-item';
            noData.textContent = 'No time logged yet';
            legendContainer.appendChild(noData);
            return;
        }
        
        // Calculate total time for percentages
        const totalTime = sortedSubjects.reduce((sum, [_, time]) => sum + time, 0);
        
        // Create legend items
        sortedSubjects.forEach(([subject, time]) => {
            const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
            const color = getSubjectColor(subject);
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.borderLeft = `3px solid ${color}`;
            legendItem.style.marginBottom = '8px';
            legendItem.style.padding = '6px 12px';
            legendItem.style.borderRadius = '4px';
            legendItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            legendItem.style.transition = 'all 0.2s ease';
            
            // Add hover effect
            legendItem.style.cursor = 'pointer';
            legendItem.addEventListener('mouseenter', () => {
                legendItem.style.transform = 'translateX(5px)';
                legendItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            legendItem.addEventListener('mouseleave', () => {
                legendItem.style.transform = 'translateX(0)';
                legendItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            });
            
            // Highlight the segment in the chart on hover
            legendItem.addEventListener('mouseenter', () => {
                const chart = window.subjectChart?.chart;
                if (chart) {
                    try {
                        const index = chart.data.labels.indexOf(subject);
                        if (index !== -1) {
                            chart.setActiveElements([{ datasetIndex: 0, index }]);
                            chart.update();
                        }
                    } catch (error) {
                        console.warn('Could not highlight chart segment:', error);
                    }
                }
            });
            
            legendItem.addEventListener('mouseleave', () => {
                const chart = window.subjectChart?.chart;
                if (chart) {
                    try {
                        chart.setActiveElements([]);
                        chart.update();
                    } catch (error) {
                        console.warn('Could not reset chart highlight:', error);
                    }
                }
            });
            
            const subjectName = document.createElement('span');
            subjectName.className = 'legend-subject';
            subjectName.textContent = subject;
            subjectName.style.fontWeight = '600';
            subjectName.style.marginRight = '8px';
            subjectName.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#fff';
            
            const timeSpent = document.createElement('span');
            timeSpent.className = 'legend-time';
            timeSpent.textContent = `${time} hours (${percentage}%)`;
            timeSpent.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#aaa';
            timeSpent.style.fontSize = '0.9em';
            
            legendItem.appendChild(subjectName);
            legendItem.appendChild(timeSpent);
            legendContainer.appendChild(legendItem);
        });
        
        console.log('Chart legend updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating chart legend:', error);
    }
}

// Helper function to get color for each subject
function getSubjectColor(subject) {
    const colors = {
        'Physics': '#4e73df',    // Blue
        'Chemistry': '#1cc88a',  // Green
        'Mathematics': '#f6c23e' // Yellow
    };
    return colors[subject] || '#858796'; // Default gray color if subject not found
}

// Handle adding a new goal
function handleAddGoal(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('Please sign in to add goals', true);
        return;
    }
    
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const target = document.getElementById('target').value;
    const time = parseFloat(document.getElementById('time').value);
    
    if (!subject || !topic || !target || isNaN(time)) {
        showMessage('Please fill in all fields with valid values', true);
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    db.collection('goals').add({
        subject,
        topic,
        target,
        time,
        completed: false,
        userId: currentUser.uid,
        date: today,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Reset form
        document.getElementById('goalForm').reset();
        // Reload goals
        loadGoals(today);
        // Update chart
        updateSubjectPriorityChart();
        
        showMessage('Goal added successfully!', false);
    })
    .catch((error) => {
        console.error('Error adding goal:', error);
        showMessage('Failed to add goal. Please try again.', true);
    });
}

// Track if event listeners have been initialized
let eventListenersInitialized = false;

// Initialize event listeners
function initEventListeners() {
    console.log('Initializing event listeners...');
    
    // Prevent multiple initializations
    if (eventListenersInitialized) {
        console.log('Event listeners already initialized, skipping...');
        return;
    }
    
    // Get DOM elements
    const goalForm = document.getElementById('goalForm');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const addGoalModal = document.getElementById('addGoalModal');
    const closeAddGoalModal = document.getElementById('closeAddGoalModal');
    const cancelAddGoal = document.getElementById('cancelAddGoal');
    const chartCtx = document.getElementById('subjectPriorityChart')?.getContext('2d');
    
    // Add goal form submission
    if (goalForm) {
        // Remove any existing event listeners first
        const newGoalForm = goalForm.cloneNode(true);
        goalForm.parentNode.replaceChild(newGoalForm, goalForm);
        
        // Add the event listener to the new form
        newGoalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddGoal(e);
        });
        
        // Update the reference
        window.goalForm = newGoalForm;
    }
    
    // Mark as initialized
    eventListenersInitialized = true;
    
    // Function to close modal
    const closeModal = () => {
        if (addGoalModal) {
            addGoalModal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    };
    
    // Modal open/close handlers
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            if (addGoalModal) {
                addGoalModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    }
    
    if (closeAddGoalModal) {
        closeAddGoalModal.addEventListener('click', closeModal);
    }
    
    if (cancelAddGoal) {
        cancelAddGoal.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside or pressing Escape
    window.addEventListener('click', (e) => {
        if (e.target === addGoalModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addGoalModal && addGoalModal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Edit goal modal event listeners
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            editGoalModal.style.display = 'none';
        });
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', (e) => {
            e.preventDefault();
            editGoalModal.style.display = 'none';
        });
    }
    
    // Edit goal form submission
    if (editGoalForm) {
        editGoalForm.addEventListener('submit', handleEditGoal);
    }
    
    // Initialize chart if container exists
    if (chartCtx) {
        initChart();
        // We'll load goals after the user is authenticated
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editGoalModal) {
            editGoalModal.style.display = 'none';
        } else if (e.target === changeNameModal) {
            hideChangeNameModal();
        }
        
        if (e.target === changePasswordModal) {
            hideChangePasswordModal();
        }
    });
    
    // Close chart button
    if (closeChartBtn) {
        closeChartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChart(false);
        });
    }
    
    // Account menu toggle
    if (accountIcon) {
        accountIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = accountDropdown.style.display === 'block';
            accountDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut();
        });
    }
    
    // Change password button
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showChangePasswordModal();
        });
    }
    
    // Change name button
    console.log('Setting up change name button listener');
    if (changeNameBtn) {
        console.log('Change name button found, adding event listener');
        changeNameBtn.addEventListener('click', (e) => {
            console.log('Change name button clicked');
            e.preventDefault();
            showChangeNameModal();
        });
    } else {
        console.error('Change name button not found in the DOM');
    }
    
    // Change name form submission
    if (changeNameForm) {
        console.log('Setting up change name form submission');
        changeNameForm.addEventListener('submit', (e) => {
            console.log('Name change form submitted');
            handleNameChange(e);
        });
    } else {
        console.error('Change name form not found in the DOM');
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const passwordModal = document.getElementById('changePasswordModal');
        const nameModal = document.getElementById('changeNameModal');
        
        if (e.target === passwordModal) {
            hideChangePasswordModal();
        }
        
        if (e.target === nameModal) {
            hideChangeNameModal();
        }
    });
    
    // Close modal button for password modal
    console.log('Setting up password modal close button');
    console.log('closePasswordModal element:', closePasswordModal);
    
    // Add click handler for close button
    if (closePasswordModal) {
        console.log('Adding click listener to closePasswordModal');
        
        // Remove any existing event listeners to avoid duplicates
        const newCloseBtn = closePasswordModal.cloneNode(true);
        closePasswordModal.parentNode.replaceChild(newCloseBtn, closePasswordModal);
        
        // Add new event listener
        newCloseBtn.addEventListener('click', (e) => {
            console.log('Close password modal button clicked');
            e.preventDefault();
            e.stopPropagation();
            hideChangePasswordModal();
        });
        
        // Update the reference
        window.closePasswordModal = newCloseBtn;
    } else {
        console.error('closePasswordModal button not found in the DOM');
    }
    
    // Also handle clicks on the modal overlay
    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) {
                console.log('Clicked outside modal content - closing');
                hideChangePasswordModal();
            }
        });
    }
    
    // Cancel button in password change modal
    const cancelPasswordChange = document.getElementById('cancelPasswordChange');
    if (cancelPasswordChange) {
        cancelPasswordChange.addEventListener('click', (e) => {
            e.preventDefault();
            hideChangePasswordModal();
        });
    }
    
    // Close name modal button
    if (closeNameModal) {
        console.log('Adding click listener to closeNameModal');
        closeNameModal.addEventListener('click', (e) => {
            console.log('Close name modal button clicked');
            e.preventDefault();
            hideChangeNameModal();
        });
    } else {
        console.error('closeNameModal button not found');
    }
    
    // Cancel button in name change modal
    if (cancelNameChange) {
        console.log('Adding click listener to cancelNameChange');
        cancelNameChange.addEventListener('click', (e) => {
            console.log('Cancel name change button clicked');
            e.preventDefault();
            hideChangeNameModal();
        });
    } else {
        console.error('cancelNameChange button not found');
    }
    
    // Submit password change
    if (submitPasswordChange) {
        submitPasswordChange.addEventListener('click', handlePasswordChange);
    }
    
    // Add goal form submission
    goalForm?.addEventListener('submit', handleAddGoal);
    
    // Modal open/close handlers
    addGoalBtn?.addEventListener('click', () => {
        addGoalModal.style.display = 'flex';
    });
    
    closeAddGoalModal?.addEventListener('click', () => {
        addGoalModal.style.display = 'none';
    });
    
    cancelAddGoal?.addEventListener('click', () => {
        addGoalModal.style.display = 'none';
    });
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target === addGoalModal) {
            addGoalModal.style.display = 'none';
        }
    });
    
    // Initialize chart
    if (chartCtx) {
        initChart();
    }
}

// Debug function to manually trigger chart update
window.debugUpdateChart = function() {
    console.log('=== Manually triggering chart update ===');
    if (typeof updateSubjectPriorityChart === 'function') {
        updateSubjectPriorityChart();
    } else {
        console.error('updateSubjectPriorityChart function not found');
    }
};

// Function to initialize the application
function initializeApp() {
    console.log('Initializing application...');
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available');
        return;
    }
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase is not available');
        return;
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Debug button code has been removed
    
    console.log('Application initialized successfully');
}

// Wait for everything to be ready
if (document.readyState === 'loading') {
    // Document is still loading, wait for it
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // Document is already ready, initialize immediately
    initializeApp();
}

// Initialize Firestore
function initializeFirebase() {
    try {
        // Get Firestore instance
        db = firebase.firestore();
        console.log('Firestore initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firestore:', error);
        showMessage('Error initializing database. Please refresh the page.', true);
        return false;
    }
}

// Call the initialization function
initializeFirebase();

// Set today's date as default for the history date picker
const today = new Date().toISOString().split('T')[0];
if (historyDateInput) {
    historyDateInput.value = today;
    historyDateInput.max = today; // Prevent selecting future dates
    historyDateInput.addEventListener('change', (e) => loadGoals(e.target.value));
}

// Add event listeners
if (goalForm) {
    goalForm.addEventListener('submit', addGoal);
} else {
    console.error('Goal form not found');
}

// Show auth container by default
const authContainer = document.getElementById('authContainer');
if (authContainer) {
    authContainer.style.display = 'flex';
} else {
    console.error('Auth container not found');
}

// Add a new goal
async function addGoal(e) {
    e.preventDefault();
    
    if (!db) {
        console.error('Firestore not initialized');
        showMessage('Database not available. Please refresh the page.', true);
        return;
    }
    
    if (!currentUser || !currentUser.uid) {
        console.error('User not authenticated');
        showMessage('Please sign in to add goals', true);
        return;
    }
    
    const subject = document.getElementById('subject')?.value.trim();
    const topic = document.getElementById('topic')?.value.trim();
    const target = document.getElementById('target')?.value.trim();
    const time = parseFloat(document.getElementById('time')?.value || 0);
    
    if (!subject || !topic || !target || isNaN(time) || time <= 0) {
        showMessage('Please fill in all fields with valid values', true);
        return;
    }
    
    if (!subject || !topic || !target || isNaN(time)) {
        alert('Please fill in all fields correctly');
        return;
    }
    
    if (!currentUser) {
        alert('Please sign in to add goals');
        return;
    }
    
    const goal = {
        userId: currentUser.uid,
        subject,
        topic,
        target,
        time,
        date: new Date().toISOString().split('T')[0],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        completed: false
    };
    
    try {
        // Add to Firestore with error handling
        if (!db) throw new Error('Database not initialized');
        
        const docRef = await db.collection('goals').add(goal);
        console.log('Goal added with ID:', docRef.id);
        
        // Show success message
        showMessage('Goal added successfully!', false);
        
        // Reset form
        goalForm.reset();
        
        // Reload today's goals
        loadGoals(goal.date);
    } catch (error) {
        console.error('Error adding goal:', error);
        let errorMessage = 'Error adding goal';
        
        // More user-friendly error messages
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please sign in again.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        showMessage(errorMessage, true);
    }
}

// Load goals for a specific date
function loadGoals(date) {
    console.log(`Loading goals for date: ${date}`);
    return new Promise(async (resolve, reject) => {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            const error = 'No user signed in';
            console.log(error);
            reject(new Error(error));
            return;
        }
        
        const db = window.db;
        if (!db) {
            console.error('Firestore not initialized');
            reject(new Error('Firestore not initialized'));
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const container = date === today ? todayGoalsContainer : historyGoalsContainer;
        if (!container) {
            console.error('Container not found');
            reject(new Error('Container not found'));
            return;
        }
        
        container.innerHTML = '<p class="no-goals">Loading...</p>';
        
        try {
            if (!currentUser || !currentUser.uid) {
                throw new Error('User not authenticated');
            }
            
            // First, get all goals for the user (this only requires a single-field index on 'userId')
            const querySnapshot = await db.collection('goals')
                .where('userId', '==', currentUser.uid)
                .get();
                
            // Then filter and sort in memory
            const goals = [];
            querySnapshot.forEach((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    // Only include goals for the selected date
                    if (data.date === date) {
                        goals.push({ 
                            id: doc.id, 
                            ...data
                        });
                    }
                }
            });
            
            // Sort by timestamp in descending order (newest first)
            goals.sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
            
            // Clear the container
            container.innerHTML = '';
            
            if (goals.length === 0) {
                container.innerHTML = `<p class="no-goals">No goals found for this date.</p>`;
                // Still resolve with empty array even if no goals found
                resolve([]);
                
                // Update chart with empty data
                if (date === today && subjectChart) {
                    setTimeout(() => {
                        updateSubjectPriorityChart();
                    }, 50);
                }
                return;
            }
            
            // Add each goal to the container
            goals.forEach(goal => {
                const goalElement = createGoalElement(goal, date === today);
                container.appendChild(goalElement);
            });
            
            // Resolve with the loaded goals
            resolve(goals);
            
            // If loading today's goals, also update the chart and history view
            if (date === today) {
                try {
                    // Small delay to ensure DOM is ready before updating chart
                    setTimeout(() => {
                        if (subjectChart) {
                            updateSubjectPriorityChart();
                        }
                    }, 100);
                    
                    // Load history in the background
                    loadHistory().catch(historyError => {
                        console.error('Error loading history in loadGoals:', historyError);
                        // Don't show error to user here as loadHistory already handles that
                    });
                } catch (historyError) {
                    console.error('Error in history/chart update:', historyError);
                }
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            container.innerHTML = '<p class="no-goals">Error loading goals. Please try again.</p>';
            reject(error);
        }
    });
}

// Create a goal element
function createGoalElement(goal, isToday = true) {
    const goalElement = document.createElement('div');
    goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
    goalElement.dataset.id = goal.id;
    
    const statusClass = goal.completed ? 'completed' : 'pending';
    const statusText = goal.completed ? 'Completed' : 'Pending';
    
    goalElement.innerHTML = `
        <div class="goal-header">
            <span class="goal-subject">${goal.subject}</span>
            <span class="goal-status ${statusClass}">${statusText}</span>
        </div>
        <div class="goal-topic">${goal.topic}</div>
        <div class="goal-target">${goal.target}</div>
        <div class="goal-time">Time spent: ${goal.time} hours</div>
        <div class="goal-actions">
            <button class="complete-btn" data-id="${goal.id}">
                <i class="fas fa-${goal.completed ? 'undo' : 'check'}"></i>
                ${goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button class="edit-btn" data-id="${goal.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" data-id="${goal.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add edit button event listener
    const editBtn = goalElement.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditModal(goal));
    }
    
    return goalElement;
}

// Toggle goal completion status
async function toggleComplete(goalId, button) {
    if (!currentUser || !goalId) {
        console.error('User not authenticated or no goal ID provided');
        showMessage('Please sign in to update goals', 'error');
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        showMessage('Database error. Please refresh the page.', 'error');
        return;
    }
    
    try {
        // Get the goal element and button text
        const goalElement = button.closest('.goal-item') || button.closest('[class*="goal"]');
        const buttonText = button.querySelector('span') || button;
        const icon = button.querySelector('i') || button.querySelector('.fa') || 
                   (button.firstElementChild?.tagName === 'I' ? button.firstElementChild : null);
        
        // Determine the current state from the UI
        const isCompleted = goalElement ? goalElement.classList.contains('completed') : 
                            icon ? icon.classList.contains('fa-check') : false;
        const newCompletedState = !isCompleted;
        
        // Optimistic UI update
        if (goalElement) {
            goalElement.classList.toggle('completed', newCompletedState);
        }
        
        // Update button text and icon
        if (buttonText) {
            buttonText.textContent = newCompletedState ? 'Mark Incomplete' : 'Mark Complete';
        }
        
        if (icon) {
            icon.className = `fas fa-${newCompletedState ? 'check' : 'circle'}`;
        }
        
        // Update the status text if it exists
        const statusElement = goalElement?.querySelector('.goal-status');
        if (statusElement) {
            statusElement.textContent = newCompletedState ? 'Completed' : 'Pending';
            statusElement.className = `goal-status ${newCompletedState ? 'completed' : 'pending'}`;
        }
        
        // Update in Firestore
        await db.collection('goals').doc(goalId).update({
            completed: newCompletedState,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Show success message
        showMessage(`Goal marked as ${newCompletedState ? 'completed' : 'incomplete'}!`, false);
        
    } catch (error) {
        console.error('Error toggling goal completion:', error);
        
        // Revert UI on error
        if (goalElement) {
            goalElement.classList.toggle('completed');
            
            const buttonText = button.querySelector('span') || button;
            if (buttonText) {
                buttonText.textContent = isCompleted ? 'Mark Complete' : 'Mark Incomplete';
            }
            
            const icon = button.querySelector('i') || button.querySelector('.fa');
            if (icon) {
                icon.className = `fas fa-${isCompleted ? 'circle' : 'check'}`;
            }
            
            const statusElement = goalElement.querySelector('.goal-status');
            if (statusElement) {
                statusElement.textContent = isCompleted ? 'Pending' : 'Completed';
                statusElement.className = `goal-status ${isCompleted ? 'pending' : 'completed'}`;
            }
        }
        
        showMessage(`Failed to update goal: ${error.message}`, true);
    }
}

// Delete a goal
async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) {
        return;
    }
    
    if (!currentUser) {
        console.log('No user signed in');
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    try {
        // Delete from Firestore
        await db.collection('goals').doc(goalId).delete();
        
        // Reload the view
        const today = new Date().toISOString().split('T')[0];
        loadGoals(today);
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal. Please try again.');
    }
}

// Load history summary
async function loadHistory() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser || !currentUser.uid) {
        console.error('User not authenticated');
        return;
    }
    
    const historyContainer = document.getElementById('historyGoals');
    if (!historyContainer) {
        console.error('History container not found');
        return;
    }
    
    // Check if Firestore is initialized
    const db = window.db;
    if (!db) {
        console.error('Firestore not initialized');
        historyContainer.innerHTML = '<p class="error-message">Error: Database not available. Please refresh the page.</p>';
        return;
    }
    
    try {
        // Show loading state
        historyContainer.innerHTML = '<p class="loading-message">Loading history...</p>';
        
        // First, get all goals for the user (this only requires a single-field index on 'userId')
        const querySnapshot = await db.collection('goals')
            .where('userId', '==', currentUser.uid)
            .get()
            .catch(error => {
                console.error('Error fetching goals:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                historyContainer.innerHTML = `
                    <div class="error-message">
                        <p>Error loading history. Please try again later.</p>
                        ${errorMessage.includes('permission') ? 
                            '<p>Make sure you are logged in and have the necessary permissions.</p>' : ''}
                        <details style="margin-top: 10px; color: #ff6b6b;">
                            <summary>Error details</summary>
                            <pre style="white-space: pre-wrap; font-size: 0.8em;">${errorMessage}</pre>
                        </details>
                    </div>`;
                throw error;
            });
            
        const goalsByDate = {};
        const historySummary = {}; // Initialize historySummary object
        
        // First pass: Group goals by date and calculate summary
        querySnapshot.forEach(doc => {
            try {
                if (doc.exists) {
                    const data = doc.data();
                    // Ensure required fields exist
                    if (!data.date) {
                        console.warn('Goal missing date field:', doc.id, data);
                        return;
                    }
                    
                    const date = data.date;
                    
                    // Initialize date entry in both objects if it doesn't exist
                    if (!goalsByDate[date]) {
                        goalsByDate[date] = [];
                    }
                    
                    if (!historySummary[date]) {
                        historySummary[date] = {
                            totalGoals: 0,
                            completedGoals: 0,
                            totalTime: 0
                        };
                    }
                    
                    // Add to goals by date
                    goalsByDate[date].push({
                        id: doc.id,
                        ...data
                    });
                    
                    // Update summary
                    historySummary[date].totalGoals++;
                    if (data.completed) {
                        historySummary[date].completedGoals++;
                    }
                    if (data.time) {
                        historySummary[date].totalTime += parseInt(data.time) || 0;
                    }
                }
            } catch (error) {
                console.error('Error processing document:', doc?.id, error);
            }
        });
        
        // Generate history HTML
        let historyHTML = '<h2>History overview</h2>';
        
        if (Object.keys(historySummary).length === 0) {
            historyHTML += '<p>No history available yet. Add some goals to get started!</p>';
        } else {
            historyHTML += '<div class="history-grid">';
            
            // Sort dates in descending order (newest first)
            const sortedDates = Object.keys(historySummary).sort((a, b) => new Date(b) - new Date(a));
            
            // Generate history cards
            for (const date of sortedDates) {
                const data = historySummary[date];
                const completionPercentage = Math.round((data.completedGoals / data.totalGoals) * 100) || 0;
                
                historyHTML += `
                    <div class="history-card">
                        <div class="history-date">${formatDate(date)}</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${completionPercentage}%"></div>
                        </div>
                        <div class="history-stats">
                            <span>${data.completedGoals}/${data.totalGoals} goals</span>
                            <span>${Math.round(data.totalTime)} hours</span>
                        </div>
                    </div>
                    <br>
                    <hr>
                    <br>
                `;
            }
            
            historyHTML += '</div>';
        }
        
        // Update the history container
        historyContainer.innerHTML = historyHTML;
        
        // Log success
        console.log('History loaded successfully');
        
    } catch (error) {
        console.error('Error loading history:', error);
        showMessage('Failed to load history. Please try again.', 'error');
    }
}

// Show change password modal
function showChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('show');
        // Clear previous inputs and messages
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        const messageDiv = document.getElementById('passwordChangeMessage');
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }
}

// Hide change password modal
function hideChangePasswordModal() {
    console.log('Hiding change password modal');
    if (changePasswordModal) {
        // Hide the modal
        changePasswordModal.style.display = 'none';
        
        // Reset the form
        if (changePasswordForm) {
            changePasswordForm.reset();
        }
        
        // Clear any messages
        const messageDiv = changePasswordModal.querySelector('.message');
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }
        
        console.log('Change password modal hidden');
    } else {
        console.error('Change password modal element not found when trying to hide');
    }
}

// Handle password change form submission
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('passwordChangeMessage');
    
    // Reset message
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordMessage('New password must be at least 6 characters long', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordMessage('New passwords do not match', 'error');
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
        
        // Show success message
        showPasswordMessage('Password updated successfully!', 'success');
        
        // Clear form and close modal after 2 seconds
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        setTimeout(() => {
            hideChangePasswordModal();
        }, 2000);
        
    } catch (error) {
        console.error('Error updating password:', error);
        let errorMessage = 'Failed to update password. ';
        
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage += 'Current password is incorrect.';
                break;
            case 'auth/weak-password':
                errorMessage += 'New password is too weak.';
                break;
            default:
                errorMessage += error.message || 'Please try again.';
        }
        
        showPasswordMessage(errorMessage, 'error');
    }
}

// Show name change modal
function showChangeNameModal() {
    console.log('showChangeNameModal called');
    console.log('changeNameModal element:', changeNameModal);
    
    if (!changeNameModal) {
        console.error('changeNameModal is not defined');
        return;
    }
    
    console.log('Current display style:', changeNameModal.style.display);
    changeNameModal.style.display = 'block';
    console.log('New display style:', changeNameModal.style.display);
    
    document.body.style.overflow = 'hidden';
    
    if (newDisplayNameInput) {
        newDisplayNameInput.focus();
        console.log('Focused on newDisplayNameInput');
    } else {
        console.error('newDisplayNameInput not found');
    }
    
    // Log the current user's display name
    console.log('Current user display name:', currentUser?.displayName);
}

// Hide name change modal
function hideChangeNameModal() {
    console.log('hideChangeNameModal called');
    console.log('changeNameModal element:', changeNameModal);
    
    if (!changeNameModal) {
        console.error('changeNameModal is not defined in hide function');
        return;
    }
    
    console.log('Hiding modal, current display:', changeNameModal.style.display);
    changeNameModal.style.display = 'none';
    document.body.style.overflow = '';
    
    if (nameChangeMessage) {
        nameChangeMessage.style.display = 'none';
    } else {
        console.error('nameChangeMessage not found');
    }
    
    if (changeNameForm) {
        changeNameForm.reset();
    } else {
        console.error('changeNameForm not found');
    }
    
    console.log('Modal hidden, display set to:', changeNameModal.style.display);
}

// Handle name change form submission
async function handleNameChange(e) {
    e.preventDefault();
    
    const newDisplayName = newDisplayNameInput.value.trim();
    
    // Reset message
    nameChangeMessage.style.display = 'none';
    nameChangeMessage.textContent = '';
    nameChangeMessage.className = 'message';
    
    // Validate input
    if (!newDisplayName) {
        showNameMessage('Please enter a display name', 'error');
        return;
    }
    
    if (newDisplayName.length < 2 || newDisplayName.length > 30) {
        showNameMessage('Display name must be between 2 and 30 characters', 'error');
        return;
    }
    
    try {
        // Update profile in Firebase Auth
        await currentUser.updateProfile({
            displayName: newDisplayName
        });
        
        // Update UI
        updateUserUI(currentUser);
        
        // Show success message
        showNameMessage('Display name updated successfully!', 'success');
        
        // Close modal after a short delay
        setTimeout(() => {
            hideChangeNameModal();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating display name:', error);
        showNameMessage('Failed to update display name. Please try again.', 'error');
    }
}

// Show message in name change modal
function showNameMessage(message, type) {
    nameChangeMessage.textContent = message;
    nameChangeMessage.className = `message ${type}`;
    nameChangeMessage.style.display = 'block';
    
    // Scroll to message
    nameChangeMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show message in password change modal
function showPasswordMessage(message, type) {
    const messageDiv = document.getElementById('passwordChangeMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Update UI with user information
function updateUserUI(user) {
    // Display user's display name or email username
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement) {
        if (user.displayName) {
            userNameElement.textContent = user.displayName;
        } else if (user.email) {
            // Use the part before @ in email as the display name
            const displayName = user.email.split('@')[0];
            userNameElement.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        } else {
            userNameElement.textContent = 'User';
        }
    }
    
    if (userEmailElement && user.email) {
        userEmailElement.textContent = user.email;
    }
    
    // Update the avatar with user's photo if available
    const avatarIcon = document.querySelector('.account-icon i');
    if (user.photoURL && avatarIcon) {
        avatarIcon.style.display = 'none';
        avatarIcon.style.backgroundImage = `url(${user.photoURL})`;
        avatarIcon.style.backgroundSize = 'cover';
        avatarIcon.style.borderRadius = '50%';
        avatarIcon.style.width = '32px';
        avatarIcon.style.height = '32px';
    }
}

// Function to clean up chart resources
function cleanupChart() {
    const chart = window.subjectChart;
    if (chart && chart.destroy) {
        chart.destroy();
    }
}



// Function to display goals in the UI
function displayGoals(goals, date) {
    try {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        // Clear existing goals
        goalsList.innerHTML = '';
        
        if (!goals || goals.length === 0) {
            goalsList.innerHTML = '<div class="no-goals">No goals for this date. Add a goal to get started!</div>';
            return;
        }

        // Sort goals by completion status (uncompleted first) and then by time added
        const sortedGoals = [...goals].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Add each goal to the list
        sortedGoals.forEach(goal => {
            const goalElement = createGoalElement(goal);
            if (goalElement) {
                goalsList.appendChild(goalElement);
            }
        });

        // Update the chart with the new goals
        updateSubjectPriorityChart();
    } catch (error) {
        console.error('Error displaying goals:', error);
    }
}

// Listen for goals loaded event
document.addEventListener('goalsLoaded', (event) => {
    const { date, goals } = event.detail;
    // Update the UI with the loaded goals
    displayGoals(goals, date);
});

// Update the Firebase auth state observer to set the current user
firebase.auth().onAuthStateChanged(async (user) => {
    // Clean up any existing chart when auth state changes
    cleanupChart();
    
    if (user) {
        try {
            // User is signed in
            currentUser = user;
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';

            // Update UI with user information
            updateUserUI(user);

            // Check if chart container exists
            const chartContainer = document.getElementById('subjectPriorityChart');
            if (chartContainer) {
                // Initialize chart
                initChart();
                
                // Load goals for today
                const today = new Date().toISOString().split('T')[0];
                
                // Load goals and update chart when done
                try {
                    await loadGoals(today);
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        updateSubjectPriorityChart();
                    }, 100);
                } catch (error) {
                    console.error('Error loading goals:', error);
                }
            }

            // Load history
            loadHistory().catch(error => {
                console.error('Error loading history:', error);
            });
        } catch (error) {
            console.error('Error in auth state change handler:', error);
        }
    } else {
        // User is signed out
        currentUser = null;
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
        
        // Clean up any remaining chart instances
        cleanupChart();
    }
});
