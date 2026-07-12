let budgetItems = [];
let savingsChart = null;
let spendingChart = null;
let spendingChartScale = 'linear';
let budgetPieChart = null;
let incomeEnabled = true;

const categoryColorMap = new Map();
const premiumColors = [
    '#e8d5a3', // Champagne Gold
    '#b8955a', // Warm Brass
    '#e28a5c', // Copper/Terracotta
    '#a8894f', // Antique Bronze
    '#8db898', // Muted Sage Green
    '#8a7040', // Deep Bronze
    '#c4b08a', // Warm Sand
    '#d47a6a', // Soft Coral/Red
    '#6e93a0', // Muted Slate Blue
    '#e0c98e', // Soft Brass
    '#a67c52', // Warm Amber
    '#b0a078', // Sage Gold
    '#c08fa6', // Dusty Rose
    '#6e5a38', // Dark Olive
    '#889fa5'  // Muted Platinum
];

function getCategoryColor(name) {
    if (categoryColorMap.has(name)) {
        return categoryColorMap.get(name);
    }
    const defaults = {
        'Monthly Income': '#e8d5a3',
        'Bills & Utilities': '#e8d5a3',
        'Dining & Drinks': '#b8955a',
        'Groceries': '#e28a5c',
        'Auto & Transport': '#a8894f',
        'Entertainment & Rec.': '#8db898',
        'Shopping': '#8a7040',
        'Fees': '#c4b08a',
        'Travel & Vacation': '#d47a6a',
        'Health & Wellness': '#6e93a0',
        'Home & Garden': '#e0c98e',
        'Software & Tech': '#a67c52',
        'Car Loan Payment': '#b0a078',
        'Car Loan Payments': '#b0a078',
        'House Expenses': '#c08fa6',
        'College / Tuition': '#6e5a38',
        'Hospital / Medical': '#889fa5'
    };
    if (defaults[name]) {
        categoryColorMap.set(name, defaults[name]);
        return defaults[name];
    }
    const color = premiumColors[categoryColorMap.size % premiumColors.length];
    categoryColorMap.set(name, color);
    return color;
}


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
        text: 'Toggle Dream Car, Dream House, College/Tuition, and Hospital/Medical floor blockers. Payments update live and flow into affordability.'
    },
    {
        title: 'Charts & Data',
        text: 'Scroll down for savings projections, spending breakdowns, treemap, and a 20-year financial summary. Everything recalculates in real time.'
    },
    {
        title: 'Affordability',
        text: 'The banner shows whether projected savings stay positive at the 5-year mark on a 20-year path. Health score reflects cash flow, expense ratio, debt load, and savings rate.'
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

/** Portal tip copy for income + spending categories (data-vd-tip). */
const BUDGET_ITEM_TIPS = {
    'Monthly Income': {
        title: 'Monthly income',
        body: 'Gross cash in each month before lifestyle spend and floor blockers. This is the top of the cash-flow equation — lifestyle should fit income, not the reverse.',
    },
    'Bills & Utilities': {
        title: 'Bills & utilities',
        body: 'Recurring fixed services: power, water, internet, phone, insurance premiums. Keep these lean — they rarely shrink in a tight month.',
    },
    'Dining & Drinks': {
        title: 'Dining & drinks',
        body: 'Restaurants, delivery, coffee, alcohol. Usually the first discretionary lever to cut when cash flow is thin.',
    },
    'Groceries': {
        title: 'Groceries',
        body: 'Household food and household staples. A need — optimize with planning and bulk buys, not by zeroing out.',
    },
    'Auto & Transport': {
        title: 'Auto & transport',
        body: 'Fuel, rideshare, transit, maintenance, registration. Separate from a financed car payment (that lives under Major Purchases).',
    },
    'Entertainment & Rec.': {
        title: 'Entertainment & recreation',
        body: 'Streaming, hobbies, tickets, gym beyond health needs. Classic discretionary spend — easy to audit and reduce.',
    },
    'Shopping': {
        title: 'Shopping',
        body: 'Clothes, gadgets, household extras. High lifestyle-inflation risk; watch silent subscription and impulse leaks.',
    },
    'Fees': {
        title: 'Fees',
        body: 'Bank fees, ATM charges, late fees, membership dues. Often pure waste — eliminate rather than budget around them.',
    },
    'Travel & Vacation': {
        title: 'Travel & vacation',
        body: 'Trips, hotels, flights. Plan as a sinking fund when cash flow is healthy; defer when the health score is under pressure.',
    },
    'Health & Wellness': {
        title: 'Health & wellness',
        body: 'Pharmacy, copays, supplements, wellness routines. Protect essentials; treat premium wellness as discretionary.',
    },
    'Home & Garden': {
        title: 'Home & garden',
        body: 'Maintenance, furniture, yard, household projects. Bundle into planned months so they don’t ambush cash flow.',
    },
    'Software & Tech': {
        title: 'Software & tech',
        body: 'Apps, SaaS, cloud, devices. Audit recurring charges — silent subscriptions stack into real monthly drag.',
    },
};

function getBudgetItemTip(name) {
    const key = String(name || '').trim();
    if (BUDGET_ITEM_TIPS[key]) return BUDGET_ITEM_TIPS[key];
    return {
        title: key || 'Category',
        body: 'Monthly lifestyle outflow in this category. Toggle it off to exclude from the model, or edit the amount to stress-test cash flow.',
    };
}

function escapeHtmlAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

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
        collegeEnabled: document.getElementById('collegeEnabled')?.checked || false,
        collegeCost: parseFloat(document.getElementById('collegeCost')?.value) || 80000,
        collegeInterestRate: parseFloat(document.getElementById('collegeInterestRate')?.value) || 5.5,
        collegeLoanMonths: parseInt(document.getElementById('collegeLoanMonths')?.value) || 120,
        collegeStartYear: parseInt(document.getElementById('collegeStartYear')?.value) || 0,
        medicalEnabled: document.getElementById('medicalEnabled')?.checked || false,
        medicalCost: parseFloat(document.getElementById('medicalCost')?.value) || 25000,
        medicalInterestRate: parseFloat(document.getElementById('medicalInterestRate')?.value) || 7,
        medicalLoanMonths: parseInt(document.getElementById('medicalLoanMonths')?.value) || 48,
        medicalStartYear: parseInt(document.getElementById('medicalStartYear')?.value) || 0,
        propertyTaxEnabled: document.getElementById('propertyTaxEnabled')?.checked || false,
        propertyTaxAnnual: parseFloat(document.getElementById('propertyTaxAnnual')?.value) || 4800,
        propertyTaxStartYear: parseInt(document.getElementById('propertyTaxStartYear')?.value) || 0,
        debtEnabled: document.getElementById('debtEnabled')?.checked || false,
        debtBalance: parseFloat(document.getElementById('debtBalance')?.value) || 15000,
        debtInterestRate: parseFloat(document.getElementById('debtInterestRate')?.value) || 19.99,
        debtLoanMonths: parseInt(document.getElementById('debtLoanMonths')?.value) || 36,
        debtStartYear: parseInt(document.getElementById('debtStartYear')?.value) || 0,
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

    // College / medical (optional on older scenarios)
    if (document.getElementById('collegeEnabled')) {
        document.getElementById('collegeEnabled').checked = !!state.collegeEnabled;
        if (state.collegeCost != null) document.getElementById('collegeCost').value = state.collegeCost;
        if (state.collegeInterestRate != null) document.getElementById('collegeInterestRate').value = state.collegeInterestRate;
        if (state.collegeLoanMonths != null) document.getElementById('collegeLoanMonths').value = state.collegeLoanMonths;
        if (state.collegeStartYear != null) document.getElementById('collegeStartYear').value = state.collegeStartYear;
    }
    if (document.getElementById('medicalEnabled')) {
        document.getElementById('medicalEnabled').checked = !!state.medicalEnabled;
        if (state.medicalCost != null) document.getElementById('medicalCost').value = state.medicalCost;
        if (state.medicalInterestRate != null) document.getElementById('medicalInterestRate').value = state.medicalInterestRate;
        if (state.medicalLoanMonths != null) document.getElementById('medicalLoanMonths').value = state.medicalLoanMonths;
        if (state.medicalStartYear != null) document.getElementById('medicalStartYear').value = state.medicalStartYear;
    }
    if (document.getElementById('propertyTaxEnabled')) {
        document.getElementById('propertyTaxEnabled').checked = !!state.propertyTaxEnabled;
        if (state.propertyTaxAnnual != null) document.getElementById('propertyTaxAnnual').value = state.propertyTaxAnnual;
        if (state.propertyTaxStartYear != null) document.getElementById('propertyTaxStartYear').value = state.propertyTaxStartYear;
    }
    if (document.getElementById('debtEnabled')) {
        document.getElementById('debtEnabled').checked = !!state.debtEnabled;
        if (state.debtBalance != null) document.getElementById('debtBalance').value = state.debtBalance;
        if (state.debtInterestRate != null) document.getElementById('debtInterestRate').value = state.debtInterestRate;
        if (state.debtLoanMonths != null) document.getElementById('debtLoanMonths').value = state.debtLoanMonths;
        if (state.debtStartYear != null) document.getElementById('debtStartYear').value = state.debtStartYear;
    }

    // Update UI
    renderBudgetItems();
    calculate();

    // Update toggles
    toggleCar();
    toggleHouse();
    toggleCollege();
    toggleMedical();
    togglePropertyTax();
    toggleDebt();

    // Ensure fitted sizes after full scenario hydrate (metrics + purchases)
    requestNumberFit();
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
        const safe = String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
            <div class="scenario-item scenario-chip" title="Saved ${date}">
                <span class="scenario-name">${name}</span>
                <button type="button" class="scenario-btn load-btn" onclick="loadScenario('${safe}')">Load</button>
                <button type="button" class="scenario-btn delete-btn" onclick="deleteScenario('${safe}')" aria-label="Delete ${name}">×</button>
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

    const carEnabled = document.getElementById('carEnabled')?.checked || false;
    const houseEnabled = document.getElementById('houseEnabled')?.checked || false;
    const collegeEnabled = document.getElementById('collegeEnabled')?.checked || false;
    const medicalEnabled = document.getElementById('medicalEnabled')?.checked || false;
    const propertyTaxEnabled = document.getElementById('propertyTaxEnabled')?.checked || false;
    const debtEnabled = document.getElementById('debtEnabled')?.checked || false;
    const carPayment = carEnabled ? calculateCarPayment() : 0;
    const housePayment = houseEnabled ? calculateHousePayment() : 0;
    const houseAdditionalBills = houseEnabled ? (parseFloat(document.getElementById('houseAdditionalBills')?.value) || 0) : 0;
    const collegePayment = collegeEnabled ? calculateCollegePayment() : 0;
    const medicalPayment = medicalEnabled ? calculateMedicalPayment() : 0;
    const propertyTaxPayment = propertyTaxEnabled ? calculatePropertyTaxPayment() : 0;
    const debtPayment = debtEnabled ? calculateDebtPayment() : 0;
    const totalMajorPayments = carPayment + housePayment + houseAdditionalBills + collegePayment + medicalPayment + propertyTaxPayment + debtPayment;

    const totalMonthlyExpenses = monthlySpending + totalMajorPayments;
    const monthlyCashFlow = monthlyIncome - totalMonthlyExpenses;
    const miniMonthlyCashFlow = document.getElementById('miniMonthlyCashFlow');
    const miniMonthlyCashFlowTrend = document.getElementById('miniMonthlyCashFlowTrend');

    if (miniMonthlyCashFlow) {
        miniMonthlyCashFlow.textContent = formatCompactCurrency(monthlyCashFlow);
    }

    if (miniMonthlyCashFlowTrend) {
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
    }

    const expenseRatio = monthlyIncome > 0 ? (totalMonthlyExpenses / monthlyIncome) * 100 : 0;
    const miniExpenseRatio = document.getElementById('miniExpenseRatio');
    const miniExpenseRatioTrend = document.getElementById('miniExpenseRatioTrend');

    if (miniExpenseRatio) miniExpenseRatio.textContent = Math.round(expenseRatio) + '%';

    if (miniExpenseRatioTrend) {
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
    }

    const miniMajorPurchases = document.getElementById('miniMajorPurchases');
    const miniMajorPurchasesTrend = document.getElementById('miniMajorPurchasesTrend');

    if (miniMajorPurchases) {
        miniMajorPurchases.textContent = formatCompactCurrency(totalMajorPayments);
    }

    const majorPaymentRatio = monthlyIncome > 0 ? (totalMajorPayments / monthlyIncome) * 100 : 0;
    if (miniMajorPurchasesTrend) {
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
    }

    // Lifestyle spend
    const miniLifestyle = document.getElementById('miniLifestyleSpend');
    const miniLifestyleTrend = document.getElementById('miniLifestyleSpendTrend');
    if (miniLifestyle) {
        miniLifestyle.textContent = formatCompactCurrency(monthlySpending);
    }
    if (miniLifestyleTrend) {
        const lifeRatio = monthlyIncome > 0 ? (monthlySpending / monthlyIncome) * 100 : 0;
        if (lifeRatio < 50) {
            miniLifestyleTrend.textContent = '→ Lean';
            miniLifestyleTrend.className = 'mini-metric-trend positive';
        } else if (lifeRatio < 70) {
            miniLifestyleTrend.textContent = '→ Typical';
            miniLifestyleTrend.className = 'mini-metric-trend';
        } else {
            miniLifestyleTrend.textContent = '⚠ Heavy';
            miniLifestyleTrend.className = 'mini-metric-trend warning';
        }
    }

    // DTI-style major load %
    const miniDti = document.getElementById('miniDtiRatio');
    const miniDtiTrend = document.getElementById('miniDtiRatioTrend');
    if (miniDti) miniDti.textContent = Math.round(majorPaymentRatio) + '%';
    if (miniDtiTrend) {
        if (majorPaymentRatio < 20) {
            miniDtiTrend.textContent = '→ Light';
            miniDtiTrend.className = 'mini-metric-trend positive';
        } else if (majorPaymentRatio < 36) {
            miniDtiTrend.textContent = '⚠ Elevated';
            miniDtiTrend.className = 'mini-metric-trend warning';
        } else {
            miniDtiTrend.textContent = '⚠ Stretched';
            miniDtiTrend.className = 'mini-metric-trend negative';
        }
    }

    // Runway months from 5-year projection / monthly lifestyle burn
    const proj = window.__bbProjection || {};
    const fiveBal = proj.fiveYearSavings != null ? proj.fiveYearSavings : 0;
    const miniRunway = document.getElementById('miniRunway');
    const miniRunwayTrend = document.getElementById('miniRunwayTrend');
    if (miniRunway) {
        if (monthlySpending > 0 && fiveBal > 0) {
            const monthsCover = fiveBal / monthlySpending;
            miniRunway.textContent = Math.round(monthsCover) + ' mo';
            if (miniRunwayTrend) {
                if (monthsCover >= 24) {
                    miniRunwayTrend.textContent = '↗ Deep';
                    miniRunwayTrend.className = 'mini-metric-trend positive';
                } else if (monthsCover >= 12) {
                    miniRunwayTrend.textContent = '→ Solid';
                    miniRunwayTrend.className = 'mini-metric-trend positive';
                } else {
                    miniRunwayTrend.textContent = '⚠ Thin';
                    miniRunwayTrend.className = 'mini-metric-trend warning';
                }
            }
        } else {
            miniRunway.textContent = fiveBal <= 0 ? '0 mo' : '—';
            if (miniRunwayTrend) {
                miniRunwayTrend.textContent = fiveBal <= 0 ? '↘ None' : '→ Calc';
                miniRunwayTrend.className = fiveBal <= 0 ? 'mini-metric-trend negative' : 'mini-metric-trend';
            }
        }
    }

    // Actionable liquidity target: six months of all current outflows.
    const reserveTarget = Math.max(0, totalMonthlyExpenses * 6);
    const reserveEl = document.getElementById('reserveTarget');
    const reserveStatus = document.getElementById('reserveTargetStatus');
    if (reserveEl) {
        reserveEl.textContent = formatCompactCurrency(reserveTarget);
        reserveEl.classList.add('vd-tile-value');
    }
    if (reserveStatus) {
        reserveStatus.textContent = `6 × ${formatCompactCurrency(totalMonthlyExpenses)}/mo`;
        reserveStatus.className = 'core-metric-status vd-chip';
    }

    const savingsRate = monthlyIncome > 0 ? (monthlyCashFlow / monthlyIncome) * 100 : 0;
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

function calculateCollegePayment() {
    const cost = parseFloat(document.getElementById('collegeCost')?.value) || 0;
    const rate = parseFloat(document.getElementById('collegeInterestRate')?.value) || 0;
    const months = parseInt(document.getElementById('collegeLoanMonths')?.value) || 120;
    return cost > 0 ? calculateLoanPayment(cost, rate, months) : 0;
}

function calculateMedicalPayment() {
    const cost = parseFloat(document.getElementById('medicalCost')?.value) || 0;
    const rate = parseFloat(document.getElementById('medicalInterestRate')?.value) || 0;
    const months = parseInt(document.getElementById('medicalLoanMonths')?.value) || 48;
    return cost > 0 ? calculateLoanPayment(cost, rate, months) : 0;
}

// Property tax is a recurring annual bill spread across 12 months — no term, no interest.
function calculatePropertyTaxPayment() {
    const annual = parseFloat(document.getElementById('propertyTaxAnnual')?.value) || 0;
    return annual > 0 ? annual / 12 : 0;
}

function calculateDebtPayment() {
    const balance = parseFloat(document.getElementById('debtBalance')?.value) || 0;
    const rate = parseFloat(document.getElementById('debtInterestRate')?.value) || 0;
    const months = parseInt(document.getElementById('debtLoanMonths')?.value) || 36;
    return balance > 0 ? calculateLoanPayment(balance, rate, months) : 0;
}

/** Finite loan active in a given month (payments start month after startMonth). */
function isFiniteLoanActive(month, startMonth, termMonths) {
    return month > startMonth && month <= startMonth + termMonths;
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


/**
 * Compact money for dense UI: 4+ digits → K, millions → M.
 * Keeps tiles/metrics/ledger from overflowing their containers.
 */
function formatCompactCurrency(value, opts = {}) {
    const n = Number(value);
    if (!isFinite(n)) return '$0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    const withCents = !!opts.withCents;

    if (abs >= 1_000_000) {
        const m = abs / 1_000_000;
        const body = m >= 100
            ? m.toFixed(0)
            : m.toFixed(m >= 10 ? 1 : 2).replace(/\.?0+$/, '');
        return sign + '$' + body + 'M';
    }
    // Quadruple digits and up → K (e.g. $1.2K, $9.6K, $146K)
    if (abs >= 1000) {
        const k = abs / 1000;
        let body;
        if (k >= 100) {
            body = k.toFixed(0);
        } else if (k >= 10) {
            body = (Math.round(k * 10) / 10).toFixed(1).replace(/\.0$/, '');
        } else {
            body = (Math.round(k * 10) / 10).toFixed(1).replace(/\.0$/, '');
        }
        return sign + '$' + body + 'K';
    }
    if (withCents) {
        return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return sign + '$' + Math.round(abs).toLocaleString();
}

/** Alias used across dashboards / charts */
function formatMoney(value, opts) {
    return formatCompactCurrency(value, opts);
}

function saveCurrentScenario() {
    const saveBtn = document.getElementById('saveCurrentScenarioBtn');
    const scenarioInput = document.getElementById('scenarioName');
    const scenarioName = scenarioInput.value.trim();
    if (!scenarioName) {
        showNotification('Please enter a scenario name');
        return;
    }
    saveScenario(scenarioName);
    scenarioInput.value = '';
    
    if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.classList.add('btn-success');
        saveBtn.disabled = true;
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.classList.remove('btn-success');
            saveBtn.disabled = false;
        }, 1500);
    }
}


