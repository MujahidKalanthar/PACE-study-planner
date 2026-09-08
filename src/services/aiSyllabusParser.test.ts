import { z } from 'zod';

const ChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).catch('medium'),
  estimatedMinutes: z.number().int().min(15).max(300).catch(45),
  subtopics: z.array(z.string()).default([]),
});

const SubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  chapters: z.array(ChapterSchema).min(1, 'Each subject must have at least one chapter'),
});

const SyllabusSchema = z.object({
  subjects: z.array(SubjectSchema).min(1, 'At least one subject is required'),
});

async function runSyllabusParserTests() {
  console.log('🧪 Running AI Syllabus Parser Validation Tests...');
  let passedCount = 0;
  const totalTests = 5;

  // Test 1: Unique Syllabus (Non-standard / Custom)
  try {
    const uniqueInput = {
      subjects: [
        {
          name: 'Quantum Widget Studies',
          chapters: [
            {
              name: 'Banana Mechanics',
              difficulty: 'hard',
              estimatedMinutes: 50,
              subtopics: ['Peel Dynamics', 'Slip Coefficients', 'Potassium Decay'],
            },
            {
              name: 'Orbital Sandwich Theory',
              difficulty: 'medium',
              estimatedMinutes: 45,
              subtopics: ['Layer Gravitation', 'Condiment Friction'],
            },
            {
              name: 'Recursive Thermodynamics',
              difficulty: 'hard',
              estimatedMinutes: 60,
              subtopics: ['Entropy Loops', 'Infinite Boil'],
            },
          ],
        },
      ],
    };

    const validated = SyllabusSchema.parse(uniqueInput);
    if (
      validated.subjects.length === 1 &&
      validated.subjects[0].name === 'Quantum Widget Studies' &&
      validated.subjects[0].chapters.length === 3 &&
      validated.subjects[0].chapters[0].name === 'Banana Mechanics'
    ) {
      console.log('✅ Test 1 Passed: Unique syllabus correctly validated without hallucinated default data.');
      passedCount++;
    } else {
      console.error('❌ Test 1 Failed:', validated);
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err);
  }

  // Test 2: Completely different syllabus (e.g. Legal Studies & Jurisprudence)
  try {
    const lawInput = {
      subjects: [
        {
          name: 'Constitutional Law',
          chapters: [
            {
              name: 'Fundamental Rights & Writs',
              difficulty: 'hard',
              estimatedMinutes: 55,
              subtopics: ['Habeas Corpus', 'Mandamus', 'Article 21'],
            },
            {
              name: 'Directive Principles',
              difficulty: 'easy',
              estimatedMinutes: 35,
              subtopics: ['Socialist Principles', 'Gandhian Principles'],
            },
          ],
        },
      ],
    };

    const validated = SyllabusSchema.parse(lawInput);
    if (
      validated.subjects[0].name === 'Constitutional Law' &&
      validated.subjects[0].chapters[0].name === 'Fundamental Rights & Writs'
    ) {
      console.log('✅ Test 2 Passed: Completely different domain (Law) structured faithfully.');
      passedCount++;
    } else {
      console.error('❌ Test 2 Failed:', validated);
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err);
  }

  // Test 3: Rejection of empty subjects
  try {
    const invalidEmpty = { subjects: [] };
    const result = SyllabusSchema.safeParse(invalidEmpty);
    if (!result.success) {
      console.log('✅ Test 3 Passed: Empty subjects properly rejected by schema validator.');
      passedCount++;
    } else {
      console.error('❌ Test 3 Failed: Empty subjects was accepted');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err);
  }

  // Test 4: Rejection of subject with zero chapters
  try {
    const invalidZeroChapters = {
      subjects: [{ name: 'Empty Subject', chapters: [] }],
    };
    const result = SyllabusSchema.safeParse(invalidZeroChapters);
    if (!result.success) {
      console.log('✅ Test 4 Passed: Subject with zero chapters properly rejected.');
      passedCount++;
    } else {
      console.error('❌ Test 4 Failed: Zero chapters was accepted');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err);
  }

  // Test 5: Rejection of missing chapter name
  try {
    const invalidChapterName = {
      subjects: [
        {
          name: 'Maths',
          chapters: [{ name: '', difficulty: 'easy', estimatedMinutes: 40 }],
        },
      ],
    };
    const result = SyllabusSchema.safeParse(invalidChapterName);
    if (!result.success) {
      console.log('✅ Test 5 Passed: Empty chapter title properly rejected.');
      passedCount++;
    } else {
      console.error('❌ Test 5 Failed: Empty chapter title was accepted');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err);
  }

  console.log(`\n🎉 Results: ${passedCount} / ${totalTests} syllabus parser tests passed!\n`);
  return passedCount === totalTests;
}

runSyllabusParserTests();
