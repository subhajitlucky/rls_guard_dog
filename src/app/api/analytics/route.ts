import { getCollection } from '../../../../lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const teacherId = searchParams.get('teacher_id')
    const type = searchParams.get('type') || 'class_averages'

    if (type === 'class_averages') {
      const collection = await getCollection('class_averages')
      const query: Record<string, string> = {}
      
      if (schoolId) {
        query.school_id = schoolId
      }
      
      if (teacherId) {
        query.teacher_id = teacherId
      }

      const classAverages = await collection.find(query).toArray()
      
      return NextResponse.json({
        success: true,
        data: classAverages
      })
    }

    if (type === 'school_analytics') {
      const collection = await getCollection('school_analytics')
      const query: Record<string, string> = {}
      
      if (schoolId) {
        query.school_id = schoolId
      }

      const schoolAnalytics = await collection.find(query).toArray()
      
      return NextResponse.json({
        success: true,
        data: schoolAnalytics
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid analytics type'
    }, { status: 400 })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, { status: 500 })
  }
}