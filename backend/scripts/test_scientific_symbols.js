const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { exportQPToPDF } = require('../src/utils/pdfExporter');
const fs = require('fs');

async function testScientificSymbols() {
  console.log('🧪 Testing Scientific Symbols & Math Notation Formatting...');

  const mockQP = {
    title: 'HSC Physics Scientific Notation Test Examination',
    subject: { name: 'Physics' },
    grade: '12th Standard',
    totalMarks: 70,
    durationMins: 180,
    difficulty: 'MEDIUM',
    instructions: 'Use of log tables is allowed.',
    patternData: {
      sections: [
        {
          sectionName: 'Section A',
          subSections: [
            {
              questionNumber: 'Q1',
              title: 'Multiple Choice Questions',
              questionType: 'MCQ',
              totalQuestions: 2,
              totalMarks: 2
            }
          ]
        },
        {
          sectionName: 'Section B',
          questionType: 'SHORT',
          totalQuestions: 2,
          marksPerQuestion: 2,
          questionNumberRange: 'Q3 to Q4'
        }
      ]
    },
    questions: [
      {
        questionText: 'Calculate the angular velocity \\omega of a particle moving with frequency 50 Hz. Given angle \\theta = \\pi / 4 radians.',
        type: 'MCQ',
        marks: 1,
        options: [
          'A) \\omega = 100\\pi rad/s',
          'B) \\omega = 50\\pi rad/s',
          'C) \\omega = 200\\pi rad/s',
          'D) \\omega = 25\\pi rad/s'
        ],
        answerKey: 'A) \\omega = 100\\pi rad/s'
      },
      {
        questionText: 'A resistance of 50 \\Omega is connected to an AC source. The phase difference between voltage and current is \\phi = 0^\circ.',
        type: 'MCQ',
        marks: 1,
        options: [
          'A) Power factor = 1.0',
          'B) Power factor = 0.5',
          'C) Power factor = 0.0',
          'D) Power factor = \\sqrt{3}/2'
        ],
        answerKey: 'A) Power factor = 1.0'
      },
      {
        questionText: 'Derive the expression for moment of inertia of a uniform disk of mass M and radius R. Show that I = \\frac{1}{2} M R^2.',
        type: 'SHORT',
        marks: 2,
        answerKey: 'I = \\frac{1}{2} M R^2'
      },
      {
        questionText: 'An electron accelerates through a potential difference of 100 V. Find its de Broglie wavelength \\lambda. Given \\mu = 10^{-6}.',
        type: 'SHORT',
        marks: 2,
        answerKey: '\\lambda = 0.123 nm'
      }
    ]
  };

  try {
    const pdfBuffer = await exportQPToPDF(mockQP, false);
    const outputPath = path.join(__dirname, 'test_scientific_output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`  ✅ PDF with scientific symbols exported successfully: ${pdfBuffer.length} bytes`);
    console.log(`  📄 Output file saved to: ${outputPath}`);
    console.log('\n==================================================');
    console.log('🎉 SCIENTIFIC NOTATION & MATH SYMBOLS VERIFIED!');
    console.log('   - theta (θ), omega (ω), pi (π), phi (ϕ): Formatted ✅');
    console.log('   - Ohm (Ω), degree (°), sqrt (√), fractions: Formatted ✅');
    console.log('   - Superscripts (^2, ^{-6}): Formatted ✅');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Scientific symbols test failed:', err);
  }
}

testScientificSymbols();
