// DOM Elements
const goalForm = document.getElementById('goalForm');
const todayGoalsContainer = document.getElementById('todayGoals');
const historyGoalsContainer = document.getElementById('historyGoals');
const historyDateInput = document.getElementById('historyDate');

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
});

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', () => {
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
function createGoalElement(goal, isToday) {
    const goalElement = document.createElement('div');
    goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
    goalElement.dataset.id = goal.id;
    
    const completedClass = goal.completed ? 'completed' : '';
    const completedText = goal.completed ? 'Completed' : 'Mark as Complete';
    
    goalElement.innerHTML = `
        <div class="goal-content">
            <h3>${goal.subject}: ${goal.topic}</h3>
            <p>${goal.target}</p>
            <div class="goal-meta">
                <span>${goal.time} min</span>
                <span>${new Date(goal.timestamp?.toDate?.() || Date.now()).toLocaleTimeString()}</span>
            </div>
        </div>
        <div class="goal-actions">
            <button class="btn btn-icon complete-btn" data-id="${goal.id}">
                <i class="fas ${goal.completed ? 'fa-undo' : 'fa-check'}"></i>
            </button>
            <button class="btn btn-icon btn-danger delete-btn" data-id="${goal.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return goalElement;
}

// Toggle goal completion status
async function toggleComplete(goalId, button) {
    if (!currentUser) {
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    try {
        // Get the goal element
        const goalElement = button.closest('.goal-card');
        if (!goalElement) {
            throw new Error('Could not find goal element');
        }
        
        // Get the icon element
        const icon = button.querySelector('i');
        if (!icon) {
            throw new Error('Could not find icon element');
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
        
        // Update the goal element's completed class
        if (newCompletedState) {
            goalElement.classList.add('completed');
        } else {
            goalElement.classList.remove('completed');
        }
        
        // Show success message
        showMessage(`Goal marked as ${newCompletedState ? 'completed' : 'incomplete'}`, 'success');
        
    } catch (error) {
        console.error('Error updating goal:', error);
        showMessage('Failed to update goal. Please try again.', 'error');
        
        // Revert the UI if there was an error
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = `fas ${icon.classList.contains('fa-check') ? 'fa-circle' : 'fa-check'}`;
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
        
        // Process and group goals by date
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
                    
                    if (!goalsByDate[date]) {
                        goalsByDate[date] = [];
                    }
                    
                    goalsByDate[date].push({
                        id: doc.id,
                        ...data
                    });
                }
            } catch (error) {
                console.error('Error processing document:', doc?.id, error);
            }
        });
        
        // Update the history section if needed
        if (historyContainer) {
            let historyHTML = '<h2>History</h2>';
            
            if (Object.keys(goalsByDate).length === 0) {
                historyHTML += '<p>No history available yet. Add some goals to get started!</p>';
            } else {
                historyHTML += '<div class="history-grid">';
                
                // Create a summary of goals by date
                const historySummary = {};
                
                // Calculate summary for each date
                for (const [date, goals] of Object.entries(goalsByDate)) {
                    if (!historySummary[date]) {
                        historySummary[date] = {
                            totalGoals: 0,
                            completedGoals: 0,
                            totalTime: 0
                        };
                    }
                    
                    goals.forEach(goal => {
                        historySummary[date].totalGoals++;
                        if (goal.completed) {
                            historySummary[date].completedGoals++;
                        }
                        if (goal.time) {
                            historySummary[date].totalTime += parseInt(goal.time) || 0;
                        }
                    });
                }
                
                // Generate history HTML
                for (const [date, data] of Object.entries(historySummary)) {
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
            
            historyContainer.innerHTML = historyHTML;
        }
        
        // Sort the dates in descending order (newest first)
        const sortedDates = Object.keys(goalsByDate).sort((a, b) => new Date(b) - new Date(a));
        
        // Sort goals within each date by timestamp (newest first)
        sortedDates.forEach(date => {
            if (goalsByDate[date]) {
                goalsByDate[date].sort((a, b) => {
                    const timeA = a.timestamp?.toDate?.() || 0;
                    const timeB = b.timestamp?.toDate?.() || 0;
                    return timeB - timeA;
                });
            }
        });
        
        // Update the history section if needed
        // This can be expanded to show a summary chart or list of past dates
        console.log('History summary:', historySummary);
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Update the Firebase auth state observer to set the current user
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        // Load data for the current user
        loadGoals(new Date().toISOString().split('T')[0]);
    } else {
        // User is signed out
        currentUser = null;
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }
});
