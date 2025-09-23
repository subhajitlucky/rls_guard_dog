import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚀 Testing Edge Function logic...')

    // Mock data to test the analytics calculation logic
    const mockProgressData = [
      {
        id: '1',
        student_id: 'student1',
        score: 85,
        classrooms: {
          id: 'class1',
          name: 'Math 101',
          subject: 'Mathematics',
          teacher_id: 'teacher1',
          school_id: 'school1',
          profiles: { full_name: 'Mr. Smith' },
          schools: { id: 'school1', name: 'Test School' }
        },
        profiles: { full_name: 'John Doe', grade: '10th' }
      },
      {
        id: '2',
        student_id: 'student2',
        score: 92,
        classrooms: {
          id: 'class1',
          name: 'Math 101',
          subject: 'Mathematics',
          teacher_id: 'teacher1',
          school_id: 'school1',
          profiles: { full_name: 'Mr. Smith' },
          schools: { id: 'school1', name: 'Test School' }
        },
        profiles: { full_name: 'Jane Smith', grade: '10th' }
      },
      {
        id: '3',
        student_id: 'student3',
        score: 78,
        classrooms: {
          id: 'class2',
          name: 'Science 101',
          subject: 'Science',
          teacher_id: 'teacher2',
          school_id: 'school1',
          profiles: { full_name: 'Ms. Johnson' },
          schools: { id: 'school1', name: 'Test School' }
        },
        profiles: { full_name: 'Bob Wilson', grade: '11th' }
      }
    ]

    // Calculate class averages (same logic as the real Edge Function)
    const classAverages = new Map()
    const schoolStats = new Map()

    for (const progress of mockProgressData) {
      const classroom = progress.classrooms
      if (!classroom) continue

      const classroomId = classroom.id
      
      if (!classAverages.has(classroomId)) {
        classAverages.set(classroomId, {
          classroom_id: classroomId,
          classroom_name: classroom.name,
          school_id: classroom.school_id,
          school_name: classroom.schools?.name || 'Unknown',
          teacher_id: classroom.teacher_id,
          teacher_name: classroom.profiles?.full_name || 'Unknown',
          subject: classroom.subject,
          average_score: 0,
          total_students: 0,
          last_updated: new Date().toISOString(),
          scores_distribution: {
            excellent: 0, // 90-100
            good: 0,      // 80-89
            satisfactory: 0, // 70-79
            needs_improvement: 0 // Below 70
          }
        })
      }

      const classAvg = classAverages.get(classroomId)
      classAvg.total_students++
      classAvg.average_score += progress.score

      // Update score distribution
      if (progress.score >= 90) {
        classAvg.scores_distribution.excellent++
      } else if (progress.score >= 80) {
        classAvg.scores_distribution.good++
      } else if (progress.score >= 70) {
        classAvg.scores_distribution.satisfactory++
      } else {
        classAvg.scores_distribution.needs_improvement++
      }

      // Track school statistics
      const schoolId = classroom.school_id
      if (!schoolStats.has(schoolId)) {
        schoolStats.set(schoolId, {
          school_id: schoolId,
          school_name: classroom.schools?.name || 'Unknown',
          students: new Set(),
          teachers: new Set(),
          classrooms: new Set(),
          totalScore: 0,
          totalRecords: 0,
          subjects: new Map(),
          grades: new Map()
        })
      }

      const school = schoolStats.get(schoolId)
      school.students.add(progress.student_id)
      school.teachers.add(classroom.teacher_id)
      school.classrooms.add(classroomId)
      school.totalScore += progress.score
      school.totalRecords++

      // Track by subject
      if (!school.subjects.has(classroom.subject)) {
        school.subjects.set(classroom.subject, { total: 0, count: 0 })
      }
      const subjectStats = school.subjects.get(classroom.subject)
      subjectStats.total += progress.score
      subjectStats.count++

      // Track by grade
      const studentGrade = progress.profiles?.grade
      if (studentGrade) {
        if (!school.grades.has(studentGrade)) {
          school.grades.set(studentGrade, { total: 0, count: 0 })
        }
        const gradeStats = school.grades.get(studentGrade)
        gradeStats.total += progress.score
        gradeStats.count++
      }
    }

    // Finalize class averages
    for (const [_, classAvg] of classAverages) {
      if (classAvg.total_students > 0) {
        classAvg.average_score = Math.round((classAvg.average_score / classAvg.total_students) * 100) / 100
      }
    }

    // Prepare school analytics
    const schoolAnalytics = []
    for (const [_, school] of schoolStats) {
      const analytics = {
        school_id: school.school_id,
        school_name: school.school_name,
        total_students: school.students.size,
        total_teachers: school.teachers.size,
        total_classrooms: school.classrooms.size,
        overall_average: school.totalRecords > 0 ? 
          Math.round((school.totalScore / school.totalRecords) * 100) / 100 : 0,
        subject_averages: Array.from(school.subjects.entries() as Iterable<[string, any]>).map(([subject, stats]) => ({
          subject,
          average: Math.round((stats.total / stats.count) * 100) / 100,
          student_count: stats.count
        })),
        grade_averages: Array.from(school.grades.entries() as Iterable<[string, any]>).map(([grade, stats]) => ({
          grade,
          average: Math.round((stats.total / stats.count) * 100) / 100,
          student_count: stats.count
        })),
        last_updated: new Date().toISOString()
      }
      schoolAnalytics.push(analytics)
    }

    return NextResponse.json({
      success: true,
      message: 'Edge Function logic test completed successfully',
      mockData: true,
      calculated: {
        classAverages: Array.from(classAverages.values()),
        schoolAnalytics: schoolAnalytics
      },
      summary: {
        classAveragesCalculated: classAverages.size,
        schoolAnalyticsCalculated: schoolAnalytics.length,
        totalProgressRecords: mockProgressData.length
      }
    })

  } catch (error) {
    console.error('❌ Edge Function test error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        mockData: true
      },
      { status: 500 }
    )
  }
}