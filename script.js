let budgetItems = [];
let savingsChart = null;
let spendingChart = null;
let budgetPieChart = null;
let incomeEnabled = true;

const instructionItems = [
    {
        title: 'Income Control',
        text: 'Edit the income amount directly or use the arrow buttons. Values are in dollars per month (max $50,000). Use the toggle to exclude income from calculations.'
    },
    {
        title: 'Budget Items',
        text: 'Adjust each spending category by editing the amount or using the arrow buttons (max $5,000/item). Toggle items off to exclude them without deleting.'
    },
    {
        title: 'Adding Items',
        text: 'Click "Add Item" to create new spending categories. Click the × button to remove items. You must keep at least one category.'
    },
    {
        title: 'Major Purchases',
        text: 'Toggle Dream Car and Dream House to include them. Estimated monthly payments update live. Change purchase year to see how timing affects savings.'
    },
    {
        title: 'Charts & Data',
        text: 'Scroll down for savings projections, spending breakdowns, treemap, and a yearly financial summary. Everything recalculates in real time.'
    },
    {
        title: 'Affordability',
        text: 'The banner shows whether projected savings stay positive over 5 years. Health score reflects cash flow, expense ratio, debt load, and savings rate.'
    }
];

const summaryCardConfig = [
    { id: 'monthlySavings', label: 'Monthly Cash Flow' },
    { id: 'totalSavings', label: '5-Year Savings' },
    { id: 'carPayment', label: 'Car Payment / mo' },
    { id: 'housePayment', label: 'House Payment / mo' }
];

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
        houseAdditionalBills: parseFloat(document.getElementById('houseAdditionalBills').value) || 600,
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
            <input class="form-input budget-item-input budget-name-input budget-name-input--readonly budget-item-name" value="Monthly Income"
                   placeholder="Monthly Income"
                   readonly
                   ${!incomeEnabled ? 'disabled' : ''}>
        </div>
        <div class="budget-item-amount-row">
            <div class="budget-amount-input-wrapper${!incomeEnabled ? ' is-disabled' : ''}">
                <input type="number"
                       class="budget-amount-input income-amount-input${!incomeEnabled ? ' is-disabled' : ''}"
                       id="incomeAmountInput"
                       value="${incomeValue}"
                       min="0"
                       max="50000"
                       step="100"
                       oninput="updateIncome(parseFloat(this.value) || 0)"
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
        inputElement.value = clampedValue;
    }
    calculate();
}

function updateIncomeFromThousands(thousandsValue) {
    // Legacy helper kept for compatibility; convert thousands → dollars
    const dollarValue = Math.round(thousandsValue * 1000);
    updateIncome(dollarValue);
}

function incrementIncome() {
    const input = document.getElementById('incomeAmountInput');
    if (input && !input.disabled) {
        const currentValue = Math.round(parseFloat(input.value) || 0);
        const newValue = Math.min(50000, currentValue + 100);
        updateIncome(newValue);
    }
}

