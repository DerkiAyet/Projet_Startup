import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext } from "react";
import { AuthContext } from "./_layout";
import { LessonViewer } from "@/components/contentViewer";
import { Content, ContentComment, Exercise, Lesson } from "./types/Content";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

type Item = Lesson | Exercise;
export default function ContentDisplay() {
    const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

    const [topic, setTopic] = useState<any>(null);
    const [content, setContent] = useState<Content | null>(null);
    const [comments, setComments] = useState<ContentComment[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const link = type === "course"
            ? `/content/courses`
            : type === "assignment"
                ? `/content/assignments`
                : `/content/tips`;

        api.get(`${link}/${id}`)
            .then((res) => {
                setTopic(res.data);
                const content = res.data.course ?? res.data.assignment ?? res.data.topic;
                const items = content?.lessons ?? content?.exercises ?? [];
                setItems(items);
                setComments(res.data.comments ?? []);
                setContent(content);
            })
            .catch((err) => console.error(err?.response?.data))
            .finally(() => setLoading(false));   // ← always clear loading
    }, [id, type]);

    const { userAuth } = useContext(AuthContext)!;

     const dateOnly = content?.createdAt
        ? new Date(content.createdAt).toLocaleDateString()
        : null;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.indexHeader}>
                <View style={styles.userInfos}>
                    <View style={styles.parameter}>
                        <Feather name="bell" size={20} color={"#000"} />
                    </View>
                    {userAuth?.userImg ? (
                        <Image
                            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${userAuth.userImg}` }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userAuth?.givenName?.charAt(0).toUpperCase()}
                                {userAuth?.familyName?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.username}>
                            {userAuth?.givenName} {userAuth?.familyName}
                        </Text>
                        <Text style={styles.userRole}>{userAuth?.role}</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#F29DB6" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <View style={styles.contentHeader}>
                        <Text style={styles.contentTitle}>{content?.title}</Text>
                        <View style={styles.contentInfos}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Feather name="user" size={14} color="#831843" />
                                <Text style={styles.userRole}>
                                    {topic?.teacher?.givenName} {topic?.teacher?.familyName}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Feather name="calendar" size={14} color="#831843" />
                                <Text style={styles.userRole}>
                                    {dateOnly}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Feather name="message-circle" size={14} color="#831843" />
                                <Text style={styles.userRole}>
                                    {comments.length}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Feather name="star" size={14} color="#831843" />
                                <Text style={styles.userRole}>
                                    {content?.avgRating ? content.avgRating.toFixed(1) : "No ratings"}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flex: 1, width: "100%" }}>
                        <LessonViewer items={items} />
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        position: "relative",
        backgroundColor: "#F9FAFB",
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
    contentHeader: {
        width: "100%",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: "#FCE7F3",
        borderBottomWidth: 1,
        marginTop: 10,
        marginBottom: 16,
    },
    contentTitle: {
        fontSize: 18,
        fontWeight: "600",
        fontFamily: "Nunito_700Bold",
        marginBottom: -2,
        color: "#1E293B",
        textTransform: "capitalize",
    },
    contentInfos: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    }
});