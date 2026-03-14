import pool from '../config/db.config.js';

export const getAnalytics = async (req, res) => {
    try {
        const { timeframe } = req.query; // 'week', 'month', 'quarter', 'year'
        
        // Get date range based on timeframe
        const dateRange = getDateRange(timeframe);
        
        // Get expense trend data
        const expenseTrend = await getExpenseTrend(dateRange);
        
        // Get category breakdown
        const categoryBreakdown = await getCategoryBreakdown(dateRange);
        
        // Get meals by member
        const memberMeals = await getMemberMeals(dateRange);
        
        // Get daily average meals
        const dailyAverage = await getDailyAverage(dateRange);
        
        // Get comparison with previous period
        const comparison = await getComparisonData(timeframe);
        
        res.json({
            expenseTrend,
            categoryBreakdown,
            memberMeals,
            dailyAverage,
            comparison
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to get date range
const getDateRange = (timeframe) => {
    const now = new Date();
    let startDate = new Date();
    
    switch(timeframe) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(now.getMonth() - 1);
    }
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
    };
};

// Get expense trend over time
const getExpenseTrend = async (dateRange) => {
    const [rows] = await pool.query(
        `SELECT 
            DATE(expense_date) as date,
            SUM(price) as amount
         FROM expenses
         WHERE expense_date BETWEEN ? AND ?
         GROUP BY DATE(expense_date)
         ORDER BY date ASC`,
        [dateRange.start, dateRange.end]
    );
    
    return rows.map(row => ({
        date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(row.amount)
    }));
};

// Get expense by category (based on item name patterns)
const getCategoryBreakdown = async (dateRange) => {
    const [rows] = await pool.query(
        `SELECT item_name, price FROM expenses
         WHERE expense_date BETWEEN ? AND ?`,
        [dateRange.start, dateRange.end]
    );
    
    // Categorize items based on keywords
    const categories = {
        'Vegetables': ['aloo', 'potato', 'tomato', 'begun', 'fulkopi', 'morich', 'daal', 'sobij', 'ada', 'dhoniya'],
        'Meat & Fish': ['murgi', 'chicken', 'mach', 'fish', 'khasi', 'beef', 'meat'],
        'Grains': ['chal', 'rice', 'ata', 'flour'],
        'Spices & Oil': ['tel', 'oil', 'moshla', 'spice', 'lobon', 'salt'],
        'Other': []
    };
    
    const categoryMap = {};
    
    rows.forEach(row => {
        const itemName = row.item_name.toLowerCase();
        let categorized = false;
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => itemName.includes(keyword))) {
                categoryMap[category] = (categoryMap[category] || 0) + parseFloat(row.price);
                categorized = true;
                break;
            }
        }
        
        if (!categorized) {
            categoryMap['Other'] = (categoryMap['Other'] || 0) + parseFloat(row.price);
        }
    });
    
    return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
    }));
};

// Get meals by member
const getMemberMeals = async (dateRange) => {
    const [rows] = await pool.query(
        `SELECT u.name, COUNT(m.id) as meals
         FROM users u
         LEFT JOIN meals m ON u.id = m.user_id 
            AND m.meal_date BETWEEN ? AND ?
         WHERE u.is_active = true
         GROUP BY u.id, u.name
         ORDER BY meals DESC`,
        [dateRange.start, dateRange.end]
    );
    
    return rows.map(row => ({
        name: row.name,
        meals: row.meals
    }));
};

// Get daily average meals by type
const getDailyAverage = async (dateRange) => {
    const [rows] = await pool.query(
        `SELECT 
            DAYOFWEEK(meal_date) as day_num,
            DATE_FORMAT(meal_date, '%W') as day_name,
            meal_type,
            COUNT(*) as count
         FROM meals
         WHERE meal_date BETWEEN ? AND ?
         GROUP BY day_num, day_name, meal_type
         ORDER BY day_num`,
        [dateRange.start, dateRange.end]
    );
    
    // Transform data for chart
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const result = days.map(day => ({
        day: day.substring(0, 3),
        breakfast: 0,
        lunch: 0,
        dinner: 0
    }));
    
    rows.forEach(row => {
        const dayIndex = row.day_num - 1; // MySQL DAYOFWEEK returns 1=Sunday
        if (dayIndex >= 0 && dayIndex < 7) {
            result[dayIndex][row.meal_type] = row.count;
        }
    });
    
    return result;
};

// Get comparison with previous period
const getComparisonData = async (timeframe) => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    
    // Set date ranges for current and previous periods
    switch(timeframe) {
        case 'week':
            currentStart = new Date(now.setDate(now.getDate() - 7));
            currentEnd = new Date();
            previousStart = new Date(currentStart.setDate(currentStart.getDate() - 7));
            previousEnd = new Date(currentStart);
            break;
        case 'month':
            currentStart = new Date(now.setMonth(now.getMonth() - 1));
            currentEnd = new Date();
            previousStart = new Date(currentStart.setMonth(currentStart.getMonth() - 1));
            previousEnd = new Date(currentStart);
            break;
        case 'quarter':
            currentStart = new Date(now.setMonth(now.getMonth() - 3));
            currentEnd = new Date();
            previousStart = new Date(currentStart.setMonth(currentStart.getMonth() - 3));
            previousEnd = new Date(currentStart);
            break;
        case 'year':
            currentStart = new Date(now.setFullYear(now.getFullYear() - 1));
            currentEnd = new Date();
            previousStart = new Date(currentStart.setFullYear(currentStart.getFullYear() - 1));
            previousEnd = new Date(currentStart);
            break;
        default:
            currentStart = new Date(now.setMonth(now.getMonth() - 1));
            currentEnd = new Date();
            previousStart = new Date(currentStart.setMonth(currentStart.getMonth() - 1));
            previousEnd = new Date(currentStart);
    }
    
    // Get current period data
    const [currentExpenses] = await pool.query(
        `SELECT SUM(price) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`,
        [currentStart, currentEnd]
    );
    
    const [currentMeals] = await pool.query(
        `SELECT COUNT(*) as total FROM meals WHERE meal_date BETWEEN ? AND ?`,
        [currentStart, currentEnd]
    );
    
    // Get previous period data
    const [previousExpenses] = await pool.query(
        `SELECT SUM(price) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`,
        [previousStart, previousEnd]
    );
    
    const [previousMeals] = await pool.query(
        `SELECT COUNT(*) as total FROM meals WHERE meal_date BETWEEN ? AND ?`,
        [previousStart, previousEnd]
    );
    
    // Get active members
    const [activeMembers] = await pool.query(
        `SELECT COUNT(*) as total FROM users WHERE is_active = true`
    );
    
    const currentTotalExpense = parseFloat(currentExpenses[0]?.total || 0);
    const previousTotalExpense = parseFloat(previousExpenses[0]?.total || 0);
    const currentTotalMeals = parseInt(currentMeals[0]?.total || 0);
    const previousTotalMeals = parseInt(previousMeals[0]?.total || 0);
    
    const currentMealRate = currentTotalMeals > 0 ? currentTotalExpense / currentTotalMeals : 0;
    const previousMealRate = previousTotalMeals > 0 ? previousTotalExpense / previousTotalMeals : 0;
    
    return {
        totalExpense: currentTotalExpense.toFixed(2),
        avgMealRate: currentMealRate.toFixed(2),
        totalMeals: currentTotalMeals,
        activeMembers: activeMembers[0]?.total || 0,
        previousPeriod: {
            totalExpense: previousTotalExpense.toFixed(2),
            avgMealRate: previousMealRate.toFixed(2),
            totalMeals: previousTotalMeals
        }
    };
};