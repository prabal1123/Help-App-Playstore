import { useState } from 'react'
import { View, TextInput, Button, Alert } from 'react-native'
import { supabase } from '../../supabase/supabase'
import { useRouter, useLocalSearchParams } from 'expo-router'

export default function VerifyScreen() {
  const [otp, setOtp] = useState('')
  const { email } = useLocalSearchParams()
  const router = useRouter()

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email: email as string,
      token: otp,
      type: 'email',
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      router.replace('/(tabs)')

    }
  }

  return (
    <View>
      <TextInput
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  )
}
