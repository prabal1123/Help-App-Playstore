
// import 'react-native-url-polyfill/auto'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://xzpyaylnaakhtfqshhmv.supabase.co'
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiO iJzdXBhYmFzZSIsInJlZiI6Inh6cHlheWxuYWFraHRmcXNoaG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzM2MjEsImV4cCI6MjA2NzEwOTYyMX0.X5L6Sx1g5RNsKsChQzv2YIoOARrXipDas3D99djeOOE'

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     storage: AsyncStorage,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//     flowType: "pkce", // ✅ fixed — correct for OTP + React Native
//   },
// })





import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // ✅ fixed — correct for OTP + React Native
  },
})