function renderBudgetItems() {
    const container = document.getElementById('budgetItems');
    container.innerHTML = '';

    // Income — primary vault tile
    const incomeValue = Math.round(parseFloat(document.getElementById('monthlyIncome').value) || 9593);
    const incomeTip = getBudgetItemTip('Monthly Income');
    const incomeDiv = document.createElement('div');
    incomeDiv.className = 'budget-item income-item atelier-tile atelier-tile--income' + (incomeEnabled === false ? ' disabled' : '');
    incomeDiv.setAttribute('data-vd-tip', '');
    incomeDiv.setAttribute('data-tip-title', incomeTip.title);
    incomeDiv.setAttribute('data-tip-body', incomeTip.body);
    incomeDiv.innerHTML = `
        <div class="tile-aura" aria-hidden="true"></div>
        <div class="tile-edge" aria-hidden="true"></div>
        <header class="tile-head">
            <span class="tile-index">00</span>
            <span class="tile-role">Primary</span>
            <div class="tile-head-actions">
                <button type="button" class="vd-tip-btn budget-tip-btn" aria-label="Explain monthly income" tabindex="0">?</button>
                <button type="button"
                    class="tile-power ${incomeEnabled ? 'is-on' : ''}"
                    role="switch"
                    aria-checked="${incomeEnabled ? 'true' : 'false'}"
                    onclick="toggleIncome()"
                    title="${incomeEnabled ? 'Disable' : 'Enable'} income"
                    aria-label="${incomeEnabled ? 'Disable' : 'Enable'} income">
                    <span class="tile-power-dot"></span>
                </button>
            </div>
        </header>
        <div class="tile-body">
            <input class="form-input budget-item-input budget-name-input budget-name-input--readonly budget-item-name tile-label"
                   value="Monthly Income"
                   placeholder="Monthly Income"
                   readonly
                   ${!incomeEnabled ? 'disabled' : ''}>
            <div class="tile-meter tile-meter--solo">
                <div class="budget-amount-input-wrapper budget-amount-face budget-amount-face--income tile-value-wrap${!incomeEnabled ? ' is-disabled' : ''}"
                     data-digits="${String(incomeValue).length}"
                     data-compact="${Math.abs(incomeValue) >= 1000 ? '1' : '0'}"
                     role="group"
                     tabindex="0"
                     aria-label="Edit monthly income"
                     onclick="if (event.target !== this.querySelector('input')) { const field = this.querySelector('input'); field?.focus(); field?.select(); }"
                     onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); const field = this.querySelector('input'); field?.focus(); field?.select(); }">
                    <span class="budget-amount-prefix tile-currency" aria-hidden="true">$</span>
                    <input type="number"
                           class="budget-amount-input income-amount-input tile-value${!incomeEnabled ? ' is-disabled' : ''}"
                           id="incomeAmountInput"
                           value="${incomeValue}"
                           min="0"
                           max="50000"
                           step="100"
                           oninput="updateIncome(parseFloat(this.value) || 0); syncAmountFaceDigits(this)"
                           onfocus="this.select()"
                           ${!incomeEnabled ? 'disabled' : ''}
                           placeholder="0"
                           aria-label="Monthly income amount">
                    <span class="tile-value-compact" aria-hidden="true">${Math.abs(incomeValue) >= 1000 ? formatCompactCurrency(incomeValue).replace(/^\$/, '') : ''}</span>
                </div>
            </div>
            <span class="tile-period">per month</span>
        </div>
    `;
    container.appendChild(incomeDiv);

    // Spending categories
    budgetItems.forEach((item, index) => {
        const div = document.createElement('div');
        const isEnabled = item.enabled !== false;
        const amountVal = Math.round(parseFloat(item.amount) || 0);
        const idx = String(index + 1).padStart(2, '0');
        const tip = getBudgetItemTip(item.name);
        const safeName = escapeHtmlAttr(item.name);
        div.className = 'budget-item atelier-tile' + (isEnabled ? '' : ' disabled');
        div.style.setProperty('--tile-i', String(index));
        div.setAttribute('data-vd-tip', '');
        div.setAttribute('data-tip-title', tip.title);
        div.setAttribute('data-tip-body', tip.body);
        div.innerHTML = `
            <div class="tile-aura" aria-hidden="true"></div>
            <div class="tile-edge" aria-hidden="true"></div>
            <header class="tile-head">
                <span class="tile-index">${idx}</span>
                <span class="tile-role">Category</span>
                <div class="tile-head-actions">
                    <button type="button" class="vd-tip-btn budget-tip-btn" aria-label="Explain ${safeName}" tabindex="0">?</button>
                    <button type="button"
                        class="tile-power ${isEnabled ? 'is-on' : ''}"
                        role="switch"
                        aria-checked="${isEnabled ? 'true' : 'false'}"
                        onclick="toggleBudgetItem(${index})"
                        title="${isEnabled ? 'Disable' : 'Enable'} item"
                        aria-label="${isEnabled ? 'Disable' : 'Enable'} ${safeName}">
                        <span class="tile-power-dot"></span>
                    </button>
                    <button type="button" class="tile-x budget-item-delete" onclick="deleteBudgetItem(${index})" title="Remove category" aria-label="Delete budget item">×</button>
                </div>
            </header>
            <div class="tile-body">
                <input class="form-input budget-item-input budget-name-input budget-item-name tile-label"
                       value="${safeName}"
                       placeholder="Category name"
                       oninput="updateBudgetItem(${index}, 'name', this.value); syncBudgetItemTip(this, ${index})"
                       ${!isEnabled ? 'disabled' : ''}>
                <div class="tile-meter tile-meter--solo">
                    <div class="budget-amount-input-wrapper budget-amount-face tile-value-wrap${!isEnabled ? ' is-disabled' : ''}" data-digits="${String(amountVal).length}" data-compact="${Math.abs(amountVal) >= 1000 ? '1' : '0'}">
                        <span class="budget-amount-prefix tile-currency" aria-hidden="true">$</span>
                        <input type="number"
                               class="budget-amount-input tile-value${!isEnabled ? ' is-disabled' : ''}"
                               id="budget-amount-${index}"
                               value="${amountVal}"
                               min="0"
                               max="5000"
                               step="10"
                               oninput="updateBudgetItem(${index}, 'amount', Math.round(parseFloat(this.value) || 0)); syncAmountFaceDigits(this)"
                               onfocus="this.select()"
                               ${!isEnabled ? 'disabled' : ''}
                               placeholder="0"
                               aria-label="${safeName} monthly amount">
                        <span class="tile-value-compact" aria-hidden="true">${Math.abs(amountVal) >= 1000 ? formatCompactCurrency(amountVal).replace(/^\$/, '') : ''}</span>
                    </div>
                </div>
                <span class="tile-period">per month</span>
            </div>
        `;
        container.appendChild(div);
    });

    // Size numbers immediately after rebuild so they don't flash CSS-small then grow
    requestNumberFit();
}

/** Keep tile tip in sync when the category name is edited. */
function syncBudgetItemTip(inputEl, index) {
    const tile = inputEl?.closest?.('.atelier-tile');
    if (!tile) return;
    const name = inputEl.value || budgetItems[index]?.name || 'Category';
    const tip = getBudgetItemTip(name);
    tile.setAttribute('data-tip-title', tip.title);
    tile.setAttribute('data-tip-body', tip.body);
    const tipBtn = tile.querySelector('.budget-tip-btn');
    if (tipBtn) tipBtn.setAttribute('aria-label', `Explain ${name}`);
}

/** Run bento number fit after layout settles (scenario load, recalculate, etc.). */
function requestNumberFit() {
    if (typeof window.__bbBentoFitSchedule === 'function') {
        window.__bbBentoFitSchedule();
        return;
    }
    if (typeof window.__bbBentoFit === 'function') {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => window.__bbBentoFit());
        });
    }
}

/** Keep amount face digit count + compact K overlay in sync. */
function syncAmountFaceDigits(inputEl) {
    if (!inputEl) return;
    const face = inputEl.closest('.budget-amount-face');
    if (!face) return;
    const raw = String(inputEl.value ?? '').replace(/[^\d.-]/g, '') || '0';
    const n = Math.round(parseFloat(raw) || 0);
    face.dataset.digits = String(Math.max(1, String(Math.abs(n)).length));
    const useCompact = Math.abs(n) >= 1000;
    face.dataset.compact = useCompact ? '1' : '0';
    let compactEl = face.querySelector('.tile-value-compact');
    if (!compactEl) {
        compactEl = document.createElement('span');
        compactEl.className = 'tile-value-compact';
        compactEl.setAttribute('aria-hidden', 'true');
        face.appendChild(compactEl);
    }
    // Compact label omits leading $ — the face already has a currency prefix
    compactEl.textContent = useCompact ? formatCompactCurrency(n).replace(/^\$/, '') : '';

    // Keep type size locked when flipping full digits ↔ K (set by bento-fit probe)
    const locked = face.dataset.lockedFit || inputEl.dataset.fitSize || compactEl.dataset.fitSize;
    if (locked) {
        const px = `${parseFloat(locked)}px`;
        inputEl.style.setProperty('transition', 'none', 'important');
        compactEl.style.setProperty('transition', 'none', 'important');
        inputEl.style.setProperty('font-size', px, 'important');
        compactEl.style.setProperty('font-size', px, 'important');
        inputEl.dataset.fitSize = String(parseFloat(locked));
        compactEl.dataset.fitSize = String(parseFloat(locked));
    } else {
        // First paint / no probe yet — refit all planning tiles with stable probe
        requestNumberFit();
    }
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
            syncAmountFaceDigits(inputElement);
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
    calculate();
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
        syncAmountFaceDigits(inputElement);
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
        displayElement.textContent = formatCompactCurrency(clampedValue);
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
        displayElement.textContent = formatCompactCurrency(clampedValue);
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
        displayElement.textContent = formatCompactCurrency(clampedValue);
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
        displayElement.textContent = formatCompactCurrency(newValue);
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
        displayElement.textContent = formatCompactCurrency(budgetItems[index].amount);
    }
}

function syncPurchaseSwitchLabel(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const label = input.closest('.purchase-tile-switch')?.querySelector('.purchase-tile-switch-label');
    if (label) label.textContent = input.checked ? 'On' : 'Off';
}

function toggleCar() {
    const carEnabled = document.getElementById('carEnabled').checked;
    const carPanel = document.getElementById('carPanel');
    if (carEnabled) {
        carPanel.classList.remove('disabled');
    } else {
        carPanel.classList.add('disabled');
    }
    syncPurchaseSwitchLabel('carEnabled');
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
    syncPurchaseSwitchLabel('houseEnabled');
    calculate();
}

function toggleCollege() {
    const enabled = document.getElementById('collegeEnabled')?.checked;
    const panel = document.getElementById('collegePanel');
    if (!panel) return;
    if (enabled) panel.classList.remove('disabled');
    else panel.classList.add('disabled');
    syncPurchaseSwitchLabel('collegeEnabled');
    calculate();
}

function toggleMedical() {
    const enabled = document.getElementById('medicalEnabled')?.checked;
    const panel = document.getElementById('medicalPanel');
    if (!panel) return;
    if (enabled) panel.classList.remove('disabled');
    else panel.classList.add('disabled');
    syncPurchaseSwitchLabel('medicalEnabled');
    calculate();
}

function togglePropertyTax() {
    const enabled = document.getElementById('propertyTaxEnabled')?.checked;
    const panel = document.getElementById('propertyTaxPanel');
    if (!panel) return;
    if (enabled) panel.classList.remove('disabled');
    else panel.classList.add('disabled');
    syncPurchaseSwitchLabel('propertyTaxEnabled');
    calculate();
}

