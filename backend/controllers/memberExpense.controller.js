import pool from '../config/db.config.js';

export const calculateMemberExpenses = async (req, res) => {
    try {
        const { year, month } = req.params;
        const monthYear = `${year}-${month}`;

        console.log('Calculating for month:', monthYear);

        // 1. Get all active members with their rent
        const [members] = await pool.query(
            'SELECT id, name, COALESCE(individual_rent, 0) as individual_rent FROM users WHERE is_active = true'
        );

        console.log('Members found:', members.length);

        if (!members || members.length === 0) {
            return res.json({
                month: monthYear,
                total_bazar_expense: '0.00',
                total_meals: 0,
                meal_rate: '0.00',
                total_fixed_bills: '0.00',
                fixed_bills_per_member: '0.00',
                member_summaries: []
            });
        }

        // 2. Get total meals per member (including guests)
        const [memberMeals] = await pool.query(
            `SELECT 
                u.id,
                COALESCE(rm.meal_count, 0) + COALESCE(gm.guest_count, 0) as total_meals
             FROM users u
             LEFT JOIN (
                 SELECT user_id, COUNT(*) as meal_count
                 FROM meals 
                 WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?
                 GROUP BY user_id
             ) rm ON u.id = rm.user_id
             LEFT JOIN (
                 SELECT host_member_id, COUNT(*) as guest_count
                 FROM guest_meals 
                 WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?
                 GROUP BY host_member_id
             ) gm ON u.id = gm.host_member_id
             WHERE u.is_active = true`,
            [monthYear, monthYear]
        );

        // Ensure memberMeals is an array
        const mealsArray = Array.isArray(memberMeals) ? memberMeals : [];
        console.log('Meals data:', mealsArray.length);

        // 3. Get total bazar expenses
        const [bazarExpense] = await pool.query(
            'SELECT COALESCE(SUM(price), 0) as total FROM expenses WHERE DATE_FORMAT(expense_date, "%Y-%m") = ?',
            [monthYear]
        );
        const totalBazarExpense = parseFloat(bazarExpense[0]?.total || 0);
        console.log('Total bazar expense:', totalBazarExpense);

        // 4. Calculate total meals and meal rate
        const totalMeals = mealsArray.reduce((sum, m) => sum + (parseInt(m.total_meals) || 0), 0);
        const mealRate = totalMeals > 0 ? totalBazarExpense / totalMeals : 0;
        console.log('Total meals:', totalMeals, 'Meal rate:', mealRate);

        // 5. Get fixed bills (excluding individual rent)
        const [fixedBills] = await pool.query(
            'SELECT COALESCE(SUM(bill_amount), 0) as total FROM fixed_bills WHERE is_active = true'
        );
        const totalFixedBills = parseFloat(fixedBills[0]?.total || 0);
        const fixedBillsPerMember = members.length > 0 ? totalFixedBills / members.length : 0;
        console.log('Total fixed bills:', totalFixedBills, 'Per member:', fixedBillsPerMember);

        // 6. Build member summaries
        const memberSummaries = members.map(member => {
            const memberData = mealsArray.find(m => m.id === member.id);
            const memberMealCount = memberData ? parseInt(memberData.total_meals) || 0 : 0;
            const mealCost = memberMealCount * mealRate;
            const individualRent = parseFloat(member.individual_rent) || 0;
            const totalExpense = mealCost + individualRent + fixedBillsPerMember;

            return {
                user_id: member.id,
                name: member.name,
                total_meals: memberMealCount,
                meal_cost: mealCost.toFixed(2),
                individual_rent: individualRent.toFixed(2),
                fixed_bills_share: fixedBillsPerMember.toFixed(2),
                total_expense: totalExpense.toFixed(2)
            };
        });

        // 7. Save to database (optional, for caching)
        for (const summary of memberSummaries) {
            await pool.query(
                `INSERT INTO monthly_member_summary 
                 (month_year, user_id, total_meals, meal_cost, individual_rent, 
                  fixed_bills_share, total_expense, due_amount) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 total_meals = VALUES(total_meals),
                 meal_cost = VALUES(meal_cost),
                 individual_rent = VALUES(individual_rent),
                 fixed_bills_share = VALUES(fixed_bills_share),
                 total_expense = VALUES(total_expense),
                 due_amount = VALUES(due_amount)`,
                [monthYear, summary.user_id, summary.total_meals, summary.meal_cost, 
                 summary.individual_rent, summary.fixed_bills_share, summary.total_expense, summary.total_expense]
            );
        }

        res.json({
            month: monthYear,
            total_bazar_expense: totalBazarExpense.toFixed(2),
            total_meals: totalMeals,
            meal_rate: mealRate.toFixed(2),
            total_fixed_bills: totalFixedBills.toFixed(2),
            fixed_bills_per_member: fixedBillsPerMember.toFixed(2),
            member_summaries: memberSummaries
        });

    } catch (error) {
        console.error('🔥 Error in calculateMemberExpenses:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: error.message,
            details: error.sqlMessage || 'Database error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getMemberExpenses = async (req, res) => {
    try {
        const { year, month } = req.params;
        const monthYear = `${year}-${month}`;
        
        const [rows] = await pool.query(
            `SELECT mms.*, u.name 
             FROM monthly_member_summary mms
             JOIN users u ON mms.user_id = u.id
             WHERE mms.month_year = ?
             ORDER BY u.name`,
            [monthYear]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error in getMemberExpenses:', error);
        res.status(500).json({ error: error.message });
    }
};