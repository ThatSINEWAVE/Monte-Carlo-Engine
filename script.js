document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing simulation tool');

    // DOM Elements
    const parametersContainer = document.getElementById('parameters-container');
    const addParameterBtn = document.getElementById('add-parameter');
    const runSimulationBtn = document.getElementById('run-simulation');
    const iterationsInput = document.getElementById('iterations');
    const resultsList = document.getElementById('results-list');
    const resultsChart = document.getElementById('results-chart');

    console.log('DOM elements initialized');

    // Event Listeners
    addParameterBtn.addEventListener('click', addParameter);
    runSimulationBtn.addEventListener('click', runSimulation);
    parametersContainer.addEventListener('click', handleParameterRemoval);

    console.log('Event listeners attached');

    // Add the first parameter row
    addParameter();
    console.log('First parameter row added');

    // Functions
    function addParameter() {
        console.log('Adding new parameter row');
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
        console.log('Parameter row added to DOM');
    }

    function handleParameterRemoval(event) {
        if (event.target.classList.contains('remove-param')) {
            console.log('Remove parameter button clicked');
            const row = event.target.closest('.parameter-row');
            if (parametersContainer.children.length > 1) {
                row.remove();
                console.log('Parameter row removed, remaining rows:', parametersContainer.children.length);
            } else {
                console.log('Cannot remove last parameter row');
            }
        }
    }

    function collectParameters() {
        console.log('Collecting parameters from UI');
        const parameters = [];
        const paramRows = parametersContainer.querySelectorAll('.parameter-row');
        console.log(`Found ${paramRows.length} parameter rows`);

        paramRows.forEach((row, index) => {
            const name = row.querySelector('.param-name').value.trim() || 'Unnamed Parameter';
            const min = parseFloat(row.querySelector('.param-min').value) || 0;
            const max = parseFloat(row.querySelector('.param-max').value) || 100;
            const weight = parseInt(row.querySelector('.param-weight').value) || 5;

            console.log(`Parameter ${index + 1}: name=${name}, min=${min}, max=${max}, weight=${weight}`);

            parameters.push({
                name,
                min,
                max,
                weight
            });
        });

        console.log('Parameters collected:', parameters);
        return parameters;
    }

    function generateOutcomes(parameters, iterations) {
        console.log(`Generating outcomes for ${iterations} iterations with ${parameters.length} parameters`);
        const outcomes = {};
        let generatedValues = 0;

        // Run the simulation for the specified number of iterations
        for (let i = 0; i < iterations; i++) {
            if (i % 1000 === 0 && i > 0) {
                console.log(`Processed ${i} iterations...`);
            }

            const result = {};
            let outcomeKey = '';

            // Generate values for each parameter
            parameters.forEach(param => {
                const randomValue = Math.random();
                const value = randomValue * (param.max - param.min) + param.min;
                const normalizedValue = Math.round(value);

                if (i < 5) { // Log only first few iterations to avoid console flood
                    console.log(`Iteration ${i}, Parameter ${param.name}: random=${randomValue.toFixed(4)}, raw=${value.toFixed(4)}, normalized=${normalizedValue}`);
                }

                result[param.name] = normalizedValue;
                outcomeKey += `${param.name}:${normalizedValue}|`;
                generatedValues++;
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

        console.log(`Generated ${generatedValues} parameter values across ${iterations} iterations`);
        console.log(`Produced ${Object.keys(outcomes).length} unique outcomes`);

        // Calculate probabilities
        const resultArray = Object.entries(outcomes).map(([key, data]) => {
            const probability = data.count / iterations;
            if (data.count > iterations * 0.05) { // Log only significant outcomes
                console.log(`Outcome ${key} occurred ${data.count} times (${(probability * 100).toFixed(2)}%)`);
            }
            return {
                key,
                probability,
                values: data.values,
                count: data.count
            };
        });

        // Sort by probability (descending)
        const sortedResults = resultArray.sort((a, b) => b.probability - a.probability);
        console.log(`Top outcome: ${sortedResults[0]?.key} with probability ${(sortedResults[0]?.probability * 100).toFixed(2)}%`);

        return sortedResults;
    }

    function applyParameterInteractions(outcomes, parameters) {
        console.log('Calculating parameter interactions');

        // Calculate interaction effects between parameters
        const interactionMatrix = calculateInteractionMatrix(parameters);
        console.log('Interaction matrix:', interactionMatrix);

        // Log interaction highlights
        for (let i = 0; i < parameters.length; i++) {
            for (let j = i + 1; j < parameters.length; j++) {
                console.log(`Interaction between ${parameters[i].name} and ${parameters[j].name}: ${interactionMatrix[i][j].toFixed(4)}`);
            }
        }

        // Apply interactions to each outcome
        console.log('Applying interaction effects to outcomes');

        const modifiedOutcomes = outcomes.map((outcome, index) => {
            let interactionFactor = 1.0;
            const values = outcome.values;

            if (index < 5) { // Log only top outcomes
                console.log(`Analyzing interactions for outcome: ${outcome.key}`);
            }

            // Apply interaction effects for each parameter pair
            for (let i = 0; i < parameters.length; i++) {
                for (let j = i + 1; j < parameters.length; j++) {
                    const param1 = parameters[i];
                    const param2 = parameters[j];
                    const value1 = values[param1.name];
                    const value2 = values[param2.name];

                    // Check for valid ranges to avoid division by zero
                    if (param1.max === param1.min || param2.max === param2.min) {
                        if (index < 5) {
                            console.log(`Skipping interaction for ${param1.name}/${param2.name} due to zero range`);
                        }
                        continue;
                    }

                    // Normalized positions within parameter ranges
                    const normalizedPos1 = (value1 - param1.min) / (param1.max - param1.min);
                    const normalizedPos2 = (value2 - param2.min) / (param2.max - param2.min);

                    // Deviation from center (0.5) affects interaction strength
                    const deviation1 = Math.abs(normalizedPos1 - 0.5);
                    const deviation2 = Math.abs(normalizedPos2 - 0.5);

                    // Calculate interaction effect
                    const interactionStrength = interactionMatrix[i][j];
                    const interaction = interactionStrength * deviation1 * deviation2;

                    if (index < 5) {
                        console.log(`  ${param1.name}=${value1} (norm=${normalizedPos1.toFixed(3)}, dev=${deviation1.toFixed(3)})`);
                        console.log(`  ${param2.name}=${value2} (norm=${normalizedPos2.toFixed(3)}, dev=${deviation2.toFixed(3)})`);
                        console.log(`  Interaction strength=${interactionStrength.toFixed(4)}, effect=${interaction.toFixed(4)}`);
                    }

                    interactionFactor += interaction;
                }
            }

            // Ensure interaction factor doesn't go below a reasonable minimum
            interactionFactor = Math.max(0.1, interactionFactor);

            if (index < 5 || interactionFactor > 1.2 || interactionFactor < 0.8) {
                console.log(`Outcome ${outcome.key}: Original prob=${outcome.probability.toFixed(4)}, interaction factor=${interactionFactor.toFixed(4)}, new prob=${(outcome.probability * interactionFactor).toFixed(4)}`);
            }

            // Apply the interaction factor to the probability
            return {
                ...outcome,
                probability: outcome.probability * interactionFactor,
                originalProbability: outcome.probability,
                interactionFactor
            };
        });

        return modifiedOutcomes;
    }

    function calculateInteractionMatrix(parameters) {
        console.log('Creating interaction matrix for', parameters.length, 'parameters');
        // Create a matrix of interaction strengths between parameters
        const matrix = [];

        for (let i = 0; i < parameters.length; i++) {
            matrix[i] = [];
            console.log(`Calculating interactions for parameter ${parameters[i].name} (weight: ${parameters[i].weight})`);

            for (let j = 0; j < parameters.length; j++) {
                if (i === j) {
                    matrix[i][j] = 0; // No self-interaction
                } else {
                    // More deterministic interaction based on weights
                    // Higher weights increase the likelihood of positive interactions
                    const weightSum = parameters[i].weight + parameters[j].weight;
                    const weightDiff = Math.abs(parameters[i].weight - parameters[j].weight);

                    // Generate a seeded random value based on parameter weights
                    const seed = (parameters[i].weight * 17 + parameters[j].weight * 31) % 100 / 100;
                    const randomFactor = Math.sin(seed * Math.PI) * 0.2; // Between -0.2 and 0.2

                    // Similar weights create positive interactions, different weights negative
                    const baseInteraction = (10 - weightDiff) / 10 * 0.2 - 0.1;
                    matrix[i][j] = baseInteraction + randomFactor;

                    console.log(`  With ${parameters[j].name} (weight: ${parameters[j].weight}):`);
                    console.log(`    Weight sum: ${weightSum}, weight diff: ${weightDiff}`);
                    console.log(`    Seed: ${seed.toFixed(4)}, random factor: ${randomFactor.toFixed(4)}`);
                    console.log(`    Base interaction: ${baseInteraction.toFixed(4)}`);
                    console.log(`    Final interaction: ${matrix[i][j].toFixed(4)}`);
                }
            }
        }

        return matrix;
    }

    function normalizeOutcomeProbabilities(outcomes) {
        console.log('Normalizing outcome probabilities');

        // Calculate total probability after interactions
        const totalProbability = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
        console.log(`Total probability before normalization: ${totalProbability.toFixed(4)}`);

        // Avoid division by zero
        if (totalProbability === 0) {
            console.log('Total probability is zero, assigning equal probabilities');
            return outcomes.map(outcome => ({
                ...outcome,
                probability: 1 / outcomes.length
            }));
        }

        // Normalize all probabilities to sum to 1
        console.log('Applying normalization factor:', (1 / totalProbability).toFixed(4));

        const normalizedOutcomes = outcomes.map(outcome => {
            const normalizedProbability = outcome.probability / totalProbability;
            if (outcome.probability > 0.05) { // Log only significant outcomes
                console.log(`Outcome ${outcome.key}: ${(outcome.probability * 100).toFixed(2)}% → ${(normalizedProbability * 100).toFixed(2)}%`);
            }
            return {
                ...outcome,
                probability: normalizedProbability
            };
        });

        // Verify normalization
        const checkSum = normalizedOutcomes.reduce((sum, o) => sum + o.probability, 0);
        console.log(`Verification: Sum of normalized probabilities = ${checkSum.toFixed(6)}`);

        return normalizedOutcomes;
    }

    function displayResults(sortedOutcomes) {
        console.log(`Displaying ${sortedOutcomes.length} outcomes, showing top 20`);
        resultsList.innerHTML = '';
        resultsChart.innerHTML = '';

        // Check if we have outcomes to display
        if (sortedOutcomes.length === 0) {
            console.log('No outcomes to display');
            resultsList.innerHTML = '<div class="no-results">No outcomes generated. Try adjusting parameters.</div>';
            return;
        }

        // Show top 20 outcomes in the list view
        const topOutcomes = sortedOutcomes.slice(0, 20);
        console.log(`Top outcome probability: ${(topOutcomes[0]?.probability * 100).toFixed(2)}%`);

        topOutcomes.forEach((outcome, index) => {
            const probabilityPercent = (outcome.probability * 100).toFixed(2);
            console.log(`Displaying outcome ${index + 1}: ${outcome.key} (${probabilityPercent}%)`);

            const outcomeItem = document.createElement('div');
            outcomeItem.className = 'outcome-item';

            // Add color coding based on probability
            if (outcome.probability > 0.1) {
                outcomeItem.classList.add('high-probability');
                console.log(`  High probability outcome`);
            } else if (outcome.probability > 0.03) {
                outcomeItem.classList.add('medium-probability');
                console.log(`  Medium probability outcome`);
            } else {
                outcomeItem.classList.add('low-probability');
                console.log(`  Low probability outcome`);
            }

            // Create content for the outcome
            let outcomeContent = `<div class="outcome-probability">${probabilityPercent}%</div>`;
            outcomeContent += '<div class="outcome-values">';

            Object.entries(outcome.values).forEach(([param, value]) => {
                outcomeContent += `<div>${param}: ${value}</div>`;
                console.log(`  ${param}: ${value}`);
            });

            // Add interaction info if available
            if (outcome.interactionFactor) {
                const interactionEffect = ((outcome.interactionFactor - 1) * 100).toFixed(2);
                const sign = interactionEffect > 0 ? '+' : '';
                outcomeContent += `<div class="interaction-effect">Interaction: ${sign}${interactionEffect}%</div>`;
                console.log(`  Interaction effect: ${sign}${interactionEffect}%`);
            }

            outcomeContent += '</div>';
            outcomeItem.innerHTML = outcomeContent;
            resultsList.appendChild(outcomeItem);
        });

        // Display chart only if we have outcomes
        if (topOutcomes.length > 0) {
            console.log('Creating bar chart with top 10 outcomes');
            createBarChart(topOutcomes.slice(0, 10));
        }
    }

    function createBarChart(outcomes) {
        console.log(`Creating bar chart with ${outcomes.length} outcomes`);
        if (outcomes.length === 0) {
            console.log('No outcomes for bar chart');
            return;
        }

        // Find max probability for scaling
        const maxProbability = Math.max(...outcomes.map(o => o.probability));
        console.log(`Max probability for scaling: ${(maxProbability * 100).toFixed(2)}%`);

        // Handle edge case where all probabilities are 0
        if (maxProbability <= 0) {
            console.log('All probabilities are zero, cannot create chart');
            return;
        }

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

            console.log(`Bar ${index + 1}: ${label} - ${probabilityPercent}% (width: ${widthPercentage.toFixed(2)}%)`);

            chartBar.innerHTML = `
                <div class="bar-label" title="${label}">${label}</div>
                <div class="bar-fill" style="width: ${widthPercentage}%"></div>
                <div class="bar-value">${probabilityPercent}%</div>
            `;

            resultsChart.appendChild(chartBar);
        });

        console.log('Bar chart created');
    }

    function calculateParameterSensitivity(parameters, iterations) {
        console.log(`Calculating parameter sensitivity with ${iterations} iterations`);

        // Create a copy of parameters to avoid modifying the original
        const parametersCopy = parameters.map(p => ({
            ...p
        }));
        console.log('Created copy of parameters for sensitivity analysis');

        // Calculate how sensitive the outcomes are to each parameter
        const sensitivities = {};
        console.log('Generating base outcomes for sensitivity comparison');
        const baseOutcomes = generateOutcomes(parametersCopy, iterations);

        // For each parameter, vary it slightly and see how much outcomes change
        parametersCopy.forEach((param, index) => {
            console.log(`\nAnalyzing sensitivity for parameter "${param.name}"`);
            const originalMin = param.min;
            const originalMax = param.max;
            console.log(`Original range: ${originalMin} to ${originalMax}`);

            // Create a modified parameter set with this parameter varied
            const range = originalMax - originalMin;

            // Handle special case where range is 0
            const variationAmount = range === 0 ? 1 : range * 0.1;

            param.min = Math.max(0, originalMin - variationAmount);
            param.max = originalMax + variationAmount;
            console.log(`Varied range: ${param.min} to ${param.max} (±${variationAmount})`);

            console.log(`Generating varied outcomes for "${param.name}"`);
            const variedOutcomes = generateOutcomes(parametersCopy, iterations);

            // Calculate difference in outcome distributions
            let totalDifference = 0;
            let maxDiff = 0;
            let maxDiffKey = '';

            baseOutcomes.forEach(baseOutcome => {
                const matchingOutcome = variedOutcomes.find(o => o.key === baseOutcome.key);
                let diff = 0;

                if (matchingOutcome) {
                    diff = Math.abs(baseOutcome.probability - matchingOutcome.probability);
                    totalDifference += diff;
                } else {
                    diff = baseOutcome.probability;
                    totalDifference += diff;
                }

                if (diff > maxDiff) {
                    maxDiff = diff;
                    maxDiffKey = baseOutcome.key;
                }
            });

            console.log(`Total difference for "${param.name}": ${totalDifference.toFixed(4)}`);
            console.log(`Largest difference: ${(maxDiff * 100).toFixed(2)}% for outcome ${maxDiffKey}`);

            // Store sensitivity for this parameter
            sensitivities[param.name] = totalDifference;

            // Reset the parameter
            param.min = originalMin;
            param.max = originalMax;
            console.log(`Reset parameter "${param.name}" to original range`);
        });

        // Log overall sensitivity ranking
        console.log('\nParameter Sensitivity Ranking:');
        const sortedSensitivities = Object.entries(sensitivities)
            .sort((a, b) => b[1] - a[1])
            .map(([name, sensitivity], index) => {
                console.log(`${index + 1}. ${name}: ${sensitivity.toFixed(4)}`);
                return {
                    name,
                    sensitivity
                };
            });

        return sensitivities;
    }

    function calculateParameterAverages(outcomes) {
        console.log(`Calculating parameter averages from ${outcomes.length} outcomes`);
        if (outcomes.length === 0) {
            console.log('No outcomes for parameter averages');
            return [];
        }

        // Initialize sum and count for each parameter
        const paramSums = {};
        const paramCounts = {};
        let totalSum = 0;

        // Sum up all parameter values weighted by their probability
        outcomes.forEach((outcome, index) => {
            if (index < 5) {
                console.log(`Processing outcome ${index + 1}: ${outcome.key} (probability: ${(outcome.probability * 100).toFixed(2)}%)`);
            }

            Object.entries(outcome.values).forEach(([param, value]) => {
                if (!paramSums[param]) {
                    paramSums[param] = 0;
                    paramCounts[param] = 0;
                }

                // Weight by probability
                const weightedValue = value * outcome.probability;
                paramSums[param] += weightedValue;
                paramCounts[param]++;
                totalSum += weightedValue;

                if (index < 5) {
                    console.log(`  ${param}: ${value} × ${outcome.probability.toFixed(4)} = ${weightedValue.toFixed(4)}`);
                }
            });
        });

        console.log(`Total weighted sum across all parameters: ${totalSum.toFixed(4)}`);

        // Handle edge case where totalSum is 0
        if (totalSum === 0) {
            console.log('Total sum is zero, using 1 to avoid division by zero');
            totalSum = 1;
        }

        // Calculate averages and prepare data for the pie chart
        const averages = [];
        Object.entries(paramSums).forEach(([param, sum]) => {
            if (paramCounts[param] > 0) {
                const average = sum;
                const percentage = (sum / totalSum * 100).toFixed(1);

                console.log(`${param}: average=${average.toFixed(2)}, percentage=${percentage}%`);

                averages.push({
                    parameter: param,
                    average: average.toFixed(2),
                    percentage: percentage
                });
            }
        });

        // Sort by average (descending)
        const sortedAverages = averages.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

        console.log('Sorted parameter averages:');
        sortedAverages.forEach((avg, index) => {
            console.log(`${index + 1}. ${avg.parameter}: ${avg.average} (${avg.percentage}%)`);
        });

        return sortedAverages;
    }

    function createPieChart(parameterAverages) {
        console.log(`Creating pie chart with ${parameterAverages.length} parameters`);
        const pieChart = document.getElementById('parameter-pie-chart');
        if (!pieChart) {
            console.log('Pie chart container not found');
            return;
        }

        pieChart.innerHTML = '';

        // Get the winner info element
        const winnerInfo = document.getElementById('winner-info');
        if (!winnerInfo) {
            console.log('Winner info container not found');
            return;
        }

        // Create winner info container first (above the pie chart)
        if (parameterAverages.length > 0) {
            const winner = parameterAverages[0];
            console.log(`Winner: ${winner.parameter} with average ${winner.average} (${winner.percentage}%)`);

            winnerInfo.style.display = 'flex';
            winnerInfo.innerHTML = `
                <div class="winner-label">Winner</div>
                <div class="winner-name">${winner.parameter}</div>
                <div class="winner-value">${winner.average} (${winner.percentage}%)</div>
            `;
        } else {
            console.log('No parameters for winner info');
            winnerInfo.style.display = 'none';
            return; // No data to display in pie chart
        }

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 300');
        svg.setAttribute('class', 'pie-chart-svg');

        const centerX = 150;
        const centerY = 150;
        const radius = 100;
        console.log(`Pie chart center: (${centerX}, ${centerY}), radius: ${radius}`);

        // Define colors for the pie slices
        const colors = [
            '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
            '#4895ef', '#560bad', '#f3722c', '#f8961e', '#90be6d'
        ];

        let startAngle = 0;
        const total = parameterAverages.reduce((sum, param) => sum + parseFloat(param.percentage), 0);
        console.log(`Total percentage sum: ${total.toFixed(2)}%`);

        // Handle case where total is 0
        if (total <= 0) {
            console.log('Total percentage is zero or negative, cannot create pie chart');
            pieChart.innerHTML = '<div class="no-results">Insufficient data for pie chart</div>';
            return;
        }

        // Create pie slices
        const legend = document.createElement('div');
        legend.className = 'pie-chart-legend';

        parameterAverages.forEach((param, index) => {
            const percentage = parseFloat(param.percentage);
            console.log(`Creating slice for ${param.parameter}: ${percentage.toFixed(2)}%`);

            // Skip parameters with 0 percentage
            if (percentage <= 0) {
                console.log(`Skipping ${param.parameter} (0% or negative)`);
                return;
            }

            const angleSize = (percentage / total) * 360;
            const endAngle = startAngle + angleSize;

            console.log(`  Angle: ${startAngle.toFixed(2)}° to ${endAngle.toFixed(2)}° (${angleSize.toFixed(2)}°)`);

            // Calculate the SVG arc path
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            console.log(`  Start point: (${x1.toFixed(2)}, ${y1.toFixed(2)})`);
            console.log(`  End point: (${x2.toFixed(2)}, ${y2.toFixed(2)})`);

            // Create pie slice
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const largeArcFlag = angleSize > 180 ? 1 : 0;
            console.log(`  Large arc flag: ${largeArcFlag}`);

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
            console.log(`  Added legend item for ${param.parameter}`);

            startAngle = endAngle;
        });

        pieChart.appendChild(svg);
        pieChart.appendChild(legend);
        console.log('Pie chart creation complete');
    }

    function runSimulation() {
        console.log('Starting simulation...');

        const parameters = collectParameters();
        const iterations = parseInt(iterationsInput.value) || 1000;
        console.log(`Running simulation with ${parameters.length} parameters and ${iterations} iterations`);

        if (parameters.length === 0) {
            console.log('No parameters defined');
            alert('Please add at least one parameter');
            return;
        }

        // Validate parameters
        const invalidParams = parameters.filter(p => isNaN(p.min) || isNaN(p.max) || p.min >= p.max);
        if (invalidParams.length > 0) {
            console.log('Invalid parameters detected:', invalidParams);
            alert('Some parameters have invalid min/max values. Please check your inputs.');
            return;
        }

        console.log('All parameters are valid, starting simulation with delay');

        // Use setTimeout to allow browser to update UI before heavy computation
        setTimeout(() => {
            try {
                console.log('Starting core simulation');
                console.time('Simulation execution time');

                // Run the basic simulation
                console.log('Generating initial outcomes');
                let outcomes = generateOutcomes(parameters, iterations);
                console.log(`Generated ${outcomes.length} outcomes`);

                // Apply parameter interactions
                if (parameters.length > 1) {
                    console.log('Multiple parameters detected, calculating interactions');
                    outcomes = applyParameterInteractions(outcomes, parameters);
                    console.log('Interactions applied, normalizing probabilities');
                    outcomes = normalizeOutcomeProbabilities(outcomes);
                } else {
                    console.log('Only one parameter, skipping interactions');
                }

                // Sort again after interactions
                console.log('Sorting outcomes by probability');
                outcomes.sort((a, b) => b.probability - a.probability);
                console.log(`Top outcome after sorting: ${outcomes[0]?.key} with ${(outcomes[0]?.probability * 100).toFixed(2)}%`);

                // Display results
                console.log('Displaying results in UI');
                displayResults(outcomes);

                // Calculate parameter averages and create pie chart
                console.log('Calculating parameter averages for pie chart');
                const parameterAverages = calculateParameterAverages(outcomes);
                console.log(`Calculated ${parameterAverages.length} parameter averages`);
                console.log('Creating pie chart');
                createPieChart(parameterAverages);

                // Calculate sensitivities (could be displayed in a future version)
                console.log('Beginning sensitivity analysis');
                const sensitivityIterations = Math.min(iterations, 500);
                console.log(`Using ${sensitivityIterations} iterations for sensitivity analysis`);
                const sensitivities = calculateParameterSensitivity(parameters, sensitivityIterations);
                console.log('Parameter Sensitivities:', sensitivities);

                console.timeEnd('Simulation execution time');
                console.log('Simulation completed successfully');

            } catch (error) {
                console.error('Simulation error:', error);
                console.error('Error stack:', error.stack);
                alert('An error occurred during simulation. Please check your parameters and try again.');

            }
        }, 50); // Small delay to allow UI update
    }
});