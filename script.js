let budgetItems = [];
let savingsChart = null;
let spendingChart = null;
let budgetPieChart = null;
let incomeEnabled = true;

const instructionItems = [
    {
        title: 'Income Control',
        text: 'Click the amount to edit directly, or use the up/down arrow buttons to adjust. Maximum income is $50,000/month.'
    },
    {
        title: 'Budget Items',
        text: 'Each category can be adjusted by clicking the amount to edit, using the up/down arrow buttons, or dragging the horizontal fader handle. Maximum per item is $5,000/month.'
    },
    {
        title: 'Adding Items',
        text: 'Click "Add Item" to create new spending categories. Click the × button to remove items.'
    },
    {
        title: 'Major Purchases',
        text: 'Toggle Dream Car and Dream House to include/exclude them. Adjust purchase year to see how timing affects your savings.'
    },
    {
        title: 'Charts & Data',
        text: 'Scroll down to see savings projections, spending breakdowns, and yearly financial summaries. All updates in real-time.'
    },
    {
        title: 'Affordability',
        text: 'The banner at the top shows if you can afford your lifestyle. Negative savings are indicated by a darker appearance over 5 years.'
    }
];

const summaryCardConfig = [];

const purchaseYearOptions = [
    { value: '0', label: 'Year 0 (Before savings start)' },
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' },
    { value: '4', label: 'Year 4' },
    { value: '5', label: 'Year 5' }
];

function renderInstructions() {
    const container = document.getElementById('instructionsContent');
    if (!container) return;
    container.innerHTML = instructionItems.map(({ title, text }) => `
        <div class="instruction-item">
            <div class="instruction-item-title">${title}</div>
            <div class="instruction-item-text">${text}</div>
        </div>
    `).join('');
}

function renderSummaryCards() {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    container.innerHTML = summaryCardConfig.map(({ id, label }) => `
        <div class="summary-card">
            <div class="summary-card-label">${label}</div>
            <div class="summary-card-value" id="${id}">$0</div>
        </div>
    `).join('');
}

function populatePurchaseYearSelects() {
    const optionsMarkup = purchaseYearOptions.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('');
    document.querySelectorAll('[data-year-options]').forEach((select) => {
        select.innerHTML = optionsMarkup;
        const defaultValue = select.dataset.default ?? purchaseYearOptions[0].value;
        select.value = defaultValue;
    });
}

function initStaticSections() {
    renderSummaryCards();
    renderInstructions();
    populatePurchaseYearSelects();
}

// Default budget items
const defaultBudgetItems = [
    { name: 'Bills & Utilities', amount: 808.63, enabled: true },
    { name: 'Dining & Drinks', amount: 798.88, enabled: true },
    { name: 'Groceries', amount: 452.76, enabled: true },
    { name: 'Auto & Transport', amount: 425.94, enabled: true },
    { name: 'Entertainment & Rec.', amount: 276.73, enabled: true },
    { name: 'Shopping', amount: 220.65, enabled: true },
    { name: 'Fees', amount: 216.93, enabled: true },
    { name: 'Travel & Vacation', amount: 201.08, enabled: true },
    { name: 'Health & Wellness', amount: 141.99, enabled: true },
    { name: 'Home & Garden', amount: 70.00, enabled: true },
    { name: 'Software & Tech', amount: 7.99, enabled: true }
];

function initBudgetItems() {
    budgetItems = [...defaultBudgetItems];
    renderBudgetItems();
}

// Save/Load functionality
function getCurrentState() {
    return {
        monthlyIncome: parseFloat(document.getElementById('monthlyIncome').value) || 9593.42,
        incomeEnabled: incomeEnabled,
        budgetItems: [...budgetItems],
        carEnabled: document.getElementById('carEnabled').checked,
        carPrice: parseFloat(document.getElementById('carPrice').value) || 40000,
        carInterestRate: parseFloat(document.getElementById('carInterestRate').value) || 6,
        carLoanMonths: parseInt(document.getElementById('carLoanMonths').value) || 60,
        carPurchaseYear: parseInt(document.getElementById('carPurchaseYear').value) || 0,
        houseEnabled: document.getElementById('houseEnabled').checked,
        housePrice: parseFloat(document.getElementById('housePrice').value) || 400000,
        houseInterestRate: parseFloat(document.getElementById('houseInterestRate').value) || 6,
        houseLoanYears: parseInt(document.getElementById('houseLoanYears').value) || 30,
        housePurchaseYear: parseInt(document.getElementById('housePurchaseYear').value) || 0,
        houseAdditionalBills: parseFloat(document.getElementById('houseAdditionalBills').value) || 2000,
        timestamp: new Date().toISOString()
    };
}

function loadState(state) {
    // Load income
    document.getElementById('monthlyIncome').value = state.monthlyIncome;
    incomeEnabled = state.incomeEnabled;

    // Load budget items
    budgetItems = [...state.budgetItems];

    // Load car settings
    document.getElementById('carEnabled').checked = state.carEnabled;
    document.getElementById('carPrice').value = state.carPrice;
    document.getElementById('carInterestRate').value = state.carInterestRate;
    document.getElementById('carLoanMonths').value = state.carLoanMonths;
    document.getElementById('carPurchaseYear').value = state.carPurchaseYear;

    // Load house settings
    document.getElementById('houseEnabled').checked = state.houseEnabled;
    document.getElementById('housePrice').value = state.housePrice;
    document.getElementById('houseInterestRate').value = state.houseInterestRate;
    document.getElementById('houseLoanYears').value = state.houseLoanYears;
    document.getElementById('housePurchaseYear').value = state.housePurchaseYear;
    document.getElementById('houseAdditionalBills').value = state.houseAdditionalBills;

    // Update UI
    renderBudgetItems();
    calculate();

    // Update toggles
    toggleCar();
    toggleHouse();
}

function saveScenario(name) {
    const scenarios = JSON.parse(localStorage.getItem('blackbox_scenarios') || '{}');
    scenarios[name] = getCurrentState();
    localStorage.setItem('blackbox_scenarios', JSON.stringify(scenarios));
    updateScenarioList();
    showNotification('Scenario saved: ' + name);
}

function loadScenario(name) {
    const scenarios = JSON.parse(localStorage.getItem('blackbox_scenarios') || '{}');
    if (scenarios[name]) {
        loadState(scenarios[name]);
        showNotification('Scenario loaded: ' + name);
    }
}

function deleteScenario(name) {
    const scenarios = JSON.parse(localStorage.getItem('blackbox_scenarios') || '{}');
    delete scenarios[name];
    localStorage.setItem('blackbox_scenarios', JSON.stringify(scenarios));
    updateScenarioList();
    showNotification('Scenario deleted: ' + name);
}

