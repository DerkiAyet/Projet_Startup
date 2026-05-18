import { View, Text, TextInput, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export function FormInput({
    label, placeholder, value, onChangeText, onFocus, error, icon, secureTextEntry = false, keyboardType = "default"
}: any) {
    return (
        <View style={styles.formInput}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
                <Feather name={icon} size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
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
});