function toggleDebt() {
    const enabled = document.getElementById('debtEnabled')?.checked;
    const panel = document.getElementById('debtPanel');
    if (!panel) return;
    if (enabled) panel.classList.remove('disabled');
    else panel.classList.add('disabled');
    syncPurchaseSwitchLabel('debtEnabled');
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

    // College / tuition (finite loan floor-blocker)
    const collegeEnabled = document.getElementById('collegeEnabled')?.checked || false;
    const collegeCost = parseFloat(document.getElementById('collegeCost')?.value) || 0;
    const collegeInterestRate = parseFloat(document.getElementById('collegeInterestRate')?.value) || 0;
    const collegeLoanMonths = parseInt(document.getElementById('collegeLoanMonths')?.value) || 120;
    const collegeStartYear = parseInt(document.getElementById('collegeStartYear')?.value) || 0;
    const collegeStartMonth = collegeStartYear * 12;
    const collegeMonthlyPayment = collegeEnabled && collegeCost > 0
        ? calculateLoanPayment(collegeCost, collegeInterestRate, collegeLoanMonths)
        : 0;

    // Hospital / medical (finite payment plan floor-blocker)
    const medicalEnabled = document.getElementById('medicalEnabled')?.checked || false;
    const medicalCost = parseFloat(document.getElementById('medicalCost')?.value) || 0;
    const medicalInterestRate = parseFloat(document.getElementById('medicalInterestRate')?.value) || 0;
    const medicalLoanMonths = parseInt(document.getElementById('medicalLoanMonths')?.value) || 48;
    const medicalStartYear = parseInt(document.getElementById('medicalStartYear')?.value) || 0;
    const medicalStartMonth = medicalStartYear * 12;
    const medicalMonthlyPayment = medicalEnabled && medicalCost > 0
        ? calculateLoanPayment(medicalCost, medicalInterestRate, medicalLoanMonths)
        : 0;

    // Property tax (recurring, ongoing floor — no term)
    const propertyTaxEnabled = document.getElementById('propertyTaxEnabled')?.checked || false;
    const propertyTaxAnnual = parseFloat(document.getElementById('propertyTaxAnnual')?.value) || 0;
    const propertyTaxStartYear = parseInt(document.getElementById('propertyTaxStartYear')?.value) || 0;
    const propertyTaxStartMonth = propertyTaxStartYear * 12;
    const propertyTaxMonthlyPayment = propertyTaxEnabled && propertyTaxAnnual > 0
        ? propertyTaxAnnual / 12
        : 0;

    // Debt payoff — credit card / back income tax (finite payment plan floor-blocker)
    const debtEnabled = document.getElementById('debtEnabled')?.checked || false;
    const debtBalance = parseFloat(document.getElementById('debtBalance')?.value) || 0;
    const debtInterestRate = parseFloat(document.getElementById('debtInterestRate')?.value) || 0;
    const debtLoanMonths = parseInt(document.getElementById('debtLoanMonths')?.value) || 36;
    const debtStartYear = parseInt(document.getElementById('debtStartYear')?.value) || 0;
    const debtStartMonth = debtStartYear * 12;
    const debtMonthlyPayment = debtEnabled && debtBalance > 0
        ? calculateLoanPayment(debtBalance, debtInterestRate, debtLoanMonths)
        : 0;

    // Calculate Year 1 savings for house down payment if needed
    let year1Savings = 0;
    const annualReturnRate = 0.04;
    const monthlyRate = annualReturnRate / 12;

    if (houseEnabled && housePurchaseYear >= 1) {
        // Calculate savings accumulated before house purchase (Year 0 to housePurchaseYear-1)
        const monthsBeforeHouse = housePurchaseYear * 12;
        for (let month = 1; month <= monthsBeforeHouse; month++) {
            let monthlySavingsThisMonth = baseMonthlySavings;
            if (carEnabled && isFiniteLoanActive(month, carPurchaseMonth, carLoanMonths)) {
                monthlySavingsThisMonth -= carMonthlyPayment;
            }
            if (collegeEnabled && isFiniteLoanActive(month, collegeStartMonth, collegeLoanMonths)) {
                monthlySavingsThisMonth -= collegeMonthlyPayment;
            }
            if (medicalEnabled && isFiniteLoanActive(month, medicalStartMonth, medicalLoanMonths)) {
                monthlySavingsThisMonth -= medicalMonthlyPayment;
            }
            if (propertyTaxEnabled && month > propertyTaxStartMonth) {
                monthlySavingsThisMonth -= propertyTaxMonthlyPayment;
            }
            if (debtEnabled && isFiniteLoanActive(month, debtStartMonth, debtLoanMonths)) {
                monthlySavingsThisMonth -= debtMonthlyPayment;
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

    // Update payment displays (summary cards + in-panel estimates) — compact K/M for 4+ digits
    const carPaymentText = carEnabled
        ? formatCompactCurrency(carMonthlyPayment)
        : '$0';
    const houseTotalMonthly = houseEnabled ? (houseMonthlyPayment + houseAdditionalBills) : 0;
    const housePaymentText = houseEnabled
        ? formatCompactCurrency(houseMonthlyPayment)
        : '$0';
    const houseEstimateText = houseEnabled
        ? formatCompactCurrency(houseTotalMonthly)
        : '$0';
    const collegePaymentText = collegeEnabled
        ? formatCompactCurrency(collegeMonthlyPayment)
        : '$0';
    const medicalPaymentText = medicalEnabled
        ? formatCompactCurrency(medicalMonthlyPayment)
        : '$0';
    const propertyTaxPaymentText = propertyTaxEnabled
        ? formatCompactCurrency(propertyTaxMonthlyPayment)
        : '$0';
    const debtPaymentText = debtEnabled
        ? formatCompactCurrency(debtMonthlyPayment)
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
    const collegePaymentDisplay = document.getElementById('collegePaymentDisplay');
    const medicalPaymentDisplay = document.getElementById('medicalPaymentDisplay');
    const propertyTaxPaymentDisplay = document.getElementById('propertyTaxPaymentDisplay');
    const debtPaymentDisplay = document.getElementById('debtPaymentDisplay');
    if (carPaymentDisplay) carPaymentDisplay.textContent = carPaymentText;
    if (housePaymentDisplay) housePaymentDisplay.textContent = houseEstimateText;
    if (collegePaymentDisplay) collegePaymentDisplay.textContent = collegePaymentText;
    if (medicalPaymentDisplay) medicalPaymentDisplay.textContent = medicalPaymentText;
    if (propertyTaxPaymentDisplay) propertyTaxPaymentDisplay.textContent = propertyTaxPaymentText;
    if (debtPaymentDisplay) debtPaymentDisplay.textContent = debtPaymentText;

    // 20-year projection for ledger; year-5 remains viability headline
    const years = 20;
    const chartYears = 5;
    const months = years * 12;
    const chartMonths = chartYears * 12;
    const savingsData = [];
    const labels = [];
    let savingsBalance = 0;

    // Calculate detailed month-by-month for chart + ledger data
    const chartAnnualReturnRate = 0.04;
    const chartMonthlyRate = chartAnnualReturnRate / 12;
    for (let month = 0; month <= months; month++) {
        if (month > 0) {
            let monthlySavingsThisMonth = baseMonthlySavings;

            // Subtract car loan payment
            if (carEnabled && isFiniteLoanActive(month, carPurchaseMonth, carLoanMonths)) {
                monthlySavingsThisMonth -= carMonthlyPayment;
            }

            // Subtract house loan payment
            if (houseEnabled && month > housePurchaseMonth) {
                monthlySavingsThisMonth -= houseMonthlyPayment;
                monthlySavingsThisMonth -= houseAdditionalBills;
            }

            // College / tuition
            if (collegeEnabled && isFiniteLoanActive(month, collegeStartMonth, collegeLoanMonths)) {
                monthlySavingsThisMonth -= collegeMonthlyPayment;
            }

            // Hospital / medical
            if (medicalEnabled && isFiniteLoanActive(month, medicalStartMonth, medicalLoanMonths)) {
                monthlySavingsThisMonth -= medicalMonthlyPayment;
            }

            // Property tax (recurring once it starts)
            if (propertyTaxEnabled && month > propertyTaxStartMonth) {
                monthlySavingsThisMonth -= propertyTaxMonthlyPayment;
            }

            // Debt payoff (credit card / back taxes)
            if (debtEnabled && isFiniteLoanActive(month, debtStartMonth, debtLoanMonths)) {
                monthlySavingsThisMonth -= debtMonthlyPayment;
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

    // Headline viability metric stays at the 5-year mark; full series runs 20 years
    const fiveYearSavings = savingsData[chartMonths] ?? savingsData[savingsData.length - 1] ?? 0;
    const tenYearSavings = savingsData[Math.min(10 * 12, months)] ?? savingsData[savingsData.length - 1] ?? 0;
    const twentyYearSavings = savingsData[Math.min(20 * 12, months)] ?? savingsData[savingsData.length - 1] ?? 0;
    const horizonSavings = savingsData[months] ?? savingsData[savingsData.length - 1] ?? 0;
    const finalSavings = fiveYearSavings;
    // Expose for walkthroughs / chat
    window.__bbProjection = {
        years,
        chartYears,
        savingsData,
        fiveYearSavings,
        tenYearSavings,
        twentyYearSavings,
        horizonSavings,
        labels
    };

    // Update affordability banner (finalSavings already calculated above)
    const banner = document.getElementById('affordabilityBanner');
    const bannerTitle = document.getElementById('affordabilityTitle');
    const bannerText = document.getElementById('affordabilityDesc');
    // Steady-state monthly cash flow with currently enabled major purchases / floor blockers
    const monthlySavingsAfterLoans = baseMonthlySavings
        - (carEnabled ? carMonthlyPayment : 0)
        - (houseEnabled ? houseMonthlyPayment + houseAdditionalBills : 0)
        - (collegeEnabled ? collegeMonthlyPayment : 0)
        - (medicalEnabled ? medicalMonthlyPayment : 0)
        - (propertyTaxEnabled ? propertyTaxMonthlyPayment : 0)
        - (debtEnabled ? debtMonthlyPayment : 0);

    if (banner && bannerTitle && bannerText) {
        const cannotAfford = finalSavings < 0 || monthlySavingsAfterLoans < 0;
        // Preserve dashboard shell classes — never wipe the whole className
        banner.classList.add('affordability-banner', 'viability-dashboard', 'bento-shell', 'vd-dash');
        banner.classList.toggle('negative', cannotAfford);
        banner.classList.toggle('is-strained', cannotAfford);
        banner.classList.toggle('is-healthy', !cannotAfford);
        banner.dataset.vdState = cannotAfford ? 'strained' : 'healthy';

        const pill = document.getElementById('viabilityStatusPill');
        if (pill) {
            pill.dataset.state = cannotAfford ? 'strained' : 'healthy';
            const pillText = pill.querySelector('.vd-pill-text');
            if (pillText) pillText.textContent = cannotAfford ? 'Under pressure' : 'On track';
        }

        if (cannotAfford) {
            bannerTitle.textContent = 'You Cannot Afford This Lifestyle';
            bannerText.textContent = 'Cash flow or the 5-year mark turns negative — cut spend, delay purchases, or raise income.';
        } else {
            bannerTitle.textContent = 'You Can Afford This Lifestyle';
            bannerText.textContent = 'Positive cash flow · 5-year mark holds on a 20-year path';
        }
    }

    const monthlySavingsEl = document.getElementById('monthlySavings');
    const totalSavingsEl = document.getElementById('totalSavings');
    
    if (monthlySavingsEl) {
        monthlySavingsEl.textContent = formatCompactCurrency(monthlySavingsAfterLoans);
        monthlySavingsEl.className = 'summary-card-value ' + (monthlySavingsAfterLoans >= 0 ? 'positive' : 'negative');
    }
    
    if (totalSavingsEl) {
        totalSavingsEl.textContent = formatCompactCurrency(finalSavings);
        totalSavingsEl.className = 'summary-card-value ' + (finalSavings >= 0 ? 'positive' : 'negative');
    }

    // Update the core metric projected savings display
    const topRightSavingsEl = document.getElementById('topRightSavings');
    if (topRightSavingsEl) {
        topRightSavingsEl.textContent = formatCompactCurrency(finalSavings);
        // Preserve dashboard value classes; only flip polarity
        topRightSavingsEl.classList.add('viability-mega-value', 'vd-tile-value');
        topRightSavingsEl.classList.toggle('positive', finalSavings >= 0);
        topRightSavingsEl.classList.toggle('negative', finalSavings < 0);
    }

    // Cash-flow hero polarity
    const cashEl = document.getElementById('miniMonthlyCashFlow');
    if (cashEl) {
        cashEl.classList.add('vd-tile-value');
        cashEl.classList.toggle('positive', monthlySavingsAfterLoans >= 0);
        cashEl.classList.toggle('negative', monthlySavingsAfterLoans < 0);
    }

    // App phone preview projection
    const appPhoneProjection = document.getElementById('appPhoneProjection');
    if (appPhoneProjection) {
        appPhoneProjection.textContent = formatCompactCurrency(finalSavings);
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

    // Charts use the full 20-year series (table highlights years 5 / 10 / 20)
    try {
        updateSavingsChart(labels, savingsData);
        updateSpendingChart(labels, budgetItems, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseEnabled, months, {
            collegeEnabled, collegeMonthlyPayment, collegeStartMonth, collegeLoanMonths,
            medicalEnabled, medicalMonthlyPayment, medicalStartMonth, medicalLoanMonths,
            propertyTaxEnabled, propertyTaxMonthlyPayment, propertyTaxStartMonth,
            debtEnabled, debtMonthlyPayment, debtStartMonth, debtLoanMonths
        });
        updateBentoBox(budgetItems, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseEnabled, months, {
            collegeEnabled, collegeMonthlyPayment, collegeStartMonth, collegeLoanMonths,
            medicalEnabled, medicalMonthlyPayment, medicalStartMonth, medicalLoanMonths,
            propertyTaxEnabled, propertyTaxMonthlyPayment, propertyTaxStartMonth,
            debtEnabled, debtMonthlyPayment, debtStartMonth, debtLoanMonths
        });
        updateBudgetPieChart(budgetItems);
    } catch (err) {
        console.warn('Chart update skipped:', err?.message || err);
    }
    try {
        updateYearlyTable(monthlyIncome, baseMonthlySavings, carMonthlyPayment, carPurchaseMonth, carLoanMonths, carEnabled, houseMonthlyPayment, housePurchaseMonth, houseAdditionalBills, houseDownPayment, houseEnabled, years, months, monthlyRate, {
            collegeEnabled, collegeMonthlyPayment, collegeStartMonth, collegeLoanMonths,
            medicalEnabled, medicalMonthlyPayment, medicalStartMonth, medicalLoanMonths,
            propertyTaxEnabled, propertyTaxMonthlyPayment, propertyTaxStartMonth,
            debtEnabled, debtMonthlyPayment, debtStartMonth, debtLoanMonths
        });
    } catch (err) {
        console.warn('Yearly table update skipped:', err?.message || err);
    }

    // Update mini dashboard
    try {
        updateMiniDashboard();
    } catch (err) {
        console.warn('Mini dashboard update skipped:', err?.message || err);
    }

    // Conditional chart walkthroughs driven by this plan's decisions
    try {
        updateChartWalkthroughs({
            monthlyIncome,
            monthlySpending,
            baseMonthlySavings,
            budgetItems,
            carEnabled,
            carPrice,
            carMonthlyPayment,
            carPurchaseYear,
            carLoanMonths,
            houseEnabled,
            housePrice,
            houseMonthlyPayment,
            houseAdditionalBills,
            housePurchaseYear,
            houseDownPayment,
            houseTotalMonthly,
            savingsData,
            months
        });
    } catch (err) {
        console.warn('Walkthrough update skipped:', err?.message || err);
    }

    // Fit metric/tile numbers to their faces after text content updates
    requestNumberFit();
}

/**
 * Narrative walkthroughs for each analytics stage — highlights the result of
 * planning decisions (income, categories, car/house) for a first-time user.
 */
function updateChartWalkthroughs(ctx) {
    const money = (n) => formatCompactCurrency(n);
    const pct = (n) => (Math.round((Number(n) || 0) * 10) / 10).toFixed(1) + '%';

    const income = ctx.monthlyIncome || 0;
    const spending = ctx.monthlySpending || 0;
    const items = (ctx.budgetItems || []).filter((i) => i.enabled !== false && (parseFloat(i.amount) || 0) > 0);
    const totalCat = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const sorted = [...items].sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
    const top = sorted[0];
    const top2 = sorted[1];
    const topShare = totalCat > 0 && top ? ((parseFloat(top.amount) || 0) / totalCat) * 100 : 0;
    const expenseRatio = income > 0 ? (spending / income) * 100 : 0;
    const savingsRate = income > 0 ? ((income - spending) / income) * 100 : 0;
    const finalSavings = ctx.savingsData && ctx.savingsData.length
        ? ctx.savingsData[ctx.savingsData.length - 1]
        : 0;
    const y1 = ctx.savingsData && ctx.savingsData.length > 12 ? ctx.savingsData[12] : 0;
    const y3 = ctx.savingsData && ctx.savingsData.length > 36 ? ctx.savingsData[36] : 0;
    const minBal = ctx.savingsData && ctx.savingsData.length ? Math.min(...ctx.savingsData) : 0;
    const dipIdx = ctx.savingsData ? ctx.savingsData.indexOf(minBal) : -1;
    const dipYear = dipIdx >= 0 ? Math.floor(dipIdx / 12) : 0;
    const dipMonth = dipIdx >= 0 ? dipIdx % 12 : 0;

    const carOn = !!ctx.carEnabled && (ctx.carMonthlyPayment || 0) > 0;
    const houseOn = !!ctx.houseEnabled && ((ctx.houseMonthlyPayment || 0) > 0 || (ctx.houseAdditionalBills || 0) > 0);
    const majorMo = (carOn ? ctx.carMonthlyPayment : 0) + (houseOn ? (ctx.houseMonthlyPayment + (ctx.houseAdditionalBills || 0)) : 0);

    // ── Budget pie
    const budgetBits = [];
    if (!items.length || totalCat <= 0) {
        budgetBits.push({ t: 'Empty plan', d: 'Enable or add spending categories in Planning to see how your monthly lifestyle is composed.' });
    } else {
        budgetBits.push({
            t: 'Where the money goes',
            d: `You’re allocating ${money(totalCat)}/mo across ${items.length} categories` +
                (income > 0 ? ` — about ${pct(expenseRatio)} of income before major purchases.` : '.')
        });
        if (top) {
            budgetBits.push({
                t: 'Largest slice',
                d: `“${top.name}” leads at ${money(top.amount)}/mo (${pct(topShare)} of lifestyle spend).` +
                    (topShare >= 30 ? ' That single category dominates — a small cut here moves the whole pie.' : ' The mix is relatively balanced; no single category is overwhelming.')
            });
        }
        if (top2) {
            budgetBits.push({
                t: 'Runner-up',
                d: `Next is “${top2.name}” at ${money(top2.amount)}/mo. Together, your top two categories are ${pct((((parseFloat(top.amount)||0)+(parseFloat(top2.amount)||0))/totalCat)*100)} of spending.`
            });
        }
    }
    renderWalkthrough('walkBudget', budgetBits);

    // ── Savings trajectory
    const savingsBits = [];
    savingsBits.push({
        t: '5-year endpoint',
        d: finalSavings >= 0
            ? `Your plan projects ${money(finalSavings)} cumulative savings after 5 years (including a 4% annual return on the balance).`
            : `Warning: the trajectory ends underwater at ${money(finalSavings)}. Lifestyle spend and purchases outrun income over five years.`
    });
    if (carOn || houseOn) {
        const parts = [];
        if (carOn) parts.push(`car ~${money(ctx.carMonthlyPayment)}/mo (year ${ctx.carPurchaseYear ?? 0})`);
        if (houseOn) parts.push(`home ~${money((ctx.houseMonthlyPayment||0)+(ctx.houseAdditionalBills||0))}/mo (year ${ctx.housePurchaseYear ?? 0})`);
        savingsBits.push({
            t: 'Purchase imprint',
            d: `Major purchases are on: ${parts.join('; ')}. Look for slope changes on the chart when those payments kick in.`
        });
    } else {
        savingsBits.push({
            t: 'No major purchases',
            d: 'Car and house are excluded, so the curve is pure lifestyle cash flow plus returns — a clean baseline of your plan.'
        });
    }
    if (minBal < finalSavings && dipIdx > 0) {
        savingsBits.push({
            t: 'Lowest point',
            d: minBal < 0
                ? `The balance dips to ${money(minBal)} around year ${dipYear}, month ${dipMonth}. That trough is where purchase timing and spend collide hardest.`
                : `The shallowest point is still positive (${money(minBal)} near year ${dipYear}). Your plan stays solvent throughout.`
        });
    }
    if (y1 || y3) {
        savingsBits.push({
            t: 'Checkpoints',
            d: `Year 1 ≈ ${money(y1)}; Year 3 ≈ ${money(y3)}. ` +
                (y3 > y1 * 1.5 ? 'Growth accelerates as compounding and cash flow stack.' : 'Growth is steady — purchases may be capping acceleration.')
        });
    }
    renderWalkthrough('walkSavings', savingsBits);

    // ── Cumulative spending bars
    const spendBits = [];
    const fiveYearLifestyle = totalCat * 60;
    const fiveYearCar = carOn ? (ctx.carMonthlyPayment || 0) * Math.min(60, ctx.carLoanMonths || 60) : 0;
    // approximate house 5y: payments for months after purchase
    const houseMonthsActive = houseOn ? Math.max(0, 60 - ((ctx.housePurchaseYear || 0) * 12)) : 0;
    const fiveYearHouse = houseOn ? ((ctx.houseMonthlyPayment || 0) + (ctx.houseAdditionalBills || 0)) * houseMonthsActive : 0;
    spendBits.push({
        t: '5-year pressure',
        d: `Lifestyle categories alone stack to about ${money(fiveYearLifestyle)} over five years if this mix holds.`
    });
    if (carOn || houseOn) {
        spendBits.push({
            t: 'Purchase stack',
            d: [
                carOn ? `Car loan ≈ ${money(fiveYearCar)} across the term.` : null,
                houseOn ? `Housing (mortgage + bills) ≈ ${money(fiveYearHouse)} from purchase through year 5.` : null
            ].filter(Boolean).join(' ')
        });
    }
    if (top) {
        spendBits.push({
            t: 'Fastest-growing lifestyle line',
            d: `“${top.name}” is your heaviest recurring category — on this chart it will be one of the tallest stacks by year 5 (${money((parseFloat(top.amount)||0)*60)} cumulative).`
        });
    }
    spendBits.push({
        t: 'How to read it',
        d: 'Each year marker is cumulative — bars only grow. A steep jump usually marks a purchase year or a high fixed category compounding.'
    });
    renderWalkthrough('walkSpending', spendBits);

    // ── Treemap
    const treeBits = [];
    const tiles = [];
    items.forEach((i) => tiles.push({ name: i.name, value: (parseFloat(i.amount) || 0) * 60 }));
    if (carOn) tiles.push({ name: 'Car loan', value: fiveYearCar });
    if (houseOn) tiles.push({ name: 'House (loan + bills)', value: fiveYearHouse });
    tiles.sort((a, b) => b.value - a.value);
    const treeTotal = tiles.reduce((s, t) => s + t.value, 0);
    if (tiles[0] && treeTotal > 0) {
        treeBits.push({
            t: 'Biggest tile',
            d: `“${tiles[0].name}” claims the largest 5-year footprint at ${money(tiles[0].value)} (${pct((tiles[0].value / treeTotal) * 100)} of all tracked spend).`
        });
    }
    if (houseOn && tiles.find((t) => t.name.startsWith('House'))) {
        treeBits.push({
            t: 'Housing weight',
            d: `Home ownership is modeled from year ${ctx.housePurchaseYear ?? 0} with ${money(ctx.houseDownPayment || 0)} down. Its tile reflects mortgage plus ${money(ctx.houseAdditionalBills || 0)}/mo in taxes & bills.`
        });
    } else if (!houseOn) {
        treeBits.push({
            t: 'No housing tile',
            d: 'Dream House is off — the map is pure lifestyle (and car if enabled). Toggle housing in Purchases to stress-test a mortgage-sized tile.'
        });
    }
    if (tiles[1]) {
        treeBits.push({
            t: 'Second mass',
            d: `“${tiles[1].name}” is next at ${money(tiles[1].value)}. Compare its area to the leader to see how concentrated your plan is.`
        });
    }
    renderWalkthrough('walkTreemap', treeBits);

    // ── Yearly ledger
    const ledgerBits = [];
    ledgerBits.push({
        t: 'Annual rhythm',
        d: income > 0
            ? `At ${money(income)}/mo income (~${money(income * 12)}/yr) and ${money(spending)}/mo lifestyle spend, your base annual surplus before purchases is about ${money((income - spending) * 12)}.`
            : 'Set a monthly income in Planning to populate a meaningful yearly ledger.'
    });
    if (majorMo > 0) {
        ledgerBits.push({
            t: 'Debt load on the ledger',
            d: `Major purchases add ~${money(majorMo)}/mo once active. Years after purchase years will show lower annual savings and a tougher cumulative column.`
        });
    }
    ledgerBits.push({
        t: 'Status column',
        d: finalSavings >= 0
            ? `With a ${money(finalSavings)} five-year endpoint, expect “On Track” badges if each year stays non-negative. A red year means that period spent more than it earned after purchases.`
            : 'Negative cumulative cells mean the plan needs a spend cut, delayed purchase, or higher income before it stays solvent year to year.'
    });
    if (savingsRate !== 0 || income > 0) {
        ledgerBits.push({
            t: 'Savings rate link',
            d: `Your current lifestyle savings rate is ${pct(savingsRate)} before major purchases. The viability section (next after Purchases in the rail) translates that into a health score.`
        });
    }
    renderWalkthrough('walkLedger', ledgerBits);
}

function renderWalkthrough(id, bits) {
    const root = document.getElementById(id);
    if (!root) return;
    const body = root.querySelector('.chart-walkthrough-body');
    if (!body) return;
    // Cap to 3 compact callouts so the row stays one line of cards
    const list = (bits || []).slice(0, 3);
    if (!list.length) {
        body.innerHTML = '<p class="walk-empty">Adjust your plan to generate a walkthrough.</p>';
        return;
    }
    body.innerHTML = list.map((b) => `
        <div class="walk-point walk-callout">
            <div class="walk-point-title">${b.t}</div>
            <div class="walk-point-text">${b.d}</div>
        </div>
    `).join('');
}

function updateSavingsChart(labels, data) {
    const ctx = document.getElementById('savingsChart').getContext('2d');

    if (savingsChart) {
        savingsChart.destroy();
    }

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const isNegative = minValue < 0;

    // Yearly cumulative savings for hover tooltips (full projection horizon)
    const yearlySavings = [];
    const maxYear = Math.max(5, Math.floor(((data && data.length) || 1) / 12));
    for (let year = 0; year <= maxYear; year++) {
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
                ctx.strokeStyle = 'rgba(201, 168, 108, 0.45)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(xPosition, top);
                ctx.lineTo(xPosition, bottom);
                ctx.stroke();

                // Draw year label background
                const yearLabel = `Year ${yearIndex}`;
                ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
                const labelWidth = ctx.measureText(yearLabel).width;
                const labelHeight = 20;
                const labelX = xPosition - labelWidth / 2;
                const labelY = top - 25;

                // Background rectangle
                ctx.fillStyle = 'rgba(12, 10, 8, 0.92)';
                ctx.fillRect(labelX - 5, labelY - labelHeight + 5, labelWidth + 10, labelHeight);

                // Label text
                ctx.fillStyle = '#e8d5a3';
                ctx.textAlign = 'center';
                ctx.fillText(yearLabel, xPosition, labelY);
                ctx.restore();
            }
        }
    };

    // Rebuild gold fill from actual chartArea once layout exists
    const goldAreaFillPlugin = {
        id: 'goldAreaFill',
        beforeDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0);
            const area = chart.chartArea;
            if (!meta || !area || meta.hidden) return;
            const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            g.addColorStop(0, 'rgba(232, 213, 163, 0.38)');
            g.addColorStop(0.45, 'rgba(201, 168, 108, 0.14)');
            g.addColorStop(1, 'rgba(201, 168, 108, 0)');
            chart.data.datasets[0].backgroundColor = g;
        }
    };

    savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Savings',
                data: data,
                borderColor: '#e8d5a3',
                backgroundColor: 'rgba(201, 168, 108, 0.18)',
                borderWidth: 2.25,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#e8d5a3',
                pointHoverBorderColor: '#1a140c',
                pointHoverBorderWidth: 2
            }]
        },
        plugins: [yearHighlightPlugin, goldAreaFillPlugin],
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
                        color: '#e8d5a3',
                        boxWidth: window.innerWidth < 480 ? 10 : 12,
                        font: {
                            family: "'JetBrains Mono', ui-monospace, monospace",
                            size: window.innerWidth < 480 ? 12 : 14,
                            weight: 500
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(12, 10, 8, 0.95)',
                    titleColor: '#e8d5a3',
                    bodyColor: '#f4efe6',
                    borderColor: 'rgba(201, 168, 108, 0.35)',
                    borderWidth: 1,
                    cornerRadius: 2,
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
                                return `Cumulative Savings: ${formatCompactCurrency(value)}`;
                            } else {
                                return `Savings Balance: ${formatCompactCurrency(value)}`;
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
                        color: '#c9a86c',
                        font: {
                            family: "'JetBrains Mono', ui-monospace, monospace",
                            size: 13,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(201, 168, 108, 0.08)'
                    },
                    ticks: {
                        color: 'rgba(244, 239, 230, 0.45)',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 480 ? 6 : 12,
                        font: {
                            family: "'JetBrains Mono', ui-monospace, monospace",
                            size: window.innerWidth < 480 ? 11 : 13
                        }
                    }
                },
                y: {
                    title: { 
                        display: window.innerWidth >= 480, 
                        text: 'Savings ($)',
                        color: '#c9a86c',
                        font: {
                            family: "'JetBrains Mono', ui-monospace, monospace",
                            size: 13,
                            weight: 500
                        }
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(201, 168, 108, 0.08)'
                    },
                    ticks: {
                        color: 'rgba(244, 239, 230, 0.45)',
                        maxTicksLimit: window.innerWidth < 480 ? 5 : 8,
                        font: {
                            family: "'JetBrains Mono', ui-monospace, monospace",
                            size: window.innerWidth < 480 ? 11 : 13
                        },
                        callback: function(value) {
                            return formatCompactCurrency(value);
                        }
                    }
                }
            }
        }
    });
    // Expose for experience.js scrub HUD
    if (typeof window !== 'undefined') window.savingsChart = savingsChart;
}

