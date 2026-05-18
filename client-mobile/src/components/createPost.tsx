import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput, Image, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

export function CreatePost({ modalVisible, handleClose, pickImage, takePhoto, handleShare, canShare, newPostImage, emptyPostImage, postText, handlePostText }: {
    modalVisible: boolean;
    handleClose: () => void;
    pickImage: () => void;
    takePhoto: () => void;
    handleShare: () => void;
    canShare: boolean;
    newPostImage: { uri: string } | null;
    emptyPostImage: () => void;
    postText: string;
    handlePostText: (text: string) => void;
}) {
    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            {/* KeyboardAvoidingView so the sheet rises with the keyboard */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalWrapper}
            >
                <Pressable style={styles.backdrop} onPress={handleClose} />

                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.sheetTitle}>New Post</Text>
                        <TouchableOpacity
                            style={[styles.shareBtn, canShare && styles.shareBtnActive]}
                            disabled={!canShare}
                            onPress={handleShare}
                        >
                            <Text style={[styles.shareBtnText, canShare && styles.shareBtnTextActive]}>
                                Share
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* User row + text input */}
                        <View style={styles.inputRow}>
                            <View style={styles.avatar}>
                                <Feather name="user" size={18} color="#EC4899" />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="What's on your mind?"
                                placeholderTextColor="#A6A6A6"
                                multiline
                                autoFocus
                                value={postText}
                                onChangeText={handlePostText}
                            />
                        </View>
                        <Text style={styles.charCount}>{postText.length}/500</Text>

                        {/* Image preview — only shown after picking */}
                        {newPostImage && (
                            <View style={styles.imagePreviewBox}>
                                <Image source={{ uri: newPostImage.uri }} style={styles.imagePreview} />
                                {/* Remove image */}
                                <TouchableOpacity
                                    style={styles.removeImage}
                                    onPress={emptyPostImage}
                                >
                                    <Feather name="x" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom toolbar — photo actions */}
                    <View style={styles.toolbarWrapper}>
                        <Text style={styles.toolbarTitle}>Add a photo to brighten things up!</Text>
                        <View style={styles.toolbar}>
                            <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage}>
                                <Feather name="image" size={20} color="#EC4899" />
                                <Text style={styles.toolbarBtnText}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolbarBtn} onPress={takePhoto}>
                                <Feather name="camera" size={20} color="#EC4899" />
                                <Text style={styles.toolbarBtnText}>Camera</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    modalWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    sheet: {
        zIndex: 2,
        backgroundColor: "#fff",
        borderRadius: 24,
        width: "100%",
        maxHeight: "80%",
        paddingBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    handle: {
        display: "none" // design spec doesn't have this but it looks better with it, so hiding for now
    },

    // Header
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    sheetTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
        fontFamily: "PlusJakartaSans_600SemiBold",
    },
    cancelText: {
        fontSize: 14,
        color: "#8A8A8A",
        fontFamily: "PlusJakartaSans_400Regular",
    },
    shareBtn: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#E2E8F0",
    },
    shareBtnActive: {
        backgroundColor: "#EC4899",
    },
    shareBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#A6A6A6",
        fontFamily: "PlusJakartaSans_600SemiBold",
    },
    shareBtnTextActive: {
        color: "#fff",
    },

    // Input area
    inputRow: {
        flexDirection: "row",
        gap: 12,
        padding: 16,
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    avatar: {
        width: 38, height: 38,
        borderRadius: 19,
        backgroundColor: "#FCE7F3",
        alignItems: "center",
        justifyContent: "center",
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: "#1E293B",
        fontFamily: "PlusJakartaSans_400Regular",
        minHeight: 100,
        textAlignVertical: "top",  // Android fix
    },

    // Image preview
    imagePreviewBox: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
    },
    imagePreview: {
        width: "100%",
        height: 200,
        borderRadius: 12,
    },
    removeImage: {
        position: "absolute",
        top: 8, right: 8,
        width: 26, height: 26,
        borderRadius: 13,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },

    toolbarWrapper: {
        flexDirection: "column",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        gap: 2,
    },
    toolbarTitle: {
        fontSize: 15,
        color: "#A6A6A6",
        fontFamily: "PlusJakartaSans_400Regular",
        marginLeft: 4,
    },
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingTop: 12,
    },
    toolbarBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: "#FDF2F8",
        marginRight: 6,
    },
    toolbarBtnText: {
        fontSize: 13,
        color: "#EC4899",
        fontFamily: "Nunito_700Bold",
    },
    charCount: {
        marginLeft: "auto",
        marginRight: 12,
        marginTop: 4,
        fontSize: 12,
        color: "#A6A6A6",
        fontFamily: "Nunito_400Regular",
    },
});