function updateScenarioList() {
    const scenarios = JSON.parse(localStorage.getItem('blackbox_scenarios') || '{}');
    const container = document.getElementById('scenarioList');
    if (!container) return;

    const scenarioNames = Object.keys(scenarios).sort();
    if (scenarioNames.length === 0) {
        container.innerHTML = '<div class="no-scenarios">No saved scenarios yet</div>';
        return;
    }

    container.innerHTML = scenarioNames.map(name => {
        const scenario = scenarios[name];
        const date = new Date(scenario.timestamp).toLocaleDateString();
        return `
            <div class="scenario-item">
                <div class="scenario-info">
                    <div class="scenario-name">${name}</div>
                    <div class="scenario-date">Saved ${date}</div>
                </div>
                <div class="scenario-actions">
                    <button class="scenario-btn load-btn" onclick="loadScenario('${name}')">Load</button>
                    <button class="scenario-btn delete-btn" onclick="deleteScenario('${name}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Mini Dashboard functionality
let miniSavingsChart = null;

function updateMiniDashboard() {
    const monthlyIncome = incomeEnabled ? (parseFloat(document.getElementById('monthlyIncome').value) || 0) : 0;
    const monthlySpending = budgetItems.reduce((sum, item) => {
        if (item.enabled === false) return sum;
        return sum + (parseFloat(item.amount) || 0);
    }, 0);

    // Calculate major purchases first (needed for expense and savings calculations)
    const carEnabled = document.getElementById('carEnabled').checked;
    const houseEnabled = document.getElementById('houseEnabled').checked;
    const carPayment = carEnabled ? calculateCarPayment() : 0;
    const housePayment = houseEnabled ? calculateHousePayment() : 0;
    const houseAdditionalBills = houseEnabled ? (parseFloat(document.getElementById('houseAdditionalBills').value) || 0) : 0;
    const totalMajorPayments = carPayment + housePayment + houseAdditionalBills;
    
    // Calculate total expenses including major purchases
    const totalMonthlyExpenses = monthlySpending + totalMajorPayments;
    
    // Calculate monthly cash flow after all expenses including major purchases
    const monthlyCashFlow = monthlyIncome - totalMonthlyExpenses;
    const miniMonthlyCashFlow = document.getElementById('miniMonthlyCashFlow');
    const miniMonthlyCashFlowTrend = document.getElementById('miniMonthlyCashFlowTrend');

    miniMonthlyCashFlow.textContent = '$' + Math.round(monthlyCashFlow).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});

    if (monthlyCashFlow > 500) {
        miniMonthlyCashFlowTrend.textContent = '↗ Strong';
        miniMonthlyCashFlowTrend.className = 'mini-metric-trend positive';
    } else if (monthlyCashFlow > 0) {
        miniMonthlyCashFlowTrend.textContent = '→ Positive';
        miniMonthlyCashFlowTrend.className = 'mini-metric-trend positive';
    } else if (monthlyCashFlow === 0) {
        miniMonthlyCashFlowTrend.textContent = '→ Neutral';
        miniMonthlyCashFlowTrend.className = 'mini-metric-trend';
    } else {
        miniMonthlyCashFlowTrend.textContent = '↘ Deficit';
        miniMonthlyCashFlowTrend.className = 'mini-metric-trend negative';
    }

    // Calculate expense ratio including major purchases
    const expenseRatio = monthlyIncome > 0 ? (totalMonthlyExpenses / monthlyIncome) * 100 : 0;
    const miniExpenseRatio = document.getElementById('miniExpenseRatio');
    const miniExpenseRatioTrend = document.getElementById('miniExpenseRatioTrend');

    miniExpenseRatio.textContent = Math.round(expenseRatio) + '%';

    if (expenseRatio < 60) {
        miniExpenseRatioTrend.textContent = '→ Optimal';
        miniExpenseRatioTrend.className = 'mini-metric-trend positive';
    } else if (expenseRatio < 80) {
        miniExpenseRatioTrend.textContent = '⚠ Moderate';
        miniExpenseRatioTrend.className = 'mini-metric-trend warning';
    } else {
        miniExpenseRatioTrend.textContent = '⚠ High';
        miniExpenseRatioTrend.className = 'mini-metric-trend negative';
    }

    const miniMajorPurchases = document.getElementById('miniMajorPurchases');
    const miniMajorPurchasesTrend = document.getElementById('miniMajorPurchasesTrend');

    miniMajorPurchases.textContent = '$' + totalMajorPayments.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) + '/mo';

    const majorPaymentRatio = monthlyIncome > 0 ? (totalMajorPayments / monthlyIncome) * 100 : 0;
    if (majorPaymentRatio < 20) {
        miniMajorPurchasesTrend.textContent = '→ Manageable';
        miniMajorPurchasesTrend.className = 'mini-metric-trend positive';
    } else if (majorPaymentRatio < 35) {
        miniMajorPurchasesTrend.textContent = '⚠ Moderate';
        miniMajorPurchasesTrend.className = 'mini-metric-trend warning';
    } else {
        miniMajorPurchasesTrend.textContent = '⚠ High Load';
        miniMajorPurchasesTrend.className = 'mini-metric-trend negative';
    }

    // Update 5-year projection using the same detailed calculation as affordability banner
    const carPurchaseYear = parseInt(document.getElementById('carPurchaseYear').value) || 0;
    const carPurchaseMonth = carPurchaseYear * 12;
    const carLoanMonths = parseInt(document.getElementById('carLoanMonths').value) || 60;
    const housePurchaseYear = parseInt(document.getElementById('housePurchaseYear').value) || 0;
    const housePurchaseMonth = housePurchaseYear * 12;
    
    // Calculate house down payment (simplified for mini dashboard)
    // Note: Use cash flow WITHOUT house payments for down payment calculation
    // since we're calculating savings accumulated BEFORE the house purchase
    const baseCashFlow = monthlyIncome - monthlySpending;
    const housePrice = parseFloat(document.getElementById('housePrice').value) || 0;
    let houseDownPayment = 0;
    if (houseEnabled && housePurchaseYear > 0) {
        // Rough estimate: use accumulated savings before house purchase
        const monthsBeforeHouse = housePurchaseYear * 12;
        const annualReturnRate = 0.04;
        const monthlyRate = annualReturnRate / 12;
        let year1Savings = 0;
        for (let month = 1; month <= monthsBeforeHouse; month++) {
            let monthlySavingsThisMonth = baseCashFlow;
            // Subtract car payment if car loan is active in this month
            if (carEnabled && month > carPurchaseMonth && month <= carPurchaseMonth + carLoanMonths) {
                monthlySavingsThisMonth -= carPayment;
            }
            year1Savings += monthlySavingsThisMonth;
            year1Savings = year1Savings * (1 + monthlyRate);
        }
        houseDownPayment = Math.min(year1Savings, housePrice);
    }
    
    // Calculate savings rate (after ALL expenses including major purchases)
    const savingsRate = monthlyIncome > 0 ? (monthlyCashFlow / monthlyIncome) * 100 : 0;
    
    // Update core metrics (Financial Health Score & Savings Rate)
    updateCoreMetrics(monthlyIncome, monthlyCashFlow, expenseRatio, savingsRate, totalMajorPayments);
    
}

function calculateCarPayment() {
    const carPrice = parseFloat(document.getElementById('carPrice').value) || 0;
    const carInterestRate = parseFloat(document.getElementById('carInterestRate').value) || 0;
    const carLoanMonths = parseInt(document.getElementById('carLoanMonths').value) || 60;
    return carPrice > 0 ? calculateLoanPayment(carPrice, carInterestRate, carLoanMonths) : 0;
}

function calculateHousePayment() {
    const housePrice = parseFloat(document.getElementById('housePrice').value) || 0;
    const houseInterestRate = parseFloat(document.getElementById('houseInterestRate').value) || 0;
    const houseLoanYears = parseInt(document.getElementById('houseLoanYears').value) || 30;
    const houseLoanMonths = houseLoanYears * 12;
    return housePrice > 0 ? calculateLoanPayment(housePrice, houseInterestRate, houseLoanMonths) : 0;
}

function updateCoreMetrics(monthlyIncome, monthlyCashFlow, expenseRatio, savingsRate, totalMajorPayments) {
    // Update Financial Health Score
    const healthScoreElement = document.getElementById('financialHealthScore');
    const healthScoreStatusElement = document.getElementById('financialHealthScoreStatus');
    
    // Calculate Financial Health Score (0-100) - same logic as before
    let healthScore = 0;
    
    // Factor 1: Cash Flow Health (0-30 points)
    if (monthlyIncome > 0) {
        const cashFlowRatio = monthlyCashFlow / monthlyIncome;
        if (cashFlowRatio >= 0.2) {
            healthScore += 30;
        } else if (cashFlowRatio >= 0.1) {
            healthScore += 25;
        } else if (cashFlowRatio >= 0.05) {
            healthScore += 20;
        } else if (cashFlowRatio > 0) {
            healthScore += 10;
        } else {
            const deficitRatio = Math.abs(cashFlowRatio);
            healthScore += Math.max(0, 10 - (deficitRatio * 20));
        }
    }
    
    // Factor 2: Expense Ratio (0-30 points)
    if (expenseRatio <= 50) {
        healthScore += 30;
    } else if (expenseRatio <= 60) {
        healthScore += 25;
    } else if (expenseRatio <= 70) {
        healthScore += 18;
    } else if (expenseRatio <= 80) {
        healthScore += 10;
    } else {
        healthScore += Math.max(0, 5 - ((expenseRatio - 80) / 2));
    }
    
    // Factor 3: Debt-to-Income Ratio (0-25 points)
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalMajorPayments / monthlyIncome) * 100 : 0;
    if (debtToIncomeRatio <= 15) {
        healthScore += 25;
    } else if (debtToIncomeRatio <= 25) {
        healthScore += 20;
    } else if (debtToIncomeRatio <= 35) {
        healthScore += 12;
    } else if (debtToIncomeRatio <= 45) {
        healthScore += 5;
    }
    
    // Factor 4: Savings Rate (0-15 points)
    if (savingsRate >= 20) {
        healthScore += 15;
    } else if (savingsRate >= 15) {
        healthScore += 12;
    } else if (savingsRate >= 10) {
        healthScore += 9;
    } else if (savingsRate > 0) {
        healthScore += 5;
    }
    
    // Clamp score to 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Update health score display
    if (healthScoreElement) {
        if (monthlyIncome > 0) {
            healthScoreElement.textContent = Math.round(healthScore);
        } else {
            healthScoreElement.textContent = '--';
        }
    }
    
    // Update health score status
    if (healthScoreStatusElement) {
        let statusText, statusClass;
        if (monthlyIncome === 0) {
            statusText = 'No Data';
            statusClass = '';
        } else if (healthScore >= 80) {
            statusText = 'Excellent';
            statusClass = 'positive';
        } else if (healthScore >= 65) {
            statusText = 'Good';
            statusClass = 'positive';
        } else if (healthScore >= 50) {
            statusText = 'Moderate';
            statusClass = 'warning';
        } else if (healthScore >= 35) {
            statusText = 'Needs Attention';
            statusClass = 'warning';
        } else {
            statusText = 'Critical';
            statusClass = 'negative';
        }
        
        healthScoreStatusElement.textContent = statusText;
        healthScoreStatusElement.className = `core-metric-status ${statusClass}`;
    }
    
    // Update Savings Rate
    const savingsRateElement = document.getElementById('savingsRate');
    const savingsRateStatusElement = document.getElementById('savingsRateStatus');
    
    if (savingsRateElement) {
        if (monthlyIncome > 0) {
            savingsRateElement.textContent = Math.round(savingsRate) + '%';
        } else {
            savingsRateElement.textContent = '--%';
        }
    }
    
    if (savingsRateStatusElement) {
        let statusText, statusClass;
        if (monthlyIncome === 0) {
            statusText = 'No Data';
            statusClass = '';
        } else if (savingsRate >= 20) {
            statusText = 'Excellent';
            statusClass = 'positive';
        } else if (savingsRate >= 15) {
            statusText = 'Strong';
            statusClass = 'positive';
        } else if (savingsRate >= 10) {
            statusText = 'Good';
            statusClass = 'positive';
        } else if (savingsRate >= 5) {
            statusText = 'Moderate';
            statusClass = 'warning';
        } else if (savingsRate > 0) {
            statusText = 'Low';
            statusClass = 'warning';
        } else {
            statusText = 'Deficit';
            statusClass = 'negative';
        }
        
        savingsRateStatusElement.textContent = statusText;
        savingsRateStatusElement.className = `core-metric-status ${statusClass}`;
    }
}


function formatCompactCurrency(value) {
    if (Math.abs(value) >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
        return '$' + (value / 1000).toFixed(0) + 'K';
    } else {
        return '$' + Math.round(value);
    }
}

function saveCurrentScenario() {
    const scenarioName = document.getElementById('scenarioName').value.trim();
    if (!scenarioName) {
        showNotification('Please enter a scenario name');
        return;
    }
    saveScenario(scenarioName);
    document.getElementById('scenarioName').value = '';
}

function renderBudgetItems() {
    const container = document.getElementById('budgetItems');
    container.innerHTML = '';
    
    // First, render the income item
    const incomeValue = Math.round(parseFloat(document.getElementById('monthlyIncome').value) || 9593);
    const incomeDiv = document.createElement('div');
    incomeDiv.className = 'budget-item income-item' + (incomeEnabled === false ? ' disabled' : '');
    const incomeToggleIcon = incomeEnabled ? '✓' : '✗';
    
    incomeDiv.innerHTML = `
        <div class="budget-item-top">
            <input class="form-input budget-item-input budget-name-input budget-name-input--readonly budget-item-name" value="Income (in thousands)"
                   placeholder="Income (in thousands)"
                   readonly
                   ${!incomeEnabled ? 'disabled' : ''}>
        </div>
        <div class="budget-item-amount-row">
            <div class="budget-amount-input-wrapper${!incomeEnabled ? ' is-disabled' : ''}">
                <input type="number"
                       class="budget-amount-input income-amount-input${!incomeEnabled ? ' is-disabled' : ''}"
                       id="incomeAmountInput"
                       value="${(incomeValue / 1000).toFixed(1)}"
                       min="0"
                       max="50"
                       step="0.1"
                       oninput="updateIncomeFromThousands(parseFloat(this.value) || 0)"
                       ${!incomeEnabled ? 'disabled' : ''}
                       placeholder="0">
            </div>
            <div class="budget-spinner-controls">
                <button type="button" class="budget-spinner-btn" onclick="decrementIncome()" ${!incomeEnabled ? 'disabled' : ''} aria-label="Decrease income">
                    <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6 L7 3 L7 9 Z" />
                    </svg>
                </button>
                <button type="button" class="budget-spinner-btn" onclick="incrementIncome()" ${!incomeEnabled ? 'disabled' : ''} aria-label="Increase income">
                    <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6 L5 3 L5 9 Z" />
                    </svg>
                </button>
            </div>
            <div class="budget-item-toggle-row">
                <div class="toggle-switch ${incomeEnabled ? 'enabled' : ''}" role="switch" aria-checked="${incomeEnabled ? 'true' : 'false'}" onclick="toggleIncome()" title="${incomeEnabled ? 'Disable' : 'Enable'} income">
                    <div class="toggle-thumb"></div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(incomeDiv);
    
    // Then render budget items
    budgetItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'budget-item' + (item.enabled === false ? ' disabled' : '');
        
        const isEnabled = item.enabled !== false;
        const toggleIcon = isEnabled ? '✓' : '✗';

        div.innerHTML = `
            <div class="budget-item-top">
                <input class="form-input budget-item-input budget-name-input budget-item-name" value="${item.name}"
                       placeholder="Budget item name"
                       oninput="updateBudgetItem(${index}, 'name', this.value)"
                       ${!isEnabled ? 'disabled' : ''}>
            </div>
            <div class="budget-item-amount-row">
                <div class="budget-amount-input-wrapper${!isEnabled ? ' is-disabled' : ''}">
                    <input type="number"
                           class="budget-amount-input${!isEnabled ? ' is-disabled' : ''}"
                           id="budget-amount-${index}"
                           value="${Math.round(parseFloat(item.amount) || 0)}"
                           min="0"
                           max="5000"
                           step="10"
                           oninput="updateBudgetItem(${index}, 'amount', Math.round(parseFloat(this.value) || 0))"
                           ${!isEnabled ? 'disabled' : ''}
                           placeholder="0">
                </div>
                <div class="budget-spinner-controls">
                    <button type="button" class="budget-spinner-btn" onclick="decrementBudgetItem(${index})" ${!isEnabled ? 'disabled' : ''} aria-label="Decrease amount">
                        <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6 L7 3 L7 9 Z" />
                        </svg>
                    </button>
                    <button type="button" class="budget-spinner-btn" onclick="incrementBudgetItem(${index})" ${!isEnabled ? 'disabled' : ''} aria-label="Increase amount">
                        <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6 L5 3 L5 9 Z" />
                        </svg>
                    </button>
                </div>
                <div class="budget-item-toggle-row">
                    <div class="toggle-switch ${isEnabled ? 'enabled' : ''}" role="switch" aria-checked="${isEnabled ? 'true' : 'false'}" onclick="toggleBudgetItem(${index})" title="${isEnabled ? 'Disable' : 'Enable'} item">
                        <div class="toggle-thumb"></div>
                    </div>
                    <button class="budget-item-delete" onclick="deleteBudgetItem(${index})" title="Delete this budget item" aria-label="Delete budget item">
                        ×
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);

    });
}

function updateBudgetItem(index, field, value) {
    if (field === 'amount') {
        const maxValue = 5000;
        const roundedValue = Math.round(parseFloat(value) || 0);
        const clampedValue = Math.max(0, Math.min(maxValue, roundedValue));
        budgetItems[index].amount = clampedValue;
        // Update the input value to reflect clamped value
        const inputElement = document.getElementById(`budget-amount-${index}`);
        if (inputElement) {
            inputElement.value = clampedValue;
        }
    } else {
        budgetItems[index][field] = value;
    }
    // Use debounced calculate to avoid blocking scroll on mobile
    debouncedCalculate();
}

function updateBudgetSlider(index, value, element) {
    const maxValue = 5000;
    budgetItems[index].amount = parseFloat(value) || 0;

    updateFaderVisuals(index);
    updateBudgetDisplay(index);
    calculate();
}

function addBudgetItem() {
    budgetItems.push({ name: 'New Item', amount: 0, enabled: true });
    renderBudgetItems();
}

function deleteBudgetItem(index) {
    if (budgetItems.length <= 1) {
        showNotification('You must have at least one budget item');
        return;
    }
    budgetItems.splice(index, 1);
    renderBudgetItems();
    calculate();
    showNotification('Budget item deleted');
}

function resetAllValues() {
    // Reset income to 0
    document.getElementById('monthlyIncome').value = 0;
    
    // Reset all budget items to 0
    budgetItems.forEach(item => {
        item.amount = 0;
    });
    
    // Re-render budget items to update displays
    renderBudgetItems();
    
    // Recalculate everything
    calculate();
    
    // Show notification
    showNotification('All values have been reset to zero');
}

function toggleIncome() {
    incomeEnabled = !incomeEnabled;
    renderBudgetItems();
    calculate();
}

function toggleBudgetItem(index) {
    if (budgetItems[index]) {
        budgetItems[index].enabled = budgetItems[index].enabled === false ? true : false;
        renderBudgetItems();
        calculate();
    }
}

function updateIncome(value) {
    const incomeValue = Math.round(parseFloat(value) || 0);
    const maxValue = 50000;
    const clampedValue = Math.max(0, Math.min(maxValue, incomeValue));
    document.getElementById('monthlyIncome').value = clampedValue;
    const inputElement = document.getElementById('incomeAmountInput');
    if (inputElement) {
        inputElement.value = (clampedValue / 1000).toFixed(1);
    }
    calculate();
}

function updateIncomeFromThousands(thousandsValue) {
    const dollarValue = Math.round(thousandsValue * 1000);
    updateIncome(dollarValue);
}

function incrementIncome() {
    const input = document.getElementById('incomeAmountInput');
    if (input && !input.disabled) {
        const currentValue = parseFloat(input.value) || 0;
        const newValue = Math.min(50, currentValue + 0.1);
        updateIncomeFromThousands(newValue);
    }
}

function decrementIncome() {
    const input = document.getElementById('incomeAmountInput');
    if (input && !input.disabled) {
        const currentValue = parseFloat(input.value) || 0;
        const newValue = Math.max(0, currentValue - 0.1);
        updateIncomeFromThousands(newValue);
    }
}

function incrementBudgetItem(index) {
    const input = document.getElementById(`budget-amount-${index}`);
    if (input && !input.disabled) {
        const currentValue = Math.round(parseFloat(input.value) || 0);
        const newValue = Math.min(5000, currentValue + 10);
        updateBudgetItem(index, 'amount', newValue);
    }
}

function decrementBudgetItem(index) {
    const input = document.getElementById(`budget-amount-${index}`);
    if (input && !input.disabled) {
        const currentValue = Math.round(parseFloat(input.value) || 0);
        const newValue = Math.max(0, currentValue - 10);
        updateBudgetItem(index, 'amount', newValue);
    }
}

function updateIncomeFaderVisuals() {
    const incomeValue = parseFloat(document.getElementById('monthlyIncome').value) || 0;
    const maxValue = 50000;
    const faderWidth = (incomeValue / maxValue) * 100;
    const track = document.getElementById('income-fader-track');
    const trackWidth = track ? track.offsetWidth : 120;
    let handleLeft = (faderWidth / 100 * trackWidth) - 8;
    handleLeft = Math.max(-8, Math.min(trackWidth - 8, handleLeft));

    const faderLevel = document.getElementById('income-fader-level');
    const faderHandle = document.getElementById('income-fader-handle');

    if (faderLevel) {
        faderLevel.style.width = faderWidth + '%';
    }
    if (faderHandle) {
        faderHandle.style.left = handleLeft + 'px';
    }
}

function editIncomeAmount() {
    const displayElement = document.getElementById('incomeAmountDisplay');
    const hiddenInput = document.getElementById('monthlyIncome');
    const slider = document.getElementById('monthlyIncomeSlider');
    
    if (!displayElement || displayElement.classList.contains('editing')) return;
    
    const currentValue = parseFloat(hiddenInput.value) || 0;
    
    // Replace display with input field
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'incomeAmountDisplay';
    input.value = currentValue;
    input.className = 'income-amount-display editing';
    input.style.width = displayElement.offsetWidth + 'px';
    input.onblur = function() {
        finishEditingIncome(this.value, hiddenInput, slider);
    };
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    };
    input.onfocus = function() {
        this.select();
    };
    
    displayElement.parentNode.replaceChild(input, displayElement);
    input.focus();
    input.select();
}

function finishEditingIncome(value, hiddenInput, slider) {
    const numValue = parseFloat(value) || 0;
    const maxValue = 50000;
    const clampedValue = Math.max(0, Math.min(maxValue, numValue));
    
    hiddenInput.value = clampedValue;
    if (slider) slider.value = clampedValue;
    updateIncomeFaderVisuals();
    
    // Find the input that's currently being edited and replace it
    const editingInput = document.getElementById('incomeAmountDisplay');
    if (editingInput) {
        const displayElement = document.createElement('span');
        displayElement.id = 'incomeAmountDisplay';
        displayElement.className = 'income-amount-display';
        displayElement.textContent = '$' + clampedValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
        displayElement.onclick = editIncomeAmount;
        editingInput.parentNode.replaceChild(displayElement, editingInput);
    }
    
    calculate();
}

function updateIncomeFromInput(value) {
    const incomeValue = Math.round(parseFloat(value) || 0);
    const maxValue = 50000;
    const clampedValue = Math.max(0, Math.min(maxValue, incomeValue));
    
    const slider = document.getElementById('monthlyIncomeSlider');
    if (slider) slider.value = clampedValue;
    const displayElement = document.getElementById('incomeAmountDisplay');
    if (displayElement) {
        displayElement.textContent = '$' + clampedValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }
    const inputElement = document.getElementById('incomeAmountInput');
    if (inputElement) {
        inputElement.value = (clampedValue / 1000).toFixed(1);
    }
    updateIncomeFaderVisuals();
    calculate();
}

function editBudgetAmount(index) {
    const displayElement = document.getElementById(`budget-amount-${index}`);
    const budgetItem = displayElement.closest('.budget-item');
    const slider = budgetItem ? budgetItem.querySelector('.budget-slider') : null;
    
    if (!displayElement || displayElement.classList.contains('editing')) return;
    
    const currentValue = budgetItems[index].amount || 0;
    
    // Replace display with input field
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `budget-amount-${index}`;
    input.value = currentValue;
    input.className = 'budget-amount-display editing';
    input.style.width = displayElement.offsetWidth + 'px';
    input.step = '1';
    input.onblur = function() {
        finishEditingBudget(index, this.value, slider);
    };
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    };
    input.onfocus = function() {
        this.select();
    };
    
    displayElement.parentNode.replaceChild(input, displayElement);
    input.focus();
    input.select();
}

function finishEditingBudget(index, value, slider) {
    const maxValue = 5000;
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(maxValue, numValue));
    
    budgetItems[index].amount = clampedValue;
    if (slider) {
        slider.value = clampedValue;
    }
    
    // Update fader level
    const faderLevel = document.getElementById(`fader-level-${index}`);
    if (faderLevel) {
        const faderHeight = (clampedValue / maxValue) * 100;
        faderLevel.style.height = faderHeight + '%';
    }
    
    // Find the input that's currently being edited and replace it
    const editingInput = document.getElementById(`budget-amount-${index}`);
    if (editingInput) {
        const displayElement = document.createElement('span');
        displayElement.id = `budget-amount-${index}`;
        displayElement.className = 'budget-amount-display';
        displayElement.textContent = '$' + clampedValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
        displayElement.onclick = function() { editBudgetAmount(index); };
        editingInput.parentNode.replaceChild(displayElement, editingInput);
    }
    
    calculate();
}

// Fader drag functionality
let isDragging = false;
let dragIndex = -1;
let dragStartX = 0;
let dragStartValue = 0;

// Income fader drag functionality
let isIncomeDragging = false;
let incomeDragStartX = 0;
let incomeDragStartValue = 0;

function startIncomeFaderDrag(event) {
    // Always clean up any existing drag state first
    stopIncomeFaderDrag();
    stopFaderDrag();
    
    // Only prevent default if this is actually a fader interaction
    const target = event.target;
    const isFaderElement = target.closest('.fader-handle') || target.closest('.fader-track') || target.closest('.income-fader-handle');
    if (!isFaderElement) return;
    
    // Don't start drag if user is interacting with an input
    if (target.closest('input') || target.closest('button') || document.activeElement?.tagName === 'INPUT') {
        return;
    }
    
    // Don't preventDefault immediately - wait to see if it's a drag or scroll
    // Only prevent default for mouse events (they're always drags)
    if (!event.touches) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    isIncomeDragging = false; // Start as false, will be set to true after movement detection
    const currentValue = parseFloat(document.getElementById('monthlyIncome').value) || 0;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    incomeDragStartX = clientX;
    incomeDragStartY = clientY;
    incomeDragStartValue = currentValue;
    
    // Use bound handlers to ensure proper cleanup
    dragIncomeFaderBound = dragIncomeFader.bind(null);
    stopIncomeFaderDragBound = stopIncomeFaderDrag.bind(null);
    
    document.addEventListener('mousemove', dragIncomeFaderBound);
    document.addEventListener('mouseup', stopIncomeFaderDragBound);
    document.addEventListener('touchmove', dragIncomeFaderBound, { passive: true }); // Start as passive
    document.addEventListener('touchend', stopIncomeFaderDragBound, { passive: true });
    document.addEventListener('touchcancel', stopIncomeFaderDragBound, { passive: true });
    
    // Safety timeout to force cleanup if drag state gets stuck
    if (incomeDragTimeout) clearTimeout(incomeDragTimeout);
    incomeDragTimeout = setTimeout(() => {
        stopIncomeFaderDrag();
    }, 10000); // 10 second safety timeout
}

let incomeDragTimeout = null;
let incomeDragStartY = 0;

let dragIncomeFaderBound = null;
let stopIncomeFaderDragBound = null;

function dragIncomeFader(event) {
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // For touch events, check if this is horizontal drag or vertical scroll
    if (event.touches) {
        const deltaX = Math.abs(clientX - incomeDragStartX);
        const deltaY = Math.abs(clientY - incomeDragStartY);

        // If vertical movement is significantly greater than horizontal, user is scrolling - cancel drag
        if (deltaY > deltaX * 1.5 && deltaY > 15) {
            stopIncomeFaderDrag();
            return;
        }

        // Only set dragging to true and preventDefault if we have clear horizontal intent
        if (!isIncomeDragging && deltaX > 8 && deltaX > deltaY * 1.2) {
            isIncomeDragging = true;
            // Switch to non-passive listener now that we know it's a drag
            document.removeEventListener('touchmove', dragIncomeFaderBound);
            document.addEventListener('touchmove', dragIncomeFaderBound, { passive: false });
        }

        // Only preventDefault if we're actually dragging
        if (!isIncomeDragging) return;
        event.preventDefault();
    } else {
        // Mouse events - always prevent default
        if (!isIncomeDragging) {
            isIncomeDragging = true;
        }
        event.preventDefault();
    }

    const track = document.getElementById('income-fader-track');
    if (!track) {
        stopIncomeFaderDrag();
        return;
    }
    
    const trackWidth = track.offsetWidth || 120;
    const deltaX = clientX - incomeDragStartX;
    const deltaPercent = deltaX / trackWidth;

    const maxValue = 50000;
    let newValue = incomeDragStartValue + (deltaPercent * maxValue);
    newValue = Math.max(0, Math.min(maxValue, Math.round(newValue / 100) * 100));

    document.getElementById('monthlyIncome').value = newValue;
    const slider = document.getElementById('monthlyIncomeSlider');
    if (slider) slider.value = newValue;
    updateIncomeFaderVisuals();
    
    const displayElement = document.getElementById('incomeAmountDisplay');
    if (displayElement && !displayElement.classList.contains('editing')) {
        displayElement.textContent = '$' + newValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }
    // Use requestAnimationFrame to avoid blocking scroll
    requestAnimationFrame(() => calculate());
}

function stopIncomeFaderDrag() {
    if (!isIncomeDragging && !dragIncomeFaderBound) return;
    isIncomeDragging = false;
    
    // Clear safety timeout
    if (incomeDragTimeout) {
        clearTimeout(incomeDragTimeout);
        incomeDragTimeout = null;
    }
    
    if (dragIncomeFaderBound) {
        document.removeEventListener('mousemove', dragIncomeFaderBound);
        document.removeEventListener('touchmove', dragIncomeFaderBound);
    }
    if (stopIncomeFaderDragBound) {
        document.removeEventListener('mouseup', stopIncomeFaderDragBound);
        document.removeEventListener('touchend', stopIncomeFaderDragBound);
        document.removeEventListener('touchcancel', stopIncomeFaderDragBound);
    }
    
    dragIncomeFaderBound = null;
    stopIncomeFaderDragBound = null;
}

let dragFaderBound = null;
let stopFaderDragBound = null;

function startFaderDrag(event, index) {
    // Always clean up any existing drag state first
    stopIncomeFaderDrag();
    stopFaderDrag();
    
    // Only prevent default if this is actually a fader interaction
    const target = event.target;
    const isFaderElement = target.closest('.fader-handle') || target.closest('.fader-track');
    if (!isFaderElement) return;
    
    // Don't start drag if user is interacting with an input
    if (target.closest('input') || target.closest('button') || document.activeElement?.tagName === 'INPUT') {
        return;
    }
    
    // Don't preventDefault immediately - wait to see if it's a drag or scroll
    // Only prevent default for mouse events (they're always drags)
    if (!event.touches) {
        event.preventDefault();
    }
    
    isDragging = false; // Start as false, will be set to true after movement detection
    dragIndex = index;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    dragStartX = clientX;
    dragStartY = clientY;
    dragStartValue = budgetItems[index].amount;
    
    // Use bound handlers to ensure proper cleanup
    dragFaderBound = dragFader.bind(null);
    stopFaderDragBound = stopFaderDrag.bind(null);
    
    document.addEventListener('mousemove', dragFaderBound);
    document.addEventListener('mouseup', stopFaderDragBound);
    document.addEventListener('touchmove', dragFaderBound, { passive: true }); // Start as passive
    document.addEventListener('touchend', stopFaderDragBound, { passive: true });
    document.addEventListener('touchcancel', stopFaderDragBound, { passive: true });
    
    // Safety timeout to force cleanup if drag state gets stuck
    if (faderDragTimeout) clearTimeout(faderDragTimeout);
    faderDragTimeout = setTimeout(() => {
        stopFaderDrag();
    }, 10000); // 10 second safety timeout
}

let faderDragTimeout = null;

let dragStartY = 0;

function dragFader(event) {
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // For touch events, check if this is horizontal drag or vertical scroll
    if (event.touches) {
        const deltaX = Math.abs(clientX - dragStartX);
        const deltaY = Math.abs(clientY - dragStartY);

        // If vertical movement is significantly greater than horizontal, user is scrolling - cancel drag
        if (deltaY > deltaX * 1.5 && deltaY > 15) {
            stopFaderDrag();
            return;
        }

        // Only set dragging to true and preventDefault if we have clear horizontal intent
        if (!isDragging && deltaX > 8 && deltaX > deltaY * 1.2 && dragIndex !== -1) {
            isDragging = true;
            // Switch to non-passive listener now that we know it's a drag
            document.removeEventListener('touchmove', dragFaderBound);
            document.addEventListener('touchmove', dragFaderBound, { passive: false });
        }

        // Only preventDefault if we're actually dragging
        if (!isDragging || dragIndex === -1) return;
        event.preventDefault();
    } else {
        // Mouse events - always prevent default
        if (!isDragging || dragIndex === -1) return;
        event.preventDefault();
    }

    const track = document.getElementById(`fader-track-${dragIndex}`);
    if (!track) {
        stopFaderDrag();
        return;
    }
    
    const trackWidth = track.offsetWidth || 120;
    const deltaX = clientX - dragStartX;
    const deltaPercent = deltaX / trackWidth;

    const maxValue = 5000;
    let newValue = dragStartValue + (deltaPercent * maxValue);
    newValue = Math.max(0, Math.min(maxValue, Math.round(newValue / 10) * 10));

    budgetItems[dragIndex].amount = newValue;
    updateFaderVisuals(dragIndex);
    updateBudgetDisplay(dragIndex);
    // Use requestAnimationFrame to avoid blocking scroll
    requestAnimationFrame(() => calculate());
}

function stopFaderDrag() {
    if (!isDragging && !dragFaderBound && dragIndex === -1) return;
    isDragging = false;
    dragIndex = -1;
    
    // Clear safety timeout
    if (faderDragTimeout) {
        clearTimeout(faderDragTimeout);
        faderDragTimeout = null;
    }
    
    if (dragFaderBound) {
        document.removeEventListener('mousemove', dragFaderBound);
        document.removeEventListener('touchmove', dragFaderBound);
    }
    if (stopFaderDragBound) {
        document.removeEventListener('mouseup', stopFaderDragBound);
        document.removeEventListener('touchend', stopFaderDragBound);
        document.removeEventListener('touchcancel', stopFaderDragBound);
    }
    
    dragFaderBound = null;
    stopFaderDragBound = null;
}

function updateFaderVisuals(index) {
    const maxValue = 5000;
    const faderWidth = (budgetItems[index].amount / maxValue) * 100;
    const track = document.getElementById(`fader-track-${index}`);
    const trackWidth = track ? track.offsetWidth : 120;
    const handleLeft = (faderWidth / 100 * trackWidth) - 8;

    const faderLevel = document.getElementById(`fader-level-${index}`);
    const faderHandle = document.getElementById(`fader-handle-${index}`);

    if (faderLevel) {
        faderLevel.style.width = faderWidth + '%';
    }
    if (faderHandle) {
        faderHandle.style.left = handleLeft + 'px';
    }
}

function updateBudgetDisplay(index) {
    const displayElement = document.getElementById(`budget-amount-${index}`);
    if (displayElement && !displayElement.classList.contains('editing')) {
        displayElement.textContent = '$' + budgetItems[index].amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }
}

function toggleCar() {
    const carEnabled = document.getElementById('carEnabled').checked;
    const carPanel = document.getElementById('carPanel');
    if (carEnabled) {
        carPanel.classList.remove('disabled');
    } else {
        carPanel.classList.add('disabled');
    }
    calculate();
}

function toggleHouse() {
    const houseEnabled = document.getElementById('houseEnabled').checked;
    const housePanel = document.getElementById('housePanel');
    if (houseEnabled) {
        housePanel.classList.remove('disabled');
    } else {
        housePanel.classList.add('disabled');
    }
    calculate();
}

function calculateLoanPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / months;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

// Shared function to calculate 5-year projection with compound interest
function calculateFiveYearProjection(baseMonthlySavings, carEnabled, carMonthlyPayment, carPurchaseMonth, carLoanMonths, houseEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseDownPayment) {
    const years = 5;
    const months = years * 12;
    let savingsBalance = 0;
    const annualReturnRate = 0.04;
    const monthlyRate = annualReturnRate / 12;

    for (let month = 0; month <= months; month++) {
        if (month > 0) {
            let monthlySavingsThisMonth = baseMonthlySavings;

            // Subtract car loan payment
            if (carEnabled && month > carPurchaseMonth && month <= carPurchaseMonth + carLoanMonths) {
                monthlySavingsThisMonth -= carMonthlyPayment;
            }

            // Subtract house loan payment
            if (houseEnabled && month > housePurchaseMonth) {
                monthlySavingsThisMonth -= houseMonthlyPayment;
                monthlySavingsThisMonth -= houseAdditionalBills;
            }

            // Deduct down payments
            if (houseEnabled && month === housePurchaseMonth && houseDownPayment > 0) {
                savingsBalance -= houseDownPayment;
            }

            savingsBalance += monthlySavingsThisMonth;
            savingsBalance = savingsBalance * (1 + monthlyRate);
        }
    }

    return savingsBalance;
}

function calculate() {
    const monthlyIncome = incomeEnabled ? (parseFloat(document.getElementById('monthlyIncome').value) || 0) : 0;
    const monthlySpending = budgetItems.reduce((sum, item) => {
        if (item.enabled === false) return sum;
        return sum + (parseFloat(item.amount) || 0);
    }, 0);
    const baseMonthlySavings = monthlyIncome - monthlySpending;

    // Car loan
    const carEnabled = document.getElementById('carEnabled').checked;
    const carPrice = parseFloat(document.getElementById('carPrice').value) || 0;
    const carInterestRate = parseFloat(document.getElementById('carInterestRate').value) || 0;
    const carLoanMonths = parseInt(document.getElementById('carLoanMonths').value) || 60;
    const carPurchaseYear = parseInt(document.getElementById('carPurchaseYear').value) || 0;
    const carPurchaseMonth = carPurchaseYear * 12; // Convert year to month
    const carMonthlyPayment = carEnabled && carPrice > 0 ? calculateLoanPayment(carPrice, carInterestRate, carLoanMonths) : 0;

    // House loan
    const houseEnabled = document.getElementById('houseEnabled').checked;
    const housePrice = parseFloat(document.getElementById('housePrice').value) || 0;
    const houseInterestRate = parseFloat(document.getElementById('houseInterestRate').value) || 0;
    const houseLoanYears = parseInt(document.getElementById('houseLoanYears').value) || 30;
    const houseLoanMonths = houseLoanYears * 12;
    const housePurchaseYear = parseInt(document.getElementById('housePurchaseYear').value) || 0;
    const housePurchaseMonth = housePurchaseYear * 12; // Convert year to month
    const houseAdditionalBills = parseFloat(document.getElementById('houseAdditionalBills').value) || 0;

    // Calculate Year 1 savings for house down payment if needed
    let year1Savings = 0;
    const annualReturnRate = 0.04;
    const monthlyRate = annualReturnRate / 12;

    if (houseEnabled && housePurchaseYear >= 1) {
        // Calculate savings accumulated before house purchase (Year 0 to housePurchaseYear-1)
        const monthsBeforeHouse = housePurchaseYear * 12;
        for (let month = 1; month <= monthsBeforeHouse; month++) {
            let monthlySavingsThisMonth = baseMonthlySavings;
            if (carEnabled && month > carPurchaseMonth && month <= carPurchaseMonth + carLoanMonths) {
                monthlySavingsThisMonth -= carMonthlyPayment;
            }
            year1Savings += monthlySavingsThisMonth;
            year1Savings = year1Savings * (1 + monthlyRate);
        }
    }
    // If house purchased at Year 0, no savings available yet for down payment
    // If house purchased at Year 1+, use accumulated savings

    const houseDownPayment = houseEnabled && housePurchaseYear === 0 ? 0 : (houseEnabled ? Math.min(year1Savings, housePrice) : 0);
    const houseLoanAmount = Math.max(0, housePrice - houseDownPayment);
    const houseMonthlyPayment = houseEnabled && houseLoanAmount > 0 ? calculateLoanPayment(houseLoanAmount, houseInterestRate, houseLoanMonths) : 0;

    // Update displays
    const carPaymentEl = document.getElementById('carPayment');
    const housePaymentEl = document.getElementById('housePayment');
    if (carPaymentEl) {
        carPaymentEl.textContent = '$' + Math.round(carMonthlyPayment).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }
    if (housePaymentEl) {
        housePaymentEl.textContent = '$' + Math.round(houseMonthlyPayment).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }

    // Calculate 5-year projection using shared function
    const years = 5;
    const months = years * 12;
    const savingsData = [];
    const labels = [];
    let savingsBalance = 0;

    // Calculate detailed month-by-month for chart data
    const chartAnnualReturnRate = 0.04;
    const chartMonthlyRate = chartAnnualReturnRate / 12;
    for (let month = 0; month <= months; month++) {
        if (month > 0) {
            let monthlySavingsThisMonth = baseMonthlySavings;

            // Subtract car loan payment
            if (carEnabled && month > carPurchaseMonth && month <= carPurchaseMonth + carLoanMonths) {
                monthlySavingsThisMonth -= carMonthlyPayment;
            }

            // Subtract house loan payment
            if (houseEnabled && month > housePurchaseMonth) {
                monthlySavingsThisMonth -= houseMonthlyPayment;
                monthlySavingsThisMonth -= houseAdditionalBills;
            }

            // Deduct down payments
            if (houseEnabled && month === housePurchaseMonth && houseDownPayment > 0) {
                savingsBalance -= houseDownPayment;
            }

            savingsBalance += monthlySavingsThisMonth;
            savingsBalance = savingsBalance * (1 + chartMonthlyRate);
        }
        savingsData.push(savingsBalance);

        if (month % 12 === 0 || month === months) {
            labels.push(`Year ${Math.floor(month / 12)}`);
        } else if (month % 3 === 0) {
            labels.push('');
        } else {
            labels.push('');
        }
    }

    // Use shared function to get final savings (ensures consistency)
    const finalSavingsCalculated = calculateFiveYearProjection(
        baseMonthlySavings,
        carEnabled,
        carMonthlyPayment,
        carPurchaseMonth,
        carLoanMonths,
        houseEnabled,
        houseMonthlyPayment,
        housePurchaseMonth,
        houseAdditionalBills,
        houseDownPayment
    );
    const finalSavings = finalSavingsCalculated;

    // Update affordability banner (finalSavings already calculated above)
    const banner = document.getElementById('affordabilityBanner');
    const bannerTitle = document.getElementById('affordabilityTitle');
    const bannerText = document.getElementById('affordabilityDesc');
    const monthlySavingsAfterLoans = baseMonthlySavings - (carMonthlyPayment > 0 && months > carPurchaseMonth && months <= carPurchaseMonth + carLoanMonths ? carMonthlyPayment : 0) - (houseMonthlyPayment > 0 && months > housePurchaseMonth ? houseMonthlyPayment + houseAdditionalBills : 0);

    if (banner && bannerTitle && bannerText) {
        if (finalSavings < 0 || monthlySavingsAfterLoans < 0) {
            banner.className = 'affordability-banner negative';
            bannerTitle.textContent = 'You Cannot Afford This Lifestyle';
            bannerText.textContent = 'Your savings will go negative. Consider adjusting your purchases or budget.';
        } else {
            banner.className = 'affordability-banner';
            bannerTitle.textContent = 'You Can Afford This Lifestyle';
            bannerText.textContent = 'Your projected savings remain positive over 5 years';
        }
    }

    const monthlySavingsEl = document.getElementById('monthlySavings');
    const totalSavingsEl = document.getElementById('totalSavings');
    
    if (monthlySavingsEl) {
        monthlySavingsEl.textContent = '$' + Math.round(monthlySavingsAfterLoans).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
        monthlySavingsEl.className = 'summary-card-value ' + (monthlySavingsAfterLoans >= 0 ? 'positive' : 'negative');
    }
    
    if (totalSavingsEl) {
        totalSavingsEl.textContent = '$' + Math.round(finalSavings).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
        totalSavingsEl.className = 'summary-card-value ' + (finalSavings >= 0 ? 'positive' : 'negative');
    }

    // Update the core metric projected savings display
    const topRightSavingsEl = document.getElementById('topRightSavings');
    if (topRightSavingsEl) {
        topRightSavingsEl.textContent = '$' + Math.round(finalSavings).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
        topRightSavingsEl.className = 'core-metric-value ' + (finalSavings >= 0 ? 'positive' : 'negative');
    }

    // Update the five-year projection status
    const fiveYearStatusEl = document.getElementById('fiveYearProjectionStatus');
    if (fiveYearStatusEl) {
        if (finalSavings > 0) {
            fiveYearStatusEl.textContent = 'Positive';
            fiveYearStatusEl.className = 'core-metric-status positive';
        } else if (finalSavings < 0) {
            fiveYearStatusEl.textContent = 'Negative';
            fiveYearStatusEl.className = 'core-metric-status negative';
        } else {
            fiveYearStatusEl.textContent = 'Break Even';
            fiveYearStatusEl.className = 'core-metric-status';
        }
    }

    // Update charts
    updateSavingsChart(labels, savingsData);
    updateSpendingChart(labels, budgetItems, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseEnabled, months);
    updateBentoBox(budgetItems, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseEnabled, months);
    updateBudgetPieChart(budgetItems);
    updateYearlyTable(monthlyIncome, baseMonthlySavings, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseDownPayment, houseEnabled, years, months, monthlyRate);

    // Update mini dashboard
    updateMiniDashboard();
}

function updateSavingsChart(labels, data) {
    const ctx = document.getElementById('savingsChart').getContext('2d');

    if (savingsChart) {
        savingsChart.destroy();
    }

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const isNegative = minValue < 0;

    // Calculate yearly cumulative savings for hover tooltips
    const yearlySavings = [];
    for (let year = 0; year <= 5; year++) {
        const monthIndex = year * 12;
        yearlySavings.push({
            year: year,
            savings: data[monthIndex] || 0,
            monthIndex: monthIndex
        });
    }

    // Create a plugin for year highlighting on hover
    const yearHighlightPlugin = {
        id: 'yearHighlight',
        beforeDraw: (chart) => {
            const { ctx, chartArea: { left, right, top, bottom }, scales: { x } } = chart;
            const hoveredIndex = chart.tooltip?.dataPoints?.[0]?.dataIndex;

            if (hoveredIndex !== undefined && hoveredIndex % 12 === 0) {
                // Only highlight at year boundaries (every 12 months)
                const yearIndex = Math.floor(hoveredIndex / 12);
                const xPosition = x.getPixelForValue(hoveredIndex);

                // Draw vertical highlight line
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(xPosition, top);
                ctx.lineTo(xPosition, bottom);
                ctx.stroke();

                // Draw year label background
                const yearLabel = `Year ${yearIndex}`;
                ctx.font = 'bold 12px Inter, sans-serif';
                const labelWidth = ctx.measureText(yearLabel).width;
                const labelHeight = 20;
                const labelX = xPosition - labelWidth / 2;
                const labelY = top - 25;

                // Background rectangle
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(labelX - 5, labelY - labelHeight + 5, labelWidth + 10, labelHeight);

                // Label text
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(yearLabel, xPosition, labelY);
                ctx.restore();
            }
        }
    };

    savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Savings',
                data: data,
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        plugins: [yearHighlightPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const year = Math.floor(dataIndex / 12);
                            const month = dataIndex % 12;
                            if (month === 0) {
                                return `Year ${year} - Start`;
                            } else {
                                return `Year ${year}, Month ${month}`;
                            }
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const dataIndex = context.dataIndex;
                            const year = Math.floor(dataIndex / 12);

                            if (dataIndex % 12 === 0) {
                                // This is a year marker - show cumulative savings for this year
                                return `Cumulative Savings: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            } else {
                                return `Savings Balance: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { 
                        display: true, 
                        text: 'Time (Years)',
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    title: { 
                        display: true, 
                        text: 'Savings ($)',
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateSpendingChart(labels, budgetItems, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseEnabled, totalMonths) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    
    if (spendingChart) {
        spendingChart.destroy();
    }

    // Year intervals: 12, 24, 36, 48, 60 months
    const yearLabels = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const yearMonths = [12, 24, 36, 48, 60];
    
    // Generate unique colors for each category
    const categoryColors = [
        'rgba(255, 255, 255, 0.9)',
        'rgba(230, 230, 230, 0.85)',
        'rgba(200, 200, 200, 0.8)',
        'rgba(170, 170, 170, 0.75)',
        'rgba(140, 140, 140, 0.7)',
        'rgba(110, 110, 110, 0.65)',
        'rgba(255, 255, 255, 0.85)',
        'rgba(220, 220, 220, 0.8)',
        'rgba(190, 190, 190, 0.75)',
        'rgba(160, 160, 160, 0.7)',
        'rgba(130, 130, 130, 0.65)',
        'rgba(100, 100, 100, 0.6)',
        'rgba(80, 80, 80, 0.55)',
        'rgba(60, 60, 60, 0.5)'
    ];

    const borderColors = ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#ffffff', '#d0d0d0', '#b0b0b0', '#909090', '#707070', '#505050', '#404040', '#303030'];

    const datasets = [];

    // Calculate cumulative spending for each category at year intervals
    budgetItems.forEach((item, index) => {
        // Skip disabled budget items
        if (item.enabled === false) return;

        const data = yearMonths.map(month => {
            return (parseFloat(item.amount) || 0) * month;
        });

        datasets.push({
            label: item.name,
            data: data,
            backgroundColor: categoryColors[index % categoryColors.length],
            borderColor: borderColors[index % borderColors.length],
            borderWidth: 1
        });
    });

    // Add car payment
    if (carEnabled && carPayment > 0) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (m > carMonth && m <= carMonth + carMonths) {
                    total += carPayment;
                }
            }
            return total;
        });
        
        datasets.push({
            label: 'Car Loan Payment',
            data: data,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#ffffff',
            borderWidth: 1.5
        });
    }

    // Add house payment
    if (houseEnabled && (housePayment > 0 || houseBills > 0)) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (m > houseMonth) {
                    total += housePayment;
                    total += houseBills;
                }
            }
            return total;
        });
        
        datasets.push({
            label: 'House Expenses',
            data: data,
            backgroundColor: 'rgba(230, 230, 230, 0.9)',
            borderColor: '#e0e0e0',
            borderWidth: 1.5
        });
    }

    spendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: yearLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: '#ffffff',
                        font: { size: 11, weight: 500 }, 
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 16,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    titleFont: {
                        size: 13,
                        weight: 600
                    },
                    bodyFont: {
                        size: 12,
                        weight: 400
                    },
                    footerFont: {
                        size: 11,
                        weight: 500
                    },
                    footerColor: '#888888',
                    cornerRadius: 0,
                    displayColors: true,
                    boxPadding: 8,
                    usePointStyle: true,
                    callbacks: {
                        title: function(context) {
                            return yearLabels[context[0].dataIndex] || '';
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            
                            return `${label}: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        },
                        footer: function(tooltipItems) {
                            let total = 0;
                            tooltipItems.forEach(item => {
                                total += item.parsed.y;
                            });
                            return `Total Cumulative: $${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    title: { 
                        display: true, 
                        text: 'Year Interval',
                        color: '#ffffff',
                        font: {
                            family: 'JetBrains Mono',
                            size: 11,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            family: 'JetBrains Mono',
                            size: 11
                        }
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    title: { 
                        display: true, 
                        text: 'Cumulative Spending ($)',
                        color: '#ffffff',
                        font: {
                            family: 'JetBrains Mono',
                            size: 11,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateBentoBox(budgetItems, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseEnabled, months) {
    const svg = d3.select('#treemapSvg');
    const tooltip = d3.select('#treemapTooltip');
    const legend = d3.select('#treemapLegend');
    
    // Clear existing content
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();

    // Calculate 5-year totals for each category
    const categories = [];
    const totalMonths = months;

    // Add budget items (only enabled ones)
    budgetItems.forEach(item => {
        // Skip disabled budget items
        if (item.enabled === false) return;

        const monthlyAmount = parseFloat(item.amount) || 0;
        const total5Year = monthlyAmount * totalMonths;
        if (total5Year > 0) {
            categories.push({
                name: item.name,
                value: total5Year
            });
        }
    });

    // Add car loan payments
    if (carEnabled && carPayment > 0) {
        let carTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (m > carMonth && m <= carMonth + carMonths) {
                carTotal += carPayment;
            }
        }
        if (carTotal > 0) {
            categories.push({
                name: 'Car Loan Payments',
                value: carTotal
            });
        }
    }

    // Add house expenses
    if (houseEnabled && (housePayment > 0 || houseBills > 0)) {
        let houseTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (m > houseMonth) {
                houseTotal += housePayment;
                houseTotal += houseBills;
            }
        }
        if (houseTotal > 0) {
            categories.push({
                name: 'House Expenses',
                value: houseTotal
            });
        }
    }

    if (categories.length === 0) return;

    // Calculate total spending
    const totalSpending = categories.reduce((sum, cat) => sum + cat.value, 0);

    // Darker gray color palette for better white label visibility
    const colors = [
        '#2a2a2a', '#353535', '#404040', '#4a4a4a', '#555555', '#606060',
        '#6b6b6b', '#757575', '#808080', '#252525', '#303030', '#3a3a3a',
        '#454545', '#505050', '#5a5a5a', '#656565', '#707070', '#7a7a7a',
        '#2f2f2f', '#383838', '#424242', '#4d4d4d', '#585858', '#636363'
    ];

    // Assign colors to categories
    categories.forEach((category, index) => {
        category.color = colors[index % colors.length];
        category.percentage = (category.value / totalSpending) * 100;
    });

    // Get container dimensions
    const container = document.querySelector('.treemap-container');
    const width = container.clientWidth - 16; // Account for padding
    const height = container.clientHeight - 16; // Account for padding

    // Create hierarchy for D3 treemap
    const root = {
        name: 'root',
        children: categories.map(cat => ({
            name: cat.name,
            value: cat.value,
            color: cat.color,
            percentage: cat.percentage
        }))
    };

    // Create treemap layout
    const treemap = d3.treemap()
        .size([width, height])
        .padding(4)
        .round(true);

    const hierarchy = d3.hierarchy(root)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    treemap(hierarchy);

    // Create tooltip function
    const showTooltip = (event, d) => {
        const [x, y] = d3.pointer(event, container);
        tooltip
            .style('left', (x + 10) + 'px')
            .style('top', (y + 10) + 'px')
            .html(`
                <div class="treemap-tooltip-title">${d.data.name}</div>
                <div class="treemap-tooltip-amount">$${d.data.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                <div>${d.data.percentage.toFixed(1)}% of total spending</div>
            `)
            .classed('show', true);
    };

    const hideTooltip = () => {
        tooltip.classed('show', false);
    };

    // Draw rectangles
    const cells = svg.selectAll('g')
        .data(hierarchy.leaves())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cells.append('rect')
        .attr('class', 'treemap-rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => d.data.color)
        .on('mousemove', showTooltip)
        .on('mouseout', hideTooltip);

    // Helper function to wrap text
    function wrapText(textElement, text, maxWidth, lineHeight, xPosition) {
        const words = text.split(/\s+/);
        let line = '';
        let tspan = textElement.append('tspan')
            .attr('x', xPosition)
            .attr('dy', '0')
            .attr('dominant-baseline', 'hanging')
            .text('');

        words.forEach((word, i) => {
            const testLine = line + (line ? ' ' : '') + word;
            const tspanNode = tspan.node();
            if (tspanNode) {
                tspanNode.textContent = testLine;
                const testWidth = tspanNode.getComputedTextLength();
                
                if (testWidth > maxWidth && i > 0) {
                    tspan.text(line);
                    line = word;
                    tspan = textElement.append('tspan')
                        .attr('x', xPosition)
                        .attr('dy', lineHeight)
                        .attr('dominant-baseline', 'hanging')
                        .text(word);
                } else {
                    line = testLine;
                    tspan.text(line);
                }
            }
        });
    }

    // Add text labels with wrapping
    cells.each(function(d) {
        const cell = d3.select(this);
        const boxWidth = d.x1 - d.x0;
        const boxHeight = d.y1 - d.y0;
        
        // Higher minimum size thresholds for better readability
        const minWidth = 140; // Minimum width to show labels
        const minHeight = 70; // Minimum height to show labels
        const minArea = 12000; // Minimum area (width * height)
        
        // Calculate area
        const area = boxWidth * boxHeight;
        
        // Only show labels if box meets all size requirements
        if (boxWidth >= minWidth && boxHeight >= minHeight && area >= minArea) {
            const padding = 16;
            const textAreaWidth = boxWidth - (padding * 2);
            const lineHeight = 18;
            const labelFontSize = boxWidth < 200 ? '11px' : '12px';
            const amountFontSize = boxWidth < 200 ? '15px' : '17px';
            const percentageFontSize = boxWidth < 200 ? '9px' : '10px';

            // Category name with wrapping - centered vertically in available space
            const labelText = cell.append('text')
                .attr('class', 'treemap-text treemap-label')
                .attr('x', padding)
                .attr('y', padding)
                .attr('dominant-baseline', 'hanging')
                .attr('font-size', labelFontSize);
            
            wrapText(labelText, d.data.name, textAreaWidth, lineHeight, padding);

            // Calculate total label height accurately
            const labelLines = labelText.selectAll('tspan').size();
            const labelHeight = padding + (labelLines * lineHeight);
            
            // Amount - show if there's enough space
            if (boxHeight >= labelHeight + 36) {
                cell.append('text')
                    .attr('class', 'treemap-text treemap-amount')
                    .attr('x', padding)
                    .attr('y', labelHeight + 8)
                    .attr('dominant-baseline', 'hanging')
                    .attr('font-size', amountFontSize)
                    .text('$' + d.data.value.toLocaleString(undefined, {maximumFractionDigits: 0}));
                
                // Percentage - show if there's enough space below amount
                if (boxHeight >= labelHeight + 60) {
                    cell.append('text')
                        .attr('class', 'treemap-text treemap-percentage')
                        .attr('x', padding)
                        .attr('y', labelHeight + 32)
                        .attr('dominant-baseline', 'hanging')
                        .attr('font-size', percentageFontSize)
                        .text(d.data.percentage.toFixed(1) + '%');
                }
            } else if (boxHeight >= labelHeight + 20) {
                // If not enough space for amount, try to show just the category name centered better
                const availableHeight = boxHeight - padding;
                const labelCenterY = padding + (availableHeight / 2) - ((labelLines * lineHeight) / 2);
                labelText.attr('y', Math.max(padding, labelCenterY));
            }
        }
        // Boxes below minimum size threshold don't show any labels
    });

    // Create legend
    categories.forEach((category, index) => {
        const legendItem = legend.append('div')
            .attr('class', 'treemap-legend-item');

        legendItem.append('div')
            .attr('class', 'treemap-legend-color')
            .style('background-color', category.color);

        legendItem.append('span')
            .text(`${category.name}: $${category.value.toLocaleString(undefined, {maximumFractionDigits: 0})} (${category.percentage.toFixed(1)}%)`);
    });
}

function updateBudgetPieChart(budgetItems) {
    const ctx = document.getElementById('budgetPieChart').getContext('2d');
    const legendContainer = document.getElementById('budgetPieLegend');

    if (budgetPieChart) {
        budgetPieChart.destroy();
    }

    // Filter enabled budget items and calculate totals
    const enabledItems = budgetItems.filter(item => item.enabled !== false);
    const totalMonthly = enabledItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    if (enabledItems.length === 0 || totalMonthly === 0) {
        // No data to display
        legendContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px; font-family: Inter, sans-serif;">No budget items enabled</div>';
        return;
    }

    // Prepare data for pie chart
    const data = enabledItems.map(item => ({
        name: item.name,
        value: parseFloat(item.amount) || 0,
        percentage: ((parseFloat(item.amount) || 0) / totalMonthly) * 100
    }));

    // Gray color palette for pie chart (shades of gray)
    const grayColors = [
        '#4a4a4a', // Dark gray
        '#6b6b6b', // Medium dark gray
        '#8c8c8c', // Medium gray
        '#adadad', // Light medium gray
        '#cecece', // Light gray
        '#5a5a5a', // Darker gray
        '#7a7a7a', // Medium dark gray
        '#9a9a9a', // Medium light gray
        '#bababa', // Very light gray
        '#4f4f4f', // Another dark gray
        '#878787', // Medium gray
        '#a3a3a3', // Light medium gray
        '#bfbfbf', // Light gray
        '#5f5f5f', // Dark gray variant
        '#939393'  // Medium gray variant
    ];

    const backgroundColors = data.map((_, index) =>
        grayColors[index % grayColors.length]
    );

    const borderColors = backgroundColors.map(color =>
        color + 'dd' // Add slight transparency for borders
    );

    // Create pie chart
    budgetPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 8,
                hoverBorderColor: backgroundColors.map(color => color + 'ff'), // Full opacity on hover
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We'll use custom legend
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 16,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    cornerRadius: 8,
                    titleFont: {
                        family: 'Inter, sans-serif',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'JetBrains Mono, monospace',
                        size: 12,
                        weight: '500'
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const item = data[context.dataIndex];
                            return `$${item.value.toLocaleString()}/month (${item.percentage.toFixed(1)}%)`;
                        }
                    }
                }
            },
            cutout: '65%', // Larger cutout for more modern look
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });

    // Create custom legend with detailed information
    legendContainer.innerHTML = data
        .sort((a, b) => b.value - a.value) // Sort by value descending
        .map((item, index) => `
            <div class="budget-pie-legend-item">
                <div class="budget-pie-legend-color" style="background-color: ${backgroundColors[data.findIndex(d => d.name === item.name)]}"></div>
                <div class="budget-pie-legend-text">
                    <div class="budget-pie-legend-name">${item.name}</div>
                    <div class="budget-pie-legend-details">
                        <span class="budget-pie-legend-amount">$${item.value.toLocaleString()}</span>
                        <span class="budget-pie-legend-percentage">${item.percentage.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `).join('');

    // Ensure chart renders properly after scroll animations
    setTimeout(() => {
        if (budgetPieChart) {
            budgetPieChart.resize();
            budgetPieChart.update();
        }
    }, 1000);
}

function updateYearlyTable(income, baseSavings, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseDownPayment, houseEnabled, years, months, monthlyRate) {
    const tableBody = document.getElementById('yearlyTable');
    tableBody.innerHTML = '';
    let savingsBalance = 0;

    for (let year = 1; year <= years; year++) {
        const startMonth = (year - 1) * 12;
        const endMonth = year * 12;
        let annualSavings = 0;

        for (let month = startMonth + 1; month <= endMonth; month++) {
            let monthlySavingsThisMonth = baseSavings;

            if (carEnabled && month > carMonth && month <= carMonth + carMonths) {
                monthlySavingsThisMonth -= carPayment;
            }

            if (houseEnabled && month > houseMonth) {
                monthlySavingsThisMonth -= housePayment;
                monthlySavingsThisMonth -= houseBills;
            }

            if (houseEnabled && month === houseMonth && houseDownPayment > 0) {
                savingsBalance -= houseDownPayment;
            }

            annualSavings += monthlySavingsThisMonth;
            savingsBalance += monthlySavingsThisMonth;
            savingsBalance = savingsBalance * (1 + monthlyRate);
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>Year ${year}</strong></td>
            <td>$${(income * 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>$${(baseSavings * 12 - annualSavings + income * 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>$${annualSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td><strong>$${savingsBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
            <td><span class="badge ${savingsBalance >= 0 ? 'badge-success' : 'badge-danger'}">${savingsBalance >= 0 ? 'On Track' : 'Over Budget'}</span></td>
        `;
        tableBody.appendChild(row);
    }
}

// Instructions toggle function
function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggle = document.getElementById('instructionsToggle');
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
        content.classList.remove('expanded');
        toggle.textContent = 'Show Instructions';
        toggle.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        toggle.textContent = 'Hide Instructions';
        toggle.setAttribute('aria-expanded', 'true');
    }
}

// Toggle income and budget panel
function toggleIncomeBudget() {
    const content = document.getElementById('incomeBudgetContent');
    const toggle = document.getElementById('incomeBudgetToggle');
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        content.classList.remove('expanded');
        toggle.textContent = 'Show Income & Budget';
        toggle.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        toggle.textContent = 'Hide Income & Budget';
        toggle.setAttribute('aria-expanded', 'true');
    }
}

