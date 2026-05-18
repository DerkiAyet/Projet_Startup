import { useState, useEffect, useContext } from "react";
import {
    View, Text, StyleSheet, Pressable, TouchableOpacity, ScrollView
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import { Content } from "@/app/types/Content";
import { AuthContext } from "@/app/_layout";

// ─── Thumbnail hook ────────────────────────────────────────────────────────────

function useThumbnail(thumbnailUrl: string | undefined | null) {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        if (!thumbnailUrl) return;

        // extract just the path after the base so our api instance handles auth + baseURL
        // thumbnail comes as full URL like http://localhost:3000/content/uploads/xyz.jpg
        // we strip everything before /content/uploads or /auth/uploads
        const match = thumbnailUrl.match(/(\/(?:content|auth)\/uploads\/.+)/);
        const path = match?.[1];
        if (!path) return;

        let cancelled = false;

        api.get(path, { responseType: "arraybuffer" })
            .then((res) => {
                if (cancelled) return;
                const base64 = btoa(
                    new Uint8Array(res.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte), ""
                    )
                );
                const mimeType = res.headers["content-type"] ?? "image/jpeg";
                setUri(`data:${mimeType};base64,${base64}`);
            })
            .catch((err) => console.error("Failed to fetch thumbnail:", err));

        return () => { cancelled = true; };
    }, [thumbnailUrl]);

    return uri;
}

// ─── Star rating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
    return (
        <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Feather
                    key={i}
                    name="star"
                    size={13}
                    color={i <= Math.round(rating) ? "#F5A623" : "#D9E1E7"}
                />
            ))}
            <Text style={s.ratingVal}>{rating.toFixed(1)}</Text>
        </View>
    );
}

// ─── ContentCard ───────────────────────────────────────────────────────────────

