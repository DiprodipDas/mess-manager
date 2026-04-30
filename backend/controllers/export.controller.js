import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs'; // Add this
import path from 'path'; // Add this
import { fileURLToPath } from 'url'; // Add this
import pool from '../config/db.config.js';

// Add these lines to get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const exportToExcel = async (req, res) => {
    try {
        const { year, month, type } = req.query;
        const monthYear = `${year}-${month}`;

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Mess Manager';
        workbook.created = new Date();

        // ============= GET ALL DATA =============

        // Get summary data
        const [summary] = await pool.query(
            `SELECT * FROM monthly_summary WHERE month_year = ?`,
            [monthYear]
        );

        // Get all expenses with details
        const [expenses] = await pool.query(
            `SELECT e.*, u.name as purchased_by_name 
             FROM expenses e
             JOIN users u ON e.purchased_by = u.id
             WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = ?
             ORDER BY e.expense_date DESC, e.id DESC`,
            [monthYear]
        );

        // Get user meal counts INCLUDING guest meals
        const [userSummary] = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.individual_rent,
                COALESCE(rm.meal_count, 0) + COALESCE(gm.guest_count, 0) as meal_count
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
             WHERE u.is_active = true
             ORDER BY u.name`,
            [monthYear, monthYear]
        );

        // Calculate totals
        const totalMeals = userSummary.reduce((sum, u) => sum + u.meal_count, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
        const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

        // Format currency helper
        const formatCurrency = (amount) => {
            return `৳${parseFloat(amount).toFixed(2)}`;
        };

        // ============= MAIN REPORT SHEET =============
        const sheet = workbook.addWorksheet('Monthly Report');

        // Set column widths
        sheet.columns = [
            { width: 15 }, // Date
            { width: 35 }, // Item
            { width: 15 }, // Price
            { width: 20 }  // By
        ];

        let currentRow = 1;

        // ===== HEADER =====
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const titleCell = sheet.getCell(`A${currentRow}`);
        titleCell.value = 'Mess Management Report';
        titleCell.font = { size: 18, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        currentRow++;

        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const monthCell = sheet.getCell(`A${currentRow}`);
        monthCell.value = `Month: ${monthYear}`;
        monthCell.font = { size: 14 };
        monthCell.alignment = { horizontal: 'center' };
        currentRow += 2;

        // ===== SUMMARY SECTION =====
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const summaryHeader = sheet.getCell(`A${currentRow}`);
        summaryHeader.value = 'Summary';
        summaryHeader.font = { size: 14, bold: true, underline: true };
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Total Meals:';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = totalMeals;
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Total Expense:';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = formatCurrency(totalExpense);
        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Meal Rate:';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = formatCurrency(mealRate);
        currentRow += 2;

        // ===== MEMBER SUMMARY =====
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const memberHeader = sheet.getCell(`A${currentRow}`);
        memberHeader.value = 'Member Summary';
        memberHeader.font = { size: 14, bold: true, underline: true };
        currentRow++;

        userSummary.forEach(user => {
            sheet.getCell(`A${currentRow}`).value = `${user.name}:`;
            sheet.getCell(`B${currentRow}`).value = `${user.meal_count} meals`;
            currentRow++;
        });
        currentRow += 2;

        // ===== EXPENSE DETAILS =====
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const expenseHeader = sheet.getCell(`A${currentRow}`);
        expenseHeader.value = 'Expense Details';
        expenseHeader.font = { size: 14, bold: true, underline: true };
        currentRow++;

        // Table headers
        sheet.getCell(`A${currentRow}`).value = 'Date';
        sheet.getCell(`B${currentRow}`).value = 'Item';
        sheet.getCell(`C${currentRow}`).value = 'Price';
        sheet.getCell(`D${currentRow}`).value = 'By';

        // Style headers
        ['A', 'B', 'C', 'D'].forEach(col => {
            const cell = sheet.getCell(`${col}${currentRow}`);
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        currentRow++;

        // Expense rows
        expenses.forEach(expense => {
            const date = new Date(expense.expense_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '/');

            sheet.getCell(`A${currentRow}`).value = date;
            sheet.getCell(`B${currentRow}`).value = expense.item_name;
            sheet.getCell(`C${currentRow}`).value = formatCurrency(expense.price);
            sheet.getCell(`D${currentRow}`).value = expense.purchased_by_name;

            // Add borders to all cells in this row
            ['A', 'B', 'C', 'D'].forEach(col => {
                const cell = sheet.getCell(`${col}${currentRow}`);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            currentRow++;
        });

        // ===== TOTAL ROW =====
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Total:';
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        sheet.getCell(`C${currentRow}`).value = formatCurrency(totalExpense);
        sheet.getCell(`C${currentRow}`).font = { bold: true, size: 12 };

        // Style total row
        ['A', 'B', 'C', 'D'].forEach(col => {
            const cell = sheet.getCell(`${col}${currentRow}`);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' }
            };
        });
        currentRow++;

        // ============= NEW: MEMBER DETAILED BREAKDOWN TABLE =============
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const memberDetailHeader = sheet.getCell(`A${currentRow}`);
        memberDetailHeader.value = 'Member-wise Expense Breakdown';
        memberDetailHeader.font = { size: 14, bold: true, underline: true };
        memberDetailHeader.alignment = { horizontal: 'center' };
        currentRow++;

        // Get member purchase data (what they spent on bazar)
        const [memberPurchases] = await pool.query(
            `SELECT purchased_by as user_id, SUM(price) as total_purchased
             FROM expenses 
             WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?
             GROUP BY purchased_by`,
            [monthYear]
        );
        const purchaseMap = {};
        memberPurchases.forEach(m => {
            purchaseMap[m.user_id] = parseFloat(m.total_purchased);
        });

        // Get total fixed bills for per member share
        const [fixedBills] = await pool.query(
            'SELECT SUM(bill_amount) as total FROM fixed_bills WHERE is_active = true'
        );
        const totalFixedBills = parseFloat(fixedBills[0]?.total || 0);
        const memberCount = userSummary.length;
        const fixedBillsPerMember = memberCount > 0 ? totalFixedBills / memberCount : 0;

        // Table headers
        const headers = ['Member Name', 'Meals', 'Meal Cost', 'Bazar Purchase', 'Food Overpayment', 'Individual Rent', 'Fixed Bills Share', 'Total Expense', 'Final Payable'];

        for (let i = 0; i < headers.length; i++) {
            const colLetter = String.fromCharCode(65 + i);
            const cell = sheet.getCell(`${colLetter}${currentRow}`);
            cell.value = headers[i];
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF7030A0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }
        currentRow++;

        // Add member rows
        let grandTotalExpense = 0;
        let grandFinalPayable = 0;

        for (const user of userSummary) {
            const mealCost = user.meal_count * mealRate;
            const bazarPurchase = purchaseMap[user.id] || 0;
            const overpayment = bazarPurchase - mealCost;
            const individualRent = parseFloat(user.individual_rent || 0);
            const totalExpenseForMember = mealCost + individualRent + fixedBillsPerMember;
            const finalPayable = totalExpenseForMember - overpayment;

            grandTotalExpense += totalExpenseForMember;
            grandFinalPayable += finalPayable;

            sheet.getCell(`A${currentRow}`).value = user.name;
            sheet.getCell(`B${currentRow}`).value = user.meal_count;
            sheet.getCell(`C${currentRow}`).value = formatCurrency(mealCost);
            sheet.getCell(`D${currentRow}`).value = formatCurrency(bazarPurchase);

            if (overpayment > 0) {
                sheet.getCell(`E${currentRow}`).value = `-${formatCurrency(overpayment)}`;
            } else if (overpayment < 0) {
                sheet.getCell(`E${currentRow}`).value = `+${formatCurrency(Math.abs(overpayment))}`;
            } else {
                sheet.getCell(`E${currentRow}`).value = formatCurrency(0);
            }

            sheet.getCell(`F${currentRow}`).value = formatCurrency(individualRent);
            sheet.getCell(`G${currentRow}`).value = formatCurrency(fixedBillsPerMember);
            sheet.getCell(`H${currentRow}`).value = formatCurrency(totalExpenseForMember);
            sheet.getCell(`I${currentRow}`).value = formatCurrency(finalPayable);

            // Style cells
            for (let i = 0; i < headers.length; i++) {
                const colLetter = String.fromCharCode(65 + i);
                const cell = sheet.getCell(`${colLetter}${currentRow}`);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
            currentRow++;
        }

        // Total row
        sheet.getCell(`A${currentRow}`).value = 'TOTAL';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = userSummary.reduce((sum, u) => sum + u.meal_count, 0);
        sheet.getCell(`H${currentRow}`).value = formatCurrency(grandTotalExpense);
        sheet.getCell(`I${currentRow}`).value = formatCurrency(grandFinalPayable);

        for (let i = 0; i < headers.length; i++) {
            const colLetter = String.fromCharCode(65 + i);
            const cell = sheet.getCell(`${colLetter}${currentRow}`);
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }
        currentRow++;

        // Set column widths for the detailed breakdown table
        sheet.getColumn('A').width = 20;
        sheet.getColumn('B').width = 10;
        sheet.getColumn('C').width = 15;
        sheet.getColumn('D').width = 18;
        sheet.getColumn('E').width = 18;
        sheet.getColumn('F').width = 18;
        sheet.getColumn('G').width = 18;
        sheet.getColumn('H').width = 18;
        sheet.getColumn('I').width = 18;

        // ===== FOOTER =====
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const footerCell = sheet.getCell(`A${currentRow}`);
        footerCell.value = `Generated on: ${new Date().toLocaleString()}`;
        footerCell.font = { size: 8, italic: true };
        footerCell.alignment = { horizontal: 'center' };

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=mess-report-${monthYear}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const exportToPDF = async (req, res) => {
    try {
        const { year, month } = req.query;
        const monthYear = `${year}-${month}`;

        // Get data
        const [summary] = await pool.query(
            `SELECT * FROM monthly_summary WHERE month_year = ?`,
            [monthYear]
        );

        const [expenses] = await pool.query(
            `SELECT e.*, u.name as purchased_by_name 
             FROM expenses e
             JOIN users u ON e.purchased_by = u.id
             WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = ?
             ORDER BY e.expense_date DESC`,
            [monthYear]
        );

        const [userSummary] = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.individual_rent,
                COALESCE(rm.meal_count, 0) + COALESCE(gm.guest_count, 0) as meal_count
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
             WHERE u.is_active = true
             ORDER BY u.name`,
            [monthYear, monthYear]
        );

        // Get member purchase data (what they spent on bazar)
        const [memberPurchases] = await pool.query(
            `SELECT purchased_by as user_id, SUM(price) as total_purchased
             FROM expenses 
             WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?
             GROUP BY purchased_by`,
            [monthYear]
        );
        const purchaseMap = {};
        memberPurchases.forEach(m => {
            purchaseMap[m.user_id] = parseFloat(m.total_purchased);
        });

        // Get total fixed bills for per member share
        const [fixedBills] = await pool.query(
            'SELECT SUM(bill_amount) as total FROM fixed_bills WHERE is_active = true'
        );
        const totalFixedBills = parseFloat(fixedBills[0]?.total || 0);
        const memberCount = userSummary.length;
        const fixedBillsPerMember = memberCount > 0 ? totalFixedBills / memberCount : 0;

        // Calculate totals
        const totalMeals = userSummary.reduce((sum, u) => sum + u.meal_count, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
        const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=mess-report-${monthYear}.pdf`);

        doc.pipe(res);

        // Register Bengali font
        const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSansBengali-Regular.ttf');
        if (fs.existsSync(fontPath)) {
            doc.registerFont('Bengali', fontPath);
            doc.font('Bengali');
        } else {
            doc.font('Helvetica');
        }

        const formatCurrency = (amount) => {
            const num = parseFloat(amount);
            if (isNaN(num)) return '0.00';
            // Use simple number format to avoid font issues
            return `${num.toFixed(2)} Tk`;
        };

        // ===== HEADER =====
        doc.fontSize(20).text('Mess Management Report', { align: 'center' });
        doc.fontSize(14).text(`Month: ${monthYear}`, { align: 'center' });
        doc.moveDown();

        // ===== SUMMARY SECTION =====
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);

        if (summary.length > 0) {
            doc.fontSize(12).text(`Total Meals: ${summary[0].total_meals}`);
            doc.text(`Total Expense: ${formatCurrency(summary[0].total_expense)}`);
            doc.text(`Meal Rate: ${formatCurrency(summary[0].meal_rate)}`);
        } else {
            doc.fontSize(12).text(`Total Meals: ${totalMeals}`);
            doc.text(`Total Expense: ${formatCurrency(totalExpense)}`);
            doc.text(`Meal Rate: ${formatCurrency(mealRate)}`);
        }
        doc.moveDown();

        // ===== Meal SUMMARY (Basic) =====
        doc.fontSize(16).text('Meal Summary', { underline: true });
        doc.moveDown(0.5);

        userSummary.forEach(user => {
            doc.fontSize(12).text(`${user.name}: ${user.meal_count} meals`);
        });
        doc.moveDown();

        // ===== EXPENSE DETAILS TABLE =====
        doc.fontSize(16).text('Expense Details', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const startX = 50;
        let currentY = doc.y;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', startX, currentY);
        doc.text('Item', startX + 80, currentY);
        doc.text('Price', startX + 250, currentY);
        doc.text('By', startX + 330, currentY);

        doc.moveDown();
        currentY = doc.y;

        if (fs.existsSync(fontPath)) {
            doc.font('Bengali');
        }
        doc.fontSize(9);

        expenses.forEach((expense) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;

                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Date', startX, currentY);
                doc.text('Item', startX + 80, currentY);
                doc.text('Price', startX + 250, currentY);
                doc.text('By', startX + 330, currentY);
                doc.moveDown();
                currentY = doc.y;

                if (fs.existsSync(fontPath)) {
                    doc.font('Bengali');
                }
                doc.fontSize(9);
            }

            const date = new Date(expense.expense_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            doc.text(date, startX, currentY);
            doc.text(expense.item_name.substring(0, 25), startX + 80, currentY);
            doc.text(formatCurrency(expense.price), startX + 250, currentY);
            doc.text(expense.purchased_by_name, startX + 330, currentY);

            currentY += 20;
            doc.y = currentY;
        });

        // Total for expenses
        const totalExpenseAmount = expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
        doc.moveDown();
        doc.fontSize(11).font('Helvetica-Bold')
            .text(`Total: ${formatCurrency(totalExpenseAmount)}`, { align: 'right' });

        // ===== NEW PAGE: MEMBER DETAILED BREAKDOWN =====
        doc.addPage();
        doc.fontSize(16).text('Member-wise Expense Breakdown', { underline: true });
        doc.moveDown();

        // Table headers with proper spacing - adjusted positions
        const tableStartX = 40;
        let tableY = doc.y;

        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Member', tableStartX, tableY);
        doc.text('Meals', tableStartX + 60, tableY);
        doc.text('Meal Cost', tableStartX + 100, tableY);
        doc.text('Bazar Purchase', tableStartX + 145, tableY);
        doc.text('Overpayment', tableStartX + 205, tableY);
        doc.text('Rent', tableStartX + 265, tableY);
        doc.text('Fixed Bills', tableStartX + 310, tableY);
        doc.text('Total Expense', tableStartX + 370, tableY);
        doc.text('Final Payable', tableStartX + 440, tableY);

        doc.moveDown();
        tableY = doc.y;

        if (fs.existsSync(fontPath)) {
            doc.font('Bengali');
        }
        doc.fontSize(8);

        let grandTotalExpense = 0;
        let grandFinalPayable = 0;

        for (const user of userSummary) {
            if (tableY > 700) {
                doc.addPage();
                tableY = 50;

                // Redraw headers
                doc.fontSize(8).font('Helvetica-Bold');
                doc.text('Member', tableStartX, tableY);
                doc.text('Meals', tableStartX + 60, tableY);
                doc.text('Meal Cost', tableStartX + 100, tableY);
                doc.text('Bazar Purchase', tableStartX + 145, tableY);
                doc.text('Overpayment', tableStartX + 205, tableY);
                doc.text('Rent', tableStartX + 265, tableY);
                doc.text('Fixed Bills', tableStartX + 310, tableY);
                doc.text('Total Expense', tableStartX + 370, tableY);
                doc.text('Final Payable', tableStartX + 440, tableY);
                doc.moveDown();
                tableY = doc.y;

                if (fs.existsSync(fontPath)) {
                    doc.font('Bengali');
                }
                doc.fontSize(8);
            }
            // Inside the for loop where you display each member's data
            const mealCost = user.meal_count * mealRate;
            const bazarPurchase = purchaseMap[user.id] || 0;
            const overpayment = bazarPurchase - mealCost;
            const individualRent = parseFloat(user.individual_rent || 0);
            const totalExpenseForMember = mealCost + individualRent + fixedBillsPerMember;
            const finalPayable = totalExpenseForMember - overpayment;

            grandTotalExpense += totalExpenseForMember;
            grandFinalPayable += finalPayable;

            // Truncate long names
            const memberName = user.name.length > 12 ? user.name.substring(0, 10) + '..' : user.name;

            doc.text(memberName, tableStartX, tableY);
            doc.text(user.meal_count.toString(), tableStartX + 60, tableY);
            doc.text(formatCurrency(mealCost), tableStartX + 100, tableY);
            doc.text(formatCurrency(bazarPurchase), tableStartX + 145, tableY);

            // FIXED: Show correct sign for overpayment
            if (overpayment > 0) {
                // Positive: Member spent more than they ate - Mess owes them
                doc.text(`-${formatCurrency(overpayment)}`, tableStartX + 205, tableY);
            } else if (overpayment < 0) {
                // Negative: Member ate more than they spent - They owe mess
                doc.text(`+${formatCurrency(Math.abs(overpayment))}`, tableStartX + 205, tableY);
            } else {
                doc.text(formatCurrency(0), tableStartX + 205, tableY);
            }

            doc.text(formatCurrency(individualRent), tableStartX + 265, tableY);
            doc.text(formatCurrency(fixedBillsPerMember), tableStartX + 310, tableY);
            doc.text(formatCurrency(totalExpenseForMember), tableStartX + 370, tableY);
            doc.text(formatCurrency(finalPayable), tableStartX + 440, tableY);

            tableY += 18;
            doc.y = tableY;
        }

        // Total row
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold')
            .text(`Total Final Payable: ${formatCurrency(grandFinalPayable)}`, { align: 'right' });

        // Footer
        doc.fontSize(8).font('Helvetica')
            .text(`Generated on: ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: error.message });
    }
};