// Toggle financial planning container
function toggleFinancialPlanning() {
    const content = document.getElementById('financialPlanningContent');
    const toggle = document.getElementById('financialPlanningToggle');
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        content.classList.remove('expanded');
        toggle.textContent = 'Show Financial Planning';
        toggle.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        toggle.textContent = 'Hide Financial Planning';
        toggle.setAttribute('aria-expanded', 'true');
    }
}

// Initialize header banner image
function initHeaderBanner() {
    const image = document.getElementById('headerBannerImage');

    if (image) {
        if (image.complete && image.naturalWidth > 0) {
            image.classList.add('loaded');
        } else {
            image.addEventListener('load', function() {
                image.classList.add('loaded');
            });
            image.addEventListener('error', function() {
                image.style.display = 'none';
            });
        }
    }
}

// Scroll animations disabled for smoother scrolling
function initScrollAnimations() {
    // Make all elements visible immediately - no animations for better scroll performance
    const elementsToAnimate = document.querySelectorAll('.panel, .chart-container, .instructions-panel, .affordability-banner, .ai-analysis-panel');
    elementsToAnimate.forEach((el) => {
        // Skip animations - make visible immediately
        el.style.opacity = '1';
        el.style.transform = 'none';
    });

    // AI section: make all parts visible immediately
    const aiStages = [
        '.ai-analysis-header',
        '.ai-grade-section',
        '.ai-insights',
        '.ai-analysis-footer'
    ];
    aiStages.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
            // Skip animations - make visible immediately
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    });
}

