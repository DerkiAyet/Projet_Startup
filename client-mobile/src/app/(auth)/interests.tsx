import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import api from "@/lib/api";
import { AuthContext } from "../_layout";
import { LinearGradient } from "expo-linear-gradient";

const MIN_SELECTION = 1;

// Type for a category from your API
interface Category {
  idSubject: number;
  name: string;
  subImg: string;
}

export default function InterestsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const router = useRouter();
  const { userAuth } = useContext(AuthContext)!;

  useEffect(() => {
    api.get("/auth/infos/get-subjects")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    try {
      await api.post("/users/infos/student/interests", {
        interests: [...selected],
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);
      console.log('MESSAGE:', error.message);
      console.error(error);
      console.log([...selected]);
    }
  };

  const canContinue = selected.size >= MIN_SELECTION;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick at least{" "}
          <Text style={styles.accent}>{MIN_SELECTION} categor{MIN_SELECTION > 1 ? "ies" : "y"}</Text>
          {" "}and we'll personalise your experience.
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.idSubject.toString()}
        numColumns={2}                    
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.idSubject);
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggle(item.idSubject)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: `http://10.0.2.2:8082/auth/uploads/${item.subImg}` }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              {/* Dark gradient overlay */}
              <LinearGradient
                colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.35)"]}
                style={styles.overlay}
              />

              <Text style={styles.cardName}>{item.name}</Text>

              {/* Check badge */}
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.selectionCount}>
          {selected.size > 0
            ? `${selected.size} selected${selected.size < MIN_SELECTION ? ` — pick ${MIN_SELECTION - selected.size} more` : ""}`
            : "Nothing selected yet"}
        </Text>
        <TouchableOpacity
          style={[styles.continueBtn, canContinue && styles.continueBtnActive]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Text style={[styles.continueBtnText, canContinue && styles.continueBtnTextActive]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf6f9",
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "Nunito_400Regular",
    lineHeight: 20,
  },
  accent: {
    color: "#F29DB6",
    fontFamily: "Nunito_700Bold",
  },

  grid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  card: {
    width: "48%",
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#D9E1E7",
    backgroundColor: "#fff",
    justifyContent: "flex-end",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#EC4899",
    shadowColor: "#F29DB6",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },

  cardName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Nunito_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1.5,
    borderTopColor: "#D9E1E7",
    backgroundColor: "#fff",
  },
  selectionCount: {
    fontSize: 13,
    color: "#8A8A8A",
    fontFamily: "Nunito_400Regular",
    fontWeight: "600",
  },

  continueBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#D9E1E7",
  },
  continueBtnActive: {
    backgroundColor: "#F29DB6",
    shadowColor: "#F29DB6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Nunito_700Bold",
    color: "#A6A6A6",             // disabled state
  },
  continueBtnTextActive: {
    color: "#fff",
  },
});