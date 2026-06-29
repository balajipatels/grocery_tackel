import { Resend } from "resend"

type DailyReportData = {
  date: string
  totalSales: number
  billCount: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  totalExpenses: number
  netProfit: number
  lowStock: Array<{ name: string; stock: number; reorderLevel: number }>
}

export async function sendDailyReport(to: string[], data: DailyReportData) {
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured. Report HTML:")
    console.log(generateReportHTML(data))
    return { success: false, message: "Email service not configured" }
  }

  const resend = new Resend(apiKey)

  try {
    await resend.emails.send({
      from: "GroceryOS <noreply@resend.dev>",
      to,
      subject: `Daily Report - ${data.date}`,
      html: generateReportHTML(data),
    })
    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    return { success: false, error }
  }
}

function generateReportHTML(data: DailyReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #1B4332; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .metric { margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 6px; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1B4332; margin-top: 5px; }
    .section { margin: 20px 0; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0">📊 Daily Sales Report</h1>
      <p style="margin:5px 0 0">${data.date}</p>
    </div>
    <div class="content">
      <div class="metric">
        <div class="metric-label">Total Sales</div>
        <div class="metric-value">₹${data.totalSales.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Bills Generated</div>
        <div class="metric-value">${data.billCount}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Net Profit</div>
        <div class="metric-value" style="color: ${data.netProfit >= 0 ? '#16A34A' : '#DC2626'}">₹${data.netProfit.toFixed(2)}</div>
      </div>
      
      ${data.topProducts.length > 0 ? `
      <div class="section">
        <div class="section-title">🔥 Top Products</div>
        <table>
          ${data.topProducts.map(p => `
            <tr>
              <td><strong>${p.name}</strong></td>
              <td align="right">${p.quantity} units</td>
              <td align="right">₹${p.revenue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
      
      ${data.lowStock.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ Low Stock Alerts</div>
        <table>
          ${data.lowStock.map(p => `
            <tr>
              <td>${p.name}</td>
              <td align="right" style="color:#DC2626">${p.stock} / ${p.reorderLevel}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      Sent by GroceryOS | ${new Date().toLocaleString('en-IN')}
    </div>
  </div>
</body>
</html>
  `.trim()
}