// Chart resize handler - optimized to prevent updates during scroll
let resizeTimeout;
let isScrolling = false;
let scrollTimeout;

// Combined scroll event handler for chart updates and drag cleanup
let lastScrollY = window.scrollY;
window.addEventListener('scroll', function() {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);

    // Handle drag cleanup on scroll
    const currentScrollY = window.scrollY;
    const isScrollingVertically = Math.abs(currentScrollY - lastScrollY) > 1;
    lastScrollY = currentScrollY;

    // If user is scrolling, immediately clean up drag state
    if (isScrollingVertically && (isIncomeDragging || isDragging)) {
        stopIncomeFaderDrag();
        stopFaderDrag();
    }

    clearTimeout(scrollCleanupTimeout);
    scrollCleanupTimeout = setTimeout(() => {
        // Additional cleanup after scroll stops
        stopIncomeFaderDrag();
        stopFaderDrag();
    }, 200);
}, { passive: true });

function handleChartResize() {
    // Don't resize charts while actively scrolling
    if (isScrolling) {
        return;
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (savingsChart && !isScrolling) {
            savingsChart.resize();
        }
        if (spendingChart && !isScrolling) {
            spendingChart.resize();
        }
    }, 200); // Slightly longer delay to reduce frequency
}

// Debounced calculate function for input fields
let calculateTimeout;
function debouncedCalculate() {
    clearTimeout(calculateTimeout);
    calculateTimeout = setTimeout(() => {
        calculate();
    }, 300);
}

