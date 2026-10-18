
import { UserProfile, HealthBudget, EatingLog } from '@/types';
import { getWeeklyAnalytics } from './logicEngine';

export const exportClinicalReport = (profile: UserProfile, budget: HealthBudget, logs: EatingLog[]) => {
  const analytics = getWeeklyAnalytics(logs);
  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
  
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return;

  const html = `
    <html>
      <head>
        <title>Clinical Nutrition Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          h1 { color: #0f172a; margin: 0; }
          h2 { color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
          .stat { font-size: 24px; font-weight: 800; color: #0f172a; }
          .label { font-size: 12px; color: #64748b; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { background: #f1f5f9; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nutri-Guardian Pro</h1>
          <p>Clinical Audit Report | Patient: ${profile.chronicDisease}</p>
        </div>
        
        <div class="grid">
          <div class="card">
            <h2>Patient Snapshot</h2>
            <div class="stat">${bmi}</div>
            <div class="label">Body Mass Index (BMI)</div>
            <p>Weight: ${profile.weight}kg | Height: ${profile.height}cm | Age: ${profile.age}</p>
          </div>
          <div class="card">
            <h2>Weekly Compliance</h2>
            <div class="stat">${analytics.totalLogs}</div>
            <div class="label">Meals Logged (Last 7 Days)</div>
            <p>Avg Sodium: ${analytics.avgSodium}mg | Avg Sugar: ${analytics.avgSugar}g</p>
          </div>
        </div>

        <h2>Consumption Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Calories</th>
              <th>Sodium (mg)</th>
              <th>Sugar (g)</th>
            </tr>
          </thead>
          <tbody>
            ${logs.slice(0, 20).map(l => `
              <tr>
                <td>${new Date(l.timestamp).toLocaleDateString()}</td>
                <td>${l.name}</td>
                <td>${l.calories}</td>
                <td>${l.sodium}</td>
                <td>${l.sugar}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 40px; font-size: 10px; color: #94a3b8;">
          Disclaimer: This is an AI-generated clinical report for personal tracking. Consult a licensed physician for medical diagnosis.
        </p>
        <script>window.print();</script>
      </body>
    </html>
  `;

  reportWindow.document.write(html);
  reportWindow.document.close();
};