function updateSpendingChart(labels, budgetItems, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseEnabled, totalMonths, extras = {}) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    
    if (spendingChart) {
        spendingChart.destroy();
    }

    // Year intervals match the 20-year ledger horizon
    const yearCount = Math.max(1, Math.round((totalMonths || 300) / 12));
    const yearLabels = Array.from({ length: yearCount }, (_, i) => `Year ${i + 1}`);
    const yearMonths = Array.from({ length: yearCount }, (_, i) => (i + 1) * 12);
    
    // Champagne bronze category stack for atelier look
    const categoryColors = [
        'rgba(232, 213, 163, 0.92)',
        'rgba(201, 168, 108, 0.88)',
        'rgba(168, 137, 79, 0.84)',
        'rgba(138, 112, 64, 0.8)',
        'rgba(212, 196, 160, 0.78)',
        'rgba(184, 149, 90, 0.75)',
        'rgba(110, 90, 56, 0.72)',
        'rgba(240, 228, 192, 0.7)',
        'rgba(154, 125, 72, 0.68)',
        'rgba(196, 176, 138, 0.65)',
        'rgba(125, 104, 64, 0.62)',
        'rgba(224, 201, 142, 0.6)',
        'rgba(92, 74, 46, 0.58)',
        'rgba(216, 192, 144, 0.55)'
    ];

    const borderColors = ['#e8d5a3', '#c9a86c', '#a8894f', '#8a7040', '#d4c4a0', '#b8955a', '#6e5a38', '#f0e4c0', '#9a7d48', '#c4b08a', '#7d6840', '#e0c98e', '#5c4a2e', '#d8c090'];

    const datasets = [];

    // Calculate cumulative spending for each category at year intervals
    budgetItems.forEach((item, index) => {
        // Skip disabled budget items
        if (item.enabled === false) return;

        const data = yearMonths.map(month => {
            const val = (parseFloat(item.amount) || 0) * month;
            return val > 0 ? val : null;
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
            return total > 0 ? total : null;
        });
        
        datasets.push({
            label: 'Car Loan Payment',
            data: data,
            backgroundColor: 'rgba(201, 168, 108, 0.95)',
            borderColor: '#e8d5a3',
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
            return total > 0 ? total : null;
        });
        
        datasets.push({
            label: 'House Expenses',
            data: data,
            backgroundColor: 'rgba(138, 112, 64, 0.9)',
            borderColor: '#c9a86c',
            borderWidth: 1.5
        });
    }

    const {
        collegeEnabled = false,
        collegeMonthlyPayment = 0,
        collegeStartMonth = 0,
        collegeLoanMonths = 0,
        medicalEnabled = false,
        medicalMonthlyPayment = 0,
        medicalStartMonth = 0,
        medicalLoanMonths = 0,
        propertyTaxEnabled = false,
        propertyTaxMonthlyPayment = 0,
        propertyTaxStartMonth = 0,
        debtEnabled = false,
        debtMonthlyPayment = 0,
        debtStartMonth = 0,
        debtLoanMonths = 0
    } = extras || {};

    if (collegeEnabled && collegeMonthlyPayment > 0) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (isFiniteLoanActive(m, collegeStartMonth, collegeLoanMonths)) total += collegeMonthlyPayment;
            }
            return total > 0 ? total : null;
        });
        datasets.push({
            label: 'College / Tuition',
            data,
            backgroundColor: 'rgba(168, 137, 79, 0.88)',
            borderColor: '#d4c4a0',
            borderWidth: 1.5
        });
    }

    if (medicalEnabled && medicalMonthlyPayment > 0) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (isFiniteLoanActive(m, medicalStartMonth, medicalLoanMonths)) total += medicalMonthlyPayment;
            }
            return total > 0 ? total : null;
        });
        datasets.push({
            label: 'Hospital / Medical',
            data,
            backgroundColor: 'rgba(224, 122, 106, 0.75)',
            borderColor: '#e07a6a',
            borderWidth: 1.5
        });
    }

    if (propertyTaxEnabled && propertyTaxMonthlyPayment > 0) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (m > propertyTaxStartMonth) total += propertyTaxMonthlyPayment;
            }
            return total > 0 ? total : null;
        });
        datasets.push({
            label: 'Property Tax',
            data,
            backgroundColor: 'rgba(122, 148, 110, 0.78)',
            borderColor: '#9fb890',
            borderWidth: 1.5
        });
    }

    if (debtEnabled && debtMonthlyPayment > 0) {
        const data = yearMonths.map(month => {
            let total = 0;
            for (let m = 1; m <= month; m++) {
                if (isFiniteLoanActive(m, debtStartMonth, debtLoanMonths)) total += debtMonthlyPayment;
            }
            return total > 0 ? total : null;
        });
        datasets.push({
            label: 'Debt Payoff',
            data,
            backgroundColor: 'rgba(180, 120, 150, 0.75)',
            borderColor: '#cf9bb6',
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
                        color: '#e8d5a3',
                        font: { family: "'JetBrains Mono', ui-monospace, monospace", size: window.innerWidth < 480 ? 11 : 13, weight: 500 }, 
                        boxWidth: window.innerWidth < 480 ? 8 : 12,
                        usePointStyle: true,
                        padding: window.innerWidth < 480 ? 8 : 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(12, 10, 8, 0.95)',
                    borderColor: 'rgba(201, 168, 108, 0.35)',
                    borderWidth: 1,
                    padding: 16,
                    titleColor: '#e8d5a3',
                    bodyColor: '#f4efe6',
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
                            
                            return `${label}: ${formatCompactCurrency(value)}`;
                        },
                        footer: function(tooltipItems) {
                            let total = 0;
                            tooltipItems.forEach(item => {
                                total += item.parsed.y;
                            });
                            return `Total Cumulative: ${formatCompactCurrency(total)}`;
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
                            size: 13,
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
                            size: window.innerWidth < 480 ? 11 : 13
                        }
                    }
                },
                y: {
                    type: (typeof spendingChartScale !== 'undefined' ? spendingChartScale : 'linear'),
                    stacked: false,
                    ...(typeof spendingChartScale !== 'undefined' && spendingChartScale === 'logarithmic' ? { min: 10 } : { beginAtZero: true }),
                    title: { 
                        display: window.innerWidth >= 480, 
                        text: `Cumulative Spending ($)${typeof spendingChartScale !== 'undefined' && spendingChartScale === 'logarithmic' ? ' [Log]' : ''}`,
                        color: '#ffffff',
                        font: {
                            family: 'JetBrains Mono',
                            size: 13,
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
                            size: window.innerWidth < 480 ? 11 : 13
                        },
                        callback: function(value) {
                            return formatCompactCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function setSpendingChartScale(scale) {
    if (scale !== 'linear' && scale !== 'logarithmic') return;
    spendingChartScale = scale;

    const btnLinear = document.getElementById('btnScaleLinear');
    const btnLog = document.getElementById('btnScaleLog');
    if (btnLinear && btnLog) {
        btnLinear.classList.toggle('active', scale === 'linear');
        btnLog.classList.toggle('active', scale === 'logarithmic');
    }

    calculate();
}

function updateBentoBox(budgetItems, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseEnabled, months, extras = {}) {
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

    const {
        collegeEnabled = false,
        collegeMonthlyPayment = 0,
        collegeStartMonth = 0,
        collegeLoanMonths = 0,
        medicalEnabled = false,
        medicalMonthlyPayment = 0,
        medicalStartMonth = 0,
        medicalLoanMonths = 0,
        propertyTaxEnabled = false,
        propertyTaxMonthlyPayment = 0,
        propertyTaxStartMonth = 0,
        debtEnabled = false,
        debtMonthlyPayment = 0,
        debtStartMonth = 0,
        debtLoanMonths = 0
    } = extras || {};

    if (collegeEnabled && collegeMonthlyPayment > 0) {
        let collegeTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (isFiniteLoanActive(m, collegeStartMonth, collegeLoanMonths)) collegeTotal += collegeMonthlyPayment;
        }
        if (collegeTotal > 0) categories.push({ name: 'College / Tuition', value: collegeTotal });
    }

    if (medicalEnabled && medicalMonthlyPayment > 0) {
        let medicalTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (isFiniteLoanActive(m, medicalStartMonth, medicalLoanMonths)) medicalTotal += medicalMonthlyPayment;
        }
        if (medicalTotal > 0) categories.push({ name: 'Hospital / Medical', value: medicalTotal });
    }

    if (propertyTaxEnabled && propertyTaxMonthlyPayment > 0) {
        let propertyTaxTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (m > propertyTaxStartMonth) propertyTaxTotal += propertyTaxMonthlyPayment;
        }
        if (propertyTaxTotal > 0) categories.push({ name: 'Property Tax', value: propertyTaxTotal });
    }

    if (debtEnabled && debtMonthlyPayment > 0) {
        let debtTotal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            if (isFiniteLoanActive(m, debtStartMonth, debtLoanMonths)) debtTotal += debtMonthlyPayment;
        }
        if (debtTotal > 0) categories.push({ name: 'Debt Payoff', value: debtTotal });
    }

    if (categories.length === 0) return;

    // Calculate total spending
    const totalSpending = categories.reduce((sum, cat) => sum + cat.value, 0);

    // Deep bronze / champagne treemap tiles for atelier contrast with cream labels
    const colors = [
        '#3a2f1c', '#4a3a22', '#5c4928', '#6e5730', '#806438', '#8a7040',
        '#9a7d48', '#a8894f', '#b8955a', '#c9a86c', '#d4b57a', '#5a4826',
        '#6a542c', '#7a6034', '#8c6c3c', '#9e7844', '#b08850', '#c49a5c',
        '#4a3820', '#543f24', '#624a2a', '#705530', '#7e6038', '#8c6c42'
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
                <div class="treemap-tooltip-amount">${formatCompactCurrency(d.data.value)}</div>
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
                    .text(formatCompactCurrency(d.data.value));
                
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
            .text(`${category.name}: ${formatCompactCurrency(category.value)} (${category.percentage.toFixed(1)}%)`);
    });
}

