'use client'

import { useState, useEffect, useCallback } from 'react'

interface ClassAverage {
  classroom_id: string
  classroom_name: string
  school_id: string
  school_name: string
  teacher_id: string
  teacher_name: string
  subject: string
  average_score: number
  total_students: number
  last_updated: string
  scores_distribution: {
    excellent: number
    good: number
    satisfactory: number
    needs_improvement: number
  }
}

interface SchoolAnalytics {
  school_id: string
  school_name: string
  total_students: number
  total_teachers: number
  total_classrooms: number
  overall_average: number
  subject_averages: Array<{
    subject: string
    average: number
    student_count: number
  }>
  grade_averages: Array<{
    grade: string
    average: number
    student_count: number
  }>
  last_updated: string
}

interface UseAnalyticsOptions {
  type: 'class_averages' | 'school_analytics'
  school_id?: string
  teacher_id?: string
  refreshInterval?: number
}

export function useAnalytics(options: UseAnalyticsOptions) {
  const [data, setData] = useState<ClassAverage[] | SchoolAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Destructure options to avoid dependency issues
  const { type, school_id, teacher_id, refreshInterval } = options

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        type,
        ...(school_id && { school_id }),
        ...(teacher_id && { teacher_id }),
      })

      const response = await fetch(`/api/analytics?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [type, school_id, teacher_id])

  useEffect(() => {
    fetchAnalytics()

    // Set up refresh interval if specified
    if (refreshInterval) {
      const interval = setInterval(fetchAnalytics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchAnalytics, refreshInterval])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  }
}

export type { ClassAverage, SchoolAnalytics }