function decrementIncome() {
    const input = document.getElementById('incomeAmountInput');
    if (input && !input.disabled) {
        const currentValue = Math.round(parseFloat(input.value) || 0);
        const newValue = Math.max(0, currentValue - 100);
        updateIncome(newValue);
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

    // Update payment displays (summary cards + in-panel estimates)
    const carPaymentText = carEnabled
        ? ('$' + Math.round(carMonthlyPayment).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }))
        : '$0';
    const houseTotalMonthly = houseEnabled ? (houseMonthlyPayment + houseAdditionalBills) : 0;
    const housePaymentText = houseEnabled
        ? ('$' + Math.round(houseMonthlyPayment).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }))
        : '$0';
    const houseEstimateText = houseEnabled
        ? ('$' + Math.round(houseTotalMonthly).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }))
        : '$0';

    const carPaymentEl = document.getElementById('carPayment');
    const housePaymentEl = document.getElementById('housePayment');
    if (carPaymentEl) {
        carPaymentEl.textContent = carPaymentText;
        carPaymentEl.className = 'summary-card-value' + (carEnabled && carMonthlyPayment > 0 ? '' : '');
    }
    if (housePaymentEl) {
        housePaymentEl.textContent = housePaymentText;
    }
    const carPaymentDisplay = document.getElementById('carPaymentDisplay');
    const housePaymentDisplay = document.getElementById('housePaymentDisplay');
    if (carPaymentDisplay) carPaymentDisplay.textContent = carPaymentText;
    if (housePaymentDisplay) housePaymentDisplay.textContent = houseEstimateText;

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
    // Steady-state monthly cash flow with currently enabled major purchases
    const monthlySavingsAfterLoans = baseMonthlySavings
        - (carEnabled ? carMonthlyPayment : 0)
        - (houseEnabled ? houseMonthlyPayment + houseAdditionalBills : 0);

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
            layout: {
                padding: window.innerWidth < 480 ? 4 : 8
            },
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
                        boxWidth: window.innerWidth < 480 ? 10 : 12,
                        font: {
                            size: window.innerWidth < 480 ? 10 : 12,
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

                            if (dataIndex % 12 === 0) {
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
                        display: window.innerWidth >= 480, 
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
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 480 ? 6 : 12,
                        font: {
                            size: window.innerWidth < 480 ? 9 : 11
                        }
                    }
                },
                y: {
                    title: { 
                        display: window.innerWidth >= 480, 
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
                        maxTicksLimit: window.innerWidth < 480 ? 5 : 8,
                        font: {
                            size: window.innerWidth < 480 ? 9 : 11
                        },
                        callback: function(value) {
                            if (Math.abs(value) >= 1000) {
                                return '$' + (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k';
                            }
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
            layout: {
                padding: window.innerWidth < 480 ? 4 : 8
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: window.innerWidth < 480 ? 'bottom' : 'top',
                    labels: { 
                        color: '#ffffff',
                        font: { size: window.innerWidth < 480 ? 9 : 11, weight: 500 }, 
                        boxWidth: window.innerWidth < 480 ? 8 : 12,
                        usePointStyle: true,
                        padding: window.innerWidth < 480 ? 8 : 12
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
                        display: window.innerWidth >= 480, 
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
                        maxRotation: 0,
                        autoSkip: true,
                        font: {
                            family: 'JetBrains Mono',
                            size: window.innerWidth < 480 ? 9 : 11
                        }
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    title: { 
                        display: window.innerWidth >= 480, 
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
                        maxTicksLimit: window.innerWidth < 480 ? 5 : 8,
                        font: {
                            size: window.innerWidth < 480 ? 9 : 11
                        },
                        callback: function(value) {
                            if (Math.abs(value) >= 1000) {
                                return '$' + (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k';
                            }
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

    // Get container dimensions (must match current layout width)
    const container = document.querySelector('.treemap-container');
    if (!container) return;
    const cs = getComputedStyle(container);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const width = Math.max(120, Math.floor(container.clientWidth - padX));
    const height = Math.max(120, Math.floor(container.clientHeight - padY));

    // Lock SVG coordinate system to container so content never overflows the page
    svg
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('overflow', 'hidden');

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
        .padding(width < 400 ? 2 : 4)
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
        
        // Lower thresholds on narrow screens so labels still appear in small cells
        const isNarrow = width < 480;
        const minWidth = isNarrow ? 72 : 140;
        const minHeight = isNarrow ? 48 : 70;
        const minArea = isNarrow ? 4000 : 12000;
        
        // Calculate area
        const area = boxWidth * boxHeight;
        
        // Only show labels if box meets all size requirements
        if (boxWidth >= minWidth && boxHeight >= minHeight && area >= minArea) {
            const padding = isNarrow ? 8 : 16;
            const textAreaWidth = Math.max(24, boxWidth - (padding * 2));
            const lineHeight = isNarrow ? 14 : 18;
            const labelFontSize = isNarrow || boxWidth < 200 ? '10px' : '12px';
            const amountFontSize = isNarrow || boxWidth < 200 ? '12px' : '17px';
            const percentageFontSize = isNarrow || boxWidth < 200 ? '9px' : '10px';

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
            maintainAspectRatio: true,
            aspectRatio: 1, // keep donut perfectly circular — never squeeze
            plugins: {
                legend: {
                    display: false // custom HTML legend
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
            cutout: '62%',
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

        const annualIncome = income * 12;
        // Annual spending = income − cash-flow savings (not the broken baseSavings formula)
        const annualSpending = annualIncome - annualSavings;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>Year ${year}</strong></td>
            <td>$${annualIncome.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td>$${annualSpending.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td class="${annualSavings >= 0 ? 'positive' : 'negative'}">$${annualSavings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td><strong class="${savingsBalance >= 0 ? 'positive' : 'negative'}">$${savingsBalance.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong></td>
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

// Header media is now the Three.js tesseract (hero-tesseract.js)
function initHeaderBanner() {
    // no-op: tesseract canvas self-initializes
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
const heroEl = document.querySelector('.hero');

function updateHeroOffscreen() {
    if (!heroEl) return;
    // Once dashboard fully covers the viewport, hide fixed hero (stops bottom bleed)
    const pastHero = window.scrollY >= window.innerHeight - 2;
    heroEl.classList.toggle('hero-offscreen', pastHero);
}

window.addEventListener('scroll', function() {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 150);

    updateHeroOffscreen();

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

updateHeroOffscreen();

function handleChartResize() {
    // Don't resize charts while actively scrolling
    if (isScrolling) {
        return;
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (isScrolling) return;
        // Chart.js canvases
        if (savingsChart) savingsChart.resize();
        if (spendingChart) spendingChart.resize();
        if (budgetPieChart) budgetPieChart.resize();
        // D3 treemap must re-layout to the current container width
        // (viewBox alone is not enough if first paint used a wide layout)
        try {
            calculate();
        } catch (e) {
            console.warn('Chart resize recalculate failed', e);
        }
    }, 220);
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

// Clean up drag state when inputs lose focus (do not rewrite html/body overflow)
document.addEventListener('focusout', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        stopIncomeFaderDrag();
        stopFaderDrag();
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

// True in-app browsers only (do NOT match normal mobile Safari/Chrome —
// the old check treated almost all phones as WebViews and forced dual scroll roots)
function isWebView() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return /FBAN|FBAV|FBIOS|Twitter|LinkedInApp|Instagram|Snapchat|Line\/|KakaoTalk|Slack|Discord|Reddit|Pinterest|tumblr/i.test(ua);
}

if (isWebView()) {
    // Keep a single scroll root; only unlock any accidental locks
    document.documentElement.style.overflowY = 'scroll';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'visible';
    document.body.style.height = 'auto';
    document.body.style.position = 'relative';

    const content = document.querySelector('.content');
    if (content) {
        content.style.overflow = 'visible';
    }

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

// Smooth scroll for nav + hero CTAs (hash links only)
document.querySelectorAll('.floating-nav-link, .hero-cta-primary, .hero-cta-secondary, .footer-nav a[href^="#"], .footer-store-link[href^="#"], .app-launch-cta, .app-launch-stores a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            const targetElement = document.getElementById(href.slice(1));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Keep URL in sync without jump
                history.pushState(null, '', href);
            }
        }
    });
});

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

// ── Pollinations / Pollen (BYOP — same pattern as /motion) ──
const POLLINATIONS_KEY_STORAGE = 'blackbox-pollinations-key';

function getPollinationsApiKey() {
    const input = document.getElementById('pollinationsApiKey');
    const fromInput = input?.value?.trim() || '';
    if (fromInput) return fromInput;
    return localStorage.getItem(POLLINATIONS_KEY_STORAGE) || '';
}

function setPollinationsKeyStatus(message, kind = '') {
    const el = document.getElementById('pollinationsKeyStatus');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-ready', 'is-error');
    if (kind) el.classList.add(kind);
}

function initPollinationsKeyUI() {
    const input = document.getElementById('pollinationsApiKey');
    const saveBtn = document.getElementById('pollinationsKeySave');
    const toggleBtn = document.getElementById('pollinationsKeyToggle');
    if (!input) return;

    const saved = localStorage.getItem(POLLINATIONS_KEY_STORAGE) || '';
    if (saved) {
        input.value = saved;
        setPollinationsKeyStatus('Key saved locally. AI analysis will spend from your Pollinations Pollen.', 'is-ready');
    }

    const persist = () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem(POLLINATIONS_KEY_STORAGE, key);
            setPollinationsKeyStatus('Key saved. Run analysis to use your Pollen balance.', 'is-ready');
        } else {
            localStorage.removeItem(POLLINATIONS_KEY_STORAGE);
            setPollinationsKeyStatus('Key cleared. Without a key, analysis falls back to a local heuristic.', '');
        }
        updateAIRerunAvailability();
    };

    saveBtn?.addEventListener('click', persist);
    input.addEventListener('change', persist);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            persist();
        }
    });

    toggleBtn?.addEventListener('click', () => {
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        toggleBtn.textContent = showing ? 'Show' : 'Hide';
    });
}

function updateAIRerunAvailability() {
    const rerunButton = document.getElementById('aiRerunButton');
    if (!rerunButton) return;
    // Always allow runs — key uses Pollinations; no key uses local heuristic
    rerunButton.classList.remove('disabled');
}

function collectFinancialDataForAI() {
    const income = incomeEnabled === false
        ? 0
        : (parseFloat(document.getElementById('monthlyIncome').value) || 0);
    const carEnabled = document.getElementById('carEnabled')?.checked || false;
    const houseEnabled = document.getElementById('houseEnabled')?.checked || false;
    const carPayment = carEnabled ? calculateCarPayment() : 0;
    const housePayment = houseEnabled ? calculateHousePayment() : 0;
    const carLoanMonths = carEnabled
        ? (parseInt(document.getElementById('carLoanMonths')?.value, 10) || 60)
        : 0;
    const houseBills = houseEnabled
        ? (parseFloat(document.getElementById('houseAdditionalBills')?.value) || 0)
        : 0;

    const parseMoney = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const n = parseFloat(String(el.textContent).replace(/[^0-9.-]/g, ''));
        return Number.isFinite(n) ? n : null;
    };

    const monthlySpending = budgetItems.reduce((sum, item) => {
        if (item.enabled === false) return sum;
        return sum + (parseFloat(item.amount) || 0);
    }, 0);
    const computedMonthly = income - monthlySpending - carPayment - housePayment - houseBills;
    const monthlySavings = parseMoney('monthlySavings') ?? computedMonthly;
    const finalSavings = parseMoney('totalSavings')
        ?? parseMoney('topRightSavings')
        ?? parseMoney('finalSavings')
        ?? 0;

    return {
        incomeEnabled: incomeEnabled !== undefined ? incomeEnabled : true,
        income,
        budgetItems: budgetItems
            .filter(item => item.enabled !== false)
            .map(item => ({ name: item.name, amount: item.amount })),
        finalSavings,
        monthlySavings,
        carEnabled,
        carPayment,
        carLoanMonths,
        houseEnabled,
        housePayment,
        houseBills,
        monthlySpending,
    };
}

function buildPollinationsAnalysisPrompt(data) {
    const totalOut = (data.monthlySpending || 0)
        + (data.carEnabled ? data.carPayment : 0)
        + (data.houseEnabled ? data.housePayment + data.houseBills : 0);
    const spendingRatio = data.income > 0 ? totalOut / data.income : 0;
    const savingsRatio = data.income > 0 ? data.monthlySavings / data.income : 0;

    return `You are a financial advisor analyzing a 5-year lifestyle affordability plan.

Financial Summary:
- Monthly Income: $${Number(data.income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Monthly Budget Spending: $${Number(data.monthlySpending || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Monthly Cash Flow (after major purchases): $${Number(data.monthlySavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- 5-Year Final Savings: $${Number(data.finalSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Spending-to-Income Ratio: ${(spendingRatio * 100).toFixed(1)}%
- Savings Rate: ${(savingsRatio * 100).toFixed(1)}%

Budget Breakdown:
${(data.budgetItems || []).map(item => `- ${item.name}: $${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month`).join('\n') || '- (none)'}

${data.carEnabled ? `Car Payment: $${Number(data.carPayment || 0).toLocaleString()}/month for ${data.carLoanMonths || 0} months` : 'No car purchase planned'}
${data.houseEnabled ? `House Payment: $${Number(data.housePayment || 0).toLocaleString()}/month + $${Number(data.houseBills || 0).toLocaleString()}/month in additional bills` : 'No house purchase planned'}

Provide a comprehensive financial viability analysis in JSON format with this exact structure:
{
  "grade": "A|B+|B|C+|C|D|F",
  "score": 0-100,
  "insights": [
    { "icon": "✓|⚠|→|!", "title": "Short title", "text": "2-3 sentence actionable insight" },
    { "icon": "✓|⚠|→|!", "title": "Short title", "text": "2-3 sentence actionable insight" },
    { "icon": "✓|⚠|→|!", "title": "Short title", "text": "2-3 sentence actionable insight" },
    { "icon": "✓|⚠|→|!", "title": "Short title", "text": "2-3 sentence actionable insight" }
  ]
}

Be professional and concise. Return ONLY valid JSON — no markdown fences, no preamble.`;
}

function parseAIAnalysisContent(content) {
    if (!content || typeof content !== 'string') {
        throw new Error('Empty AI response');
    }
    let text = content.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const grade = parsed.grade || 'B+';
    const score = Math.max(0, Math.min(100, parseInt(parsed.score, 10) || 78));
    const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : [];
    return { grade, score, insights };
}

/**
 * Call Pollinations via local/Vercel proxy with the user's key (Pollen).
 * Mirrors /motion: Authorization Bearer + openai-compatible messages.
 */
async function runPollinationsAnalysis(financialData, apiKey) {
    const messages = [
        {
            role: 'system',
            content: 'You are a concise financial advisor. Reply with valid JSON only.',
        },
        {
            role: 'user',
            content: buildPollinationsAnalysisPrompt(financialData),
        },
    ];

    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let response;
    try {
        response = await fetch('/api/pollinations-text', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: 'openai',
                messages,
                temperature: 0.25,
                max_tokens: 1024,
                apiKey: apiKey || undefined,
            }),
            signal: controller.signal,
        });
    } catch (err) {
        if (err?.name === 'AbortError') {
            throw new Error('Pollinations request timed out after 45s');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pollinations failed (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const result = await response.json();
    if (!result.success && !result.content) {
        throw new Error(result.error || 'Unknown Pollinations error');
    }

    return parseAIAnalysisContent(result.content || '');
}

// AI Analysis Rerun
function initAIAnalysis() {
    const rerunButton = document.getElementById('aiRerunButton');
    if (!rerunButton) return;

    initPollinationsKeyUI();
    updateAIRerunAvailability();

    rerunButton.addEventListener('click', async function() {
        rerunButton.disabled = true;
        rerunButton.classList.add('loading');

        const financialData = collectFinancialDataForAI();
        const apiKey = getPollinationsApiKey();

        try {
            if (apiKey) {
                setPollinationsKeyStatus('Running analysis via Pollinations…', '');
                const analysis = await runPollinationsAnalysis(financialData, apiKey);
                updateAIDisplay(analysis.grade, analysis.score, analysis.insights);
                setPollinationsKeyStatus('Analysis complete (Pollinations / your Pollen).', 'is-ready');
                const badge = document.getElementById('aiProviderBadge');
                if (badge) badge.textContent = 'POLLINATIONS';
            } else {
                // No key: local heuristic
                setPollinationsKeyStatus('No API key — using local estimate. Add a Pollinations key for live AI.', '');
                runAIAnalysis();
                const badge = document.getElementById('aiProviderBadge');
                if (badge) badge.textContent = 'LOCAL';
            }
        } catch (error) {
            console.error('AI Analysis error:', error);
            setPollinationsKeyStatus(
                ('Pollinations error — fell back to local estimate. ' + (error.message || '')).trim(),
                'is-error'
            );
            runAIAnalysis();
            const badge = document.getElementById('aiProviderBadge');
            if (badge) badge.textContent = 'LOCAL';
        } finally {
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
    // Lock page scroll while modal is open (html is the only scroll root)
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}

function closePrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'none';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
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

