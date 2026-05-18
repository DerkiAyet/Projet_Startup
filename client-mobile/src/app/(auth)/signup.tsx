import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { DateInput } from "@/components/datePicker";
import { FormInput } from "@/components/formInput";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from "../_layout";


type Role = "student" | "parent" | "";

export default function SignupScreen() {
    const [role, setRole] = useState<Role>("");
    const [step, setStep] = useState(0);
    const { setUserAuth } = useContext(AuthContext)!; // the ! tells TS it won't be null

    const router = useRouter()

    const [userInfos, setUserInfos] = useState({
        familyName: "",
        givenName: "",
        dateOfBirth: "",
        userName: "",
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        familyName: "",
        givenName: "",
        dateOfBirth: "",
        userName: "",
        email: "",
        password: "",
    });

    const handleFocus = (field: string) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const handleFirstStep = () => {
        const newErrors: Partial<typeof errors> = {};
        if (!userInfos.familyName.trim()) newErrors.familyName = "Enter your family name";
        if (!userInfos.givenName.trim()) newErrors.givenName = "Enter your given name";
        if (!userInfos.dateOfBirth.trim()) newErrors.dateOfBirth = "Enter your date of birth";

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            return;
        }
        setStep(1);
    };

    const handleSubmit = async () => {
        try {
            const newErrors: Partial<typeof errors> = {};
            if (!userInfos.userName.trim()) newErrors.userName = "Enter a username";
            if (!userInfos.email.trim()) newErrors.email = "Enter your email";
            if (!userInfos.password.trim()) newErrors.password = "Enter a password";

            if (Object.keys(newErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...newErrors }));
                return;
            }
            const { data } = await api.post('/auth/mobile/register', {
                role,
                familyName: userInfos.familyName,
                givenName: userInfos.givenName,
                DateOfBirth: userInfos.dateOfBirth,
                userName: userInfos.userName,
                email: userInfos.email,
                password: userInfos.password,
            });

            // Store tokens — from here on api.ts handles everything automatically
            await SecureStore.setItemAsync('accessToken', data.accessToken);
            await SecureStore.setItemAsync('refreshToken', data.refreshToken);

            setUserAuth({
                userId: data.userId,
                userName: userInfos.userName,
                familyName: userInfos.familyName,
                givenName: userInfos.givenName,
                userImg: "", 
                role
            });

            router.replace('/(auth)/interests');

        } catch (error: any) {
            console.log('STATUS:', error.response?.status);
            console.log('DATA:', error.response?.data);
            console.log('MESSAGE:', error.message);  

            if (error.response?.data?.errorEmail) {
                setErrors(p => ({ ...p, email: error.response.data.errorEmail }));
            };
        }
    }

    if (!role) {
        return (
            <LinearGradient
                colors={["#F5D5ED", "#ffffff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Who’s joining us today?</Text>
                        <Text style={styles.subTitle}>Choose your role to get started</Text>
                        <Image
                            source={require("../../../assets/images/main-images/arrow-signup-decoration.png")}
                            style={styles.image}
                            resizeMode="contain"
                        />
                        {(["student", "parent"] as Role[]).map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={styles.roleCard}
                                onPress={() => setRole(r)}
                            >
                                <View style={styles.roleCardLeft}>
                                    <Text style={styles.roleCardText}>
                                        {`${r.charAt(0).toUpperCase() + r.slice(1)} ${ r === "student" ? ": “Knowledge hunter.”" : ": “The guardian of progress.”"}`}
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#999" />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign In.</Text></Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (step === 0) {
        return (
            <LinearGradient
                colors={["#F5D5ED", "#ffffff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                    <View style={styles.content}>
                        <TouchableOpacity style={styles.backRow} onPress={() => setRole("")}>
                            <Feather name="chevron-left" size={22} color="#EC4899" />
                            <Text style={styles.backText}>Choose different role</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Start your journey</Text>
                        <Text style={styles.subTitle}>Every journey starts with a little information. Enter your details to get started!</Text>

                        <View style={styles.form}>
                            <FormInput
                                label="Family Name"
                                placeholder="Doe"
                                value={userInfos.familyName}
                                onChangeText={(v: string) => setUserInfos(p => ({ ...p, familyName: v }))}
                                onFocus={() => handleFocus("familyName")}
                                error={errors.familyName}
                                icon="user"
                            />
                            <FormInput
                                label="Given Name"
                                placeholder="John"
                                value={userInfos.givenName}
                                onChangeText={(v: string) => setUserInfos(p => ({ ...p, givenName: v }))}
                                onFocus={() => handleFocus("givenName")}
                                error={errors.givenName}
                                icon="user"
                            />
                            <DateInput
                                label="Date of Birth"
                                value={userInfos.dateOfBirth}
                                onChange={(v) => {
                                    setUserInfos(p => ({ ...p, dateOfBirth: v }));
                                    setErrors(p => ({ ...p, dateOfBirth: "" }));
                                }}
                                error={errors.dateOfBirth}
                            />

                            <TouchableOpacity style={styles.button} onPress={handleFirstStep}>
                                <Text style={styles.buttonText}>Next</Text>
                                <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/login')}>
                                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign In.</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // ── Step 1 — Credentials ────────────────────────────────────────
    return (
        <LinearGradient
            colors={["#F5D5ED", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.backRow} onPress={() => setStep(0)}>
                        <Feather name="chevron-left" size={22} color="#EC4899" />
                        <Text style={styles.backText}>Go back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                        {role === "student" ? "Welcome, Explorer" : "Welcome, Supporter"}
                    </Text>
                    <Text style={styles.subTitle}>
                        {role === "student" ? " Your journey of growth starts now." : "Let’s support your child’s learning, together."}
                    </Text>

                    <View style={styles.form}>
                        <FormInput
                            label="Username"
                            placeholder="johndoe"
                            value={userInfos.userName}
                            onChangeText={(v: string) => setUserInfos(p => ({ ...p, userName: v }))}
                            onFocus={() => handleFocus("userName")}
                            error={errors.userName}
                            icon="at-sign"
                        />
                        <FormInput
                            label="Email"
                            placeholder="john@example.com"
                            value={userInfos.email}
                            onChangeText={(v: string) => setUserInfos(p => ({ ...p, email: v }))}
                            onFocus={() => handleFocus("email")}
                            error={errors.email}
                            icon="mail"
                            keyboardType="email-address"
                        />
                        <FormInput
                            label="Password"
                            placeholder="••••••••"
                            value={userInfos.password}
                            onChangeText={(v: string) => setUserInfos(p => ({ ...p, password: v }))}
                            onFocus={() => handleFocus("password")}
                            error={errors.password}
                            icon="lock"
                            secureTextEntry
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Sign Up</Text>
                            <Feather name="log-in" size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign In.</Text></Text>
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