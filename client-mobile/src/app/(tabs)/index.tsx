import {
  Text, View, StyleSheet, TouchableOpacity, Alert,
  FlatList,
  Modal,
  Pressable,
  TextInput
} from "react-native"; import { useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "../_layout";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; //this is a native module, so we need to install it kill the app and rebuild it to use it
import { useState } from "react";
import api from "@/lib/api";
import { CreatePost } from "@/components/createPost";
import { Comment, Post } from "../types/Post";
import { PostCard } from "@/components/postCard";
import { Image } from "expo-image";
import { CommentsSection } from "@/components/commentsSection";

export default function Index() {
  const router = useRouter()

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const link = userAuth.role === "parent" ? "/posts/parent-hub" : "/posts"
        const res = await api.get(link);
        setPosts(res.data);
        console.log("Fetched posts:", res.data.length);
      } catch (err: any) {
        console.error("Error fetching posts:", err);
        console.log(err.message);
      }
    };

    fetchPosts();
  }, [])

  const { userAuth } = useContext(AuthContext)!

  const [profileUri, setProfileUri] = useState<string | null>(null);

  useEffect(() => {
    if (!userAuth.userImg) return;

    const fetchImage = async () => {
      try {
        const response = await api.get(`/auth/uploads/${userAuth.userImg}`, {
          responseType: "arraybuffer",
        });

        const base64 = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte), ""
          )
        );

        const mimeType = response.headers["content-type"] ?? "image/jpeg";
        setProfileUri(`data:${mimeType};base64,${base64}`);
      } catch (err) {
        console.error("Failed to fetch image:", err);
      }
    };

    fetchImage();
  }, [userAuth.userImg]);

  const [newPostImage, setNewPostImage] = useState<{ uri: string; mimeType: string } | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewPostImage({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
      });
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewPostImage({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
      });;
    }
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState("");

  const handleClose = () => {
    setModalVisible(false);
    setPostText("");
    setNewPostImage(null);
  };

  const handleShare = async () => {
    if (!postText.trim() && !newPostImage) return;
    try {
      const formData = new FormData()

      formData.append("content", postText)
      if (newPostImage) {
        const filename = newPostImage.uri.split('/').pop() ?? "post-image.jpg";
        formData.append("media", {
          uri: newPostImage.uri,
          type: newPostImage.mimeType,
          name: filename,
        } as any);
      }

      const { data: newPost } = await api.post('/posts', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const enrichedNewPost = {
        ...newPost,
        likesCount: 0,
        commentsCount: 0,
        comments: [],
        user: {
          userId: userAuth.userId,
          userName: userAuth.userName,
          familyName: userAuth.familyName,
          givenName: userAuth.givenName,
          userImg: userAuth.userImg,
          role: userAuth.role,
        }
      };

      setPosts(prev => [enrichedNewPost, ...prev]);
      handleClose();
    } catch (err: any) {
      console.error(err);
      console.log(err.message)
    }
  };

  const canShare = postText.trim().length > 0 || newPostImage !== null;

  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Comment[]>([]);

  const openComments = (id: string) => {
    const post = posts.find(p => p._id === id);
    if (!post) return;
    setSelectedPostId(id);
    setSelectedComments(post.comments ?? []);
    setCommentsModalVisible(true);
  }

  const closeComments = () => {
    setSelectedPostId("");
    setSelectedComments([]);
    setCommentsModalVisible(false);
  }
  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} setPosts={setPosts} openComments={openComments} />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.indexHeader}>
        <View style={styles.userInfos}>
          <View style={styles.parameter}>
            <Feather name="bell" size={20} color={"#000"} />
          </View>
          {
            userAuth.userImg ? (
              profileUri && <Image source={{ uri: profileUri! }} style={styles.avatar} />
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
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.fab}>
        <Text style={styles.fabText}><Feather name="plus" size={30} /></Text>
      </TouchableOpacity>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
      />
      <CreatePost
        modalVisible={modalVisible}
        handleClose={handleClose}
        pickImage={pickImage}
        takePhoto={takePhoto}
        handleShare={handleShare}
        canShare={canShare}
        newPostImage={newPostImage}
        emptyPostImage={() => setNewPostImage(null)}
        postText={postText}
        handlePostText={setPostText}
      />
      <CommentsSection
        postId={selectedPostId}
        comments={selectedComments}
        modalVisible={commentsModalVisible}
        handleClose={closeComments}
        setPosts={setPosts}
      />
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
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#EC4899",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
  fabText: {
    display: "flex",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
  },
});
