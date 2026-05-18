import { useContext, useEffect, useState } from "react";
import { View, StyleSheet, Text, TextInput, Pressable, ActivityIndicator, FlatList } from "react-native";
import { AuthContext } from "../_layout";
import { Feather } from "@expo/vector-icons"
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import { Content } from "../types/Content";
import { ContentCard } from "@/components/contentCard";

interface Category {
  idSubject: number;
  name: string;
  subImg: string;
}

export default function Search() {
  const { userAuth } = useContext(AuthContext)!

  const contentCats = ["Courses", "Assignments", "Quizes", "Tips"]
  const [selectedContentCat, setSelectedContentCat] = useState("Courses")
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    api.get("/auth/infos/get-subjects")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, [])
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.find(c => c.idSubject === cat.idSubject)
        ? prev.filter(c => c.idSubject !== cat.idSubject)
        : [...prev, cat]
    )
  }

  const [courses, setCourses] = useState<Content[]>([])
  const [assignments, setAssignments] = useState<Content[]>([])
  const [tips, setTips] = useState<Content[]>([])

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const courseRes = await api.get('/content/courses/recommended/me')
        setCourses(courseRes.data)

        const assignRes = await api.get('/content/assignments/recommended/me')
        setAssignments(assignRes.data)

      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const [searchResults, setSearchResults] = useState<Content[]>([])
  const [search, setSearch] = useState(false)

  const handleSearch = async () => {

    setSearch(true)
    setCategoriesModalOpen(false)
    setLoading(true)
    setSearchResults([])
    setCourses([])
    setAssignments([])
    setTips([])

    const categoryIds = selectedCategories.map(cat => cat.idSubject);
    const subcategoryNames = searchQuery.trim().split(/\s+/).filter(Boolean);

    const params = new URLSearchParams();
    params.set("title", searchQuery);
    if (subcategoryNames.length) params.set("subCategoryName", subcategoryNames.join(","));
    if (categoryIds.length) params.set("categoryId", categoryIds.join(","));
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      const request = api.get(`/content/courses/search?${params.toString()}`);

      const [res] = await Promise.all([request, minDelay]);
      const data = res.data;

      const filtered = {
        courses: data.filter((i: Content) => i.typeContent === "course"),
        assignments: data.filter((i: Content) => i.typeContent === "assignment"),
        tips: data.filter((i: Content) => i.typeContent === "tip")
      };

      setSearchResults(data);
      setCourses(filtered.courses);
      setAssignments(filtered.assignments);
      setTips(filtered.tips);

    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }

  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.indexHeader}>
        <View style={styles.userInfos}>
          <View style={styles.parameter}>
            <Feather name="bell" size={20} color={"#000"} />
          </View>
          {
            userAuth.userImg ? (
              userAuth.userImg && <Image source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${userAuth.userImg}` }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{userAuth.givenName.charAt(0).toUpperCase()}{userAuth.familyName.charAt(0).toUpperCase()}</Text>
              </View>
            )
          }
          <View>
            <Text style={styles.username}>{userAuth.givenName} {userAuth.familyName}</Text>
            <Text style={styles.userRole}>{userAuth.role}</Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        <Pressable onPress={() => setCategoriesModalOpen(false)} style={{ position: "absolute", bottom: 0, top: 0, left: 0, right: 0 }} />
        <View style={styles.searchMainContainer}>
          <View style={styles.searchWrapper}>
            <Feather name="search" size={20} color="#8E8E8E" />
            <TextInput
              placeholder="Search..."
              style={[styles.searchInput, categoriesModalOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
              value={searchQuery}
              onChangeText={(v: string) => setSearchQuery(v)}
              onFocus={() => setCategoriesModalOpen(true)}
            />
            <Pressable onPress={handleSearch} style={styles.searchBtn}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Search</Text>
            </Pressable>
          </View>
          {categoriesModalOpen &&
            <View style={styles.dropDown}>
              {categories.map(c => (
                <Pressable key={c.idSubject} onPress={() => toggleCategory(c)}>
                  <View style={[styles.catChip, selectedCategories.find(sc => sc.idSubject === c.idSubject) && styles.selectedCatChip]}>
                    <Text style={[styles.catText, selectedCategories.find(sc => sc.idSubject === c.idSubject) && styles.selectedCatText]}>{c.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>}
        </View>
        <View style={styles.coursesView}>
          <FlatList
            data={
              selectedContentCat === "Courses" ? courses :
                selectedContentCat === "Assignments" ? assignments :
                  tips
            }
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ContentCard content={item} typeView={selectedContentCat} />
            )}
            ListHeaderComponent={
              <>
                <View style={styles.contentCatsShadow}>
                  <View style={styles.contentCats}>
                    {contentCats.map((cat) => (
                      <Pressable key={cat} onPress={() => setSelectedContentCat(cat)}>
                        <View style={[styles.contentChip, selectedContentCat === cat && styles.selectedContentChip]}>
                          <Text style={[styles.contentText, selectedContentCat === cat && styles.selectedContentText]}>
                            {cat}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Text style={styles.suggestionLine}>Suggested for you~</Text>
                {loading && <ActivityIndicator size="large" color="#F29DB6" />}
              </>
            }
            ListEmptyComponent={
              !loading ? (
                <Text style={{ textAlign: "center", color: "#8E8E8E", marginTop: 32 }}>
                  No {selectedContentCat.toLowerCase()} found
                </Text>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  indexHeader: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D9E1E7",
    backgroundColor: "#fff",
  },
  userInfos: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  parameter: {
    padding: 5,
    borderColor: "#D9E1E7",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: -6,
  },
  userRole: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#000",
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  searchMainContainer: {
    minWidth: "90%",
    maxWidth: "100%",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#D9E1E7",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    fontSize: 15,
    color: "#1E293B",
    fontFamily: "PlusJakartaSans_400Regular",
  },
  dropDown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    minWidth: "100%",
    borderColor: "#D9E1E7",
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 1,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: "#D9E1E7",
    borderWidth: 1,
    borderRadius: 20,
  },
  catText: {
    fontSize: 14,
    color: "#1E293B",
    fontFamily: "PlusJakartaSans_400Regular"
  },
  selectedCatChip: {
    backgroundColor: "#fffafb",
    borderColor: "#f5c6d4",
  },
  selectedCatText: {
    color: "#4A4A4A",
    fontWeight: "500",
  },
  coursesView: {
    flex: 1,
    width: "100%",
    paddingTop: 10,
    paddingHorizontal: 3,
  },
  searchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F29DB6",
    borderRadius: 20,
  },
  suggestionLine: {
    fontSize: 15,
    color: "#8E8E8E",
    marginBottom: 10,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  contentCatsShadow: {
    alignSelf: "flex-start",
    borderRadius: 5,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#fff",
  },
  contentCats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    overflow: "hidden",
  },
  contentChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "transparent",
    borderRadius: 5,
  },
  contentText: {
    fontSize: 14,
    color: "#1E293B",
    fontFamily: "PlusJakartaSans_400Regular"
  },
  selectedContentChip: {
    backgroundColor: "#F29DB6",
  },
  selectedContentText: {
    color: "#fff",
    fontWeight: "500",
  },

});
