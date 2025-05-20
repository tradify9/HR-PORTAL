const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = (employee, salary) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 25 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Color Palette
    const primaryColor = '#0A2463';
    const secondaryColor = '#3E7CB1';
    const textColor = '#1A1A1A';
    const bgColor = '#F9FAFB';
    const borderColor = '#D1D5DB';

    // Fonts
    const fontRegular = 'Helvetica';
    const fontBold = 'Helvetica-Bold';
    const fontItalic = 'Helvetica-Oblique';

    // Background
    doc.rect(25, 25, 545, 792 - 50).fill(bgColor).stroke(borderColor);

    // Header
    const logoPath = path.join(__dirname, '../public/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 50 });
    } else {
      doc.font(fontBold).fontSize(12).fillColor(primaryColor)
        .text('LOGO', 40, 45, { align: 'left' });
    }

    doc.font(fontBold)
      .fontSize(20)
      .fillColor(primaryColor)
      .text('Fin Tradify Corporation Limited', 100, 40);
    doc.font(fontRegular)
      .fontSize(8)
      .fillColor(textColor)
      .text('Regd. Office: 789 Corporate Hub, Nariman Point, Mumbai, MH, India', 100, 60)
      .text('TIN: 12345678901 | CIN: U12345MH2020PLC123456', 100, 70)
      .text('Email: payroll@xyzcorp.in | Phone: +91 22 5555 4444', 100, 80);

    // Title
    doc.moveTo(40, 100).lineTo(555, 100).lineWidth(1).strokeColor(secondaryColor).stroke();
    doc.font(fontBold)
      .fontSize(16)
      .fillColor(primaryColor)
      .text(`Payslip for ${salary.month}`, 40, 110);

    // Employee Details
    const empY = 140;
    doc.roundedRect(40, empY, 515, 80, 5).strokeColor(borderColor).stroke();
    doc.font(fontBold)
      .fontSize(11)
      .fillColor(secondaryColor)
      .text('Employee Information', 50, empY + 10);
    doc.font(fontRegular)
      .fontSize(10)
      .fillColor(textColor);
    const empCol1 = 50;
    const empCol2 = 300;
    doc.text(`Emp ID: ${employee.employeeId}`, empCol1, empY + 30)
      .text(`Name: ${employee.name}`, empCol1, empY + 50)
      .text(`Email: ${employee.email}`, empCol2, empY + 30)
      .text(`Designation: ${employee.designation}`, empCol2, empY + 50);

    // Salary Table
    const tableY = 240;
    doc.roundedRect(40, tableY, 515, 200, 5).strokeColor(borderColor).stroke();
    doc.font(fontBold)
      .fontSize(11)
      .fillColor(secondaryColor)
      .text('Salary Details', 50, tableY + 10);

    const col1 = 50;
    const col2 = 350;
    const col3 = 450;

    doc.moveTo(40, tableY + 30).lineTo(555, tableY + 30).strokeColor(borderColor).stroke();
    doc.font(fontBold)
      .fontSize(10)
      .fillColor(primaryColor)
      .text('Description', col1, tableY + 35)
      .text('Earnings (₹)', col2, tableY + 35)
      .text('Deductions (₹)', col3, tableY + 35, { width: 90, align: 'center' });
    doc.moveTo(40, tableY + 50).lineTo(555, tableY + 50).strokeColor(borderColor).stroke();

    let y = tableY + 60;
    const rowHeight = 22;
    doc.font(fontRegular).fontSize(10).fillColor(textColor);

    // Earnings (Only base salary now)
    doc.text('Basic Salary', col1, y)
      .text(salary.baseSalary.toLocaleString('en-IN'), col2, y);
    y += rowHeight;

    // Deductions (None for now, just a placeholder)
    doc.text('No Deductions', col1, y)
      .text('₹ 0.00', col3, y);
    y += rowHeight;

    // Separator
    doc.moveTo(40, y).lineTo(555, y).strokeColor(borderColor).stroke();
    y += 10;

    // Totals
    const totalEarnings = salary.baseSalary;
    const totalDeductions = 0;

    doc.font(fontBold)
      .text('Total Earnings', col1, y)
      .text(totalEarnings.toLocaleString('en-IN'), col2, y);
    doc.text('Total Deductions', col1, y + rowHeight)
      .text(totalDeductions.toLocaleString('en-IN'), col3, y + rowHeight);
    y += rowHeight * 2;

    // Net Salary Payable (right aligned, INR, no minus)
    doc.roundedRect(40, y, 515, 30, 5).fill(secondaryColor).stroke(borderColor);
    const netPay = Math.abs(salary.baseSalary); // Showing only basic salary here
    doc.font(fontBold)
      .fontSize(11)
      .fillColor('#FFFFFF')
      .text('Net Salary Payable:', col1, y + 8)
      .text(`INR ${netPay.toLocaleString('en-IN')}`, 400, y + 8, {
        width: 140,
        align: 'right'
      });

    // Footer
    const footerY = 560;
    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(borderColor).stroke();
    doc.font(fontRegular)
      .fontSize(8)
      .fillColor(textColor)
      .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}`, 40, footerY + 10)
      .text('Fin Tradify Corporation Limited | payroll@xyzcorp.in', 0, footerY + 10, { align: 'center' })
      .text('This is a computer-generated payslip and does not require a signature.', 0, footerY + 22, { align: 'center' });

    // Signature
    doc.font(fontItalic)
      .fontSize(9)
      .fillColor(secondaryColor)
      .text('For Fin Tradify Corporation Limited', 400, footerY + 30)
      .text('_________________________', 400, footerY + 40)
      .text('Authorized Signatory', 400, footerY + 52);

    doc.end();
  });
};

module.exports = { generatePDF };
