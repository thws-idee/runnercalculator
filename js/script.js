// SECOND Runner Calculator Script
window.jsPDF = window.jspdf.jsPDF;

document.addEventListener('DOMContentLoaded', function() {
    // Get form and result elements
    const runnerForm = document.getElementById('runnerForm');
    const resultsContainer = document.getElementById('results-container');
    const results = document.getElementById('results');
    const noResults = document.getElementById('no-results');
    const errorMessage = document.getElementById('error-message');
    
    // Get result display elements
    const trackPaceElement = document.getElementById('track-pace');
    const tempoPaceElement = document.getElementById('tempo-pace');
    const longPaceElement = document.getElementById('long-pace');
    
    // Get workout example elements
    const trackExamplesElement = document.getElementById('track-examples');
    const tempoExamplesElement = document.getElementById('tempo-examples');
    const longExamplesElement = document.getElementById('long-examples');
    
    // Handle form submission
    runnerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous results and errors
        results.classList.add('hidden');
        noResults.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Get form values
        const gender = document.getElementById('gender').value;
        let weight = parseFloat(document.getElementById('weight').value);
        const distance = document.getElementById('distance').value;
        
        // Check weight unit and convert if necessary
        const weightUnit = document.querySelector('input[name="weightUnit"]:checked').value;
        if (weightUnit === 'lb') {
            // Convert pounds to kilograms
            weight = weight * 0.453592;
        }
        
        // Get time values if provided
        const hours = document.getElementById('hours').value ? parseInt(document.getElementById('hours').value) : 0;
        const minutes = document.getElementById('minutes').value ? parseInt(document.getElementById('minutes').value) : 0;
        const seconds = document.getElementById('seconds').value ? parseInt(document.getElementById('seconds').value) : 0;
        
        // Validate inputs
        if (!gender || !weight || !distance) {
            showError('Please fill in all required fields (gender, weight, and distance).');
            return;
        }
        
        // Calculate total seconds if time was provided
        let totalSeconds = 0;
        let hasTime = false;
        
        if (hours > 0 || minutes > 0 || seconds > 0) {
            totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
            hasTime = true;
        }
        
        // Calculate paces based on SECOND methodology
        try {
            let paces;
            if (hasTime) {
                // Use provided time to calculate paces
                paces = calculatePacesFromTime(distance, totalSeconds, gender, weight);
            } else {
                // Estimate race time based on gender, weight, and distance
                paces = calculateEstimatedPaces(distance, gender, weight);
            }
            
            // Display results
            displayResults(paces, distance);
        } catch (error) {
            showError(error.message || 'An error occurred during calculation.');
        }
    });
    
    // Handle reset button
    document.getElementById('reset').addEventListener('click', function() {
        results.classList.add('hidden');
        noResults.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    });
    
    // Add training plan generation
    document.getElementById('download-plan').addEventListener('click', generateTrainingPlan);
    
    // Unit conversion functions
    function kmToMiles(km) {
        return km * 0.621371;
    }

    function milesToKm(miles) {
        return miles * 1.60934;
    }

    // Update displayed distances when unit changes
    document.querySelectorAll('input[name="distanceUnit"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const distanceSelect = document.getElementById('distance');
            const unit = this.value;
            const options = distanceSelect.options;
            
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                switch (option.value) {
                    case '5k':
                        option.textContent = unit === 'km' ? '5K (5 km)' : '5K (3.1 mi)';
                        break;
                    case '10k':
                        option.textContent = unit === 'km' ? '10K (10 km)' : '10K (6.2 mi)';
                        break;
                    case 'half':
                        option.textContent = unit === 'km' ? 'Half Marathon (21.1 km)' : 'Half Marathon (13.1 mi)';
                        break;
                    case 'full':
                        option.textContent = unit === 'km' ? 'Marathon (42.2 km)' : 'Marathon (26.2 mi)';
                        break;
                }
            }
        });
    });

    function generateTrainingPlan() {
        const weeks = parseInt(document.getElementById('training-weeks').value);
        const distance = document.getElementById('distance').value;
        const distanceUnit = document.querySelector('input[name="distanceUnit"]:checked').value;
        const trackPace = document.getElementById('track-pace').textContent;
        const tempoPace = document.getElementById('tempo-pace').textContent;
        const longPace = document.getElementById('long-pace').textContent;
        
        if (!weeks || !distance || !trackPace || !tempoPace || !longPace) {
            showError('Please calculate your training paces SECOND.');
            return;
        }
        
        createPDF(weeks, distance, distanceUnit, trackPace, tempoPace, longPace);
    }

    function createPDF(weeks, distance, distanceUnit, trackPace, tempoPace, longPace) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Title
        doc.setFontSize(24);
        doc.setTextColor(52, 73, 94); // Dark blue
        doc.text('SECOND Running Training Plan', pageWidth / 2, 20, { align: 'center' });
        
        // Subtitle with plan details
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(`${distance.toUpperCase()} Training Plan - ${weeks} Weeks`, pageWidth / 2, 30, { align: 'center' });
        
        // Training paces section
        doc.setFontSize(16);
        doc.setTextColor(52, 152, 219); // Blue
        doc.text('Your Training Paces', 20, 45);
        
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text([
            `Track Workouts: ${trackPace}`,
            `Tempo Runs: ${tempoPace}`,
            `Long Runs: ${longPace}`
        ], 20, 55);
        
        // Weekly schedule overview
        doc.setFontSize(16);
        doc.setTextColor(52, 152, 219);
        doc.text('Weekly Schedule Overview', 20, 85);
        
        const scheduleData = [
            ['Monday', 'Rest or Cross-Training'],
            ['Tuesday', 'Track Workout'],
            ['Wednesday', 'Rest or Cross-Training'],
            ['Thursday', 'Tempo Run'],
            ['Friday', 'Rest or Cross-Training'],
            ['Saturday', 'Long Run'],
            ['Sunday', 'Complete Rest']
        ];
        
        doc.autoTable({
            startY: 90,
            head: [['Day', 'Workout']],
            body: scheduleData,
            theme: 'grid',
            styles: {
                fontSize: 12,
                textColor: [44, 62, 80],
                cellPadding: 5
            },
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [236, 240, 241]
            }
        });
        
        // Detailed weekly plans
        let currentY = doc.previousAutoTable.finalY + 20;
        
        for (let week = 1; week <= weeks; week++) {
            // Check if we need a new page
            if (currentY > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(16);
            doc.setTextColor(52, 152, 219);
            doc.text(`Week ${week}`, 20, currentY);
            
            const workouts = [
                ['Track Workout', getTrackWorkout(week, distance, distanceUnit)],
                ['Tempo Run', getTempoRun(week, distance, distanceUnit)],
                ['Long Run', getLongRun(week, distance, distanceUnit)]
            ];
            
            doc.autoTable({
                startY: currentY + 5,
                head: [['Workout Type', 'Details']],
                body: workouts,
                theme: 'grid',
                styles: {
                    fontSize: 12,
                    textColor: [44, 62, 80],
                    cellPadding: 5
                },
                headStyles: {
                    fillColor: [46, 204, 113],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [236, 240, 241]
                }
            });
            
            currentY = doc.previousAutoTable.finalY + 15;
        }
        
        // Add footer with notes
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141);
        const footer = [
            'Notes:',
            '• Maintain proper form throughout all workouts',
            '• Stay hydrated and fuel appropriately',
            '• Cross-training options: swimming, cycling, strength training',
            '• Adjust paces based on weather conditions and how you feel',
            '',
            '© SECOND (Furman Institute of Running and Scientific Training)'
        ];
        
        doc.text(footer, 20, doc.internal.pageSize.getHeight() - 50);
        
        // Save the PDF
        doc.save('SECOND_Training_Plan.pdf');
    }

    function getTrackWorkout(week, distance, unit) {
        const workout = getBaseTrackWorkout(week, distance);
        return convertDistancesInWorkout(workout, unit);
    }
    
    function getTempoRun(week, distance, unit) {
        const run = getBaseTempoRun(week, distance);
        return convertDistancesInWorkout(run, unit);
    }
    
    function getLongRun(week, distance, unit) {
        const run = getBaseLongRun(week, distance);
        return convertDistancesInWorkout(run, unit);
    }
    
    function convertDistancesInWorkout(workout, unit) {
        if (unit === 'km') return workout;
        
        return workout.replace(/(\d+(?:\.\d+)?)\s*(?:km|kilometers?)/gi, (match, num) => {
            const miles = kmToMiles(parseFloat(num));
            return `${miles.toFixed(1)} miles`;
        });
    }

    // Existing helper functions with base workouts in kilometers
    function getBaseTrackWorkout(week, distance) {
        const workouts = {
            '5k': [
                '8 x 400m with 90-sec recovery',
                '6 x 600m with 2-min recovery',
                '12 x 400m with 90-sec recovery',
                '4 x 1000m with 3-min recovery'
            ],
            '10k': [
                '6 x 800m with 2-min recovery',
                '5 x 1000m with 3-min recovery',
                '4 x 1200m with 3-min recovery',
                '3 x 1600m with 4-min recovery'
            ],
            'half': [
                '8 x 800m with 2-min recovery',
                '6 x 1000m with 3-min recovery',
                '5 x 1200m with 3-min recovery',
                '4 x 1600m with 4-min recovery'
            ],
            'full': [
                '10 x 800m with 2-min recovery',
                '8 x 1000m with 3-min recovery',
                '6 x 1200m with 3-min recovery',
                '5 x 1600m with 4-min recovery'
            ]
        };
        
        const workoutList = workouts[distance];
        return workoutList[week % workoutList.length];
    }
    
    function getBaseTempoRun(week, distance) {
        const runs = {
            '5k': [
                '2 miles at tempo pace',
                '3 miles at tempo pace',
                '2 x 1.5 miles at tempo pace with 2-min recovery',
                '4 miles at tempo pace'
            ],
            '10k': [
                '3 miles at tempo pace',
                '4 miles at tempo pace',
                '2 x 2 miles at tempo pace with 2-min recovery',
                '5 miles at tempo pace'
            ],
            'half': [
                '4 miles at tempo pace',
                '5 miles at tempo pace',
                '2 x 3 miles at tempo pace with 2-min recovery',
                '6 miles at tempo pace'
            ],
            'full': [
                '5 miles at tempo pace',
                '6 miles at tempo pace',
                '2 x 4 miles at tempo pace with 3-min recovery',
                '8 miles at tempo pace'
            ]
        };
        
        const runList = runs[distance];
        return runList[week % runList.length];
    }
    
    function getBaseLongRun(week, distance) {
        const baseMiles = {
            '5k': 6,
            '10k': 8,
            'half': 10,
            'full': 12
        };
        
        let miles = baseMiles[distance];
        
        // Gradually increase distance, with a recovery week every 4th week
        if (week % 4 === 0) {
            miles = Math.max(baseMiles[distance], miles - 2); // Recovery week
        } else {
            miles = miles + Math.floor(week / 2);
        }
        
        // Cap the maximum distance based on race distance
        const maxMiles = {
            '5k': 10,
            '10k': 14,
            'half': 16,
            'full': 20
        };
        
        miles = Math.min(miles, maxMiles[distance]);
        
        return `${miles} miles at long run pace`;
    }
    
    // Function to calculate paces from provided time
    function calculatePacesFromTime(distance, totalSeconds, gender, weight) {
        // Get race distance in kilometers
        const distanceKm = getDistanceInKm(distance);
        
        // Calculate pace in minutes per kilometer
        const pacePerKm = totalSeconds / (60 * distanceKm);
        
        // Calculate VO2max using Daniels' Running Formula
        // VO2max = -4.60 + 0.182258 * (distance in meters / time in minutes) + 0.000104 * (distance in meters / time in minutes)^2
        const distanceMeters = distanceKm * 1000;
        const timeMinutes = totalSeconds / 60;
        const velocity = distanceMeters / timeMinutes;
        let vo2max = -4.60 + 0.182258 * velocity + 0.000104 * (velocity * velocity);
        
        // Apply gender/weight adjustments (simplified)
        if (gender === 'female') {
            vo2max *= 0.92; // Adjustment for females
        }
        
        // Weight adjustment (simplified)
        const idealWeight = gender === 'male' ? 75 : 60; // Simplified ideal weights
        const weightFactor = Math.min(Math.max(idealWeight / weight, 0.85), 1.15);
        vo2max *= weightFactor;
        
        // Calculate training paces based on VO2max percentages according to SECOND
        // Track workout: ~95-100% of VO2max
        // Tempo run: ~85-90% of VO2max
        // Long run: ~70-75% of VO2max
        
        return {
            trackPace: calculatePaceFromVO2max(vo2max, 0.98),  // 98% of VO2max
            tempoPace: calculatePaceFromVO2max(vo2max, 0.88),  // 88% of VO2max
            longPace: calculatePaceFromVO2max(vo2max, 0.73)    // 73% of VO2max
        };
    }
    
    // Function to estimate paces without a provided time
    function calculateEstimatedPaces(distance, gender, weight) {
        // Base VO2max estimates by gender (simplified)
        let baseVO2max = gender === 'male' ? 45 : 40;
        
        // Apply weight adjustment (simplified)
        const idealWeight = gender === 'male' ? 75 : 60;
        const weightFactor = Math.min(Math.max(idealWeight / weight, 0.85), 1.15);
        baseVO2max *= weightFactor;
        
        // Distance adjustment (longer distances get slightly slower paces)
        let distanceAdjustment = 1.0;
        switch (distance) {
            case '5k':
                distanceAdjustment = 1.0;
                break;
            case '10k':
                distanceAdjustment = 0.98;
                break;
            case 'half':
                distanceAdjustment = 0.95;
                break;
            case 'full':
                distanceAdjustment = 0.92;
                break;
        }
        
        baseVO2max *= distanceAdjustment;
        
        // Calculate training paces based on adjusted VO2max
        return {
            trackPace: calculatePaceFromVO2max(baseVO2max, 0.98),
            tempoPace: calculatePaceFromVO2max(baseVO2max, 0.88),
            longPace: calculatePaceFromVO2max(baseVO2max, 0.73)
        };
    }
    
    // Helper function to calculate pace from VO2max and intensity
    function calculatePaceFromVO2max(vo2max, intensity) {
        // Adjust VO2max by intensity factor
        const adjustedVO2max = vo2max * intensity;
        
        // Use estimated formula to convert VO2max to pace (min/km)
        // This is a simplified approximation based on running science
        // Actual formula: velocity = VO2max / (3.5 + 0.2 * VO2max)
        const velocity = adjustedVO2max / (3.5 + 0.2 * adjustedVO2max);
        
        // Convert velocity (m/min) to pace (min/km)
        const paceMinPerKm = 1000 / (velocity * 60);
        
        // Convert decimal minutes to min:sec format
        return formatPace(paceMinPerKm);
    }
    
    // Helper function to convert distance name to kilometers
    function getDistanceInKm(distance) {
        switch (distance) {
            case '5k':
                return 5;
            case '10k':
                return 10;
            case 'half':
                return 21.1;
            case 'full':
                return 42.2;
            default:
                throw new Error('Invalid distance selected');
        }
    }
    
    // Helper function to format pace (min/km) to min:sec format
    function formatPace(paceMinPerKm) {
        const minutes = Math.floor(paceMinPerKm);
        const seconds = Math.round((paceMinPerKm - minutes) * 60);
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds} min/km`;
    }
    
    // Function to display calculated paces and workout examples
    function displayResults(paces, distance) {
        // Display the paces
        trackPaceElement.textContent = paces.trackPace;
        tempoPaceElement.textContent = paces.tempoPace;
        longPaceElement.textContent = paces.longPace;
        
        // Get workout examples based on the selected distance
        const workoutExamples = getWorkoutExamples(distance);
        
        // Clear previous examples
        trackExamplesElement.innerHTML = '';
        tempoExamplesElement.innerHTML = '';
        longExamplesElement.innerHTML = '';
        
        // Add track workout examples
        workoutExamples.track.forEach(example => {
            const li = document.createElement('li');
            li.textContent = example;
            trackExamplesElement.appendChild(li);
        });
        
        // Add tempo workout examples
        workoutExamples.tempo.forEach(example => {
            const li = document.createElement('li');
            li.textContent = example;
            tempoExamplesElement.appendChild(li);
        });
        
        // Add long run examples
        workoutExamples.long.forEach(example => {
            const li = document.createElement('li');
            li.textContent = example;
            longExamplesElement.appendChild(li);
        });
        
        // Show results
        results.classList.remove('hidden');
        noResults.classList.add('hidden');
    }
    
    // Function to get workout examples based on race distance
    function getWorkoutExamples(distance) {
        const examples = {
            track: [],
            tempo: [],
            long: []
        };
        
        // Track workout examples based on distance
        switch (distance) {
            case '5k':
                examples.track = [
                    '12 x 400m with 90-sec recovery',
                    '6 x 800m with 2-min recovery',
                    '5 x 1000m with 3-min recovery'
                ];
                examples.tempo = [
                    '3 miles/5 km at tempo pace',
                    '2 x 1.5 miles with 1-min recovery',
                    '4 x 1 km with 1-min recovery'
                ];
                examples.long = [
                    '8 miles/13 km at long run pace',
                    '10 miles/16 km at long run pace'
                ];
                break;
                
            case '10k':
                examples.track = [
                    '8 x 800m with 2-min recovery',
                    '5 x 1000m with 3-min recovery',
                    '4 x 1200m with 3-min recovery'
                ];
                examples.tempo = [
                    '4 miles/6.5 km at tempo pace',
                    '2 x 2 miles with 2-min recovery',
                    '5 x 1 km with 1-min recovery'
                ];
                examples.long = [
                    '10 miles/16 km at long run pace',
                    '12 miles/19 km at long run pace'
                ];
                break;
                
            case 'half':
                examples.track = [
                    '6 x 800m with 90-sec recovery',
                    '5 x 1000m with 2-min recovery',
                    '3 x 1600m with 3-min recovery'
                ];
                examples.tempo = [
                    '5 miles/8 km at tempo pace',
                    '2 x 3 miles with 2-min recovery',
                    '3 x 2 km with 2-min recovery'
                ];
                examples.long = [
                    '12 miles/19 km at long run pace',
                    '15 miles/24 km at long run pace'
                ];
                break;
                
            case 'full':
                examples.track = [
                    '10 x 800m with 2-min recovery',
                    '6 x 1200m with 2-min recovery',
                    '4 x 1600m with 3-min recovery'
                ];
                examples.tempo = [
                    '7 miles/11 km at tempo pace',
                    '2 x 4 miles with 2-min recovery',
                    '3 x 3 km with 2-min recovery'
                ];
                examples.long = [
                    '16 miles/26 km at long run pace',
                    '20 miles/32 km at long run pace'
                ];
                break;
        }
        
        return examples;
    }
    
    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        results.classList.add('hidden');
        noResults.classList.add('hidden');
    }
});