// Clean up drag state when inputs get focus
document.addEventListener('focusin', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        stopIncomeFaderDrag();
        stopFaderDrag();
        
        // Ensure the parent container allows scrolling
        const container = event.target.closest('.budget-item, .income-item');
        if (container) {
            container.style.touchAction = 'pan-y pan-x';
            container.style.overflow = 'visible';
        }
    }
});

// Ensure scrolling is unlocked when inputs lose focus
document.addEventListener('focusout', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        // Small delay to ensure focus has moved
        setTimeout(() => {
            const container = event.target.closest('.budget-item, .income-item');
            if (container) {
                container.style.touchAction = 'pan-y pan-x';
                container.style.overflow = 'visible';
                container.style.position = ''; // Reset any position that might lock scroll
            }
            
            // Force scroll unlock by ensuring body/html allow scrolling
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.position = '';
            
            // Ensure touch handlers are cleaned up
            stopIncomeFaderDrag();
            stopFaderDrag();
        }, 100);
    }
});

// Clean up drag state on any touch outside fader elements
document.addEventListener('touchstart', function(event) {
    const target = event.target;
    const isFaderElement = target.closest('.fader-handle') || 
                          target.closest('.fader-track') || 
                          target.closest('.income-fader-handle');
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.tagName === 'BUTTON' ||
                          target.closest('input') ||
                          target.closest('button');
    
    // If touching an input or button, or not a fader, clean up drag state
    if (isInputElement || !isFaderElement) {
        // Small delay to allow normal interactions
        setTimeout(() => {
            if (!isIncomeDragging && !isDragging) {
                stopIncomeFaderDrag();
                stopFaderDrag();
            }
        }, 100);
    }
}, { passive: true });