function updateBudgetPieChart(budgetItems) {
    const ctxEl = document.getElementById('budgetPieChart');
    if (!ctxEl) return;
    const ctx = ctxEl.getContext('2d');
    const legendContainer = document.getElementById('budgetPieLegend');

    if (budgetPieChart) {
        budgetPieChart.destroy();
    }

    // Filter enabled budget items and calculate totals
    const enabledItems = budgetItems.filter(item => item.enabled !== false);
    const totalMonthly = enabledItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    if (enabledItems.length === 0 || totalMonthly === 0) {
        if (legendContainer) {
            legendContainer.innerHTML = '<div class="budget-pie-empty">No budget items enabled — turn categories on in Planning.</div>';
        }
        setText('budgetPieTotal', '—');
        setText('budgetPieCount', '0');
        setText('budgetPieTopShare', '—');
        setText('budgetPieCenterTotal', '—');
        setText('budgetPieCenterMeta', 'no data');
        setText('budgetPieBoardMeta', '0 items');
        setText('budgetPieInsightText', 'Enable categories in Planning to compose this chart.');
        return;
    }

    // Prepare data for pie chart
    const data = enabledItems.map(item => ({
        name: item.name,
        value: parseFloat(item.amount) || 0,
        percentage: ((parseFloat(item.amount) || 0) / totalMonthly) * 100
    }));
    const sorted = data.slice().sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const top2 = sorted[1];
    const topShare = top ? top.percentage : 0;

    setText('budgetPieTotal', formatCompactCurrency(totalMonthly));
    setText('budgetPieCount', String(enabledItems.length));
    setText('budgetPieTopShare', top ? `${top.percentage.toFixed(0)}%` : '—');
    setText('budgetPieCenterTotal', formatCompactCurrency(totalMonthly));
    setText('budgetPieCenterMeta', `${enabledItems.length} categor${enabledItems.length === 1 ? 'y' : 'ies'}`);
    setText('budgetPieBoardMeta', `${enabledItems.length} item${enabledItems.length === 1 ? '' : 's'}`);
    setText(
        'budgetPieInsightText',
        top
            ? `“${top.name}” leads at ${formatCompactCurrency(top.value)}/mo (${topShare.toFixed(0)}% of lifestyle).${
                top2 ? ` Next is “${top2.name}” at ${formatCompactCurrency(top2.value)}.` : ''
              }${topShare >= 30 ? ' Concentration above 30% in one category is worth a second look.' : ''}`
            : 'Adjust categories in Planning to reshape this composition.'
    );

    // Champagne / bronze atelier palette for pie chart
    const grayColors = [
        '#e8d5a3',
        '#c9a86c',
        '#a8894f',
        '#8a7040',
        '#d4c4a0',
        '#b8955a',
        '#6e5a38',
        '#f0e4c0',
        '#9a7d48',
        '#c4b08a',
        '#7d6840',
        '#e0c98e',
        '#5c4a2e',
        '#d8c090',
        '#b0a078'
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
                            return `${formatCompactCurrency(item.value)}/month (${item.percentage.toFixed(1)}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });

    // Dense category board cards: swatch · name · amount · % · share bar
    if (legendContainer) {
        legendContainer.className = 'budget-pie-legend budget-pie-legend--panel budget-pie-key budget-cat-board';
        legendContainer.innerHTML = sorted
            .map((item, rank) => {
                const color = backgroundColors[data.findIndex((d) => d.name === item.name)];
                const pct = Math.max(0, Math.min(100, item.percentage));
                return `
            <div class="budget-pie-key-row budget-cat-card" data-pct="${pct.toFixed(2)}" data-value="${item.value}" style="--cat-color:${color}; --cat-pct:${pct.toFixed(2)}%" title="${item.name}: ${formatCompactCurrency(item.value)} (${item.percentage.toFixed(1)}%)">
                <span class="budget-pie-key-swatch" style="background-color: ${color}" aria-hidden="true"></span>
                <span class="budget-cat-rank" aria-hidden="true">${String(rank + 1).padStart(2, '0')}</span>
                <span class="budget-pie-key-name">${item.name}</span>
                <span class="budget-pie-key-amt">${formatCompactCurrency(item.value)}</span>
                <span class="budget-pie-key-pct">${item.percentage.toFixed(0)}%</span>
                <span class="budget-cat-bar" aria-hidden="true"><i style="width:${pct.toFixed(2)}%; background:${color}"></i></span>
            </div>`;
            })
            .join('');
    }

    requestAnimationFrame(() => {
        layoutBudgetPieLegend(legendContainer);
        if (budgetPieChart) {
            budgetPieChart.resize();
            budgetPieChart.update();
        }
    });
    setTimeout(() => layoutBudgetPieLegend(legendContainer), 80);
    setTimeout(() => layoutBudgetPieLegend(legendContainer), 400);
}

/**
 * Fit pie key rows into the legend box without scrolling.
 * Prefer 1-col then 2-col dense; hide smallest % last into "+N more".
 */
function layoutBudgetPieLegend(legendEl) {
    if (!legendEl) legendEl = document.getElementById('budgetPieLegend');
    if (!legendEl) return;

    legendEl.querySelectorAll('.budget-pie-legend-more, .budget-pie-key-more').forEach((n) => n.remove());

    const items = [...legendEl.querySelectorAll('.budget-pie-key-row, .budget-pie-legend-item')];
    if (!items.length) return;

    items.forEach((el) => {
        el.classList.remove('is-hidden-legend');
        el.style.display = '';
    });
    legendEl.classList.remove('is-dense', 'is-ultra-dense', 'is-two-col');

    const overflows = () =>
        legendEl.scrollHeight > legendEl.clientHeight + 2
        || legendEl.scrollWidth > legendEl.clientWidth + 2;

    if (legendEl.clientHeight < 32) return;

    // Category board prefers 2-col whenever there are enough items
    if (items.length > 4) legendEl.classList.add('is-two-col');
    if (overflows()) legendEl.classList.add('is-dense');
    if (overflows()) legendEl.classList.add('is-ultra-dense');

    if (overflows()) {
        const ranked = items
            .map((el) => ({ el, pct: parseFloat(el.dataset.pct) || 0 }))
            .sort((a, b) => a.pct - b.pct);

        let hidden = 0;
        for (const row of ranked) {
            if (!overflows()) break;
            const visible = items.filter((i) => !i.classList.contains('is-hidden-legend')).length;
            if (visible <= 4) break;
            row.el.classList.add('is-hidden-legend');
            hidden += 1;
        }
        if (hidden > 0) {
            const more = document.createElement('div');
            more.className = 'budget-pie-key-more';
            more.textContent = `+${hidden} more`;
            legendEl.appendChild(more);
            while (overflows()) {
                const still = items.filter((i) => !i.classList.contains('is-hidden-legend'));
                if (still.length <= 3) break;
                const next = still
                    .map((el) => ({ el, pct: parseFloat(el.dataset.pct) || 0 }))
                    .sort((a, b) => a.pct - b.pct)[0];
                if (!next) break;
                next.el.classList.add('is-hidden-legend');
                hidden += 1;
                more.textContent = `+${hidden} more`;
            }
        }
    }
}

// Re-pack pie legend on resize / stage size changes
let __pieLegendResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(__pieLegendResizeTimer);
    __pieLegendResizeTimer = setTimeout(() => layoutBudgetPieLegend(), 120);
});

function updateYearlyTable(income, baseSavings, carPayment, carMonth, carMonths, carEnabled, housePayment, houseMonth, houseBills, houseDownPayment, houseEnabled, years, months, monthlyRate, extras = {}) {
    const tableBody = document.getElementById('yearlyTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    let savingsBalance = 0;
    // Highlight year 5, 10, and 20 on the 20-year ledger
    const milestones = {
        5: { cls: 'year-milestone-5', tag: 'Year 5' },
        10: { cls: 'year-milestone-10', tag: 'Year 10' },
        20: { cls: 'year-milestone-20', tag: 'Year 20' }
    };
    const {
        collegeEnabled = false,
        collegeMonthlyPayment = 0,
        collegeStartMonth = 0,
        collegeLoanMonths = 0,
        medicalEnabled = false,
        medicalMonthlyPayment = 0,
        medicalStartMonth = 0,
        medicalLoanMonths = 0,
        propertyTaxEnabled = false,
        propertyTaxMonthlyPayment = 0,
        propertyTaxStartMonth = 0,
        debtEnabled = false,
        debtMonthlyPayment = 0,
        debtStartMonth = 0,
        debtLoanMonths = 0
    } = extras || {};

    for (let year = 1; year <= years; year++) {
        const startMonth = (year - 1) * 12;
        const endMonth = year * 12;
        let annualSavings = 0;

        for (let month = startMonth + 1; month <= endMonth; month++) {
            let monthlySavingsThisMonth = baseSavings;

            if (carEnabled && isFiniteLoanActive(month, carMonth, carMonths)) {
                monthlySavingsThisMonth -= carPayment;
            }

            if (houseEnabled && month > houseMonth) {
                monthlySavingsThisMonth -= housePayment;
                monthlySavingsThisMonth -= houseBills;
            }

            if (collegeEnabled && isFiniteLoanActive(month, collegeStartMonth, collegeLoanMonths)) {
                monthlySavingsThisMonth -= collegeMonthlyPayment;
            }

            if (medicalEnabled && isFiniteLoanActive(month, medicalStartMonth, medicalLoanMonths)) {
                monthlySavingsThisMonth -= medicalMonthlyPayment;
            }

            if (propertyTaxEnabled && month > propertyTaxStartMonth) {
                monthlySavingsThisMonth -= propertyTaxMonthlyPayment;
            }

            if (debtEnabled && isFiniteLoanActive(month, debtStartMonth, debtLoanMonths)) {
                monthlySavingsThisMonth -= debtMonthlyPayment;
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
        const ms = milestones[year];
        if (ms) {
            row.className = `year-milestone ${ms.cls}`;
            row.setAttribute('data-milestone', ms.tag);
        }
        const yearLabel = ms
            ? `Y${year} <span class="year-milestone-tag">${year === 5 ? '5' : year === 10 ? '10' : '20'}</span>`
            : `Y${year}`;
        const statusShort = savingsBalance >= 0 ? 'OK' : 'Over';
        row.innerHTML = `
            <td><strong>${yearLabel}</strong></td>
            <td>${formatCompactCurrency(annualIncome)}</td>
            <td>${formatCompactCurrency(annualSpending)}</td>
            <td class="${annualSavings >= 0 ? 'positive' : 'negative'}">${formatCompactCurrency(annualSavings)}</td>
            <td><strong class="${savingsBalance >= 0 ? 'positive' : 'negative'}">${formatCompactCurrency(savingsBalance)}</strong></td>
            <td><span class="badge ${savingsBalance >= 0 ? 'badge-success' : 'badge-danger'}" title="${savingsBalance >= 0 ? 'On Track' : 'Over Budget'}">${statusShort}</span></td>
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

// Keep app-stage QR pointed at this origin's waitlist (static SVG is the offline fallback)
function initAppWaitlistQr() {
    const img = document.getElementById('appQrCode');
    if (!img) return;
    try {
        const target = `${window.location.origin}${window.location.pathname || '/'}#stage-app`;
        const data = encodeURIComponent(target);
        // High-contrast gold-on-dark QR; falls back to /assets/app-waitlist-qr.svg if blocked
        const remote = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${data}&bgcolor=0a0908&color=e8d5a3&qzone=2&margin=0&format=svg`;
        const probe = new Image();
        probe.onload = () => {
            img.src = remote;
            img.style.filter = 'none';
            img.style.imageRendering = 'auto';
        };
        probe.onerror = () => { /* keep static asset */ };
        probe.src = remote;
    } catch (_) { /* keep static asset */ }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppWaitlistQr);
} else {
    initAppWaitlistQr();
}

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

/** Session flag: first click is "Run Analysis"; after a finished run → "Rerun". */
let aiAnalysisHasRunThisSession = false;

function updateAIRerunAvailability() {
    const rerunButton = document.getElementById('aiRerunButton');
    if (!rerunButton) return;
    // Always allow runs — key uses Pollinations; no key uses local heuristic
    rerunButton.classList.remove('disabled');
    setAIAnalysisButtonLabel(aiAnalysisHasRunThisSession);
}

function setAIAnalysisButtonLabel(hasRun) {
    const rerunButton = document.getElementById('aiRerunButton');
    const label = document.getElementById('aiRerunButtonLabel')
        || rerunButton?.querySelector('.ai-rerun-text');
    if (!rerunButton || !label) return;
    aiAnalysisHasRunThisSession = !!hasRun;
    rerunButton.dataset.hasRun = hasRun ? '1' : '0';
    label.textContent = hasRun ? 'Rerun' : 'Run Analysis';
}

function setAIGradePending(isCalculating = false) {
    const section = document.getElementById('aiGradeSection');
    const letter = document.getElementById('aiGradeLetter');
    const score = document.getElementById('aiGradeScore');
    const status = document.getElementById('aiGradeStatus');
    const bar = document.getElementById('aiGradeBar') || document.querySelector('.ai-grade-bar');
    if (section) {
        section.classList.add('is-pending');
        section.classList.toggle('is-calculating', !!isCalculating);
    }
    // Letter stays empty while pending — the hollow frame is the visual
    if (letter) letter.textContent = '';
    if (score) score.textContent = '—/100';
    if (status) status.textContent = isCalculating ? 'Running…' : 'Not run yet';
    if (bar) bar.style.width = '0%';
}

/** Terminal init log + progress bar for analysis API runs */
let aiRunConsoleTimer = null;
let aiRunConsolePct = 0;

const AI_RUN_BOOT_LINES = [
    { t: 0,    text: '> session open' },
    { t: 180,  text: '> packing lifestyle context…' },
    { t: 420,  text: '> serialize income · spend · floor blockers' },
    { t: 720,  text: '> POST /analysis  (secure channel)' },
    { t: 1100, text: '> waiting on model response…' },
    { t: 1800, text: '> stream idle — still computing' },
    { t: 2800, text: '> parse grade · score · insights' },
];

function setAIRunProgress(pct, labelText) {
    aiRunConsolePct = Math.max(0, Math.min(100, pct));
    const fill = document.getElementById('aiRunBarFill');
    const label = document.getElementById('aiRunConsolePct');
    if (fill) fill.style.width = `${aiRunConsolePct}%`;
    if (label) {
        label.textContent =
            labelText != null
                ? labelText
                : aiRunConsolePct <= 0
                  ? 'idle'
                  : `${Math.round(aiRunConsolePct)}%`;
    }
}

function appendAIRunLog(text, kind = '') {
    const log = document.getElementById('aiRunConsoleLog');
    if (!log) return;
    const line = document.createElement('div');
    line.className = 'ai-run-console-line' + (kind ? ` is-${kind}` : '');
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
}

function resetAIRunConsoleIdle() {
    const consoleEl = document.getElementById('aiRunConsole');
    const log = document.getElementById('aiRunConsoleLog');
    if (!consoleEl || !log) return;
    consoleEl.classList.remove('is-active');
    consoleEl.classList.add('is-idle');
    consoleEl.hidden = false;
    consoleEl.setAttribute('aria-busy', 'false');
    log.innerHTML = '';
    appendAIRunLog('awaiting run', 'meta');
    appendAIRunLog('$ ready · press Run Analysis');
    setAIRunProgress(0, 'idle');
}

function startAIRunConsole() {
    const consoleEl = document.getElementById('aiRunConsole');
    const log = document.getElementById('aiRunConsoleLog');
    if (!consoleEl || !log) return;
    if (aiRunConsoleTimer) {
        clearInterval(aiRunConsoleTimer);
        aiRunConsoleTimer = null;
    }
    log.innerHTML = '';
    consoleEl.hidden = false;
    consoleEl.setAttribute('aria-busy', 'true');
    consoleEl.classList.add('is-active');
    consoleEl.classList.remove('is-idle');
    setAIRunProgress(4);
    appendAIRunLog('blackbox analysis boot', 'meta');

    const start = performance.now();
    let lineIdx = 0;
    aiRunConsoleTimer = setInterval(() => {
        const elapsed = performance.now() - start;
        while (lineIdx < AI_RUN_BOOT_LINES.length && AI_RUN_BOOT_LINES[lineIdx].t <= elapsed) {
            appendAIRunLog(AI_RUN_BOOT_LINES[lineIdx].text);
            lineIdx += 1;
        }
        // Ease toward ~88% while waiting; finishAIRunConsole completes to 100%
        const target = Math.min(88, 8 + elapsed / 90);
        if (aiRunConsolePct < target) setAIRunProgress(aiRunConsolePct + (target - aiRunConsolePct) * 0.18);
    }, 80);
}

function finishAIRunConsole(ok = true, detail = '') {
    if (aiRunConsoleTimer) {
        clearInterval(aiRunConsoleTimer);
        aiRunConsoleTimer = null;
    }
    const consoleEl = document.getElementById('aiRunConsole');
    if (!consoleEl) return;
    appendAIRunLog(ok ? '> grade ready' : '> fallback path', ok ? 'ok' : 'warn');
    if (detail) appendAIRunLog(`> ${detail}`, 'meta');
    appendAIRunLog(ok ? 'done.' : 'done with warnings.', ok ? 'ok' : 'warn');
    setAIRunProgress(100, '100%');
    consoleEl.setAttribute('aria-busy', 'false');
    consoleEl.classList.remove('is-active');
    consoleEl.classList.add('is-idle');
    // Stay visible — return to idle prompt after a short read pause
    setTimeout(() => {
        if (consoleEl.getAttribute('aria-busy') === 'true') return;
        appendAIRunLog('$ ready · press Rerun', 'meta');
        setAIRunProgress(0, 'idle');
    }, ok ? 1200 : 1600);
}

function stopAIRunConsole() {
    if (aiRunConsoleTimer) {
        clearInterval(aiRunConsoleTimer);
        aiRunConsoleTimer = null;
    }
    const consoleEl = document.getElementById('aiRunConsole');
    if (!consoleEl) return;
    consoleEl.setAttribute('aria-busy', 'false');
    consoleEl.classList.remove('is-active');
    consoleEl.classList.add('is-idle');
    consoleEl.hidden = false;
}

function collectFinancialDataForAI() {
    const income = incomeEnabled === false
        ? 0
        : (parseFloat(document.getElementById('monthlyIncome').value) || 0);
    const carEnabled = document.getElementById('carEnabled')?.checked || false;
    const houseEnabled = document.getElementById('houseEnabled')?.checked || false;
    const collegeEnabled = document.getElementById('collegeEnabled')?.checked || false;
    const medicalEnabled = document.getElementById('medicalEnabled')?.checked || false;
    const propertyTaxEnabled = document.getElementById('propertyTaxEnabled')?.checked || false;
    const debtEnabled = document.getElementById('debtEnabled')?.checked || false;
    const carPayment = carEnabled ? calculateCarPayment() : 0;
    const housePayment = houseEnabled ? calculateHousePayment() : 0;
    const collegePayment = collegeEnabled ? calculateCollegePayment() : 0;
    const medicalPayment = medicalEnabled ? calculateMedicalPayment() : 0;
    const propertyTaxPayment = propertyTaxEnabled ? calculatePropertyTaxPayment() : 0;
    const debtPayment = debtEnabled ? calculateDebtPayment() : 0;
    const carLoanMonths = carEnabled
        ? (parseInt(document.getElementById('carLoanMonths')?.value, 10) || 60)
        : 0;
    const houseBills = houseEnabled
        ? (parseFloat(document.getElementById('houseAdditionalBills')?.value) || 0)
        : 0;
    const collegeLoanMonths = collegeEnabled
        ? (parseInt(document.getElementById('collegeLoanMonths')?.value, 10) || 120)
        : 0;
    const medicalLoanMonths = medicalEnabled
        ? (parseInt(document.getElementById('medicalLoanMonths')?.value, 10) || 48)
        : 0;
    const debtLoanMonths = debtEnabled
        ? (parseInt(document.getElementById('debtLoanMonths')?.value, 10) || 36)
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
    const computedMonthly = income - monthlySpending - carPayment - housePayment - houseBills - collegePayment - medicalPayment - propertyTaxPayment - debtPayment;
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
        collegeEnabled,
        collegePayment,
        collegeLoanMonths,
        medicalEnabled,
        medicalPayment,
        medicalLoanMonths,
        propertyTaxEnabled,
        propertyTaxPayment,
        debtEnabled,
        debtPayment,
        debtLoanMonths,
        monthlySpending,
    };
}

function buildPollinationsAnalysisPrompt(data) {
    const totalOut = (data.monthlySpending || 0)
        + (data.carEnabled ? data.carPayment : 0)
        + (data.houseEnabled ? data.housePayment + data.houseBills : 0)
        + (data.collegeEnabled ? data.collegePayment : 0)
        + (data.medicalEnabled ? data.medicalPayment : 0)
        + (data.propertyTaxEnabled ? data.propertyTaxPayment : 0)
        + (data.debtEnabled ? data.debtPayment : 0);
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
${data.collegeEnabled ? `College/Tuition: $${Number(data.collegePayment || 0).toLocaleString()}/month for ${data.collegeLoanMonths || 0} months` : 'No college/tuition planned'}
${data.medicalEnabled ? `Hospital/Medical: $${Number(data.medicalPayment || 0).toLocaleString()}/month for ${data.medicalLoanMonths || 0} months` : 'No medical/hospital bill planned'}
${data.propertyTaxEnabled ? `Property Tax: $${Number(data.propertyTaxPayment || 0).toLocaleString()}/month (recurring, ongoing)` : 'No property tax planned'}
${data.debtEnabled ? `Debt Payoff (credit card / back taxes): $${Number(data.debtPayment || 0).toLocaleString()}/month for ${data.debtLoanMonths || 0} months` : 'No outstanding debt payoff planned'}

Provide a comprehensive financial viability report in JSON format with this exact structure. The four insights must be, in order: executive diagnosis, primary risk, measurable goal, and immediate next step:
{
  "grade": "A|B+|B|C+|C|D|F",
  "score": 0-100,
  "insights": [
    { "icon": "✓", "title": "Executive diagnosis", "text": "2-3 sentence evidence-based summary" },
    { "icon": "!", "title": "Primary risk", "text": "2-3 sentence explanation with relevant numbers" },
    { "icon": "→", "title": "Measurable goal", "text": "A quantified outcome and timeframe" },
    { "icon": "→", "title": "Immediate next step", "text": "A specific first action and expected impact" }
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
    const timeoutId = setTimeout(() => controller.abort(), 25000);

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
            throw new Error('Pollinations request timed out after 25s');
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

// AI Analysis — first click "Run Analysis", later "Rerun"
function initAIAnalysis() {
    const rerunButton = document.getElementById('aiRerunButton');
    if (!rerunButton) return;

    initPollinationsKeyUI();
    setAIGradePending(false);
    setAIAnalysisButtonLabel(false);
    updateAIRerunAvailability();
    resetAIRunConsoleIdle();

    rerunButton.addEventListener('click', async function() {
        rerunButton.disabled = true;
        rerunButton.classList.add('is-running');
        setAIGradePending(true);
        startAIRunConsole();

        const financialData = collectFinancialDataForAI();
        const apiKey = '';
        let gradeAnalysis = null;
        let runOk = true;
        let runDetail = '';
        beginReportRun();

        try {
            setPollinationsKeyStatus('Analysis running…', '');
            appendAIRunLog('> dispatch model request');
            const analysis = await runPollinationsAnalysis(financialData, apiKey);
            gradeAnalysis = analysis;
            updateAIDisplay(analysis.grade, analysis.score, analysis.insights);
            setPollinationsKeyStatus('Analysis complete.', 'is-ready');
            const badge = document.getElementById('aiProviderBadge');
            if (badge) badge.textContent = 'POLLINATIONS';
            runDetail = `grade ${analysis.grade} · ${analysis.score}/100`;
        } catch (error) {
            console.error('AI Analysis error:', error);
            runOk = false;
            runDetail = (error.message || 'service error').slice(0, 72);
            setPollinationsKeyStatus(
                ('Pollinations error — fell back to local estimate. ' + (error.message || '')).trim(),
                'is-error'
            );
            appendAIRunLog('> remote failed — local heuristic', 'warn');
            runAIAnalysis();
            gradeAnalysis = {
                grade: document.getElementById('aiGradeLetter')?.textContent || '—',
                score: parseInt(String(document.getElementById('aiGradeScore')?.textContent || '0'), 10) || 0
            };
            const badge = document.getElementById('aiProviderBadge');
            if (badge) badge.textContent = 'LOCAL';
        } finally {
            try {
                if (aiReportBundle) {
                    aiReportBundle.grade = gradeAnalysis;
                    const status = document.getElementById('aiBundleStatus');
                    if (status) status.textContent = 'Grade updated · reports generate when opened';
                }
            } catch (bundleError) {
                console.error('Report bundle error', bundleError);
                setPollinationsKeyStatus('Core analysis complete; report bundle used local fallbacks.', 'is-error');
            } finally {
                finishAIRunConsole(runOk, runDetail);
                rerunButton.disabled = false;
                rerunButton.classList.remove('is-running');
                // Only flip to "Rerun" after a completed attempt this session
                setAIAnalysisButtonLabel(true);
            }
        }
    });
}

function updateAIDisplay(grade, score, insights) {
    const section = document.getElementById('aiGradeSection');
    const letter = document.getElementById('aiGradeLetter');
    const scoreEl = document.getElementById('aiGradeScore') || document.querySelector('.ai-grade-score');
    const status = document.getElementById('aiGradeStatus');
    const bar = document.getElementById('aiGradeBar') || document.querySelector('.ai-grade-bar');

    if (section) {
        section.classList.remove('is-pending', 'is-calculating');
    }
    if (letter) letter.textContent = grade;
    if (scoreEl) scoreEl.textContent = `${score}/100`;
    if (status) status.textContent = 'Complete';
    if (bar) bar.style.width = `${score}%`;

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

    // Purchase switches — sync On/Off labels + disabled chrome on boot
    ['carEnabled', 'houseEnabled', 'collegeEnabled', 'medicalEnabled', 'propertyTaxEnabled', 'debtEnabled'].forEach((id) => {
        syncPurchaseSwitchLabel(id);
        const input = document.getElementById(id);
        const panel = document.getElementById(id.replace('Enabled', 'Panel'));
        if (input && panel && !input.checked) panel.classList.add('disabled');
    });

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

    // College / tuition floor-blocker
    const collegeEnabledEl = document.getElementById('collegeEnabled');
    if (collegeEnabledEl) {
        collegeEnabledEl.addEventListener('change', toggleCollege);
    }
    ['collegeCost', 'collegeInterestRate', 'collegeLoanMonths'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', calculate);
    });
    const collegeStartYear = document.getElementById('collegeStartYear');
    if (collegeStartYear) collegeStartYear.addEventListener('change', calculate);

    // Hospital / medical floor-blocker
    const medicalEnabledEl = document.getElementById('medicalEnabled');
    if (medicalEnabledEl) {
        medicalEnabledEl.addEventListener('change', toggleMedical);
    }
    ['medicalCost', 'medicalInterestRate', 'medicalLoanMonths'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', calculate);
    });
    const medicalStartYear = document.getElementById('medicalStartYear');
    if (medicalStartYear) medicalStartYear.addEventListener('change', calculate);

    // Property tax recurring floor
    const propertyTaxEnabledEl = document.getElementById('propertyTaxEnabled');
    if (propertyTaxEnabledEl) {
        propertyTaxEnabledEl.addEventListener('change', togglePropertyTax);
    }
    ['propertyTaxAnnual'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', calculate);
    });
    const propertyTaxStartYear = document.getElementById('propertyTaxStartYear');
    if (propertyTaxStartYear) propertyTaxStartYear.addEventListener('change', calculate);

    // Debt payoff floor-blocker
    const debtEnabledEl = document.getElementById('debtEnabled');
    if (debtEnabledEl) {
        debtEnabledEl.addEventListener('change', toggleDebt);
    }
    ['debtBalance', 'debtInterestRate', 'debtLoanMonths'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', calculate);
    });
    const debtStartYear = document.getElementById('debtStartYear');
    if (debtStartYear) debtStartYear.addEventListener('change', calculate);

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


// ── Canned-prompt advisor chat (Pollinations streaming) ──
const AI_CANNED_PROMPTS = [
    {
        id: 'viability',
        label: 'Viability report',
        userText: 'Give me a viability report for my plan.',
        instruction: 'Write a clear viability report for this plan. Cover cash flow, savings rate, and the 5, 10, and 20-year marks on the full 20-year path. Use short sections with bold headings. No JSON.'
    },
    {
        id: 'cuts',
        label: 'Where to cut spend',
        userText: 'Where should I cut spending?',
        instruction: 'Identify the top 3 lifestyle categories to cut and estimate monthly/yearly impact. Be specific to the budget breakdown. No JSON.'
    },
    {
        id: 'purchases',
        label: 'Car & house stress test',
        userText: 'Stress-test my car and house plan.',
        instruction: 'Assess whether car, house, college/tuition, and medical/hospital timing/payments are sustainable as floor blockers. Suggest one safer alternative timeline if needed. No JSON.'
    },
    {
        id: 'year5',
        label: 'Year 5 checkpoint',
        userText: 'Walk me through year 5.',
        instruction: 'Explain the year-5 checkpoint on the 20-year path: cumulative savings, status, and what must stay true to hit that mark. Mention year 10 and year 20 highlights. No JSON.'
    },
    {
        id: 'year10',
        label: 'Year 10 outlook',
        userText: 'What does year 10 look like?',
        instruction: 'Project the year-10 outcome and risks between year 5 and 10. Actionable bullets only. No JSON.'
    },
    {
        id: 'action',
        label: '30-day action plan',
        userText: 'Give me a 30-day action plan.',
        instruction: 'Produce a 30-day action plan (4 weekly steps) tailored to this budget and purchases to improve viability. No JSON.'
    }
];

let aiReportBundle = null;
let activeReportId = null;

function beginReportRun() {
    const createdAt = new Date();
    aiReportBundle = {
        id: createdAt.getTime(),
        createdAt: createdAt.toISOString(),
        runLabel: `RUN ${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        plan: buildPlanContextForChat(),
        grade: null,
        reports: {}
    };
    activeReportId = null;
    setReportExportAvailability(false);
    document.querySelectorAll('#aiChatPrompts .ai-chat-prompt-btn').forEach((button) => button.classList.remove('is-active'));
    const status = document.getElementById('aiBundleStatus');
    if (status) status.textContent = 'New run · 0 of 6 reports generated';
    return aiReportBundle;
}

function escapeReportHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderInlineMarkdown(value) {
    return escapeReportHtml(value)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
}

/** Small, safe Markdown renderer tailored to generated financial reports. */
function renderReportMarkdown(markdown) {
    const lines = String(markdown || '').replace(/\r/g, '').split('\n');
    const html = [];
    let i = 0;
    let listType = null;
    const closeList = () => {
        if (listType) html.push(`</${listType}>`);
        listType = null;
    };
    const isDivider = (line) => /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
    const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());

    while (i < lines.length) {
        const line = lines[i];
        const next = lines[i + 1] || '';
        if (line.includes('|') && isDivider(next)) {
            closeList();
            const heads = cells(line);
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
                rows.push(cells(lines[i]));
                i += 1;
            }
            html.push('<div class="report-table-wrap"><table class="report-table"><thead><tr>');
            heads.forEach((head) => html.push(`<th>${renderInlineMarkdown(head)}</th>`));
            html.push('</tr></thead><tbody>');
            rows.forEach((row) => {
                html.push('<tr>');
                heads.forEach((_, index) => html.push(`<td>${renderInlineMarkdown(row[index] || '')}</td>`));
                html.push('</tr>');
            });
            html.push('</tbody></table></div>');
            continue;
        }
        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
            closeList();
            const level = Math.min(4, heading[1].length + 1);
            html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
            i += 1;
            continue;
        }
        const bullet = line.match(/^\s*[-*]\s+(.+)$/);
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        if (bullet || ordered) {
            const wanted = ordered ? 'ol' : 'ul';
            if (listType !== wanted) {
                closeList();
                listType = wanted;
                html.push(`<${wanted}>`);
            }
            html.push(`<li>${renderInlineMarkdown((bullet || ordered)[1])}</li>`);
            i += 1;
            continue;
        }
        closeList();
        if (line.trim()) html.push(`<p>${renderInlineMarkdown(line)}</p>`);
        i += 1;
    }
    closeList();
    return html.join('');
}

