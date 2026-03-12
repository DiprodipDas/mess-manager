import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import pool from '../config/db.config.js';

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

        // Header
        doc.fontSize(20).text('Mess Management Report', { align: 'center' });
        doc.fontSize(14).text(`Month: ${monthYear}`, { align: 'center' });
        doc.moveDown();

        // Summary section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);
        
        if (summary.length > 0) {
            doc.fontSize(12).text(`Total Meals: ${summary[0].total_meals}`);
            doc.text(`Total Expense: ৳${summary[0].total_expense}`);
            doc.text(`Meal Rate: ৳${summary[0].meal_rate}`);
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
        const tableTop = doc.y;
        doc.fontSize(10).text('Date', 50, tableTop);
        doc.text('Item', 120, tableTop);
        doc.text('Price', 300, tableTop);
        doc.text('By', 380, tableTop);

        doc.moveDown();
        let y = doc.y;

        expenses.forEach((expense, i) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.fontSize(9).text(new Date(expense.expense_date).toLocaleDateString(), 50, y);
            doc.text(expense.item_name, 120, y);
            doc.text(`৳${expense.price}`, 300, y);
            doc.text(expense.purchased_by_name, 380, y);
            
            y += 20;
            doc.y = y;
        });

        // Total
        doc.moveDown();
        doc.fontSize(11).font('Helvetica-Bold')
           .text(`Total: ৳${expenses.reduce((sum, e) => sum + parseFloat(e.price), 0)}`, { align: 'right' });

        // Footer
        doc.fontSize(8).font('Helvetica')
           .text(`Generated on: ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};