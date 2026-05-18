import { Stack, useRouter } from "expo-router";
import { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import api from "@/lib/api";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import {
  Nunito_400Regular,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold
} from "@expo-google-fonts/dm-sans";
import { View, ActivityIndicator } from "react-native";

interface AuthContextType {
  userAuth: {
    userId: number;
    userName: string;
    familyName: string;
    givenName: string;
    userImg: string;
    role: string;
  };
  setUserAuth: React.Dispatch<React.SetStateAction<AuthContextType["userAuth"]>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function RootLayout() {

  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold
  });

  const router = useRouter()

  const [userAuth, setUserAuth] = useState({
    userId: 0,
    userName: "",
    familyName: "",
    givenName: "",
    userImg: "",
    role: "anonymous",
  });

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");

        if (!accessToken) {
          router.replace("/(auth)/login");
          return;
        }

        const res = await api.get("/users/verify");

        setUserAuth({
          userId: res.data.userId,
          userName: res.data.userName,
          familyName: res.data.familyName,
          givenName: res.data.givenName,
          userImg: res.data.userImg,
          role: res.data.role,
        });

        router.replace("/(tabs)");

      } catch (err) {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        router.replace("/(auth)/login");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, []);

  if (isVerifying) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F29DB6" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ userAuth, setUserAuth }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </AuthContext.Provider>
  );
}