// Scroll cleanup timeout (now handled in combined scroll listener above)
let scrollCleanupTimeout;

// Emergency cleanup: Force cleanup on any touch that moves vertically (scrolling intent)
let touchStartY = 0;
let touchStartX = 0;
document.addEventListener('touchstart', function(event) {
    if (event.touches && event.touches[0]) {
        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
    }
}, { passive: true });

document.addEventListener('touchmove', function(event) {
    // If touching an input, always allow scrolling
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.closest('input') || target.closest('textarea')) {
        // Inputs are focused - ensure drag is stopped and allow scrolling
        stopIncomeFaderDrag();
        stopFaderDrag();
        return; // Allow default scroll behavior
    }

    // Only interfere with touch if we're actively dragging faders
    if (isDragging || isIncomeDragging) {
        // Let the drag handlers deal with preventDefault
        return;
    }

    // For non-drag touches, let natural scrolling happen
    // The drag handlers will preventDefault only when actually dragging
}, { passive: true });

// Clean up on any input interaction
document.addEventListener('input', function() {
    stopIncomeFaderDrag();
    stopFaderDrag();
}, { passive: true });

// Detect WebView/in-app browsers (Reddit, Twitter, Facebook, etc.)
function isWebView() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // Check for common in-app browser patterns
    return /FBAN|FBAV|Twitter|LinkedInApp|Instagram|Snapchat|Line|KakaoTalk|Slack|Discord|Reddit|Pinterest|tumblr/i.test(ua) ||
           (window.navigator.standalone === false) ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches === false && window.navigator.userAgent.includes('Mobile'));
}

