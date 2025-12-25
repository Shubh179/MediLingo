import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_URL = process.env.API_URL || 'http://localhost:5001';

async function testSeverityAnalysis() {
  console.log('🧪 Testing Prescription Severity Analysis...\n');

  const testCases = [
    {
      name: 'Mild Case - Common Cold',
      prescriptionText: `Dr. Johnson
Date: Dec 25, 2024

Patient: John Doe
Diagnosis: Common Cold

Prescription:
- Paracetamol 500mg - Take 1 tablet every 6 hours for fever
- Cetirizine 10mg - Take 1 tablet at bedtime for congestion
- Vitamin C 500mg - Take 1 tablet daily

Instructions: Rest, drink plenty of fluids, follow up if symptoms worsen.`,
      userId: undefined
    },
    {
      name: 'Moderate Case - Diabetes & Hypertension',
      prescriptionText: `Dr. Smith
Date: Dec 25, 2024

Patient: Jane Smith
Diagnosis: Type 2 Diabetes, Hypertension

Prescription:
- Metformin 500mg - Take twice daily with meals
- Glipizide 5mg - Take once daily before breakfast
- Lisinopril 10mg - Take once daily for blood pressure
- Aspirin 81mg - Take once daily

Instructions: 
- Monitor blood glucose levels daily
- Check blood pressure weekly
- Follow diabetic diet plan
- Regular exercise recommended
- Follow up in 1 month`,
      userId: undefined
    },
    {
      name: 'High Severity - Multiple Conditions',
      prescriptionText: `Dr. Williams - Cardiology
Date: Dec 25, 2024

Patient: Robert Brown
Diagnosis: Heart Disease, Type 2 Diabetes, Severe Hypertension

Prescription:
- Atorvastatin 40mg - Take at bedtime for cholesterol
- Metoprolol 50mg - Take twice daily for heart
- Insulin Glargine 20 units - Inject once daily at bedtime
- Lisinopril 20mg - Take once daily
- Clopidogrel 75mg - Take once daily (blood thinner)
- Furosemide 40mg - Take once daily (diuretic)

CRITICAL WARNINGS:
- Regular cardiac monitoring required
- Risk of heart attack - seek immediate help if chest pain
- Monitor for bleeding due to blood thinner
- Strict blood sugar control essential
- Follow up weekly for first month`,
      userId: undefined
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Test Case: ${testCase.name}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      const response = await fetch(`${API_URL}/api/prescriptions/analyze-severity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescriptionText: testCase.prescriptionText,
          userId: testCase.userId
        })
      });

      const data = await response.json();

      if (data.success) {
        const { analysis } = data;
        
        console.log(`📊 SEVERITY ANALYSIS RESULTS:`);
        console.log(`   Score: ${analysis.severityScore}/10`);
        console.log(`   Level: ${analysis.severityLevel}`);
        console.log(`\n🏥 Detected Conditions:`);
        analysis.conditions?.forEach((c: string) => console.log(`   - ${c}`));
        
        console.log(`\n💊 Medications:`);
        analysis.medications?.forEach((m: string) => console.log(`   - ${m}`));
        
        console.log(`\n⚠️  Risk Factors:`);
        analysis.riskFactors?.forEach((r: string) => console.log(`   - ${r}`));
        
        console.log(`\n📝 Recommendations:`);
        analysis.recommendations?.forEach((r: string) => console.log(`   - ${r}`));
        
        console.log(`\n📖 Summary:`);
        console.log(`   ${analysis.summary}`);

        if (analysis.databaseMatches && analysis.databaseMatches.length > 0) {
          console.log(`\n🗄️  Database Matches (${analysis.databaseMatches.length}):`);
          analysis.databaseMatches.forEach((match: any) => {
            console.log(`   - ${match.disease} (${match.severity})`);
          });
        }
        
        console.log(`\n✅ Test Passed`);
      } else {
        console.log(`❌ Test Failed: ${data.error}`);
        console.log(`   Details: ${data.details}`);
      }
    } catch (error) {
      console.log(`❌ Test Failed with exception:`);
      console.log(`   ${(error as any).message}`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 All tests completed!');
  console.log(`${'='.repeat(80)}\n`);
}

// Run tests
testSeverityAnalysis().catch(console.error);
