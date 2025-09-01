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

    // Create gradient for each subject
    createGradient(ctx, subject) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 150);

        if (subject === 'Physics') {
            // White core → bright cyan → deep blue
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#00e5ff');
            gradient.addColorStop(1, '#005f99');
        } else if (subject === 'Chemistry') {
            // White core → neon green → deep teal
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#39ff14');
            gradient.addColorStop(1, '#006633');
        } else { // Mathematics
            // White core → violet neon → deep purple
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#c77dff');
            gradient.addColorStop(1, '#4b0082');
        }

        return gradient;
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
            borderColors.push('#f0f0f0');
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
            // Create gradients for each subject
            const gradientColors = [];
            if (data.labels && data.labels.length > 0) {
                data.labels.forEach((label, index) => {
                    if (label !== 'No Data') {
                        gradientColors.push(this.createGradient(ctx, label));
                    } else {
                        gradientColors.push('#f0f0f0');
                    }
                });

                // Update the background colors with gradients
                if (data.datasets && data.datasets.length > 0) {
                    data.datasets[0].backgroundColor = gradientColors;
                }
            }

            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Changed to false to allow custom aspect ratio
                    aspectRatio: 1, // Ensures the chart is perfectly circular
                    cutout: '0%',
                    radius: '80%',
                    borderWidth: 0,
                    plugins: {
                        legend: {
                            display: true
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
                            displayColors: false,
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw || 0;
                                    return [`${value} hours`];
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
                            borderWidth: 0
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
            // Update gradients when data changes
            const ctx = this.chart.ctx;
            const gradientColors = [];

            if (data.labels && data.labels.length > 0) {
                data.labels.forEach((label, index) => {
                    if (label !== 'No Data') {
                        gradientColors.push(this.createGradient(ctx, label));
                    } else {
                        gradientColors.push('#f0f0f0');
                    }
                });

                // Update the background colors with gradients
                if (data.datasets && data.datasets.length > 0) {
                    data.datasets[0].backgroundColor = gradientColors;
                }
            }

            this.chart.data = data;
            this.chart.update();
            console.log('✅ Chart updated successfully');
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    // Get color for subject (fallback method)
    getSubjectColor(subject) {
        const colors = {
            'Physics': '#00e5ff',   // icy neon blue
            'Chemistry': '#00ffa6', // neon aqua green
            'Mathematics': '#c77dff', // violet neon
        };

        return colors[subject] || '#ffffff'; // pure white fallback
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
