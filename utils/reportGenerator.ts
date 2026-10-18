import { UserProfile, HealthBudget, EatingLog } from '../types';
import { getWeeklyAnalytics } from './logicEngine';

export const exportClinicalReport = (profile: UserProfile, budget: HealthBudget, logs: EatingLog[]) => {
  const analytics = getWeeklyAnalytics(logs);
  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
  const complianceScore = Math.max(0, Math.min(100, 100 - (analytics.avgSodium / 2300 * 50) - (analytics.avgSugar / 25 * 50))).toFixed(0);
  
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return;

  const html = `
    <html>
      <head>
        <title>Clinical Nutrition Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          h1 { color: #0f172a; margin: 0; font-size: 28px; font-weight: 800; }
          h2 { color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 8px; }
          .stat { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 4px; }
          .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; }
          .compliance-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #10b981; color: white; font-weight: 800; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1>Nutri-Guardian Pro</h1>
              <p style="margin: 4px 0 0 0; color: #64748b; font-weight: 600;">Patient Condition: ${profile.chronicDisease}</p>
            </div>
            <div class="compliance-badge">Compliance: ${complianceScore}%</div>
          </div>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>Vital Metrics</h2>
            <div class="stat">${bmi}</div>
            <div class="label">BMI Index</div>
            <p style="margin: 12px 0 0 0; font-size: 13px; font-weight: 600;">Age: ${profile.age} | Weight: ${profile.weight}kg | Height: ${profile.height}cm</p>
          </div>
          <div class="card">
            <h2>Weekly Analysis</h2>
            <div class="stat">${analytics.totalLogs}</div>
            <div class="label">Total Audits</div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">Avg: ${analytics.avgSodium}mg Sodium | ${analytics.avgSugar}g Sugar | ${analytics.avgProtein}g Protein</p>
          </div>
        </div>

        <h2>Audit History (Last 20)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Clinical Subject</th>
              <th>Calories</th>
              <th>Sodium (mg)</th>
              <th>Sugar (g)</th>
              <th>Protein (g)</th>
            </tr>
          </thead>
          <tbody>
            ${logs.slice(0, 20).map(l => `
              <tr>
                <td>${new Date(l.timestamp).toLocaleDateString()}</td>
                <td>${l.name}</td>
                <td>${l.calories || 0}</td>
                <td>${l.sodium}</td>
                <td>${l.sugar}</td>
                <td>${l.protein || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 10px; color: #94a3b8; font-weight: 600; line-height: 1.4;">
            NOTICE: This document is an AI-synthesized clinical audit for metabolic monitoring. It is NOT a substitute for professional medical advice. Always consult a licensed health provider before modifying treatment protocols.
          </p>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  reportWindow.document.write(html);
  reportWindow.document.close();
};