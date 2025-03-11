document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const parametersContainer = document.getElementById('parameters-container');
    const addParameterBtn = document.getElementById('add-parameter');
    const runSimulationBtn = document.getElementById('run-simulation');
    const iterationsInput = document.getElementById('iterations');
    const resultsList = document.getElementById('results-list');
    const resultsChart = document.getElementById('results-chart');

    // Event Listeners
    addParameterBtn.addEventListener('click', addParameter);
    runSimulationBtn.addEventListener('click', runSimulation);
    parametersContainer.addEventListener('click', handleParameterRemoval);

    // Add the first parameter row
    addParameter();

    // Functions
    function addParameter() {
        const paramRow = document.createElement('div');
        paramRow.className = 'parameter-row';
        paramRow.innerHTML = `
            <input type="text" class="param-name" placeholder="Parameter name">
            <input type="number" class="param-min" placeholder="Min value" min="0" max="100" step="1">
            <input type="number" class="param-max" placeholder="Max value" min="0" max="100" step="1">
            <input type="number" class="param-weight" placeholder="Weight" min="1" max="10" step="1" value="5">
            <button class="remove-param">✕</button>
        `;
        parametersContainer.appendChild(paramRow);
    }

    function handleParameterRemoval(event) {
        if (event.target.classList.contains('remove-param')) {
            const row = event.target.closest('.parameter-row');
            if (parametersContainer.children.length > 1) {
                row.remove();
            }
        }
    }

    function collectParameters() {
        const parameters = [];
        const paramRows = parametersContainer.querySelectorAll('.parameter-row');

        paramRows.forEach(row => {
            const name = row.querySelector('.param-name').value.trim() || 'Unnamed Parameter';
            const min = parseFloat(row.querySelector('.param-min').value) || 0;
            const max = parseFloat(row.querySelector('.param-max').value) || 100;
            const weight = parseInt(row.querySelector('.param-weight').value) || 5;

            parameters.push({
                name,
                min,
                max,
                weight
            });
        });

        return parameters;
    }

    function generateOutcomes(parameters, iterations) {
        const outcomes = {};

        // Run the simulation for the specified number of iterations
        for (let i = 0; i < iterations; i++) {
            const result = {};
            let outcomeKey = '';

            // Generate values for each parameter
            parameters.forEach(param => {
                const value = Math.random() * (param.max - param.min) + param.min;
                const normalizedValue = Math.round(value);

                result[param.name] = normalizedValue;
                outcomeKey += `${param.name}:${normalizedValue}|`;
            });

            // Count occurrences of each outcome
            if (outcomes[outcomeKey]) {
                outcomes[outcomeKey].count++;
            } else {
                outcomes[outcomeKey] = {
                    count: 1,
                    values: {
                        ...result
                    }
                };
            }
        }

        // Calculate probabilities
        const resultArray = Object.entries(outcomes).map(([key, data]) => {
            return {
                key,
                probability: data.count / iterations,
                values: data.values,
                count: data.count
            };
        });

        // Sort by probability (descending)
        return resultArray.sort((a, b) => b.probability - a.probability);
    }

    function applyParameterInteractions(outcomes, parameters) {
        // Calculate interaction effects between parameters
        const interactionMatrix = calculateInteractionMatrix(parameters);

        return outcomes.map(outcome => {
            let interactionFactor = 1.0;
            const values = outcome.values;

            // Apply interaction effects for each parameter pair
            for (let i = 0; i < parameters.length; i++) {
                for (let j = i + 1; j < parameters.length; j++) {
                    const param1 = parameters[i];
                    const param2 = parameters[j];
                    const value1 = values[param1.name];
                    const value2 = values[param2.name];

                    // Normalized positions within parameter ranges
                    const normalizedPos1 = (value1 - param1.min) / (param1.max - param1.min);
                    const normalizedPos2 = (value2 - param2.min) / (param2.max - param2.min);

                    // Calculate interaction effect (this is a simple example)
                    // The closer the parameters are to their extremes, the stronger the interaction
                    const interaction = interactionMatrix[i][j] *
                        Math.abs(normalizedPos1 - 0.5) *
                        Math.abs(normalizedPos2 - 0.5);

                    interactionFactor += interaction;
                }
            }

            // Apply the interaction factor to the probability
            const newProbability = outcome.probability * interactionFactor;
            return {
                ...outcome,
                probability: newProbability,
                originalProbability: outcome.probability,
                interactionFactor
            };
        });
    }

    function calculateInteractionMatrix(parameters) {
        // Create a matrix of interaction strengths between parameters
        const matrix = [];

        for (let i = 0; i < parameters.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < parameters.length; j++) {
                if (i === j) {
                    matrix[i][j] = 0; // No self-interaction
                } else {
                    // Simple weight-based interaction (could be more complex)
                    // Values between -0.2 and 0.2 for subtle effects
                    const weightFactor = (parameters[i].weight + parameters[j].weight) / 20;
                    matrix[i][j] = (Math.random() * 0.4 - 0.2) * weightFactor;
                }
            }
        }

        return matrix;
    }

    function normalizeOutcomeProbabilities(outcomes) {
        // After applying interactions, we need to normalize probabilities to sum to 1
        const totalProbability = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);

        return outcomes.map(outcome => ({
            ...outcome,
            probability: outcome.probability / totalProbability
        }));
    }

    function displayResults(sortedOutcomes) {
        resultsList.innerHTML = '';
        resultsChart.innerHTML = '';

        // Show top 20 outcomes in the list view
        const topOutcomes = sortedOutcomes.slice(0, 20);

        topOutcomes.forEach(outcome => {
            const probabilityPercent = (outcome.probability * 100).toFixed(2);
            const outcomeItem = document.createElement('div');
            outcomeItem.className = 'outcome-item';

            // Add color coding based on probability
            if (outcome.probability > 0.1) {
                outcomeItem.classList.add('high-probability');
            } else if (outcome.probability > 0.03) {
                outcomeItem.classList.add('medium-probability');
            } else {
                outcomeItem.classList.add('low-probability');
            }

            // Create content for the outcome
            let outcomeContent = `<div class="outcome-probability">${probabilityPercent}%</div>`;
            outcomeContent += '<div class="outcome-values">';

            Object.entries(outcome.values).forEach(([param, value]) => {
                outcomeContent += `<div>${param}: ${value}</div>`;
            });

            // Add interaction info if available
            if (outcome.interactionFactor) {
                const interactionEffect = ((outcome.interactionFactor - 1) * 100).toFixed(2);
                const sign = interactionEffect > 0 ? '+' : '';
                outcomeContent += `<div class="interaction-effect">Interaction: ${sign}${interactionEffect}%</div>`;
            }

            outcomeContent += '</div>';
            outcomeItem.innerHTML = outcomeContent;
            resultsList.appendChild(outcomeItem);
        });

        // Display top 10 outcomes in the chart
        createBarChart(topOutcomes.slice(0, 10));
    }

    function createBarChart(outcomes) {
        // Find max probability for scaling
        const maxProbability = outcomes[0].probability;

        outcomes.forEach((outcome, index) => {
            const chartBar = document.createElement('div');
            chartBar.className = 'chart-bar';

            // Create a simple label from parameter values
            let label = '';
            const entries = Object.entries(outcome.values);
            if (entries.length > 0) {
                const [key, value] = entries[0];
                label = `${key}: ${value}`;

                // Add second parameter if available
                if (entries.length > 1) {
                    const [key2, value2] = entries[1];
                    label += `, ${key2}: ${value2}`;
                }

                // Indicate more if there are more parameters
                if (entries.length > 2) {
                    label += '...';
                }
            }

            const widthPercentage = (outcome.probability / maxProbability) * 100;
            const probabilityPercent = (outcome.probability * 100).toFixed(2);

            chartBar.innerHTML = `
                <div class="bar-label" title="${label}">${label}</div>
                <div class="bar-fill" style="width: ${widthPercentage}%"></div>
                <div class="bar-value">${probabilityPercent}%</div>
            `;

            resultsChart.appendChild(chartBar);
        });
    }

    function calculateParameterSensitivity(parameters, iterations) {
        // Calculate how sensitive the outcomes are to each parameter
        const sensitivities = {};
        const baseOutcomes = generateOutcomes(parameters, iterations);

        // For each parameter, vary it slightly and see how much outcomes change
        parameters.forEach(param => {
            const originalMin = param.min;
            const originalMax = param.max;

            // Create a modified parameter set with this parameter varied
            const range = originalMax - originalMin;
            param.min = Math.max(0, originalMin - range * 0.1);
            param.max = originalMax + range * 0.1;

            const variedOutcomes = generateOutcomes(parameters, iterations);

            // Calculate difference in outcome distributions
            let totalDifference = 0;
            baseOutcomes.forEach(baseOutcome => {
                const matchingOutcome = variedOutcomes.find(o => o.key === baseOutcome.key);
                if (matchingOutcome) {
                    totalDifference += Math.abs(baseOutcome.probability - matchingOutcome.probability);
                } else {
                    totalDifference += baseOutcome.probability;
                }
            });

            // Store sensitivity for this parameter
            sensitivities[param.name] = totalDifference;

            // Reset the parameter
            param.min = originalMin;
            param.max = originalMax;
        });

        return sensitivities;
    }

    function calculateParameterAverages(outcomes) {
        // Initialize sum and count for each parameter
        const paramSums = {};
        const paramCounts = {};
        let totalSum = 0;

        // Sum up all parameter values weighted by their probability
        outcomes.forEach(outcome => {
            Object.entries(outcome.values).forEach(([param, value]) => {
                if (!paramSums[param]) {
                    paramSums[param] = 0;
                    paramCounts[param] = 0;
                }

                // Weight by probability
                paramSums[param] += value * outcome.probability;
                paramCounts[param]++;
                totalSum += value * outcome.probability;
            });
        });

        // Calculate averages and prepare data for the pie chart
        const averages = [];
        Object.entries(paramSums).forEach(([param, sum]) => {
            if (paramCounts[param] > 0) {
                const average = sum;
                const percentage = (sum / totalSum * 100).toFixed(1);
                averages.push({
                    parameter: param,
                    average: average.toFixed(2),
                    percentage: percentage
                });
            }
        });

        // Sort by average (descending)
        return averages.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
    }

    function createPieChart(parameterAverages) {
        const pieChart = document.getElementById('parameter-pie-chart');
        pieChart.innerHTML = '';

        // Create winner info container first (above the pie chart)
        if (parameterAverages.length > 0) {
            const winner = parameterAverages[0];

            // Get the winner info element
            const winnerInfo = document.getElementById('winner-info');
            winnerInfo.style.display = 'flex';
            winnerInfo.innerHTML = `
                <div class="winner-label">Winner</div>
                <div class="winner-name">${winner.parameter}</div>
                <div class="winner-value">${winner.average} (${winner.percentage}%)</div>
            `;
        }

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 300');
        svg.setAttribute('class', 'pie-chart-svg');

        const centerX = 150;
        const centerY = 150;
        const radius = 100;

        // Define colors for the pie slices
        const colors = [
            '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
            '#4895ef', '#560bad', '#f3722c', '#f8961e', '#90be6d'
        ];

        let startAngle = 0;
        const total = parameterAverages.reduce((sum, param) => sum + parseFloat(param.percentage), 0);

        // Create pie slices
        const legend = document.createElement('div');
        legend.className = 'pie-chart-legend';

        parameterAverages.forEach((param, index) => {
            const percentage = parseFloat(param.percentage);
            const angleSize = (percentage / total) * 360;
            const endAngle = startAngle + angleSize;

            // Calculate the SVG arc path
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            // Create pie slice
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const largeArcFlag = angleSize > 180 ? 1 : 0;

            const d = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');

            path.setAttribute('d', d);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', '2');

            // Add hover effects and tooltip
            path.setAttribute('data-parameter', param.parameter);
            path.setAttribute('data-average', param.average);
            path.setAttribute('data-percentage', param.percentage);
            path.classList.add('pie-slice');

            svg.appendChild(path);

            // Create legend item
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[index % colors.length]}"></span>
                <span class="legend-label">${param.parameter}</span>
                <span class="legend-value">${param.average} (${param.percentage}%)</span>
            `;
            legend.appendChild(legendItem);

            startAngle = endAngle;
        });

        pieChart.appendChild(svg);
        pieChart.appendChild(legend);
    }

    function runSimulation() {
        const parameters = collectParameters();
        const iterations = parseInt(iterationsInput.value) || 1000;

        if (parameters.length === 0) {
            alert('Please add at least one parameter');
            return;
        }

        // Validate parameters
        const invalidParams = parameters.filter(p => isNaN(p.min) || isNaN(p.max) || p.min >= p.max);
        if (invalidParams.length > 0) {
            alert('Some parameters have invalid min/max values. Please check your inputs.');
            return;
        }

        // Run the basic simulation
        let outcomes = generateOutcomes(parameters, iterations);

        // Apply parameter interactions
        if (parameters.length > 1) {
            outcomes = applyParameterInteractions(outcomes, parameters);
            outcomes = normalizeOutcomeProbabilities(outcomes);
        }

        // Sort again after interactions
        outcomes.sort((a, b) => b.probability - a.probability);

        // Display results
        displayResults(outcomes);

        // Calculate parameter averages and create pie chart
        const parameterAverages = calculateParameterAverages(outcomes);
        createPieChart(parameterAverages);

        // Calculate sensitivities (could be displayed in a future version)
        const sensitivities = calculateParameterSensitivity(parameters, Math.min(iterations, 500));
        console.log('Parameter Sensitivities:', sensitivities);
    }
});