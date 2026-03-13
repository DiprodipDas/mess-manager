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

        // Add summary sheet
        const summarySheet = workbook.addWorksheet('Summary');

        // Get summary data
        const [summary] = await pool.query(
            `SELECT * FROM monthly_summary WHERE month_year = ?`,
            [monthYear]
        );

        // Add title
        summarySheet.mergeCells('A1:E1');
        const titleRow = summarySheet.getRow(1);
        titleRow.getCell(1).value = `Mess Report - ${monthYear}`;
        titleRow.getCell(1).font = { size: 16, bold: true };
        titleRow.getCell(1).alignment = { horizontal: 'center' };

        // Add headers
        summarySheet.addRow([]);
        summarySheet.addRow(['Metric', 'Value']);
        summarySheet.getRow(3).font = { bold: true };

        if (summary.length > 0) {
            summarySheet.addRow(['Total Meals', summary[0].total_meals]);
            summarySheet.addRow(['Total Expense', summary[0].total_expense]);
            summarySheet.addRow(['Meal Rate', summary[0].meal_rate]);
        }

        // Style the sheet
        summarySheet.columns.forEach(column => {
            column.width = 20;
        });

        // Add expenses sheet
        if (type === 'expenses' || !type) {
            const expenseSheet = workbook.addWorksheet('Expenses');

            const [expenses] = await pool.query(
                `SELECT e.*, u.name as purchased_by_name 
                 FROM expenses e
                 JOIN users u ON e.purchased_by = u.id
                 WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = ?
                 ORDER BY e.expense_date DESC`,
                [monthYear]
            );

            expenseSheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Item', key: 'item', width: 25 },
                { header: 'Quantity', key: 'quantity', width: 15 },
                { header: 'Price', key: 'price', width: 15 },
                { header: 'Purchased By', key: 'purchased_by', width: 20 },
                { header: 'Notes', key: 'notes', width: 30 }
            ];

            expenseSheet.getRow(1).font = { bold: true };

            expenses.forEach(expense => {
                expenseSheet.addRow({
                    date: new Date(expense.expense_date).toLocaleDateString(),
                    item: expense.item_name,
                    quantity: expense.quantity || '-',
                    price: expense.price,
                    purchased_by: expense.purchased_by_name,
                    notes: expense.notes || '-'
                });
            });

            // Add total row
            const totalRow = expenseSheet.addRow({
                item: 'TOTAL',
                price: expenses.reduce((sum, e) => sum + parseFloat(e.price), 0)
            });
            totalRow.font = { bold: true };
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=mess-report-${monthYear}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
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
            `SELECT u.name, COUNT(m.id) as meal_count
             FROM users u
             LEFT JOIN meals m ON u.id = m.user_id AND DATE_FORMAT(m.meal_date, '%Y-%m') = ?
             WHERE u.is_active = true
             GROUP BY u.id, u.name`,
            [monthYear]
        );

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=mess-report-${monthYear}.pdf`);

        doc.pipe(res);

        // 🔴 IMPORTANT: Register and use the Bengali font
         const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSansBengali-Regular.ttf');

        // Check if font exists
        if (fs.existsSync(fontPath)) {
            console.log('✅ Bengali font found, registering...');
            doc.registerFont('Bengali', fontPath);
            doc.font('Bengali');
        } else {
            console.log('⚠️ Bengali font not found, using Helvetica');
            doc.font('Helvetica');
        }

        // Helper function to format currency properly
        const formatCurrency = (amount) => {
            const num = parseFloat(amount);
            if (isNaN(num)) return '৳0.00';
            // Use 'Tk' as fallback if Bengali font fails
            return `৳${num.toFixed(2)}`; // or use 'Tk' if you prefer: return `Tk ${num.toFixed(2)}`;
        };

        // Header
        doc.fontSize(20).text('Mess Management Report', { align: 'center' });
        doc.fontSize(14).text(`Month: ${monthYear}`, { align: 'center' });
        doc.moveDown();

        // Summary section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);

        if (summary.length > 0) {
            doc.fontSize(12).text(`Total Meals: ${summary[0].total_meals}`);
            doc.text(`Total Expense: ${formatCurrency(summary[0].total_expense)}`);
            doc.text(`Meal Rate: ${formatCurrency(summary[0].meal_rate)}`);
        } else {
            // If no summary, calculate from raw data
            const totalMeals = userSummary.reduce((sum, u) => sum + u.meal_count, 0);
            const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
            const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

            doc.fontSize(12).text(`Total Meals: ${totalMeals}`);
            doc.text(`Total Expense: ${formatCurrency(totalExpense)}`);
            doc.text(`Meal Rate: ${formatCurrency(mealRate)}`);
        }
        doc.moveDown();

        // Member summary
        doc.fontSize(16).text('Member Summary', { underline: true });
        doc.moveDown(0.5);

        userSummary.forEach(user => {
            doc.fontSize(12).text(`${user.name}: ${user.meal_count} meals`);
        });
        doc.moveDown();

        // Expenses table
        doc.fontSize(16).text('Expense Details', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const startX = 50;
        let currentY = doc.y;

        doc.fontSize(10).font('Helvetica-Bold'); // Use Helvetica for headers
        doc.text('Date', startX, currentY);
        doc.text('Item', startX + 80, currentY);
        doc.text('Price', startX + 250, currentY);
        doc.text('By', startX + 330, currentY);

        doc.moveDown();
        currentY = doc.y;

        // Table rows - switch back to Bengali font if available
        if (fs.existsSync(fontPath)) {
            doc.font('Bengali');
        } else {
            doc.font('Helvetica');
        }
        doc.fontSize(9);

        expenses.forEach((expense, i) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;

                // Redraw headers on new page
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Date', startX, currentY);
                doc.text('Item', startX + 80, currentY);
                doc.text('Price', startX + 250, currentY);
                doc.text('By', startX + 330, currentY);
                doc.moveDown();
                currentY = doc.y;

                if (fs.existsSync(fontPath)) {
                    doc.font('Bengali');
                } else {
                    doc.font('Helvetica');
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

        // Total
        const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
        doc.moveDown();
        doc.fontSize(11).font('Bengali')
            .text(`Total: ${formatCurrency(totalExpense)}`, { align: 'right' });

        // Footer
        doc.fontSize(8).font('Helvetica')
            .text(`Generated on: ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: error.message });
    }
};