# BLACKBOX — Lifestyle Affordability Calculator

A sophisticated financial planning tool that helps you visualize and understand how your lifestyle choices impact your savings over a 5-year period.

![BLACKBOX](blackbox.png)

## Overview

**BLACKBOX** is an interactive financial calculator that provides comprehensive analysis of your income, spending, and savings projections. With a modern, monochromatic design and real-time visualizations, it helps you make informed decisions about major purchases like cars and houses, and understand their long-term financial impact.

## Features

### 📊 **Interactive Budget Management**
- Adjust monthly income with a vertical fader control
- Manage multiple spending categories with individual sliders
- Add custom budget items as needed
- Real-time calculation updates

### 💰 **Major Purchase Planning**
- **Dream Car Calculator**: Plan car purchases with loan details, purchase timing, and monthly payments
- **Dream House Calculator**: Analyze home purchases with mortgage calculations, down payments, and additional costs
- Visualize how major purchases affect your savings trajectory

### 📈 **Visual Analytics**
- **Savings Projection Chart**: Line graph showing cumulative savings over 5 years
- **Cumulative Spending by Category**: Bar chart displaying yearly spending totals
- **Treemap Visualization**: Interactive view of total spending by category
- **Yearly Financial Summary Table**: Comprehensive year-by-year breakdown

### 🤖 **AI Analysis** (Pollinations / Pollen)
- Live analysis via [Pollinations.ai](https://pollinations.ai) using **your** API key (BYOP)
- Paste a `pk_…` or `sk_…` key from [enter.pollinations.ai](https://enter.pollinations.ai)
- Personalized grade, score, and actionable insights
- Falls back to a local heuristic if no key is set

### 🎨 **Design**
- Monochromatic, grid-based aesthetic
- Futuristic typography with Exo 2 and JetBrains Mono fonts
- Responsive design for all devices
- Smooth animations and transitions

## Getting Started

### Live Demo

Visit the live application: [Deployed on Vercel](https://test-15m8lw1yp-murderszns-projects.vercel.app)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/murderszn/blackbox.git
cd blackbox
```

2. Start the local server (serves the app + API routes):
```bash
npm start
```

3. Open [http://localhost:8080](http://localhost:8080)

Requires Node.js 18+. Static files work without a server, but email signup and **Pollinations AI** need `npm start` (or `vercel dev`) so `/api/*` proxies respond.

### Pollinations API key (Pollen)

1. Create a key at [enter.pollinations.ai](https://enter.pollinations.ai)
2. Open BLACKBOX → **AI Financial Viability Analysis**
3. Paste the key → **Save Key** (stored only in your browser’s `localStorage`)
4. Click **Rerun Analysis** — requests go through `/api/pollinations-text` with your Bearer token so usage spends **your** Pollen, same idea as `/motion`

## How to Use

### Setting Your Income
1. Find the **Income** slider in the Income & Monthly Spending panel
2. Drag the vertical fader or click the amount to edit directly
3. Maximum income is $50,000/month

### Managing Budget Items
1. Adjust spending categories using the vertical faders
2. Maximum per category is $5,000/month
3. Click the amount display to edit values directly
4. Click "Add Budget Item" to create custom categories
5. Click the × button to remove unwanted items

### Planning Major Purchases

#### Dream Car
1. Toggle "Include" checkbox to enable car purchase
2. Set purchase price, interest rate, loan term, and purchase month
3. Adjust down payment and additional monthly payments
4. See real-time impact on your savings

#### Dream House
1. Toggle "Include" checkbox to enable house purchase
2. Set house price, interest rate, and loan term
3. Configure down payment and monthly bills (taxes, insurance)
4. Choose purchase month to see timing impact

### Understanding the Results

- **Affordability Banner**: Shows if you can afford your lifestyle over 5 years
- **Summary Cards**: Quick overview of monthly savings, total savings, and major payments
- **Charts**: Visual representations help identify spending patterns and trends
- **Yearly Table**: Detailed breakdown of income, spending, and savings by year

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom styling with CSS Grid and Flexbox
- **JavaScript**: Vanilla JS for interactivity
- **Chart.js**: Data visualization for savings and spending charts
- **D3.js**: Treemap visualization
- **Vercel**: Hosting and deployment

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Project Structure

```
blackbox/
├── index.html          # Main application file
├── blackbox.png        # Hero banner image
├── README.md           # This file
└── .vercel/            # Vercel deployment configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Designed and developed by [aurawlbx](https://github.com/murderszn)
- Built with modern web technologies for optimal performance
- Inspired by minimalist, grid-based design principles

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with <3 by aurablox**

Est. 2025

