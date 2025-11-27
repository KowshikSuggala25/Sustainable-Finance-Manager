import { Transaction } from '@/hooks/useTransactions';

export const exportToPDF = async (transactions: Transaction[], dashboardData?: any) => {
  // For now, we'll create a simple HTML-based PDF export
  // In a real app, you might use libraries like jsPDF or react-pdf
  
  const formatAmount = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #eee; 
          padding-bottom: 20px; 
        }
        .summary { 
          display: flex; 
          justify-content: space-around; 
          margin: 30px 0; 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
        }
        .summary-item { 
          text-align: center; 
        }
        .summary-item h3 { 
          margin: 0; 
          color: #666; 
          font-size: 14px; 
        }
        .summary-item p { 
          margin: 5px 0 0 0; 
          font-size: 24px; 
          font-weight: bold; 
        }
        .income { color: #10b981; }
        .expense { color: #ef4444; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: left; 
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
        }
        .amount { 
          text-align: right; 
          font-weight: 600; 
        }
        .category { 
          display: inline-block; 
          padding: 4px 8px; 
          border-radius: 4px; 
          background: #e5e7eb; 
          font-size: 12px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      
      ${dashboardData ? `
      <div class="summary">
        <div class="summary-item">
          <h3>Total Income</h3>
          <p class="income">₹${dashboardData.totalIncome?.toLocaleString('en-IN')}</p>
        </div>
        <div class="summary-item">
          <h3>Total Expenses</h3>
          <p class="expense">₹${dashboardData.totalExpenses?.toLocaleString('en-IN')}</p>
        </div>
        <div class="summary-item">
          <h3>Net Savings</h3>
          <p>₹${(dashboardData.totalIncome - dashboardData.totalExpenses)?.toLocaleString('en-IN')}</p>
        </div>
      </div>
      ` : ''}
      
      <h2>Transaction History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(transaction => `
            <tr>
              <td>${formatDate(transaction.date)}</td>
              <td>${transaction.title}</td>
              <td><span class="category">${transaction.category}</span></td>
              <td>${transaction.type === 'income' ? 'Income' : 'Expense'}</td>
              <td class="amount ${transaction.amount >= 0 ? 'income' : 'expense'}">
                ${transaction.amount >= 0 ? '+' : '-'}${formatAmount(transaction.amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a new window to print the PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait a bit for the content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    // Fallback: create a downloadable HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};