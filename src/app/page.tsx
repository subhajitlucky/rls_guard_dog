import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🛡️ RLS Guard Dog
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Secure Classroom Management with Row-Level Security
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-semibold mb-2">Student Dashboard</h3>
            <p className="text-gray-600">
              Students can view only their own progress records with automatic RLS filtering
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-semibold mb-2">Teacher Management</h3>
            <p className="text-gray-600">
              Teachers manage students in their grade/subjects and edit progress records
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">👩‍💼</div>
            <h3 className="text-lg font-semibold mb-2">School Analytics</h3>
            <p className="text-gray-600">
              Head teachers access school-wide analytics with MongoDB integration
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Built With</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold">Next.js 15</h4>
              <p className="text-sm text-gray-600">App Router + TypeScript</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <h4 className="font-semibold">Supabase</h4>
              <p className="text-sm text-gray-600">PostgreSQL + RLS</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold">MongoDB</h4>
              <p className="text-sm text-gray-600">Analytics Storage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-semibold">Edge Functions</h4>
              <p className="text-sm text-gray-600">Serverless Computing</p>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">📋 Assignment Requirements</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">✅ Database & Security:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Classroom and progress tables linked by school_id</li>
                <li>Row-level security policies implemented</li>
                <li>Students see only their own records</li>
                <li>Teachers see students in their classes</li>
                <li>Head teachers see all school records</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ Features & Integration:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Protected /teacher page for editing progress</li>
                <li>Role-based authentication system</li>
                <li>Edge Function calculates class averages</li>
                <li>MongoDB integration for analytics</li>
                <li>Comprehensive testing and deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
