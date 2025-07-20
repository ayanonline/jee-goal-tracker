// Chart module for JEE Goal Tracker
class SubjectChart {
    constructor() {
        this.chart = null;
        this.initialized = false;
        this.init();
    }

    // Initialize the chart
    async init() {
        try {
            await this.ensureChartContainer();
            this.initialized = true;
            console.log('✅ Chart module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize chart module:', error);
            this.initialized = false;
        }
    }

    // Ensure chart container is ready
    async ensureChartContainer() {
        return new Promise((resolve) => {
            const checkContainer = () => {
                const container = document.querySelector('.chart-container');
                if (container) {
                    resolve(container);
                } else {
                    setTimeout(checkContainer, 100);
                }
            };
            checkContainer();
        });
    }

    // Create or update the chart
    update(data) {
        if (!this.initialized) {
            console.warn('Chart not initialized');
            return false;
        }

        try {
            const ctx = document.getElementById('subjectPriorityChart').getContext('2d');
            
            // Prepare chart data
            const chartData = this.prepareChartData(data);
            
            // Create new chart or update existing one
            if (!this.chart) {
                this.createChart(ctx, chartData);
            } else {
                this.updateChart(chartData);
            }
            
            return true;
        } catch (error) {
            console.error('Error updating chart:', error);
            return false;
        }
    }

    // Get color for each subject (must match app.js)
    getSubjectColor(subject) {
        const colors = {
            'Physics': '#4e73df',    // Blue
            'Chemistry': '#1cc88a',  // Green
            'Mathematics': '#f6c23e' // Yellow
        };
        return colors[subject] || '#858796'; // Default gray color if subject not found
    }
    
    // Prepare chart data from goals
    prepareChartData(goals) {
        // Define all possible subjects in the order we want them to appear
        const allSubjects = ['Physics', 'Chemistry', 'Mathematics'];
        
        // Initialize subjectTime with all possible subjects set to 0
        const subjectTime = {};
        allSubjects.forEach(subject => {
            subjectTime[subject] = 0;
        });

        // Aggregate time by subject from the goals
        if (goals && goals.length > 0) {
            goals.forEach(goal => {
                if (!goal.completed) return;
                
                const subject = goal.subject;
                const time = parseFloat(goal.timeSpent) || 0;
                
                if (subjectTime.hasOwnProperty(subject)) {
                    subjectTime[subject] += time;
                } else {
                    subjectTime[subject] = time;
                }
            });
        }

        // Convert to chart.js format
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];
        
        // Always show all subjects, even if time is 0
        allSubjects.forEach(subject => {
            labels.push(subject);
            data.push(subjectTime[subject] || 0);
            backgroundColors.push(this.getSubjectColor(subject));
            borderColors.push('#ffffff');
        });

        // If no data at all, show the "No Data" state
        if (data.every(val => val === 0)) {
            return {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#f0f0f0'],
                    borderColor: ['#ffffff'],
                    borderWidth: 1
                }]
            };
        }

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 10
            }]
        };
    }

    // Create a new chart instance
    createChart(ctx, data) {
        try {
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    radius: '90%',
                    plugins: {
                        legend: {
                            display: false // Hide the legend since we're showing it outside
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value} hours`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000
                    },
                    layout: {
                        padding: 10
                    },
                    elements: {
                        arc: {
                            borderWidth: 2
                        }
                    }
                }
            });
            
            console.log('✅ Chart created successfully');
        } catch (error) {
            console.error('Error creating chart:', error);
            this.chart = null;
        }
    }

    // Update existing chart
    updateChart(data) {
        if (!this.chart) return;
        
        try {
            this.chart.data = data;
            this.chart.update();
            console.log('✅ Chart updated successfully');
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    // Get color for subject
    getSubjectColor(subject) {
        const colors = {
            'Physics': '#4e73df',
            'Chemistry': '#1cc88a',
            'Mathematics': '#f6c23e',
            'Biology': '#4BC0C0',
            'Default': '#9B59B6'
        };
        
        return colors[subject] || colors['Default'];
    }

    // Clean up chart resources
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.initialized = false;
    }
}

// Create a singleton instance
const subjectChart = new SubjectChart();

// Export the chart instance
export default subjectChart;
