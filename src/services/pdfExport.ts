import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportData {
  users: any[];
  transactions: any[];
  stats: {
    totalUsers: number;
    totalDesigners: number;
    totalAllUsers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingKyc: number;
    activeDisputes: number;
    escrowBalance: number;
  };
}

export const exportToPDF = async (data: ExportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * 7);
    } else {
      pdf.text(text, x, y);
      return y + 7;
    }
  };

  // Helper function to add a line
  const addLine = (y: number) => {
    pdf.line(20, y, pageWidth - 20, y);
    return y + 5;
  };

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  yPosition = addText('Phasionista Admin Report', pageWidth / 2, yPosition);
  yPosition += 10;

  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Stats Overview
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  yPosition = addText('Platform Statistics', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  yPosition = addText(`Total Users: ${data.stats.totalAllUsers}`, 20, yPosition);
  yPosition = addText(`Customers: ${data.stats.totalUsers}`, 20, yPosition);
  yPosition = addText(`Designers: ${data.stats.totalDesigners}`, 20, yPosition);
  yPosition = addText(`Total Orders: ${data.stats.totalOrders}`, 20, yPosition);
  yPosition = addText(`Total Revenue: $${data.stats.totalRevenue.toFixed(2)}`, 20, yPosition);
  yPosition = addText(`Escrow Balance: $${data.stats.escrowBalance.toFixed(2)}`, 20, yPosition);
  yPosition = addText(`Pending KYC: ${data.stats.pendingKyc}`, 20, yPosition);
  yPosition = addText(`Active Disputes: ${data.stats.activeDisputes}`, 20, yPosition);
  yPosition += 15;

  // Users Section
  if (data.users.length > 0) {
    yPosition = addLine(yPosition);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    yPosition = addText('User Details', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Table headers
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined', 'Orders', 'Revenue'];
    const colWidths = [30, 50, 20, 20, 25, 15, 20];
    let xPosition = 20;
    
    // Draw headers
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;

    // Draw user data
    pdf.setFont('helvetica', 'normal');
    data.users.slice(0, 20).forEach((user) => { // Limit to 20 users per page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      xPosition = 20;
      const userData = [
        user.phasion_name || 'N/A',
        user.email || 'N/A',
        user.role || 'N/A',
        user.is_verified ? 'Verified' : 'Unverified',
        new Date(user.created_at).toLocaleDateString(),
        (user.orders_count || 0).toString(),
        `$${(user.revenue || 0).toFixed(2)}`
      ];
      
      userData.forEach((value, index) => {
        pdf.text(value.substring(0, colWidths[index] / 2), xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;
    });
    yPosition += 15;
  }

  // Transactions Section
  if (data.transactions.length > 0) {
    yPosition = addLine(yPosition);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    yPosition = addText('Recent Transactions', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Table headers
    const headers = ['ID', 'Type', 'Amount', 'Status', 'Customer', 'Date'];
    const colWidths = [25, 20, 20, 20, 40, 25];
    let xPosition = 20;
    
    // Draw headers
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;

    // Draw transaction data
    pdf.setFont('helvetica', 'normal');
    data.transactions.slice(0, 15).forEach((transaction) => { // Limit to 15 transactions per page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      xPosition = 20;
      const transactionData = [
        transaction.id.substring(0, 8) + '...',
        transaction.type || 'N/A',
        `$${transaction.amount.toFixed(2)}`,
        transaction.status || 'N/A',
        transaction.customer?.phasion_name || 'N/A',
        new Date(transaction.date).toLocaleDateString()
      ];
      
      transactionData.forEach((value, index) => {
        pdf.text(value.substring(0, colWidths[index] / 2), xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;
    });
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Generated by Phasionista Admin Dashboard', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `phasionista-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};

export const exportAnalyticsToPDF = async (analyticsData: any) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize = 12, isBold = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.text(text, x, y);
    return y + (fontSize + 2);
  };

  // Title
  yPosition = addText('Phasionista Analytics Report', pageWidth / 2, yPosition, 20, true);
  yPosition += 10;

  // Date
  yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Analytics data
  yPosition = addText('Platform Analytics', 20, yPosition, 16, true);
  yPosition += 10;

  // Add analytics data here
  Object.entries(analyticsData).forEach(([key, value]) => {
    yPosition = addText(`${key}: ${value}`, 20, yPosition);
  });

  // Save the PDF
  const fileName = `phasionista-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};
