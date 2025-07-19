// Study Planner Functionality - Wrapped in IIFE to prevent global scope pollution
(function() {
    console.log('planner.js loaded');

    // Private variables
    let currentWeekStart, weeklyPlanner, currentWeekRange, prevWeekBtn, nextWeekBtn, generatePlanBtn;
    let selectedDayForTask = null;
    
    // Store navigation functions for proper cleanup
    const navigationHandlers = {
        prevWeek: null,
        nextWeek: null,
        generatePlan: null
    };

    // Initialize date after function declarations
    function initializeDates() {
        currentWeekStart = getStartOfWeek(new Date());
    }

    function initializePlanner() {
        console.log('Initializing study planner...');
        
        // Initialize dates
        initializeDates();
        
        // Get DOM Elements
        weeklyPlanner = document.getElementById('weeklyPlanner');
        currentWeekRange = document.getElementById('currentWeekRange');
        prevWeekBtn = document.getElementById('prevWeek');
        nextWeekBtn = document.getElementById('nextWeek');
        generatePlanBtn = document.getElementById('generatePlan');
        
        if (!weeklyPlanner) {
            console.error('Weekly planner element not found');
            return false;
        }
        
        // Create task popup if it doesn't exist
        createTaskPopup();
        
        // Generate the weekly planner
        generateWeeklyPlanner();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load any saved tasks
        loadTasks();
        
        return true;
    }

    // Create and manage the task popup
    function createTaskPopup() {
        console.log('Creating task popup...');
        
        // First, check if we already have a popup in the DOM
        let popup = document.getElementById('taskPopup');
        
        // If popup exists, remove it first to avoid duplicates
        if (popup) {
            console.log('Removing existing popup');
            popup.remove();
        }
        
        // Create the popup container
        popup = document.createElement('div');
        popup.id = 'taskPopup';
        popup.className = 'modal';
        popup.style.display = 'none';
        
        // Create the popup content
        popup.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h3>Add New Task</h3>
                <div class="form-group">
                    <label for="taskTitle">Task Title</label>
                    <input type="text" id="taskTitle" placeholder="Enter task title" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description (Optional)</label>
                    <textarea id="taskDescription" placeholder="Enter task description"></textarea>
                </div>
                <div class="form-group">
                    <label for="taskTime">Time Required (hours)</label>
                    <input type="number" id="taskTime" min="0.5" step="0.5" value="1" required>
                </div>
                <div class="form-group">
                    <label for="taskPriority">Priority</label>
                    <select id="taskPriority">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancelTaskBtn" class="btn btn-secondary">Cancel</button>
                    <button type="button" id="saveTaskBtn" class="btn btn-primary">Save Task</button>
                </div>
            </div>
        `;
        
        // Add popup to the body
        document.body.appendChild(popup);
        console.log('Popup added to DOM');
        
        // Get popup elements
        const closeBtn = popup.querySelector('.close-btn');
        const cancelBtn = popup.querySelector('#cancelTaskBtn');
        const saveBtn = popup.querySelector('#saveTaskBtn');
        
        // Show popup function
        const show = (day) => {
            console.log('Showing popup for day:', day);
            selectedDayForTask = day;
            
            // Make sure popup is in the DOM
            if (!document.body.contains(popup)) {
                console.log('Popup not in DOM, re-adding it');
                document.body.appendChild(popup);
            }
            
            // Reset form
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskTime').value = '1';
            document.getElementById('taskPriority').value = 'medium';
            
            // Show the popup with animation
            popup.style.display = 'flex';
            setTimeout(() => {
                popup.classList.add('visible');
                document.body.style.overflow = 'hidden';
                document.getElementById('taskTitle').focus();
            }, 10);
        };
        
        // Hide popup function
        const hide = () => {
            console.log('Hiding popup');
            popup.classList.remove('visible');
            document.body.style.overflow = '';
            selectedDayForTask = null;
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300); // Match this with CSS transition duration
        };
        
        // Event listeners
        closeBtn.addEventListener('click', hide);
        cancelBtn.addEventListener('click', hide);
        
        saveBtn.addEventListener('click', () => {
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const time = parseFloat(document.getElementById('taskTime').value) || 1;
            const priority = document.getElementById('taskPriority').value;
            
            if (!title) {
                alert('Please enter a task title');
                return;
            }
            
            const task = {
                id: `task-${Date.now()}`,
                title,
                description,
                time,
                priority,
                completed: false
            };
            
            addTaskToDay(selectedDayForTask, task);
            hide();
            
            // Reset form
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskTime').value = '1';
            document.getElementById('taskPriority').value = 'medium';
        });
        
        // Close popup when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                hide();
            }
        });
        
        // Make popup methods available globally
        window.taskPopup = { show, hide };
        console.log('Task popup initialized with show/hide methods');
    }

    // Add a task to a specific day
    function addTaskToDay(day, task) {
        console.log('Adding task to day:', day, task);
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(dayDate.getDate() + ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day.toLowerCase()));
        const dateString = dayDate.toISOString().split('T')[0];
        
        console.log('Looking for task list with date:', dateString);
        const taskList = document.querySelector(`.tasks[data-date="${dateString}"] .task-list`);
        
        if (!taskList) {
            console.error('Task list not found for day:', day, 'Date:', dateString, 'Current week start:', currentWeekStart);
            // Try to find any task list as a fallback
            const fallbackTaskList = document.querySelector('.task-list');
            if (fallbackTaskList) {
                console.warn('Using fallback task list');
                const taskElement = createTaskElement(task);
                fallbackTaskList.appendChild(taskElement);
                saveTasks();
            } else {
                console.error('No task list found at all');
            }
            return;
        }
        
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
        saveTasks();
        console.log('Task added successfully');
    }

    // Create a task element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task priority-${task.priority} ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        
        taskElement.innerHTML = `
            <div class="task-header">
                <h4 class="task-priority">${escapeHtml(task.title)}</h4>
                
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-footer">
                <span class="task-time">${task.time} hour${task.time !== 1 ? 's' : ''}</span>
                <div class="task-actions">
                    <button class="btn-icon complete-task" title="Mark Complete">
                        <i class="far ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    </button>
                    <button class="btn-icon delete-task" title="Delete Task">
                        <i class="far fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const completeBtn = taskElement.querySelector('.complete-task');
        const deleteBtn = taskElement.querySelector('.delete-task');
        
        completeBtn.addEventListener('click', () => {
            taskElement.classList.toggle('completed');
            const icon = completeBtn.querySelector('i');
            if (taskElement.classList.contains('completed')) {
                icon.className = 'fas fa-check-circle';
            } else {
                icon.className = 'far fa-circle';
            }
            saveTasks();
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                taskElement.remove();
                saveTasks();
            }
        });
        
        return taskElement;
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Clean up planner resources
    function cleanupPlanner() {
        console.log('Cleaning up planner resources...');
        
        // Remove event listeners if they exist
        if (prevWeekBtn && navigationHandlers.prevWeek) {
            prevWeekBtn.removeEventListener('click', navigationHandlers.prevWeek);
            navigationHandlers.prevWeek = null;
        }
        
        if (nextWeekBtn && navigationHandlers.nextWeek) {
            nextWeekBtn.removeEventListener('click', navigationHandlers.nextWeek);
            navigationHandlers.nextWeek = null;
        }
        
        if (generatePlanBtn && navigationHandlers.generatePlan) {
            generatePlanBtn.removeEventListener('click', navigationHandlers.generatePlan);
            navigationHandlers.generatePlan = null;
        }
        
        // Remove task popup if it exists
        const existingPopup = document.getElementById('taskPopup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        console.log('Planner resources cleaned up');
    }
    
    // Reinitialize the planner
    function reinitializePlanner() {
        console.log('Reinitializing planner...');
        cleanupPlanner();
        return initializePlanner();
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded in planner.js');
        
        // Check if we're on the planner page
        const plannerSection = document.getElementById('plannerSection');
        if (plannerSection) {
            // Initialize the planner
            if (initializePlanner()) {
                console.log('Planner initialized successfully');
                
                // Listen for section changes
                document.addEventListener('sectionChanged', (event) => {
                    if (event.detail.section === 'planner') {
                        console.log('Planner section became active, reinitializing...');
                        reinitializePlanner();
                    }
                });
            } else {
                console.error('Failed to initialize planner');
            }
        } else {
            console.log('Planner section not found, will initialize when navigated to');
        }
    });

    
    // Set up event listeners
    function setupEventListeners() {
        // Navigation buttons
        if (prevWeekBtn) {
            // Store the handler for later cleanup
            navigationHandlers.prevWeek = () => {
                currentWeekStart.setDate(currentWeekStart.getDate() - 7);
                generateWeeklyPlanner();
                updateWeekDisplay();
                loadTasks();
            };
            prevWeekBtn.addEventListener('click', navigationHandlers.prevWeek);
        }
        
        if (nextWeekBtn) {
            // Store the handler for later cleanup
            navigationHandlers.nextWeek = () => {
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                generateWeeklyPlanner();
                updateWeekDisplay();
                loadTasks();
            };
            nextWeekBtn.addEventListener('click', navigationHandlers.nextWeek);
        }
        
        // Generate plan button
        if (generatePlanBtn) {
            generatePlanBtn.addEventListener('click', generateStudyPlan);
        }
    }
    
    // Helper Functions
    function getStartOfWeek(date) {
        const d = new Date(date);
        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
        const day = d.getDay();
        // Calculate difference to previous Sunday
        const diff = d.getDate() - day;
        // Create new date set to Sunday of current week
        const sunday = new Date(d.setDate(diff));
        // Set to 00:00:00 to avoid timezone issues
        sunday.setHours(0, 0, 0, 0);
        console.log('Start of week:', sunday.toDateString(), 'from input:', date.toDateString());
        return sunday;
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    function updateWeekDisplay() {
        if (!currentWeekRange) return;
        
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        currentWeekRange.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }
    
    function generateWeeklyPlanner() {
        if (!weeklyPlanner) return;
        
        weeklyPlanner.innerHTML = '';
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date().toDateString();
        
        days.forEach((day, index) => {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + index);
            
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            if (dayDate.toDateString() === today) {
                dayCard.classList.add('today');
            }
            
            const dateStr = dayDate.toISOString().split('T')[0];
            dayCard.innerHTML = `
                <div class="day-header">
                    <h3>${day}</h3>
                    <div class="date">${formatDate(dayDate)}</div>
                </div>
                <div class="tasks" data-date="${dateStr}">
                    <div class="add-task">
                        <button class="btn btn-outline add-task-btn" data-day="${day.toLowerCase()}">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                    <div class="task-list"></div>
                </div>
            `;
            
            // Add click handler for the add task button
            const addTaskBtn = dayCard.querySelector('.add-task-btn');
            addTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add task button clicked for day:', day);
                console.log('Window taskPopup:', window.taskPopup);
                console.log('Popup element:', document.getElementById('taskPopup'));
                
                if (window.taskPopup && typeof window.taskPopup.show === 'function') {
                    console.log('Calling taskPopup.show()');
                    window.taskPopup.show(day.toLowerCase());
                } else {
                    console.error('Task popup not available. Available properties:', Object.keys(window));
                    // Try to recreate the popup as a fallback
                    createTaskPopup();
                    if (window.taskPopup && typeof window.taskPopup.show === 'function') {
                        console.log('Popup recreated, showing now');
                        window.taskPopup.show(day.toLowerCase());
                    } else {
                        alert('Task popup not available. Please refresh the page.');
                    }
                }
            });
            
            weeklyPlanner.appendChild(dayCard);
        });
        
        // Load saved tasks
        loadTasks();
    }
    
    function saveTasks() {
        if (!weeklyPlanner) return;
        
        const tasks = [];
        const dayContainers = weeklyPlanner.querySelectorAll('.tasks');
        
        dayContainers.forEach(dayContainer => {
            const date = dayContainer.dataset.date;
            const taskElements = dayContainer.querySelectorAll('.task');
            
            taskElements.forEach(task => {
                const titleElement = task.querySelector('.task-title');
                if (!titleElement) {
                    console.error('Task title element not found in task:', task);
                    return;
                }
                
                const title = titleElement.textContent;
                const descriptionElement = task.querySelector('.task-description');
                const description = descriptionElement ? descriptionElement.textContent : '';
                
                const timeElement = task.querySelector('.task-time');
                const timeText = timeElement ? timeElement.textContent : '1';
                const time = parseFloat(timeText) || 1;
                
                const priorityClass = task.className.match(/priority-(high|medium|low)/);
                const priority = priorityClass ? priorityClass[1] : 'medium';
                
                const completed = task.classList.contains('completed');
                const id = task.dataset.id || Date.now().toString();
                
                tasks.push({
                    id,
                    date,
                    title,
                    description,
                    time,
                    priority,
                    completed
                });
            });
        });
        
        // Save to localStorage
        if (currentUser) {
            localStorage.setItem(`studyPlan_${currentUser.uid}`, JSON.stringify(tasks));
            console.log('Saved tasks for user:', currentUser.uid, tasks);
        } else {
            localStorage.setItem('studyPlan', JSON.stringify(tasks));
            console.log('Saved tasks (no user):', tasks);
        }
    }
    
    function loadTasks() {
        if (!weeklyPlanner) return;
        
        let savedTasks = [];
        
        // Try to load tasks for the current user, fall back to non-user specific tasks
        if (currentUser) {
            const userTasks = localStorage.getItem(`studyPlan_${currentUser.uid}`);
            if (userTasks) {
                try {
                    savedTasks = JSON.parse(userTasks);
                    console.log('Loaded tasks for user:', currentUser.uid, savedTasks);
                } catch (e) {
                    console.error('Error parsing saved tasks:', e);
                }
            }
        } else {
            const tasks = localStorage.getItem('studyPlan');
            if (tasks) {
                try {
                    savedTasks = JSON.parse(tasks);
                    console.log('Loaded tasks (no user):', savedTasks);
                } catch (e) {
                    console.error('Error parsing saved tasks:', e);
                }
            }
        }
        
        // Clear existing tasks
        const taskLists = weeklyPlanner.querySelectorAll('.task-list');
        taskLists.forEach(list => list.innerHTML = '');
        
        // Add tasks to their respective days
        savedTasks.forEach(task => {
            if (!task) {
                console.warn('Task is null or undefined');
                return;
            }
            
            if (!task.date) {
                console.warn('Task missing date:', task);
                return;
            }
            
            // Ensure task has required fields
            if (!task.title) {
                console.warn('Task missing title:', task);
                task.title = 'Untitled Task';
            }
            
            if (!task.priority || !['high', 'medium', 'low'].includes(task.priority)) {
                task.priority = 'medium'; // Default priority
            }
            
            if (typeof task.time !== 'number' || isNaN(task.time) || task.time <= 0) {
                task.time = 1; // Default time
            }
            
            const taskList = document.querySelector(`.tasks[data-date="${task.date}"] .task-list`);
            if (taskList) {
                const taskElement = createTaskElement({
                    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: task.title || 'Untitled Task',
                    description: task.description || '',
                    time: task.time || 1,
                    priority: task.priority || 'medium',
                    completed: task.completed || false
                });
                
                taskList.appendChild(taskElement);
            } else {
                console.warn('No task list found for date:', task.date);
            }
        });
        
        console.log('Finished loading tasks');
    }
    
    function generateStudyPlan() {
        // This is a placeholder for the AI-generated study plan
        // In a real implementation, this would connect to an AI service
        alert('Generating a study plan based on your goals and progress...');
        
        // For now, we'll just add some sample tasks
        const sampleTasks = [
            { day: 'Monday', text: 'Review Organic Chemistry - 2 hours' },
            { day: 'Tuesday', text: 'Practice Calculus problems - 1.5 hours' },
            { day: 'Wednesday', text: 'Study Electrostatics - 2 hours' },
            { day: 'Thursday', text: 'Solve previous year questions - 2 hours' },
            { day: 'Friday', text: 'Take mock test - 3 hours' },
            { day: 'Saturday', text: 'Revise weak topics - 2 hours' },
            { day: 'Sunday', text: 'Rest and review - 1 hour' }
        ];
        
        sampleTasks.forEach(task => {
            const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(task.day);
            if (dayIndex !== -1) {
                const dayDate = new Date(currentWeekStart);
                dayDate.setDate(dayDate.getDate() + dayIndex);
                const dateString = dayDate.toISOString().split('T')[0];
                
                const taskList = weeklyPlanner.querySelector(`.tasks[data-date="${dateString}"] .task-list`);
                if (taskList) {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task';
                    taskElement.innerHTML = `
                        <span class="task-text">${task.text}</span>
                        <div class="task-actions">
                            <button class="btn-icon complete-task" title="Mark Complete">
                                <i class="far fa-circle"></i>
                            </button>
                            <button class="btn-icon delete-task" title="Delete Task">
                                <i class="far fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners
                    const completeBtn = taskElement.querySelector('.complete-task');
                    const deleteBtn = taskElement.querySelector('.delete-task');
                    
                    completeBtn.addEventListener('click', () => {
                        taskElement.classList.toggle('completed');
                        const icon = completeBtn.querySelector('i');
                        if (taskElement.classList.contains('completed')) {
                            icon.className = 'fas fa-check-circle';
                        } else {
                            icon.className = 'far fa-circle';
                        }
                        saveTasks();
                    });
                    
                    deleteBtn.addEventListener('click', () => {
                        taskElement.remove();
                        saveTasks();
                    });
                    
                    taskList.appendChild(taskElement);
                }
            }
        });
        
        saveTasks();
        alert('Sample study plan has been generated. You can modify it as needed!');
    }
    
    // Make the planner functions available globally
    window.studyPlanner = {
        saveTasks,
        loadTasks,
        generateStudyPlan,
        updateWeekDisplay: function() {
            updateWeekDisplay();
        },
        showTaskPopup: function(day) {
            if (window.taskPopup && typeof window.taskPopup.show === 'function') {
                window.taskPopup.show(day);
            } else {
                console.error('Task popup not available');
                alert('Task popup not available. Please refresh the page.');
            }
        }
    };
})(); // End of IIFE