function setReportExportAvailability(enabled) {
    ['aiCopyReport', 'aiDownloadMarkdown', 'aiPrintReport'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.disabled = !enabled;
    });
}

function showCachedReport(promptId) {
    const prompt = AI_CANNED_PROMPTS.find((item) => item.id === promptId);
    const report = aiReportBundle?.reports?.[promptId];
    if (!prompt || !report) return false;
    activeReportId = promptId;
    document.querySelectorAll('#aiChatPrompts .ai-chat-prompt-btn').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.promptId === promptId);
    });
    const output = document.getElementById('aiChatMessages');
    if (!output) return false;
    output.innerHTML = '';
    const request = document.createElement('div');
    request.className = 'ai-report-query';
    request.innerHTML = `<span>REPORT FILE</span><strong>${escapeReportHtml(prompt.label)}</strong>`;
    const article = document.createElement('article');
    article.className = 'ai-report-document';
    article.innerHTML = `
        <div class="ai-report-doc-head"><span>BLACKBOX / ADVISORY</span><span>${escapeReportHtml(aiReportBundle.runLabel)}</span></div>
        <div class="ai-report-grade-strip"><span>Viability grade</span><strong>${escapeReportHtml(aiReportBundle.grade?.grade || document.getElementById('aiGradeLetter')?.textContent || '—')}</strong><span>${escapeReportHtml(String(aiReportBundle.grade?.score ?? document.getElementById('aiGradeScore')?.textContent ?? ''))}${Number.isFinite(aiReportBundle.grade?.score) ? '/100' : ''}</span></div>
        <div class="ai-report-rendered">${renderReportMarkdown(report.markdown)}</div>`;
    output.append(request, article);
    output.scrollTop = 0;
    setReportExportAvailability(true);
    return true;
}

