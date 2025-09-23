import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Database and collection helpers
export async function getDatabase(dbName: string = 'rls_guard_dog_analytics') {
  const client = await clientPromise
  return client.db(dbName)
}

export async function getCollection(collectionName: string, dbName?: string) {
  const db = await getDatabase(dbName)
  return db.collection(collectionName)
}

// Analytics collections
export const COLLECTIONS = {
  CLASS_AVERAGES: 'class_averages',
  SCHOOL_ANALYTICS: 'school_analytics',
  TEACHER_ANALYTICS: 'teacher_analytics',
  PERFORMANCE_TRENDS: 'performance_trends'
} as const