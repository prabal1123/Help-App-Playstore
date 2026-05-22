
// import 'react-native-get-random-values'
// import 'react-native-url-polyfill/auto'

// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
// import { Stack } from 'expo-router'
// import { StatusBar } from 'expo-status-bar'
// import 'react-native-reanimated'
// import { useColorScheme } from '@/hooks/use-color-scheme'
// import { useEffect, useState } from 'react'
// import { supabase } from '../supabase/supabase'

// // ✅ ADD THIS
// import { SafeAreaProvider } from 'react-native-safe-area-context'

// export default function RootLayout() {
//   const colorScheme = useColorScheme()
//   const [session, setSession] = useState<any>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const getSession = async () => {
//       const { data } = await supabase.auth.getSession()
//       setSession(data.session)
//       setLoading(false)
//     }

//     getSession()

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         setSession(session)
//       }
//     )

//     return () => {
//       listener.subscription.unsubscribe()
//     }
//   }, [])

//   if (loading) return null

//   return (
//     // ✅ WRAP HERE
//     <SafeAreaProvider>
//       <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//         <Stack screenOptions={{ headerShown: false }}>
//           {session ? (
//             <Stack.Screen name="(tabs)" />
//           ) : (
//             <Stack.Screen name="auth/email" />
//           )}
//         </Stack>
//         <StatusBar style="auto" />
//       </ThemeProvider>
//     </SafeAreaProvider>
//   )
// }

// import 'react-native-get-random-values'
// import 'react-native-url-polyfill/auto'
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
// import { Stack, useRouter, useSegments } from 'expo-router'
// import { StatusBar } from 'expo-status-bar'
// import 'react-native-reanimated'
// import { useColorScheme } from '@/hooks/use-color-scheme'
// import { useEffect, useState } from 'react'
// import { supabase } from '../supabase/supabase'
// import { SafeAreaProvider } from 'react-native-safe-area-context'

// export default function RootLayout() {
//   const colorScheme = useColorScheme()
//   const [session, setSession] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const router = useRouter()
//   const segments = useSegments()

//   useEffect(() => {
//     const getSession = async () => {
//       const { data } = await supabase.auth.getSession()
//       setSession(data.session)
//       setLoading(false)
//     }

//     getSession()

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         setSession(session)
//       }
//     )

//     return () => {
//       listener.subscription.unsubscribe()
//     }
//   }, [])

//   // Handle routing based on session
//   useEffect(() => {
//     if (loading) return

//     const inAuthGroup = segments[0] === 'auth'
//     const inTabsGroup = segments[0] === '(tabs)'

//     if (session && !inTabsGroup) {
//       // Logged in but not in tabs — go home
//       router.replace('/')
//     } else if (!session && !inAuthGroup) {
//       // Not logged in and not in auth — go to login
//       router.replace('/auth/email')
//     }
//   }, [session, loading, segments])

//   if (loading) return null

//   return (
//     <SafeAreaProvider>
//       <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//         <Stack screenOptions={{ headerShown: false }}>
//           <Stack.Screen name="(tabs)" />
//           <Stack.Screen name="auth/email" />
//           <Stack.Screen name="auth/callback" />
//           <Stack.Screen name="auth/otp" />
//           <Stack.Screen name="auth/phone" />
//           <Stack.Screen name="auth/whatsapp-otp" />
//           <Stack.Screen name="auth/add-guardian" />
//           <Stack.Screen name="profile" />
//         </Stack>
//         <StatusBar style="auto" />
//       </ThemeProvider>
//     </SafeAreaProvider>
//   )
// }

import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase/supabase'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  const hasRedirected = useRef(false)

  // 🔐 Session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        hasRedirected.current = false
        setSession(session)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🚦 Routing Logic (FIXED)
  useEffect(() => {
    if (loading) return
    if (hasRedirected.current) return

    const inAuthGroup = segments[0] === 'auth'

    // ❌ Not logged in → allow all auth screens
    if (!session) {
      if (!inAuthGroup) {
        hasRedirected.current = true
        router.replace('/auth/get-started') // 🔥 new entry
      }
      return
    }

    // ✅ Logged in → block auth screens
    if (session && inAuthGroup) {
      hasRedirected.current = true
      router.replace('/')
    }

  }, [session, loading])

  if (loading) return null

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        
        <Stack screenOptions={{ headerShown: false }}>
          
          {/* MAIN APP */}
          <Stack.Screen name="(tabs)" />

          {/* AUTH FLOW */}
          <Stack.Screen name="auth/get-started" />
          <Stack.Screen name="auth/email" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="auth/otp" />
          <Stack.Screen name="auth/phone" />
          <Stack.Screen name="auth/whatsapp-otp" />

          {/* GUARDIAN FLOW */}
          <Stack.Screen name="auth/guardian-invite" />
          <Stack.Screen name="auth/guardian-requests" />
          <Stack.Screen name="auth/guardian-success" />

          {/* QR SCANNER */}
          <Stack.Screen name="auth/scan-qr" />

          {/* PROFILE */}
         

        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}