import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { FormInput } from "@/components/formInput";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import { useContext } from "react";
import { AuthContext } from "../_layout";



export default function LoginScreen() {
    const router = useRouter()

    const [userInfos, setUserInfos] = useState({
        identifier: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        identifier: "",
        password: "",
    });

    const handleFocus = (field: string) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const { setUserAuth } = useContext(AuthContext)!;

    const handleSubmit = async() => {
        try {
        const newErrors: Partial<typeof errors> = {};
        if (!userInfos.identifier.trim()) newErrors.identifier = "Enter your identifier";
        if (!userInfos.password.trim()) newErrors.password = "Enter a password";

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            return;
        }
        const { data } = await api.post('/auth/mobile/login', {
                identifier: userInfos.identifier,
                password: userInfos.password,
            });

            await SecureStore.setItemAsync('accessToken', data.accessToken);
            await SecureStore.setItemAsync('refreshToken', data.refreshToken);

            setUserAuth({
                userId: data.userId,
                userName: data.userName,
                familyName: data.familyName,
                givenName: data.givenName,
                userImg: data.userImg,
                role: data.role,
            });

            router.replace('/(tabs)');

        } catch (error: any) {
            console.log('STATUS:', error.response?.status);
            console.log('DATA:', error.response?.data);
            console.log('MESSAGE:', error.message);  

            if (error.response?.data?.errorUser) {
                setErrors(p => ({ ...p, identifier: error.response.data.errorUser }));
            };

            if (error.response?.data?.errorPassword) {
                setErrors(p => ({ ...p, password: error.response.data.errorPassword }));
            };
        }
    };


    return (
        <LinearGradient
            colors={["#F5D5ED", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <View style={styles.content}>

                    <Text style={styles.title}>
                        Welcome Back!
                    </Text>
                    <Text style={styles.subTitle}>
                        Enter your credentials to access your account and continue where you left off.
                    </Text>
                    <Image
                        source={require("../../../assets/images/main-images/arrow-signup-decoration.png")}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    <View style={styles.form}>
                        <FormInput
                            label="Identifier"
                            placeholder="johndoe"
                            value={userInfos.identifier}
                            onChangeText={(v: string) => setUserInfos(p => ({ ...p, identifier: v }))}
                            onFocus={() => handleFocus("identifier")}
                            error={errors.identifier}
                            icon="at-sign"
                        />
                        <FormInput
                            label="Password"
                            placeholder="••••••••"
                            value={userInfos.password}
                            onChangeText={(v: string) => setUserInfos(p => ({ ...p, password: v }))}
                            onFocus={() => handleFocus("password")}
                            error={errors.password}
                            icon="mail"
                            keyboardType="email-address"
                        />
                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Sign In</Text>
                            <Feather name="log-in" size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/signup')}>
                            <Text style={styles.linkText}>You don’t have an Account? <Text style={styles.linkTextBold}>Sign Up.</Text></Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { flex: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 28, marginBottom: 6, color: "#1E293B", fontFamily: "PlusJakartaSans_700Bold", fontWeight: "700" },
    subTitle: { fontSize: 15, color: "#475569", marginBottom: 16, fontFamily: "PlusJakartaSans_400Regular" },
    backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
    backText: { fontSize: 16, color: "#EC4899", marginLeft: 4, fontFamily: "PlusJakartaSans_400Regular", fontWeight: "600" },
    image: {
        alignSelf: "flex-start",
        width: 300,
        height: 80,
        marginBottom: 10
    },

    // Role cards
    roleCard: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "#FDF2F8", borderRadius: 12, padding: 16, marginBottom: 18,
        borderWidth: 1, borderColor: "#EC4899", color: "#0F172A", fontFamily: "PlusJakartaSans_500Medium", fontWeight: "600"
    },
    roleCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    roleCardText: { fontSize: 16, fontWeight: "500", fontFamily: "PlusJakartaSans_400Regular" },

    // Form
    form: { width: "100%" },
    formInput: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#333", fontFamily: "PlusJakartaSans_400Regular" },
    inputRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#fff", borderRadius: 40,
        borderWidth: 1.5, borderColor: "#CBD5E1", paddingHorizontal: 12, paddingVertical: 0
    },
    inputError: { borderColor: "#E53E3E" },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 16, padding: 14, color: "#475569", fontFamily: "PlusJakartaSans_400Regular" },
    errorText: { fontSize: 12, color: "#E53E3E", marginTop: 4 },

    // Button
    button: {
        backgroundColor: "#FFB6C1", borderRadius: 40, padding: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    link: {
        marginTop: 24,
        alignItems: "center"
    },
    linkText: {
        color: "#1E293B",
        fontSize: 16,
        fontFamily: "PlusJakartaSans_400Regular",
        fontWeight: "500"
    },
    linkTextBold: {
        fontWeight: "600",
        color: "#EC4899"
    }
});