// Apply WebView-specific fixes
if (isWebView()) {
    // Force body/html to allow scrolling in WebViews
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    document.body.style.position = 'relative';
    
    // Ensure content container allows scrolling
    const content = document.querySelector('.content');
    if (content) {
        content.style.overflow = 'visible';
        content.style.overflowY = 'visible';
        content.style.touchAction = 'pan-y pan-x';
    }
    
    // Prevent WebView from blocking touch events
    document.addEventListener('touchstart', function(e) {
        // Allow all touch events to propagate in WebView
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && 
            !e.target.closest('input') && !e.target.closest('textarea')) {
            // Don't prevent default for scrolling
        }
    }, { passive: true });
    
    // Force scroll unlock on any touch
    document.addEventListener('touchmove', function(e) {
        // In WebViews, ensure scrolling is never blocked
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
            target.closest('input') || target.closest('textarea')) {
            // Allow scrolling even when inputs are focused
            stopIncomeFaderDrag();
            stopFaderDrag();
            return; // Allow default scroll behavior
        }
    }, { passive: true });
    
    // Fix viewport height issues in WebViews
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}

// Initialize
initStaticSections();
initBudgetItems();
// Initialize income fader visuals
// Initialize scroll animations
setTimeout(() => initScrollAnimations(), 100);

// Smooth scroll handling for navigation links
document.querySelectorAll('.floating-nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Ensure smooth scrolling for all content (disable any scroll snapping)
// Remove any scroll-snap properties that might cause sticking
const smoothScrollStyle = document.createElement('style');
smoothScrollStyle.textContent = `
    .content, .content * {
        scroll-snap-type: none !important;
        scroll-snap-align: none !important;
        scroll-snap-stop: normal !important;
    }
`;
document.head.appendChild(smoothScrollStyle);
// Initialize header banner
initHeaderBanner();
// Add window resize listener for charts
window.addEventListener('resize', handleChartResize);
// Add debounced input handlers
document.querySelectorAll('.form-input[oninput]').forEach(input => {
    const originalOnInput = input.getAttribute('oninput');
    if (originalOnInput && originalOnInput.includes('calculate()')) {
        input.removeAttribute('oninput');
        input.addEventListener('input', debouncedCalculate);
    }
});
calculate();

// Email signup handler
function initEmailSignup() {
    const nameInput = document.getElementById('nameSignupInput');
    const emailInput = document.getElementById('emailSignupInput');
    const signupButton = document.getElementById('emailSignupButton');
    const successMessage = document.getElementById('emailSignupSuccess');

    async function handleSignup() {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        // Basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!name) {
            successMessage.textContent = 'Please enter your name';
            successMessage.style.color = 'rgba(255, 255, 255, 0.6)';
            successMessage.classList.add('show');
            return;
        }
        
        if (!email) {
            successMessage.textContent = 'Please enter your email address';
            successMessage.style.color = 'rgba(255, 255, 255, 0.6)';
            successMessage.classList.add('show');
            return;
        }
        
        if (!emailRegex.test(email)) {
            successMessage.textContent = 'Please enter a valid email address';
            successMessage.style.color = 'rgba(255, 255, 255, 0.6)';
            successMessage.classList.add('show');
            return;
        }

        // Disable button and show loading state
        signupButton.disabled = true;
        signupButton.textContent = 'SIGNING UP...';

        try {
            // Send to webhook
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email
                })
            });

            if (response.ok) {
                // Success - mark user as signed up
                localStorage.setItem('emailSignupComplete', 'true');
                
                nameInput.value = '';
                emailInput.value = '';
                successMessage.textContent = 'Thank you! You\'ve been added to our list.';
                successMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                successMessage.classList.add('show');
                
                // Enable AI analysis button
                const aiRerunButton = document.getElementById('aiRerunButton');
                if (aiRerunButton) {
                    aiRerunButton.classList.remove('disabled');
                }
                
                // Remove signup notice from AI panel if it exists
                const aiPanel = document.querySelector('.ai-analysis-panel');
                if (aiPanel) {
                    const signupNotice = aiPanel.querySelector('.signup-notice');
                    if (signupNotice) {
                        signupNotice.style.animation = 'fadeOut 0.3s ease-out';
                        setTimeout(() => signupNotice.remove(), 300);
                    }
                }
            } else {
                throw new Error('Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            successMessage.textContent = 'Something went wrong. Please try again.';
            successMessage.style.color = 'rgba(255, 255, 255, 0.6)';
            successMessage.classList.add('show');
        } finally {
            // Re-enable button
            signupButton.disabled = false;
            signupButton.textContent = 'SIGN UP';
        }
    }

    signupButton.addEventListener('click', handleSignup);
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSignup();
        }
    });
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            emailInput.focus();
        }
    });
}

