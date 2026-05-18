import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Like, Post } from "@/app/types/Post";
import { useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "@/app/_layout";
import { formatTimeAgo } from "@/lib/date-helper";
import { Feather, AntDesign } from "@expo/vector-icons";
import api from "@/lib/api";

export function PostCard({ post, setPosts, openComments }: { post: Post; setPosts: React.Dispatch<React.SetStateAction<Post[]>>, openComments: (postId: string) => void }) {
    const { userAuth } = useContext(AuthContext)!;
    const isOwnPost = post.user.userId === userAuth.userId;
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        if (!post.mediaUrl) return;

        const fetchImage = async () => {
            try {
                const response = await api.get(`/posts/uploads/${post.mediaUrl}`, {
                    responseType: "arraybuffer",
                });

                const base64 = btoa(
                    new Uint8Array(response.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte), ""
                    )
                );

                const mimeType = response.headers["content-type"] ?? "image/jpeg";
                setImageUri(`data:${mimeType};base64,${base64}`);
            } catch (err) {
                console.error("Failed to fetch image:", err);
            }
        };

        fetchImage();
    }, [post.mediaUrl]);

    const isLiked = post.likes.some((l) => l.userId === userAuth.userId);

    const toggleLike = async () => {
        try {
            const res = await api.post(
                    `/posts/${post._id}/like`,
                    {},
                    { headers: { "Content-Type": "application/json" } }
                );
            const updatedLikes = res.data.likes;
            const updatedLikesCount = updatedLikes.length;

            setPosts((prev) =>
                prev.map((p) =>
                    p._id === post._id
                        ? { ...p, likes: updatedLikes, likesCount: updatedLikesCount }
                        : p
                )
            );
        } catch (error: any) {
            console.error("Error toggling like:", error);
            console.log(error.message)
        }

    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfos}>
                    {post.user.userImg ? (
                        <Image source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${post.user.userImg}` }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>{post.user.givenName.charAt(0).toUpperCase()}{post.user.familyName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.username}>
                            {isOwnPost ? "You" : `@${post.user.userName}`}
                        </Text>
                        <Text style={styles.time}>
                            {formatTimeAgo(post.createdAt)}
                        </Text>
                    </View>
                </View>
                <Feather name="more-horizontal" size={20} color="#000" />
            </View>

            {
                post.mediaUrl ? (
                    <View style={styles.postContentWithMedia}>
                        {imageUri && (
                            <Image source={{ uri: imageUri }} style={styles.postImg} contentFit="cover" />
                        )}
                        <Text style={styles.postText}>{post.content}</Text>
                    </View>
                ) : (
                    <Text style={styles.postTextWithMedia}>{post.content}</Text>
                )
            }
            <View style={styles.postActions}>
                <View style={styles.postSingleAction}>
                    {
                        <Pressable onPress={() => toggleLike()}>
                            {isLiked ? (
                                <AntDesign name="heart" size={22} color="#EC4899" />
                            ) : (
                                <Feather name="heart" size={22} color="#832243" />

                            )}
                        </Pressable>
                    }
                    <Text style={styles.postActionText}>{post.likesCount}</Text>
                </View>
                <View style={styles.postSingleAction}>
                    <Pressable onPress={() => openComments(post._id)}>
                         <Feather name="message-circle" size={22} color="#831843" />
                    </Pressable>
                    <Text style={styles.postActionText}>{post.commentsCount}</Text>
                </View>
                <View style={styles.postSingleAction}>
                    <Feather name="share-2" size={22} color="#831843" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 16,
        elevation: 2,
        borderBottomColor: "#D9E1E7",
        borderBottomWidth: 1.5,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingBottom: 0,
    },
    userInfos: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
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
        fontSize: 16,
        fontWeight: "600",
        color: "#1E293B",
    },
    time: {
        fontSize: 12,
        color: "#666",
    },
    postImg: {
        width: "100%",
        height: 200,
        marginBottom: 12,
        borderRadius: 8,
    },
    postContentWithMedia: {
        marginTop: 12,
        width: "100%",
        paddingHorizontal: 16,
    },
    postText: {
        marginTop: 12,
        marginBottom: 12,
        fontFamily: "DMSans_500Medium",
        fontSize: 14,
    },
    postTextWithMedia: {
        marginTop: 12,
        marginBottom: 12,
        fontFamily: "DMSans_500Medium",
        fontSize: 16,
        color: "#000",
        lineHeight: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    postActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 16,
    },
    postSingleAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    postActionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#831843",
    }
});  
