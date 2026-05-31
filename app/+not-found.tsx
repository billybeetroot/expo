import { View, Text } from 'react-native'
import { Link } from 'expo-router'

export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-defaultText text-xl">Page not found</Text>
      <Link href="/" className="mt-4 text-primary">Go home</Link>
    </View>
  )
}
