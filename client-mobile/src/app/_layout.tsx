import { Stack } from "expo-router";

export default function RootLayout() {
  return (
  <Stack screenOptions={{headerShown: false}}> // headerShown false will hide the default top bar  
    <Stack.Screen name="(tabs)"/>
  </Stack>
  );
}
