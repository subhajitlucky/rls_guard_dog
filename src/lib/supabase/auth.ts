import { createClient } from './client'
import { Database, UserRole } from './types'

type AuthUser = {
  email: string
  password: string
  fullName: string
  role: UserRole
  schoolName: string
  grade?: string
  subjects?: string[]
}

// Client-side authentication functions
export const authClient = {
  // Sign up new user with profile
  async signUp(userData: AuthUser) {
    const supabase = createClient()
    
    console.log('🔐 Step 1: Creating auth user...')
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: userData.fullName,
          role: userData.role
        }
      }
    })

    if (authError) {
      console.error('❌ Auth error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    if (!authData.user) {
      console.error('❌ No user returned from auth')
      throw new Error('Failed to create user - no user returned')
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Step 2: Find or create school
    let schoolId: string

    console.log('🏫 Step 2: Finding/creating school:', userData.schoolName)
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .ilike('name', userData.schoolName)
      .single()

    if (existingSchool) {
      schoolId = existingSchool.id
      console.log('✅ Found existing school:', schoolId)
    } else {
      console.log('➕ Creating new school...')
      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: userData.schoolName })
        .select('id')
        .single()

      if (schoolError) {
        console.error('❌ School creation error:', schoolError)
        throw new Error(`Failed to create school: ${schoolError.message}`)
      }
      schoolId = newSchool.id
      console.log('✅ Created new school:', schoolId)
    }

    // Step 3: Create user profile
    console.log('👤 Step 3: Creating user profile...')
    const profileData = {
      id: authData.user.id,
      school_id: schoolId,
      role: userData.role,
      full_name: userData.fullName,
      email: userData.email,
      grade: userData.grade || null,
      subjects: userData.subjects || null,
    }
    
    console.log('Profile data:', profileData)
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      throw new Error(`Failed to create profile: ${profileError.message}. This might be due to missing RLS policies.`)
    }

    console.log('✅ Profile created successfully')
    return { user: authData.user }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign out current user
  async signOut() {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user profile
  async getProfile() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // First get the profile without joins to avoid recursion
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (!profile) return null

    // Then get school info separately if needed
    let schoolInfo = null
    if (profile.school_id) {
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('id', profile.school_id)
        .single()
      
      if (!schoolError && school) {
        schoolInfo = school
      }
    }

    return {
      ...profile,
      schools: schoolInfo
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<Pick<Database['public']['Tables']['profiles']['Update'], 'full_name' | 'grade' | 'subjects'>>) {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get current user session
  async getSession() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

// Utility functions
export const authUtils = {
  // Check if user has specific role
  hasRole(profile: any, role: UserRole | UserRole[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!profile) return false
    if (Array.isArray(role)) {
      return role.includes(profile.role)
    }
    return profile.role === role
  },

  // Check if user can access teacher features
  canAccessTeacher(profile: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return this.hasRole(profile, ['teacher', 'head_teacher'])
  },

  // Get display name for user
  getDisplayName(profile: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return profile?.full_name || profile?.email || 'Unknown User'
  }
}