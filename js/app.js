// DOM Elements
const goalForm = document.getElementById('goalForm');
const todayGoalsContainer = document.getElementById('todayGoals');
const historyGoalsContainer = document.getElementById('historyGoals');
const historyDateInput = document.getElementById('historyDate');

// Global variables
let currentUser = null;
let db = null;

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
        alert('Database not available. Please refresh the page and try again.');
        return;
    }
    
    const subject = document.getElementById('subject')?.value;
    const topic = document.getElementById('topic')?.value;
    const target = document.getElementById('target')?.value;
    const time = parseFloat(document.getElementById('time')?.value || 0);
    
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
        // Add to Firestore
        if (!db) throw new Error('Database not initialized');
        const docRef = await db.collection('goals').add(goal);
        console.log('Goal added with ID:', docRef.id);
        
        // Reset form
        goalForm.reset();
        
        // Reload today's goals
        loadGoals(goal.date);
    } catch (error) {
        console.error('Error adding goal:', error);
        alert('Failed to add goal. Please try again.');
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
        // Query Firestore for goals on the selected date
        const snapshot = await db.collection('goals')
            .where('userId', '==', currentUser.uid)
            .where('date', '==', date)
            .orderBy('timestamp', 'desc')
            .get();
        
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });
        
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
        <div class="goal-header">
            <span class="goal-subject">${goal.subject}</span>
            <span class="goal-time">${goal.time} hours</span>
        </div>
        <div class="goal-topic">${goal.topic}</div>
        <div class="goal-target">${goal.target}</div>
        ${isToday ? `
            <div class="goal-actions" style="margin-top: 10px; text-align: right;">
                <button class="complete-btn ${completedClass}" onclick="toggleComplete(${goal.id}, this)">
                    <i class="fas fa-${goal.completed ? 'check-circle' : 'circle'}"></i> ${completedText}
                </button>
                <button class="delete-btn" onclick="deleteGoal(${goal.id})" style="background: none; border: none; color: var(--error-color); margin-left: 10px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : ''}
    `;
    
    return goalElement;
}

// Toggle goal completion status
async function toggleComplete(goalId, button) {
    if (!currentUser) {
        console.log('No user signed in');
        return;
    }
    
    if (!db) {
        console.error('Firestore not initialized');
        return;
    }
    
    try {
        const goalRef = db.collection('goals').doc(goalId);
        const doc = await goalRef.get();
        
        if (!doc.exists) {
            console.error('No such document!');
            return;
        }
        
        const currentStatus = doc.data().completed || false;
        
        // Update in Firestore
        await goalRef.update({
            completed: !currentStatus,
            completedAt: !currentStatus ? firebase.firestore.FieldValue.serverTimestamp() : null
        });
        
        // Update the button appearance
        if (!currentStatus) {
            button.classList.add('completed');
            button.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
            button.previousElementSibling.previousElementSibling.style.textDecoration = 'line-through';
            button.previousElementSibling.style.textDecoration = 'line-through';
        } else {
            button.classList.remove('completed');
            button.innerHTML = '<i class="far fa-circle"></i> Mark as Complete';
            button.previousElementSibling.previousElementSibling.style.textDecoration = 'none';
            button.previousElementSibling.style.textDecoration = 'none';
        }
    } catch (error) {
        console.error('Error updating goal:', error);
        alert('Failed to update goal status. Please try again.');
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
    if (!currentUser) return;
    
    try {
        // Get all goals for the current user, ordered by date
        const snapshot = await db.collection('goals')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        const historySummary = {};
        
        // Group goals by date
        snapshot.forEach(doc => {
            const goal = doc.data();
            if (!historySummary[goal.date]) {
                historySummary[goal.date] = {
                    totalGoals: 0,
                    completedGoals: 0,
                    totalTime: 0
                };
            }
            
            historySummary[goal.date].totalGoals++;
            historySummary[goal.date].totalTime += goal.time || 0;
            if (goal.completed) {
                historySummary[goal.date].completedGoals++;
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