async function requestBundledReport(prompt, plan) {
    const system = 'You are BLACKBOX Advisor, an expert financial report writer. Use only the supplied plan. Return clean Markdown with section headings, concise explanation, measurable goals, and next steps. When information is naturally tabular, use a valid Markdown table with a header separator row. No conversational preamble.';
    const user = `${formatPlanContextBlock(plan)}\n\nREPORT REQUEST:\n${prompt.instruction}`;
    let markdown = '';
    try {
        markdown = await streamPollinationsChat(
            [{ role: 'system', content: system }, { role: 'user', content: user }],
            '',
            null
        );
    } catch (error) {
        markdown = localCannedReport(prompt.id, plan);
    }
    return { id: prompt.id, label: prompt.label, markdown: markdown || localCannedReport(prompt.id, plan) };
}

async function generateReportBundle() {
    const plan = buildPlanContextForChat();
    const status = document.getElementById('aiBundleStatus');
    if (status) status.textContent = 'Generating 6 report files…';
    setReportExportAvailability(false);
    const generated = await Promise.all(AI_CANNED_PROMPTS.map((prompt) => requestBundledReport(prompt, plan)));
    const createdAt = new Date();
    aiReportBundle = {
        id: createdAt.getTime(),
        createdAt: createdAt.toISOString(),
        runLabel: `RUN ${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        plan,
        reports: Object.fromEntries(generated.map((report) => [report.id, report]))
    };
    if (status) status.textContent = '7 analyses cached · click any report';
    showCachedReport(activeReportId || AI_CANNED_PROMPTS[0].id);
    return aiReportBundle;
}

function buildPlanContextForChat() {
    const data = collectFinancialDataForAI();
    const proj = window.__bbProjection || {};
    const five = proj.fiveYearSavings != null ? proj.fiveYearSavings : data.finalSavings;
    const ten = proj.tenYearSavings != null ? proj.tenYearSavings : null;
    const twenty = proj.twentyYearSavings != null ? proj.twentyYearSavings : null;
    return {
        ...data,
        fiveYearSavings: five,
        tenYearSavings: ten,
        twentyYearSavings: twenty,
        horizonYears: 20
    };
}

function formatPlanContextBlock(data) {
    return `PLAN SNAPSHOT (authoritative numbers):
- Monthly income: ${formatCompactCurrency(data.income || 0)}
- Lifestyle spending: ${formatCompactCurrency(data.monthlySpending || 0)}/mo
- Monthly cash flow (after majors): ${formatCompactCurrency(data.monthlySavings || 0)}
- 5-year cumulative savings: ${formatCompactCurrency(data.fiveYearSavings || 0)}
- 10-year cumulative savings: ${data.tenYearSavings != null ? formatCompactCurrency(data.tenYearSavings) : 'n/a'}
- 20-year cumulative savings: ${data.twentyYearSavings != null ? formatCompactCurrency(data.twentyYearSavings) : 'n/a'}
- Categories: ${(data.budgetItems || []).map(i => `${i.name}=${formatCompactCurrency(i.amount)}`).join('; ') || 'none'}
- Car: ${data.carEnabled ? `${formatCompactCurrency(data.carPayment || 0)}/mo × ${data.carLoanMonths || 0} mo` : 'off'}
- House: ${data.houseEnabled ? `${formatCompactCurrency(data.housePayment || 0)}/mo + ${formatCompactCurrency(data.houseBills || 0)} bills` : 'off'}
- College/Tuition: ${data.collegeEnabled ? `${formatCompactCurrency(data.collegePayment || 0)}/mo × ${data.collegeLoanMonths || 0} mo` : 'off'}
- Hospital/Medical: ${data.medicalEnabled ? `${formatCompactCurrency(data.medicalPayment || 0)}/mo × ${data.medicalLoanMonths || 0} mo` : 'off'}
- Property Tax: ${data.propertyTaxEnabled ? `${formatCompactCurrency(data.propertyTaxPayment || 0)}/mo recurring` : 'off'}
- Debt Payoff: ${data.debtEnabled ? `${formatCompactCurrency(data.debtPayment || 0)}/mo × ${data.debtLoanMonths || 0} mo` : 'off'}
`;
}

function appendChatMessage(role, text, opts = {}) {
    const box = document.getElementById('aiChatMessages');
    if (!box) return null;
    if (role === 'user') {
        box.innerHTML = '';
        const request = document.createElement('div');
        request.className = 'ai-report-query';
        request.innerHTML = '<span>REPORT REQUEST</span><strong></strong>';
        request.querySelector('strong').textContent = text || 'Financial report';
        box.appendChild(request);
        return { row: request, bubble: request, textEl: request.querySelector('strong') };
    }
    const row = document.createElement('div');
    row.className = `ai-chat-msg ai-chat-msg--${role} ai-report-document${opts.streaming ? ' is-streaming' : ''}`;
    const head = document.createElement('div');
    head.className = 'ai-report-doc-head';
    head.innerHTML = '<span>BLACKBOX / ADVISORY</span><span>GENERATED REPORT</span>';
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble';
    const p = document.createElement('p');
    p.className = 'ai-chat-text';
    p.textContent = text || '';
    bubble.appendChild(p);
    row.appendChild(head);
    row.appendChild(bubble);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
    return { row, bubble, textEl: p };
}

function setChatPromptsDisabled(disabled) {
    document.querySelectorAll('#aiChatPrompts .ai-chat-prompt-btn').forEach((btn) => {
        btn.disabled = !!disabled;
    });
}

async function streamPollinationsChat(messages, apiKey, onDelta) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
        response = await fetch('/api/pollinations-text', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: 'openai',
                messages,
                temperature: 0.4,
                max_tokens: 900,
                stream: true,
                apiKey: apiKey || undefined
            }),
            signal: controller.signal
        });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error?.name === 'AbortError') throw new Error('Report request timed out after 30s');
        throw error;
    }

    if (!response.ok) {
        clearTimeout(timeoutId);
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || `HTTP ${response.status}`);
    }

    const ctype = response.headers.get('content-type') || '';
    // Non-stream JSON fallback
    if (ctype.includes('application/json')) {
        const data = await response.json();
        const content = data.content || '';
        if (onDelta) onDelta(content);
        clearTimeout(timeoutId);
        return content;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
                const parsed = JSON.parse(data);
                const delta =
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.choices?.[0]?.message?.content ||
                    parsed.content ||
                    '';
                if (delta) {
                    full += delta;
                    if (onDelta) onDelta(delta);
                }
            } catch {
                // plain text chunk
                if (data) {
                    full += data;
                    if (onDelta) onDelta(data);
                }
            }
        }
    }
    clearTimeout(timeoutId);
    return full;
}

function localCannedReport(promptId, plan) {
    const money = (n) => formatCompactCurrency(n);
    const inc = plan.income || 0;
    const spend = plan.monthlySpending || 0;
    const five = plan.fiveYearSavings || 0;
    const ten = plan.tenYearSavings;
    const twenty = plan.twentyYearSavings;
    const rate = inc > 0 ? ((inc - spend) / inc) * 100 : 0;
    const lines = {
        viability: `**Viability report**\n\nCash flow: ${money(plan.monthlySavings)}/mo after majors.\nLifestyle savings rate (pre-purchase): ${rate.toFixed(1)}%.\n5-year mark: ${money(five)}.\n10-year mark: ${ten != null ? money(ten) : 'n/a'}.\n20-year mark: ${twenty != null ? money(twenty) : 'n/a'}.\n\n${five >= 0 ? 'Plan stays solvent at the 5-year checkpoint.' : 'Plan is underwater by year 5 — cut spend or delay purchases.'}`,
        cuts: `**Where to cut**\n\nTop categories:\n${(plan.budgetItems || []).slice().sort((a,b)=>b.amount-a.amount).slice(0,3).map((i,idx)=>`${idx+1}. ${i.name}: ${money(i.amount)}/mo`).join('\n') || 'No categories'}\n\nTrim the #1 category 10–15% first for the largest cash-flow lift.`,
        purchases: `**Floor-blocker stress test**\n\nCar: ${plan.carEnabled ? money(plan.carPayment) + '/mo' : 'off'}\nHouse: ${plan.houseEnabled ? money(plan.housePayment) + '/mo + ' + money(plan.houseBills) + ' bills' : 'off'}\nCollege: ${plan.collegeEnabled ? money(plan.collegePayment) + '/mo' : 'off'}\nMedical: ${plan.medicalEnabled ? money(plan.medicalPayment) + '/mo' : 'off'}\nProperty tax: ${plan.propertyTaxEnabled ? money(plan.propertyTaxPayment) + '/mo recurring' : 'off'}\nDebt payoff: ${plan.debtEnabled ? money(plan.debtPayment) + '/mo' : 'off'}\n\nCombined major load: ${money((plan.carEnabled?plan.carPayment:0)+(plan.houseEnabled?plan.housePayment+plan.houseBills:0)+(plan.collegeEnabled?plan.collegePayment:0)+(plan.medicalEnabled?plan.medicalPayment:0)+(plan.propertyTaxEnabled?plan.propertyTaxPayment:0)+(plan.debtEnabled?plan.debtPayment:0))}/mo against income ${money(inc)}.`,
        year5: `**Year 5 checkpoint**\n\nProjected cumulative savings: ${money(five)}.\nThis is the first highlight on your 20-year ledger (years 5, 10, and 20 are marked).\nKeep expense ratio and purchase payments stable to protect this number.`,
        year10: `**Year 10 outlook**\n\nProjected cumulative savings: ${ten != null ? money(ten) : 'run calculate to populate'}.\nYears 6–10 compound if cash flow stays positive after loans.\nThe ledger closes at the highlighted year-20 outcome.`,
        action: `**30-day action plan**\n\nWeek 1: Freeze discretionary in top category.\nWeek 2: Re-run viability after a 10% cut test.\nWeek 3: Stress purchase year timing ±1 year.\nWeek 4: Save a scenario and compare 5 / 10 / 20-year marks.`
    };
    const lift = Math.max(250, Math.round((inc * 0.05) / 50) * 50);
    const close = `\n\n**Measurable goal**\nImprove monthly cash flow by ${money(lift)} within 30 days without adding debt.\n\n**Next steps**\n1. Save the current plan as a baseline.\n2. Model one ${money(lift)} spending reduction or equivalent income lift.\n3. Re-run viability and compare the 5-year outcome.\n4. Stress-test the next major purchase one year later.`;
    return (lines[promptId] || lines.viability) + close;
}

