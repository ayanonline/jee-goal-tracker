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
const toggleChartBtn = document.getElementById('toggleChartBtn');
const closeChartBtn = document.getElementById('closeChartBtn');
const subjectPriorityChart = document.getElementById('subjectPriorityChart');

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
    const chart = document.getElementById('subjectPriorityChart');
    const toggleBtn = document.getElementById('toggleChartBtn');
    
    if (show === undefined) {
        show = chart.style.display !== 'block';
    }
    
    if (show) {
        chart.style.display = 'block';
        toggleBtn.textContent = 'Hide Subject Priority';
        updateSubjectPriorityChart();
    } else {
        chart.style.display = 'none';
        toggleBtn.textContent = 'Show Subject Priority';
    }
}

// Update subject priority chart based on goals
function updateSubjectPriorityChart() {
    const subjects = {
        'Physics': 0,
        'Chemistry': 0,
        'Mathematics': 0
    };
    
    // Get today's goals
    const today = new Date().toISOString().split('T')[0];
    const goalsRef = firebase.database().ref(`users/${currentUser.uid}/goals/${today}`);
    
    goalsRef.once('value', (snapshot) => {
        const goals = snapshot.val() || {};
        let totalTime = 0;
        
        // Calculate total time per subject
        Object.values(goals).forEach(goal => {
            const subject = goal.subject || 'Other';
            const time = parseFloat(goal.time) || 0;
            
            if (subjects.hasOwnProperty(subject)) {
                subjects[subject] += time;
                totalTime += time;
            }
        });
        
        // Update the chart
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '';
        
        // Add a bar for each subject
        Object.entries(subjects).forEach(([subject, time]) => {
            const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
            
            const subjectBar = document.createElement('div');
            subjectBar.className = 'subject-bar';
            subjectBar.innerHTML = `
                <span class="subject-name">${subject}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%;"></div>
                </div>
                <span class="subject-percentage">${percentage}%</span>
            `;
            
            chartContainer.appendChild(subjectBar);
        });
    });
}

// Initialize event listeners
function initEventListeners() {
    console.log('Initializing event listeners...');
    console.log('changeNameBtn element:', changeNameBtn);
    console.log('changeNameModal element:', changeNameModal);
    console.log('closeNameModal element:', closeNameModal);
    console.log('cancelNameChange element:', cancelNameChange);
    console.log('changeNameForm element:', changeNameForm);
    console.log('newDisplayNameInput element:', newDisplayNameInput);
    console.log('nameChangeMessage element:', nameChangeMessage);
    // Toggle chart visibility
    if (toggleChartBtn) {
        toggleChartBtn.addEventListener('click', () => toggleChart());
    }
    
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
    const submitPasswordChange = document.getElementById('submitPasswordChange');
    if (submitPasswordChange) {
        submitPasswordChange.addEventListener('click', handlePasswordChange);
    }
}

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize event listeners
    initEventListeners();
    
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase is not initialized');
        return;
    }
    
    // Get Firestore instance
    try {
        db = firebase.firestore();
        console.log('Firestore initialized');
    } catch (error) {
        console.error('Error initializing Firestore:', error);
        return;
    }

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
});