export function ContentCard({
    content,
    typeView,
}: {
    content: Content;
    typeView: string;
}) {
    const { userAuth } = useContext(AuthContext)!;
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const thumbnailUri = useThumbnail(content.thumbnail);

    const items =
        typeView === "Courses"
            ? content.lessons ?? []
            : typeView === "Assignments"
                ? content.exercises ?? []
                : [];

    const handleEnroll = async () => {
        try {
            await api.post(`/content/activity/enrollements/${content._id}`, {});
            router.push(`/contentDisplay?id=${content._id}&type=course`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGoTo = () => {
        const type = typeView === "Courses" ? "course" : "assignment";
        router.push(`/contentDisplay?id=${content._id}&type=${type}`);
    };

    return (
        <Pressable
            onPress={() => setExpanded((p) => !p)}
            style={[s.card, expanded && s.cardExpanded]}
        >
            <View style={s.topRow}>
                {/* Thumbnail */}
                <View style={s.thumbBox}>
                    {thumbnailUri ? (
                        <Image source={{ uri: thumbnailUri }} style={s.thumb} contentFit="cover" />
                    ) : (
                        <View style={[s.thumb, s.thumbFallback]}>
                            <Feather name="image" size={28} color="#D9E1E7" />
                        </View>
                    )}
                </View>

                <View style={s.infoBox}>
                    <Text style={s.title} numberOfLines={2}>{content.title}</Text>
                    <Text style={[s.catLabel, { color: `#${content.category.color}` }]}>
                        {content.category.name}
                        {content.subCategory ? ` - ${content.subCategory.name}` : ""}
                    </Text>
                    <Text style={s.instructor}>
                        {content.teacher.givenName} {content.teacher.familyName}
                    </Text>

                    {/* Feature chips */}
                    <View style={s.chipsRow}>
                        <View style={s.chip}>
                            <Feather name="bar-chart-2" size={11} color="#8A8A8A" />
                            <Text style={s.chipText}>{content.level}</Text>
                        </View>
                        <View style={s.chip}>
                            <Feather name="users" size={11} color="#8A8A8A" />
                            <Text style={s.chipText}>
                                {typeView === "Courses"
                                    ? `${content.enrollCount} enrolled`
                                    : typeView === "Assignments"
                                        ? `${content.solveCount} solved`
                                        : "Viewed"}
                            </Text>
                        </View>
                        <View style={s.chip}>
                            <Feather name="message-circle" size={11} color="#8A8A8A" />
                            <Text style={s.chipText}>{content.commentsCount}</Text>
                        </View>
                        {typeView !== "Tips" && (
                            <View style={s.chip}>
                                <Feather name="book-open" size={11} color="#8A8A8A" />
                                <Text style={s.chipText}>
                                    {items.length} {typeView === "Courses" ? "lessons" : "exercises"}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Chevron */}
                <Feather
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#8A8A8A"
                    style={{ alignSelf: "center" }}
                />
            </View>

            {/* ── Expanded section ── */}
            {expanded && (
                <View style={s.expandedSection}>
                    <View style={s.divider} />

                    <StarRating rating={content.avgRating} />

                    <Text style={s.description}>{content.description}</Text>

                    {/* Tags */}
                    {content.tags.length > 0 && (
                        <View style={s.tagsRow}>
                            {content.tags.map((tag, i) => (
                                <View key={i} style={s.tagPill}>
                                    <Text style={s.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Lessons / Exercises list */}
                    {typeView !== "Tips" && items.length > 0 && (
                        <View style={s.lessonsList}>
                            <Text style={s.lessonsTitle}>
                                {typeView === "Courses" ? "Lessons" : "Exercises"}
                            </Text>
                            {items.slice(0, 5).map((item, i) => (
                                <View key={i} style={s.lessonRow}>
                                    <View style={s.lessonBadge}>
                                        <Text style={s.lessonBadgeText}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.lessonTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                </View>
                            ))}
                            {items.length > 5 && (
                                <Text style={s.moreItems}>+{items.length - 5} more</Text>
                            )}
                        </View>
                    )}

                    {/* CTA button */}
                    {typeView === "Courses" ? (
                        userAuth.role === "student" ? (
                            <TouchableOpacity style={s.enrollBtn} onPress={handleEnroll}>
                                <Text style={s.enrollBtnText}>Enroll Now</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={s.enrollBtn} onPress={handleGoTo}>
                                <Text style={s.enrollBtnText}>View Course</Text>
                            </TouchableOpacity>
                        )
                    ) : typeView === "Assignments" ? (
                        userAuth.role === "student" ? (
                            <TouchableOpacity style={s.enrollBtn} onPress={handleGoTo}>
                                <Text style={s.enrollBtnText}>Solve Now</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={s.enrollBtn} onPress={handleGoTo}>
                                <Text style={s.enrollBtnText}>View Assignment</Text>
                            </TouchableOpacity>
                        )
                    ) : null}
                </View>
            )}
        </Pressable>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    card: {
        borderWidth: 1.5,
        borderColor: "#D9E1E7",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    cardExpanded: {
        borderColor: "#F29DB6",
        shadowColor: "#F29DB6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    topRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    thumbBox: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: "hidden",
        flexShrink: 0,
    },
    thumb: {
        width: "100%",
        height: "100%",
    },
    thumbFallback: {
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },
    infoBox: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1E293B",
        fontFamily: "PlusJakartaSans_500Medium",
    },
    catLabel: {
        fontSize: 12,
        fontFamily: "PlusJakartaSans_400Regular",
    },
    instructor: {
        fontSize: 11,
        color: "#8A8A8A",
        fontFamily: "PlusJakartaSans_400Regular",
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 4,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
    },
    chipText: {
        fontSize: 10,
        color: "#8A8A8A",
        fontFamily: "PlusJakartaSans_400Regular",
    },

    // expanded
    expandedSection: {
        gap: 10,
        marginTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: "#D9E1E7",
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingVal: {
        fontSize: 11,
        color: "#8A8A8A",
        marginLeft: 4,
        fontFamily: "PlusJakartaSans_400Regular",
    },
    description: {
        fontSize: 12,
        color: "#8A8A8A",
        lineHeight: 18,
        fontFamily: "PlusJakartaSans_400Regular",
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
    },
    tagPill: {
        backgroundColor: "#fce4ec",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 11,
        color: "#F29DB6",
        fontWeight: "600",
    },
    lessonsList: {
        gap: 6,
    },
    lessonsTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: 2,
        fontFamily: "PlusJakartaSans_500Medium",
    },
    lessonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    lessonBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#F29DB6",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    lessonBadgeText: {
        fontSize: 10,
        color: "#fff",
        fontWeight: "700",
    },
    lessonTitle: {
        flex: 1,
        fontSize: 12,
        color: "#8A8A8A",
        fontFamily: "PlusJakartaSans_400Regular",
    },
    moreItems: {
        fontSize: 11,
        color: "#F29DB6",
        fontWeight: "600",
        marginTop: 2,
    },
    enrollBtn: {
        backgroundColor: "#F29DB6",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 4,
    },
    enrollBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        fontFamily: "PlusJakartaSans_500Medium",
    },
});