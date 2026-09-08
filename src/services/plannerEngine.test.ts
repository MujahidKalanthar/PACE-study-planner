import {
  generateStudySchedule,
  calculateOnTrackStatus,
  getAvailableMinutesForDate,
  addDays,
  formatDate,
} from './plannerEngine';
import {
  Chapter,
  Exam,
  PlannedStudyItem,
  StudentProfile,
  StudySessionLog,
  Subject,
  TimetableSlot,
} from '../types';

function runPlannerTests() {
  console.log('🧪 Starting Study Planner Engine Verification Tests...');
  let passedCount = 0;
  const totalTests = 8;

  const todayStr = '2026-09-05';

  const mockProfile: StudentProfile = {
    name: 'Arjun',
    classLevel: '12',
    dailyStudyMinutes: 135, // 2h 15m
    onboardingCompleted: true,
    autoAdjustPlan: true,
    theme: 'light',
    showStatsToFriends: true,
    notifications: { dailyMorningPlan: true, eveningReview: true, revisionAlerts: true, friendAlerts: true },
  };

  const mockExamJEE: Exam = {
    id: 'exam_jee',
    name: 'JEE Main 2026',
    category: 'jee',
    targetDate: '2026-09-28', // 23 days left
    priority: 1,
    color: 'blue',
    isPrimary: true,
  };

  const mockExamCBSE: Exam = {
    id: 'exam_cbse',
    name: 'CBSE Class 12 Boards',
    category: 'cbse',
    targetDate: '2026-10-15', // 40 days left
    priority: 2,
    color: 'emerald',
    isPrimary: false,
  };

  const mockSubjects: Subject[] = [
    { id: 'sub_p', name: 'Physics', color: '#3B82F6', examIds: ['exam_jee'], order: 1 },
    { id: 'sub_c', name: 'Chemistry', color: '#10B981', examIds: ['exam_jee'], order: 2 },
    { id: 'sub_m', name: 'Mathematics', color: '#8B5CF6', examIds: ['exam_jee'], order: 3 },
  ];

  const mockChapters: Chapter[] = [
    { id: 'ch_kin', subjectId: 'sub_p', name: 'Kinematics', classLevel: 11, order: 1, difficulty: 'medium', estimatedMinutes: 45, status: 'in_progress', completedMinutes: 0, subtopics: [], revisionCount: 0 },
    { id: 'ch_chem_bond', subjectId: 'sub_c', name: 'Chemical Bonding', classLevel: 11, order: 1, difficulty: 'hard', estimatedMinutes: 40, status: 'not_started', completedMinutes: 0, subtopics: [], revisionCount: 0 },
    { id: 'ch_quad', subjectId: 'sub_m', name: 'Quadratic Equations', classLevel: 11, order: 1, difficulty: 'medium', estimatedMinutes: 30, status: 'not_started', completedMinutes: 0, subtopics: [], revisionCount: 0 },
    { id: 'ch_units', subjectId: 'sub_p', name: 'Units & Measurements', classLevel: 11, order: 0, difficulty: 'easy', estimatedMinutes: 30, status: 'completed', completedMinutes: 30, subtopics: [], revisionCount: 1, nextRevisionDate: '2026-09-05' },
    { id: 'ch_laws', subjectId: 'sub_p', name: 'Laws of Motion', classLevel: 11, order: 2, difficulty: 'medium', estimatedMinutes: 45, status: 'not_started', completedMinutes: 0, subtopics: [], revisionCount: 0 },
  ];

  const mockTimetable: TimetableSlot[] = [
    { id: 'tt_school', title: 'School', days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '14:00', category: 'school' },
    { id: 'tt_coach', title: 'Coaching', days: [1, 3, 5], startTime: '17:00', endTime: '18:30', category: 'coaching' },
  ];

  // Test 1: Normal Schedule (Generates balanced plan without exceeding available hours)
  try {
    const plans = generateStudySchedule({
      todayStr,
      daysToPlan: 7,
      exams: [mockExamJEE],
      subjects: mockSubjects,
      chapters: mockChapters,
      existingPlans: [],
      timetable: [],
      profile: mockProfile,
      sessionLogs: [],
    });

    const todayPlans = plans.filter((p) => p.date === todayStr);
    const totalPlannedMin = todayPlans.reduce((acc, curr) => acc + curr.plannedMinutes, 0);

    if (todayPlans.length >= 2 && totalPlannedMin <= mockProfile.dailyStudyMinutes + 30) {
      console.log('✅ Test 1 Passed: Normal Schedule created balanced daily plan.');
      passedCount++;
    } else {
      console.error('❌ Test 1 Failed: daily minutes exceeded or empty', { todayPlans, totalPlannedMin });
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err);
  }

  // Test 2: Limited Time / On-Track detection
  try {
    const statusNormal = calculateOnTrackStatus({
      todayStr,
      primaryExam: mockExamJEE,
      chapters: mockChapters,
      profile: mockProfile,
      timetable: [],
      sessionLogs: [],
    });

    const mockLowProfile: StudentProfile = {
      ...mockProfile,
      dailyStudyMinutes: 20, // artificially low study capacity
    };

    const statusBehind = calculateOnTrackStatus({
      todayStr,
      primaryExam: { ...mockExamJEE, targetDate: '2026-09-08' }, // exam only 3 days away
      chapters: mockChapters,
      profile: mockLowProfile,
      timetable: [],
      sessionLogs: [],
    });

    if (statusNormal.status === 'on_track' && statusBehind.status === 'behind') {
      console.log('✅ Test 2 Passed: On-Track status accurately transitions when time is constrained.');
      passedCount++;
    } else {
      console.error('❌ Test 2 Failed:', { statusNormal: statusNormal.status, statusBehind: statusBehind.status });
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err);
  }

  // Test 3: Missed Study redistribution without penalty
  try {
    const yesterdayStr = '2026-09-04';
    const missedItem: PlannedStudyItem = {
      id: 'plan_missed_1',
      date: yesterdayStr,
      chapterId: 'ch_chem_bond',
      subjectId: 'sub_c',
      examId: 'exam_jee',
      type: 'learn',
      plannedMinutes: 40,
      completed: false,
      order: 1,
    };

    const adjustedPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 3,
      exams: [mockExamJEE],
      subjects: mockSubjects,
      chapters: mockChapters,
      existingPlans: [missedItem],
      timetable: [],
      profile: mockProfile,
      sessionLogs: [],
    });

    const rescheduled = adjustedPlans.find(
      (p) => p.chapterId === 'ch_chem_bond' && p.date >= todayStr && !p.completed
    );

    if (rescheduled) {
      console.log('✅ Test 3 Passed: Missed study redistributed gently to today or tomorrow.');
      passedCount++;
    } else {
      console.error('❌ Test 3 Failed: missed study not rescheduled');
    }
  } catch (err) {
    console.error('❌ Test 3 Error:', err);
  }

  // Test 4: Early Completion (Chapter completed ahead of time)
  try {
    const chaptersWithCompleted = mockChapters.map((c) =>
      c.id === 'ch_kin' ? { ...c, status: 'completed' as const, completedMinutes: 45 } : c
    );

    const plans = generateStudySchedule({
      todayStr,
      daysToPlan: 3,
      exams: [mockExamJEE],
      subjects: mockSubjects,
      chapters: chaptersWithCompleted,
      existingPlans: [],
      timetable: [],
      profile: mockProfile,
      sessionLogs: [],
    });

    const kinPlannedAsLearn = plans.find((p) => p.chapterId === 'ch_kin' && p.type === 'learn');
    if (!kinPlannedAsLearn) {
      console.log('✅ Test 4 Passed: Completed chapter not re-scheduled for initial study.');
      passedCount++;
    } else {
      console.error('❌ Test 4 Failed: Completed chapter was planned again for learn');
    }
  } catch (err) {
    console.error('❌ Test 4 Error:', err);
  }

  // Test 5: Multiple Exams
  try {
    const plans = generateStudySchedule({
      todayStr,
      daysToPlan: 5,
      exams: [mockExamJEE, mockExamCBSE],
      subjects: mockSubjects,
      chapters: mockChapters,
      existingPlans: [],
      timetable: [],
      profile: mockProfile,
      sessionLogs: [],
    });

    if (plans.length > 0) {
      console.log('✅ Test 5 Passed: Multiple exams handled cleanly.');
      passedCount++;
    } else {
      console.error('❌ Test 5 Failed: Empty plans for multiple exams');
    }
  } catch (err) {
    console.error('❌ Test 5 Error:', err);
  }

  // Test 6: Spaced Revision scheduled
  try {
    const plans = generateStudySchedule({
      todayStr,
      daysToPlan: 3,
      exams: [mockExamJEE],
      subjects: mockSubjects,
      chapters: mockChapters, // contains ch_units with nextRevisionDate = todayStr
      existingPlans: [],
      timetable: [],
      profile: mockProfile,
      sessionLogs: [],
    });

    const revisionPlan = plans.find((p) => p.type === 'revise' && p.chapterId === 'ch_units');
    if (revisionPlan) {
      console.log('✅ Test 6 Passed: Spaced revision item included in daily study.');
      passedCount++;
    } else {
      console.error('❌ Test 6 Failed: revision item not scheduled', plans);
    }
  } catch (err) {
    console.error('❌ Test 6 Error:', err);
  }

  // Test 7: Fixed Timetable commitment consideration
  try {
    // 2026-09-07 is a Monday (day 1), which has School 8-14 (6h = 360m) + Coaching 17-18:30 (1.5h = 90m) = 450 min
    const mondayStr = '2026-09-07';
    const mondayCap = getAvailableMinutesForDate(mondayStr, 180, mockTimetable);
    // Sunday 2026-09-06 has 0 commitments
    const sundayStr = '2026-09-06';
    const sundayCap = getAvailableMinutesForDate(sundayStr, 180, mockTimetable);

    if (mondayCap < sundayCap) {
      console.log(`✅ Test 7 Passed: Timetable commitments gently adjust available study time (Mon: ${mondayCap}m vs Sun: ${sundayCap}m).`);
      passedCount++;
    } else {
      console.error('❌ Test 7 Failed: timetable commitments did not reduce available time');
    }
  } catch (err) {
    console.error('❌ Test 7 Error:', err);
  }

  // Test 8: Very Close Exam prioritization
  try {
    const urgentExam: Exam = {
      ...mockExamJEE,
      targetDate: '2026-09-07', // 2 days away
    };

    const statusUrgent = calculateOnTrackStatus({
      todayStr,
      primaryExam: urgentExam,
      chapters: mockChapters,
      profile: mockProfile,
      timetable: [],
      sessionLogs: [],
    });

    if (statusUrgent.status === 'behind' || statusUrgent.status === 'catching_up') {
      console.log(`✅ Test 8 Passed: Very close exam detected and flagged with supportive guidance: "${statusUrgent.headline}"`);
      passedCount++;
    } else {
      console.error('❌ Test 8 Failed:', statusUrgent);
    }
  } catch (err) {
    console.error('❌ Test 8 Error:', err);
  }

  console.log(`\n🎉 Results: ${passedCount} / ${totalTests} planner engine tests passed!\n`);
  return passedCount === totalTests;
}

runPlannerTests();
