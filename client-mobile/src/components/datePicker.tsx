import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function DateInput({ label, value, onChange, error }: {
    label: string; value: string; onChange: (v: string) => void; error?: string;
}) {
    const [show, setShow] = useState(false);
    const parsed = value ? new Date(value) : null;
    const [day, setDay] = useState(parsed?.getDate() ?? 1);
    const [month, setMonth] = useState(parsed?.getMonth() ?? 0);
    const [year, setYear] = useState(parsed?.getFullYear() ?? 2000);

    const confirm = () => {
        const d = String(day).padStart(2, "0");
        const m = String(month + 1).padStart(2, "0");
        onChange(`${year}-${m}-${d}`);
        setShow(false);
    };

    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[styles.inputRow, error ? styles.inputError : null]}
                onPress={() => setShow(true)}
            >
                <Feather name="calendar" size={18} color="#999" style={styles.inputIcon} />
                <Text style={[styles.input, { paddingVertical: 14 }, !value && { color: "#999" }]}>
                    {value || "Select date of birth"}
                </Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Modal visible={show} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" }}>
                    <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        
                        {/* Header */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                            <TouchableOpacity onPress={() => setShow(false)}>
                                <Text style={{ color: "#999", fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E293B" }}>Date of Birth</Text>
                            <TouchableOpacity onPress={confirm}>
                                <Text style={{ color: "#EC4899", fontSize: 16, fontWeight: "600" }}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Picker columns */}
                        <View style={{ flexDirection: "row", height: 200 }}>
                            {/* Day */}
                            <ScrollColumn
                                items={DAYS.map(String)}
                                selected={day - 1}
                                onSelect={(i) => setDay(i + 1)}
                            />
                            {/* Month */}
                            <ScrollColumn
                                items={MONTHS}
                                selected={month}
                                onSelect={setMonth}
                            />
                            {/* Year */}
                            <ScrollColumn
                                items={YEARS.map(String)}
                                selected={YEARS.indexOf(year)}
                                onSelect={(i) => setYear(YEARS[i])}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function ScrollColumn({ items, selected, onSelect }: {
    items: string[]; selected: number; onSelect: (i: number) => void;
}) {
    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {items.map((item, i) => (
                <TouchableOpacity
                    key={item}
                    onPress={() => onSelect(i)}
                    style={{
                        paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: selected === i ? "#FDF2F8" : "transparent",
                        borderRadius: 8,
                    }}
                >
                    <Text style={{
                        fontSize: 16,
                        color: selected === i ? "#EC4899" : "#475569",
                        fontWeight: selected === i ? "600" : "400",
                    }}>
                        {item}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
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