import React, { useContext, useEffect, useRef, useState } from "react";
import {
    View, Text, StyleSheet, Modal, Pressable, TextInput,
    FlatList, KeyboardAvoidingView, Platform, TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Feather, AntDesign } from "@expo/vector-icons";
import api from "@/lib/api";
import { Comment, Post } from "@/app/types/Post";
import { AuthContext } from "@/app/_layout";
import { formatTimeAgo } from "@/lib/date-helper";

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
    comment,
    postId,
    onReplyAdded,
}: {
    comment: Comment;
    postId: string;
    onReplyAdded: (commentId: string, reply: Comment) => void;
}) {
    const { userAuth } = useContext(AuthContext)!;
    const [isLiked, setIsLiked] = useState(
        comment.likes?.some((l: any) => l.userId === userAuth.userId) ?? false
    );
    const [likesCount, setLikesCount] = useState(comment.likes?.length ?? 0);
    const [showReplies, setShowReplies] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState<Comment[]>(comment.replies ?? []);

    const toggleLike = async () => {
        try {
            const res = await api.post(`/posts/${postId}/comment/${comment._id}/like`, {});
            const updatedComment = res.data.comments?.find(
                (c: Comment) => c._id === comment._id
            );
            const nowLiked =
                updatedComment?.likes?.some((l: any) => l.userId === userAuth.userId) ?? false;
            setIsLiked(nowLiked);
            setLikesCount(updatedComment?.likes?.length ?? likesCount);
        } catch (err) {
            console.error(err);
        }
    };

    const submitReply = async () => {
        if (!replyText.trim()) return;
        try {
            const res = await api.post(
                `/posts/${postId}/comment/${comment._id}/reply`,
                { text: `@${comment.userName} ${replyText}` }
            );
            const newReply: Comment = {
                _id: res.data._id ?? Date.now().toString(),
                text: `@${comment.userName} ${replyText}`,
                userName: userAuth.userName,
                familyName: userAuth.familyName,
                givenName: userAuth.givenName,
                userImg: userAuth.userImg,
                userId: userAuth.userId,
                role: userAuth.role,
                likes: [],
                replies: [],
                createdAt: new Date().toISOString(),
            };
            setReplies((prev) => [...prev, newReply]);
            onReplyAdded(comment._id, newReply);
            setReplyText("");
            setReplyOpen(false);
            setShowReplies(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <View style={cs.row}>
            {/* Avatar */}
            {comment.userImg ? (
                <Image
                    source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${comment.userImg}` }}
                    style={cs.avatar}
                />
            ) : (
                <View style={[cs.avatar, cs.avatarFallback]}>
                    <Text style={cs.avatarText}>
                        {comment.givenName?.charAt(0).toUpperCase()}
                        {comment.familyName?.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}

            {/* Body */}
            <View style={cs.body}>
                <Text style={cs.username}>{comment.userName}</Text>
                <Text style={cs.commentText}>{comment.text}</Text>

                <View style={cs.actionsRow}>
                    {comment.createdAt && (
                        <Text style={cs.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
                    )}
                    <TouchableOpacity onPress={() => setReplyOpen((p) => !p)}>
                        <Text style={cs.actionBtn}>Reply</Text>
                    </TouchableOpacity>
                    {replies.length > 0 && (
                        <TouchableOpacity onPress={() => setShowReplies((p) => !p)}>
                            <Text style={cs.actionBtn}>
                                {showReplies ? "Hide replies" : `View replies (${replies.length})`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Nested replies */}
                {showReplies && replies.map((r) => (
                    <View key={r._id} style={cs.replyWrap}>
                        <CommentItem
                            comment={r}
                            postId={postId}
                            onReplyAdded={onReplyAdded}
                        />
                    </View>
                ))}

                {/* Reply input */}
                {replyOpen && (
                    <View style={cs.replyInputRow}>
                        <TextInput
                            style={cs.replyInput}
                            placeholder={`Reply to @${comment.userName}…`}
                            placeholderTextColor="#8E8E8E"
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />
                        <TouchableOpacity onPress={submitReply}>
                            <Text style={cs.postBtn}>Post</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Like */}
            <TouchableOpacity onPress={toggleLike} style={cs.likeBtn}>
                {isLiked ? (
                    <AntDesign name="heart" size={16} color="#EC4899" />
                ) : (
                    <Feather name="heart" size={16} color="#8E8E8E" />
                )}
                {likesCount > 0 && <Text style={cs.likeCount}>{likesCount}</Text>}
            </TouchableOpacity>
        </View>
    );
}

// ─── CommentsSection ──────────────────────────────────────────────────────────

export function CommentsSection({
    postId,
    comments: initialComments,
    modalVisible,
    handleClose,
    setPosts,
}: {
    postId: string;
    comments: Comment[];
    modalVisible: boolean;
    handleClose: () => void;
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}) {
    const { userAuth } = useContext(AuthContext)!;
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const handleReplyAdded = (commentId: string, reply: Comment) => {
        setComments((prev) =>
            prev.map((c) =>
                c._id === commentId
                    ? { ...c, replies: [...(c.replies ?? []), reply] }
                    : c
            )
        );
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/posts/${postId}/comment`, { text: commentText });
            const newComment: Comment = {
                _id: res.data._id ?? Date.now().toString(), // I can't fetch the real id in backend but only pass the whole modified post with the new comment, so for now we generate a temporary id for the new comment until we get the real one from backend
                text: commentText,
                userName: userAuth.userName,
                familyName: userAuth.familyName,
                givenName: userAuth.givenName,
                userImg: userAuth.userImg,
                userId: userAuth.userId,
                role: userAuth.role,
                likes: [],
                replies: [],
                createdAt: new Date().toISOString(),
            };
            setComments((prev) => [...prev, newComment]);
            setPosts((prev) =>
                prev.map((p) =>
                    p._id === postId
                        ? {
                            ...p,
                            comments: [...comments, newComment],
                            commentsCount: p.commentsCount + 1,
                        }
                        : p
                )
            );
            setCommentText("");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <Pressable style={ss.backdrop} onPress={handleClose} />

            {/* Sheet */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={ss.kvWrap}
            >
                <View style={ss.sheet}>
                    {/* Drag bar */}
                    <View style={ss.dragBar} />

                    {/* Title */}
                    <Text style={ss.title}>Comments</Text>

                    {/* List */}
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <CommentItem
                                comment={item}
                                postId={postId}
                                onReplyAdded={handleReplyAdded}
                            />
                        )}
                        ListEmptyComponent={
                            <Text style={ss.empty}>No comments yet. Be the first!</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 12 }}
                    />

                    {/* Input bar */}
                    <View style={ss.inputBar}>
                        {userAuth.userImg ? (
                            <Image
                                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${userAuth.userImg}` }}
                                style={ss.inputAvatar}
                            />
                        ) : (
                            <View style={[ss.inputAvatar, ss.avatarFallback]}>
                                <Text style={ss.avatarText}>
                                    {userAuth.givenName?.charAt(0).toUpperCase()}
                                    {userAuth.familyName?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <TextInput
                            style={ss.input}
                            placeholder="Add a comment…"
                            placeholderTextColor="#8E8E8E"
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity onPress={submitComment} disabled={!commentText.trim()}>
                            <Text style={[ss.postBtn, !commentText.trim() && ss.postBtnDisabled]}>
                                Post
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
    row: { flexDirection: "row", gap: 10, paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: "#D9E1E7", alignItems: "flex-start" },
    avatar: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
    avatarFallback: { backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontSize: 13, fontWeight: "500" },
    body: { flex: 1, gap: 3 },
    username: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
    commentText: { fontSize: 14, color: "#444", lineHeight: 20 },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
    timeAgo: { fontSize: 11, color: "#8E8E8E" },
    actionBtn: { fontSize: 12, color: "#8E8E8E", fontWeight: "500" },
    replyWrap: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#D9E1E7" },
    replyInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    replyInput: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, color: "#000" },
    postBtn: { color: "#0095F6", fontWeight: "600", fontSize: 13 },
    likeBtn: { alignItems: "center", gap: 2, paddingTop: 2 },
    likeCount: { fontSize: 11, color: "#8E8E8E" },
});

const ss = StyleSheet.create({
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 199 },
    kvWrap: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 200 },
    sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: "80%", minHeight: 500, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 10 },
    dragBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D9E1E7", alignSelf: "center", marginBottom: 8 },
    title: { textAlign: "center", fontSize: 15, fontWeight: "600", color: "#8E8E8E", paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: "#D9E1E7", marginHorizontal: 16 },
    empty: { textAlign: "center", color: "#8E8E8E", fontSize: 14, paddingVertical: 32 },
    inputBar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: "#D9E1E7" },
    inputAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
    avatarFallback: { backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontSize: 11, fontWeight: "500" },
    input: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: "#000" },
    postBtn: { color: "#0095F6", fontWeight: "600", fontSize: 14 },
    postBtnDisabled: { opacity: 0.4 },
});