// Initialize email signup
initEmailSignup();

// AI Analysis Rerun
function initAIAnalysis() {
    const rerunButton = document.getElementById('aiRerunButton');
    
    if (!rerunButton) return;

    // Check if user has signed up on page load
    const hasSignedUp = localStorage.getItem('emailSignupComplete') === 'true';
    if (!hasSignedUp) {
        rerunButton.classList.add('disabled');
    }

    rerunButton.addEventListener('click', async function() {
        // Check if user has signed up
        const hasSignedUp = localStorage.getItem('emailSignupComplete') === 'true';
        
        if (!hasSignedUp) {
            // Show friendly notification in AI panel
            const aiPanel = document.querySelector('.ai-analysis-panel');
            const existingNotice = aiPanel.querySelector('.signup-notice');
            
            if (existingNotice) {
                existingNotice.remove();
            }
            
            const signupNotice = document.createElement('div');
            signupNotice.className = 'signup-notice';
            signupNotice.innerHTML = `
                <div class="signup-notice-icon">⚠</div>
                <div class="signup-notice-content">
                    <div class="signup-notice-title">Email Signup Required</div>
                    <div class="signup-notice-text">Please sign up with your email at the top of the page to access AI Analysis. This helps us provide you with updates and improvements.</div>
                </div>
            `;
            
            // Insert notice at the top of the AI panel content
            const aiHeader = aiPanel.querySelector('.ai-analysis-header');
            if (aiHeader && aiHeader.nextSibling) {
                aiPanel.insertBefore(signupNotice, aiHeader.nextSibling);
            } else {
                aiPanel.insertBefore(signupNotice, aiPanel.firstChild);
            }
            
            // Scroll to top of page smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Removed highlight effect and focus to prevent visual rectangle
            return;
        }

        // Disable button and show loading state
        rerunButton.disabled = true;
        rerunButton.classList.add('loading');

        try {
            // Collect all financial data
            const income = parseFloat(document.getElementById('monthlyIncome').value) || 9593.42;
            const finalSavings = parseFloat(document.getElementById('finalSavings').textContent.replace(/[^0-9.-]/g, '')) || 0;
            const monthlySavings = parseFloat(document.getElementById('monthlySavings').textContent.replace(/[^0-9.-]/g, '')) || 0;
            const carEnabled = document.getElementById('carEnabled')?.checked || false;
            const houseEnabled = document.getElementById('houseEnabled')?.checked || false;
            const carPaymentEl = document.getElementById('carPayment');
            const housePaymentEl = document.getElementById('housePayment');
            const carPayment = carPaymentEl ? parseFloat(carPaymentEl.textContent.replace(/[^0-9.-]/g, '')) || 0 : 0;
            const housePayment = housePaymentEl ? parseFloat(housePaymentEl.textContent.replace(/[^0-9.-]/g, '')) || 0 : 0;
            
            // Get car and house details
            const carLoanMonthsEl = document.getElementById('carLoanMonths');
            const carLoanMonths = carEnabled && carLoanMonthsEl ? parseInt(carLoanMonthsEl.value) || 60 : 0;
            const houseAdditionalBillsEl = document.getElementById('houseAdditionalBills');
            const houseBills = houseEnabled && houseAdditionalBillsEl ? parseFloat(houseAdditionalBillsEl.value) || 0 : 0;

            // Prepare financial data for API (filter disabled items, include incomeEnabled)
            const financialData = {
                incomeEnabled: incomeEnabled !== undefined ? incomeEnabled : true,
                income: incomeEnabled === false ? 0 : income,
                budgetItems: budgetItems
                    .filter(item => item.enabled !== false)
                    .map(item => ({ name: item.name, amount: item.amount })),
                finalSavings: finalSavings,
                monthlySavings: monthlySavings,
                carEnabled: carEnabled,
                carPayment: carPayment,
                carLoanMonths: carLoanMonths,
                houseEnabled: houseEnabled,
                housePayment: housePayment,
                houseBills: houseBills
            };

            // Call AI analysis API
            const apiUrl = '/api/ai-analysis';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(financialData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI Analysis API error:', response.status, errorText);
                
                // Check if it's a 405 Method Not Allowed - likely wrong server (only show on localhost)
                if (response.status === 405 && window.location.hostname === 'localhost' && window.location.port !== '8888') {
                    alert('⚠️ API Error: Please use the Vercel dev server on port 8888.\n\nRun: npx vercel dev --listen 8888\nThen access: http://localhost:8888\n\nThe current server (port ' + window.location.port + ') does not support serverless functions.');
                    throw new Error('Please use Vercel dev server on port 8888');
                }
                
                throw new Error(`AI analysis failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            
            // Update UI with AI results
            if (result.success) {
                updateAIDisplay(result.grade, result.score, result.insights);
            } else {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            console.error('AI Analysis error:', error);
            // Fallback to local analysis if API fails
            runAIAnalysis();
        } finally {
            // Re-enable button and remove loading state
            rerunButton.disabled = false;
            rerunButton.classList.remove('loading');
        }
    });
}

function updateAIDisplay(grade, score, insights) {
    // Update grade display
    document.getElementById('aiGradeLetter').textContent = grade;
    document.querySelector('.ai-grade-score').textContent = `${score}/100`;
    document.querySelector('.ai-grade-bar').style.width = `${score}%`;

    // Update insights
    const insightItems = document.querySelectorAll('.ai-insight-item');
    insightItems.forEach((item, index) => {
        if (insights && insights[index]) {
            const insight = insights[index];
            item.querySelector('.ai-insight-icon').textContent = insight.icon || '✓';
            item.querySelector('.ai-insight-title').textContent = insight.title || 'Analysis';
            item.querySelector('.ai-insight-text').textContent = insight.text || 'No insight available.';
        }
    });
}

function runAIAnalysis() {
    // Fallback local analysis (for demo/error cases)
    const income = parseFloat(document.getElementById('monthlyIncome').value) || 9593.42;
    const totalSpending = budgetItems.reduce((sum, item) => {
        if (item.enabled === false) return sum;
        return sum + item.amount;
    }, 0);
    const baseSavings = income - totalSpending;
    
    const spendingRatio = totalSpending / income;
    const savingsRatio = baseSavings / income;
    
    let grade = 'B+';
    let score = 78;
    
    if (spendingRatio < 0.6 && savingsRatio > 0.25) {
        grade = 'A';
        score = 92;
    } else if (spendingRatio < 0.7 && savingsRatio > 0.15) {
        grade = 'B+';
        score = 78;
    } else if (spendingRatio < 0.8 && savingsRatio > 0.1) {
        grade = 'B';
        score = 72;
    } else if (spendingRatio < 0.85) {
        grade = 'C+';
        score = 65;
    } else {
        grade = 'C';
        score = 58;
    }

    const insights = [
        {
            icon: savingsRatio > 0.15 ? '✓' : '⚠',
            title: 'Savings Trajectory',
            text: savingsRatio > 0.15 
                ? `Your savings rate of ${(savingsRatio * 100).toFixed(1)}% demonstrates strong financial discipline. Projected growth remains positive across all 5 years.`
                : `Your savings rate of ${(savingsRatio * 100).toFixed(1)}% is below the recommended 20%. Consider increasing savings to build a stronger financial buffer.`
        },
        {
            icon: spendingRatio < 0.75 ? '✓' : '⚠',
            title: 'Expense Ratio',
            text: spendingRatio < 0.75
                ? `Your spending-to-income ratio of ${(spendingRatio * 100).toFixed(1)}% is within a healthy range. This allows for both lifestyle maintenance and savings growth.`
                : `Your spending-to-income ratio of ${(spendingRatio * 100).toFixed(1)}% is elevated. Reducing discretionary spending by 10-15% could significantly improve your financial position.`
        },
        {
            icon: '✓',
            title: 'Budget Allocation',
            text: `Your budget is well-distributed across ${budgetItems.length} categories. The largest expenses are appropriate relative to your income level.`
        },
        {
            icon: '→',
            title: 'Optimization Recommendation',
            text: `Based on current projections, maintaining this lifestyle is ${score >= 70 ? 'viable' : 'challenging'}. ${score >= 70 ? 'Consider optimizing timing of major purchases to maximize savings growth.' : 'Consider reducing expenses or increasing income to improve long-term viability.'}`
        }
    ];

    updateAIDisplay(grade, score, insights);
}

// Privacy Policy Modal Functions
function showPrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closePrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('privacyModal');
    if (event.target === modal) {
        closePrivacyPolicy();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePrivacyPolicy();
    }
});

// Initialize scenarios on page load
updateScenarioList();

// Initialize mini dashboard on page load
setTimeout(() => updateMiniDashboard(), 100);

// Initialize AI Analysis on page load
initAIAnalysis();

// Event listeners for elements that previously had inline handlers
document.addEventListener('DOMContentLoaded', function() {
    // Instructions toggle
    const instructionsToggle = document.getElementById('instructionsToggle');
    if (instructionsToggle) {
        instructionsToggle.addEventListener('click', toggleInstructions);
    }

    // Income budget toggle
    const incomeBudgetToggle = document.getElementById('incomeBudgetToggle');
    if (incomeBudgetToggle) {
        incomeBudgetToggle.addEventListener('click', toggleIncomeBudget);
    }

    // Financial planning toggle
    const financialPlanningToggle = document.getElementById('financialPlanningToggle');
    if (financialPlanningToggle) {
        financialPlanningToggle.addEventListener('click', toggleFinancialPlanning);
    }

    // Add budget item button
    const addBudgetItemBtn = document.getElementById('addBudgetItemBtn');
    if (addBudgetItemBtn) {
        addBudgetItemBtn.addEventListener('click', addBudgetItem);
    }

    // Reset all values button
    const resetAllValuesBtn = document.getElementById('resetAllValuesBtn');
    if (resetAllValuesBtn) {
        resetAllValuesBtn.addEventListener('click', resetAllValues);
    }

    // Save current scenario button
    const saveCurrentScenarioBtn = document.getElementById('saveCurrentScenarioBtn');
    if (saveCurrentScenarioBtn) {
        saveCurrentScenarioBtn.addEventListener('click', saveCurrentScenario);
    }

    // Monthly income input
    const monthlyIncome = document.getElementById('monthlyIncome');
    if (monthlyIncome) {
        monthlyIncome.addEventListener('input', function() {
            updateIncomeFromInput(this.value);
        });
    }

    // Car enabled checkbox
    const carEnabled = document.getElementById('carEnabled');
    if (carEnabled) {
        carEnabled.addEventListener('change', toggleCar);
    }

    // Car inputs
    const carInputs = ['carPrice', 'carInterestRate', 'carLoanMonths'];
    carInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculate);
        }
    });

    // Car purchase year select
    const carPurchaseYear = document.getElementById('carPurchaseYear');
    if (carPurchaseYear) {
        carPurchaseYear.addEventListener('change', calculate);
    }

    // House enabled checkbox
    const houseEnabled = document.getElementById('houseEnabled');
    if (houseEnabled) {
        houseEnabled.addEventListener('change', toggleHouse);
    }

    // House inputs
    const houseInputs = ['housePrice', 'houseInterestRate', 'houseLoanYears', 'houseAdditionalBills'];
    houseInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculate);
        }
    });

    // House purchase year select
    const housePurchaseYear = document.getElementById('housePurchaseYear');
    if (housePurchaseYear) {
        housePurchaseYear.addEventListener('change', calculate);
    }

    // Privacy policy link
    const privacyPolicyLink = document.getElementById('privacyPolicyLink');
    if (privacyPolicyLink) {
        privacyPolicyLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacyPolicy();
        });
    }

    // Close privacy policy button
    const closePrivacyPolicyBtn = document.getElementById('closePrivacyPolicyBtn');
    if (closePrivacyPolicyBtn) {
        closePrivacyPolicyBtn.addEventListener('click', closePrivacyPolicy);
    }
});

// Parallax effect disabled for fixed hero - hero stays in place while content scrolls over
// The fixed hero approach provides better performance and visual effect