async function runCannedChatPrompt(prompt) {
    if (showCachedReport(prompt.id)) return;
    if (!aiReportBundle) beginReportRun();
    const output = document.getElementById('aiChatMessages');
    const status = document.getElementById('aiBundleStatus');
    if (status) status.textContent = `Generating ${prompt.label}…`;
    setChatPromptsDisabled(true);
    if (output) output.innerHTML = `
        <article class="ai-report-document is-streaming">
            <div class="ai-report-doc-head"><span>BLACKBOX / ADVISORY</span><span>${escapeReportHtml(aiReportBundle.runLabel)}</span></div>
            <div class="ai-chat-bubble"><p class="ai-chat-text"></p></div>
        </article>`;
    try {
        const report = await requestBundledReport(prompt, aiReportBundle.plan);
        aiReportBundle.reports[prompt.id] = report;
        activeReportId = prompt.id;
        showCachedReport(prompt.id);
        const count = Object.keys(aiReportBundle.reports).length;
        if (status) status.textContent = `${count} of 6 reports cached · grade + reports share one run`;
    } catch (error) {
        aiReportBundle.reports[prompt.id] = {
            id: prompt.id,
            label: prompt.label,
            markdown: localCannedReport(prompt.id, aiReportBundle.plan)
        };
        showCachedReport(prompt.id);
        if (status) status.textContent = 'Provider unavailable · local report cached';
    } finally {
        setChatPromptsDisabled(false);
    }
    return;
    /* Legacy single-report streaming path retained below for compatibility. */
    const apiKey = '';
    const plan = buildPlanContextForChat();

    appendChatMessage('user', prompt.userText);
    const assistant = appendChatMessage('assistant', '', { streaming: true });
    if (assistant?.textEl) assistant.textEl.dataset.empty = '1';
    setChatPromptsDisabled(true);

    const system = 'You are BLACKBOX Advisor, an expert financial report writer. Use only the provided plan snapshot. Produce a rigorous executive brief with these labeled sections when relevant: Executive Read, Evidence, Primary Risk, Goal, Next Steps. Include plan numbers, explain why they matter, and make actions measurable. Reply in clean markdown. No JSON and no conversational language.';
    const user = `${formatPlanContextBlock(plan)}\n\nREPORT REQUEST:\n${prompt.instruction}`;

    try {
        await streamPollinationsChat(
                [
                    { role: 'system', content: system },
                    { role: 'user', content: user }
                ],
                apiKey,
                (delta) => {
                    if (assistant.textEl.dataset.empty) {
                        assistant.textEl.textContent = '';
                        delete assistant.textEl.dataset.empty;
                    }
                    assistant.textEl.textContent += delta;
                    const box = document.getElementById('aiChatMessages');
                    if (box) box.scrollTop = box.scrollHeight;
                }
            );
        setPollinationsKeyStatus('Report complete.', 'is-ready');
    } catch (err) {
        console.error('Chat prompt error', err);
        const fallback = localCannedReport(prompt.id, plan);
        assistant.textEl.textContent =
            (assistant.textEl.textContent || '') +
            (assistant.textEl.textContent ? '\n\n' : '') +
            `*(Live model unavailable — local report)*\n\n${fallback}`;
        setPollinationsKeyStatus(('Chat error — local report shown. ' + (err.message || '')).trim(), 'is-error');
    } finally {
        assistant.row.classList.remove('is-streaming');
        // light markdown: bold ** **
        const raw = assistant.textEl.textContent || '';
        assistant.textEl.innerHTML = raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n{2,}/g, '<br><br>')
            .replace(/\n/g, '<br>');
        setChatPromptsDisabled(false);
    }
}

function initFinanceChat() {
    const promptsEl = document.getElementById('aiChatPrompts');
    if (!promptsEl || promptsEl.dataset.bound === '1') return;
    promptsEl.dataset.bound = '1';
    promptsEl.innerHTML = AI_CANNED_PROMPTS.map((p) => `
        <button type="button" class="ai-chat-prompt-btn" data-prompt-id="${p.id}">
            ${p.label}
        </button>
    `).join('');
    promptsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.ai-chat-prompt-btn');
        if (!btn || btn.disabled) return;
        const prompt = AI_CANNED_PROMPTS.find((p) => p.id === btn.dataset.promptId);
        if (prompt) runCannedChatPrompt(prompt);
    });

    const copyButton = document.getElementById('aiCopyReport');
    const markdownButton = document.getElementById('aiDownloadMarkdown');
    const printButton = document.getElementById('aiPrintReport');
    const activeReport = () => aiReportBundle?.reports?.[activeReportId] || null;

    copyButton?.addEventListener('click', async () => {
        const report = activeReport();
        if (!report) return;
        await navigator.clipboard.writeText(report.markdown);
        const original = copyButton.textContent;
        copyButton.textContent = 'Copied';
        setTimeout(() => { copyButton.textContent = original; }, 1200);
    });

    markdownButton?.addEventListener('click', () => {
        const report = activeReport();
        if (!report) return;
        const grade = aiReportBundle.grade;
        const blob = new Blob([`# BLACKBOX - ${report.label}\n\n**Viability Grade:** ${grade?.grade || '—'} (${grade?.score ?? '—'}/100)\n\n${report.markdown}\n`], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blackbox-${report.id}-${aiReportBundle.id}.md`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    printButton?.addEventListener('click', () => {
        const report = activeReport();
        if (!report) return;
        const popup = window.open('', '_blank');
        if (!popup) return;
        popup.opener = null;
        const title = `BLACKBOX - ${report.label}`;
        popup.document.write(`<!doctype html><html><head><title>${escapeReportHtml(title)}</title><style>
            @page{size:Letter;margin:0.65in}*{box-sizing:border-box}body{margin:0;color:#17140f;font:11pt/1.5 Arial,sans-serif}
            header{border-bottom:2px solid #9a7841;padding-bottom:14px;margin-bottom:24px}header b{font-size:22pt;letter-spacing:.08em}header p{margin:4px 0 0;color:#6f6658}
            h2{font-size:18pt;margin:24px 0 8px}h3{font-size:13pt;margin:20px 0 7px;color:#725827}p{margin:0 0 10px}strong{color:#725827}
            table{width:100%;border-collapse:collapse;margin:14px 0;font-size:9pt;page-break-inside:avoid}th,td{border:1px solid #cfc7b9;padding:7px;text-align:left;vertical-align:top}th{background:#f1ede5;color:#5e4822}
            li{margin:3px 0}footer{border-top:1px solid #cfc7b9;margin-top:28px;padding-top:10px;color:#777;font-size:8pt}
        </style></head><body><header><b>BLACKBOX</b><p>${escapeReportHtml(report.label)} · ${escapeReportHtml(aiReportBundle.runLabel)} · Grade ${escapeReportHtml(aiReportBundle.grade?.grade || '—')} (${escapeReportHtml(String(aiReportBundle.grade?.score ?? '—'))}/100)</p></header>${renderReportMarkdown(report.markdown)}<footer>Educational planning output · Generated from the active BLACKBOX scenario · Not financial advice.</footer><script>setTimeout(()=>window.print(),250)<\/script></body></html>`);
        popup.document.close();
    });
}

// boot chat after DOM + key UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try { initFinanceChat(); } catch (e) { console.warn(e); }
        try { initViabilityTooltips(); } catch (e) { console.warn(e); }
    });
} else {
    try { initFinanceChat(); } catch (e) { console.warn(e); }
    try { initViabilityTooltips(); } catch (e) { console.warn(e); }
}

/**
 * Fixed-position portal tooltips for viability + major purchases.
 * Escapes overflow:hidden on stage shells so tips stay readable.
 */
function initViabilityTooltips() {
    const tip = document.getElementById('vdTooltip');
    const tipTitle = document.getElementById('vdTooltipTitle');
    const tipBody = document.getElementById('vdTooltipBody');
    if (!tip || !tipTitle || !tipBody) return;
    if (document.documentElement.dataset.vdTipsReady === '1') return;
    document.documentElement.dataset.vdTipsReady = '1';
    // Escape `.app-container` perspective containment. A fixed descendant of
    // a perspective element is positioned against that element, not viewport.
    if (tip.parentElement !== document.body) document.body.appendChild(tip);

    let hideTimer = null;
    let activeEl = null;

    const hide = () => {
        tip.hidden = true;
        tip.classList.remove('is-visible');
        activeEl = null;
    };

    const scheduleHide = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, 120);
    };

    const position = (anchor) => {
        const r = anchor.getBoundingClientRect();
        const pad = 12;
        const tw = tip.offsetWidth || 280;
        const th = tip.offsetHeight || 100;
        // Prefer to the right of the ? control; fall back below / above
        let left = r.right + 10;
        let top = r.top + r.height / 2 - th / 2;
        if (left + tw > window.innerWidth - pad) {
            left = r.left - tw - 10;
        }
        if (left < pad) {
            left = r.left + r.width / 2 - tw / 2;
            top = r.bottom + 10;
            if (top + th > window.innerHeight - pad) top = r.top - th - 10;
        }
        left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
        top = Math.max(pad, Math.min(top, window.innerHeight - th - pad));
        tip.style.left = `${Math.round(left)}px`;
        tip.style.top = `${Math.round(top)}px`;
    };

    const show = (el) => {
        const host = el.closest('[data-vd-tip]') || el;
        const title = host.getAttribute('data-tip-title') || '';
        const body = host.getAttribute('data-tip-body') || '';
        if (!title && !body) return;
        clearTimeout(hideTimer);
        const anchor = el.classList?.contains('vd-tip-btn') ? el : host;
        activeEl = anchor;
        tipTitle.textContent = title;
        tipBody.textContent = body;
        tip.hidden = false;
        tip.classList.add('is-visible');
        // measure then place
        requestAnimationFrame(() => position(anchor));
    };

    // Document-level so purchases + viability both work
    document.addEventListener('pointerenter', (e) => {
        const t = e.target?.closest?.('[data-vd-tip], .vd-tip-btn');
        if (!t) return;
        show(t);
    }, true);

    document.addEventListener('pointerleave', (e) => {
        const t = e.target?.closest?.('[data-vd-tip], .vd-tip-btn');
        if (!t) return;
        // Leaving into the portal tip should not dismiss
        const related = e.relatedTarget;
        if (related && (tip.contains(related) || related.closest?.('[data-vd-tip], .vd-tip-btn'))) return;
        scheduleHide();
    }, true);

    document.addEventListener('focusin', (e) => {
        const t = e.target?.closest?.('[data-vd-tip], .vd-tip-btn');
        if (t) show(t);
    });

    document.addEventListener('focusout', () => scheduleHide());

    document.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('.vd-tip-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            show(btn);
            return;
        }
        if (tip.hidden) return;
        if (tip.contains(e.target) || e.target?.closest?.('[data-vd-tip]')) return;
        hide();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !tip.hidden) hide();
    });

    tip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
    tip.addEventListener('pointerleave', scheduleHide);

    window.addEventListener('scroll', () => {
        if (!tip.hidden && activeEl) position(activeEl);
    }, { passive: true });
    window.addEventListener('resize', () => {
        if (!tip.hidden && activeEl) position(activeEl);
    });
}