// Add a new goal
async function addGoal(e) {
    e.preventDefault();
    
    if (!db) {
        console.error('Firestore not initialized');
        showMessage('Database not available. Please refresh the page and try again.', true);
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
        
        // Reload goals to show the new one
        loadGoals(new Date().toISOString().split('T')[0]);
        
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
async function loadGoals(date) {
    if (!currentUser) {
        console.log('No user signed in');
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const container = date === today ? todayGoalsContainer : historyGoalsContainer;
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
            return;
        }
        
        // Add each goal to the container
        goals.forEach(goal => {
            const goalElement = createGoalElement(goal, date === today);
            container.appendChild(goalElement);
        });
        
        // If loading today's goals, also update the history view
        if (date === today) {
            loadHistory();
        }
    } catch (error) {
        console.error('Error loading goals:', error);
        container.innerHTML = '<p class="no-goals">Error loading goals. Please try again.</p>';
    }
}

// Create a goal element
function createGoalElement(goal, isToday = true) {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal-card';
    goalElement.setAttribute('data-goal-id', goal.id);
    
    if (goal.completed) {
        goalElement.classList.add('completed');
    }
    
    const completedClass = goal.completed ? 'completed' : '';
    const completedText = goal.completed ? 'Completed' : 'Mark as Complete';
    
    goalElement.innerHTML = `
        <div class="goal-content">
            <h3>${goal.subject || 'No Subject'}: ${goal.topic || 'No Topic'}</h3>
            <p>${goal.target || 'No target set'}</p>
            <div class="goal-meta">
                <span>${goal.time || 0} hours</span>
                <span>${goal.timestamp ? new Date(goal.timestamp?.toDate?.() || goal.timestamp).toLocaleTimeString() : ''}</span>
            </div>
        </div>
        <div class="goal-actions">
            <button class="btn btn-icon complete-btn" data-id="${goal.id}" title="${completedText}">
                <i class="fas ${goal.completed ? 'fa-check' : 'fa-circle'}"></i>
            </button>
            <button class="btn btn-icon btn-danger delete-btn" data-id="${goal.id}" title="Delete goal">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return goalElement;
}

// Toggle goal completion status
async function toggleComplete(goalId, button) {
    if (!currentUser || !goalId) {
        console.error('User not authenticated or no goal ID provided');
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    try {
        // Find the closest parent with class 'goal-card' or 'goal-item' or similar
        let goalElement = button.closest('.goal-card, .goal-item, .goal, [data-goal-id]');
        
        // If still not found, try to find any parent with a class containing 'goal'
        if (!goalElement) {
            goalElement = button.closest('[class*="goal"]');
        }
        
        // If still not found, log a warning but continue
        if (!goalElement) {
            console.warn('Could not find goal element, but will continue with the update');
        }
        
        // Get the icon element
        let icon = button.querySelector('i');
        if (!icon && button.firstElementChild?.tagName === 'I') {
            icon = button.firstElementChild;
        }
        
        if (!icon) {
            console.warn('Could not find icon element, creating one');
            icon = document.createElement('i');
            button.prepend(icon);
        }
        
        // Determine the current state and toggle it
        const isCompleted = icon.classList.contains('fa-check');
        const newCompletedState = !isCompleted;
        
        // Update the UI immediately for better UX
        icon.className = `fas ${newCompletedState ? 'fa-check' : 'fa-circle'}`;
        
        // Update in Firestore
        await db.collection('goals').doc(goalId).update({
            completed: newCompletedState,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update the goal element's completed class if element was found
        if (goalElement) {
            if (newCompletedState) {
                goalElement.classList.add('completed');
            } else {
                goalElement.classList.remove('completed');
            }
        }
        
        // Show success message
        showMessage(`Goal marked as ${newCompletedState ? 'completed' : 'incomplete'}`, 'success');
        
    } catch (error) {
        console.error('Error updating goal:', error);
        showMessage('Failed to update goal. Please try again.', 'error');
        
        // Try to revert the UI if there was an error
        try {
            const icon = button.querySelector('i') || button.firstElementChild;
            if (icon && icon.tagName === 'I') {
                icon.className = `fas ${icon.classList.contains('fa-check') ? 'fa-circle' : 'fa-check'}`;
            }
        } catch (e) {
            console.error('Error reverting UI:', e);
        }
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
    if (!currentUser || !currentUser.uid) {
        console.error('User not authenticated');
        return;
    }
    
    const historyContainer = document.getElementById('historyGoals');
    if (!historyContainer) {
        console.error('History container not found');
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
        let historyHTML = '<h2>History</h2>';
        
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
                            <span>${Math.round(data.totalTime / 60)} hours</span>
                        </div>
                    </div>
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

// Update the Firebase auth state observer to set the current user
firebase.auth().onAuthStateChanged((user) => {
if (user) {
    // User is signed in
    currentUser = user;
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Update UI with user information
    updateUserUI(user);

    // Load goals for today
    loadGoals(new Date().toISOString().split('T')[0]);

    // Load history
    loadHistory();
} else {
    // User is signed out
    currentUser = null;
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}
});
