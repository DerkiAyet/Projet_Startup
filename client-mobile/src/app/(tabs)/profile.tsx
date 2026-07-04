import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../_layout";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import api from "@/lib/api";
import { Post } from "../types/Post";
import { PostCard } from "@/components/postCard";
import { CommentsSection } from "@/components/commentsSection";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  userName: string;
  givenName: string;
  familyName: string;
  userImg?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  role?: string;
  placeOfWork?: string;
  grade?: string;
  levelOfEducation?: string;
  institution?: string;
  address?: {
    addressLine1?: string;
    city?: string;
    country?: string;
  };
}

interface FollowData {
  followers: any[];
  followersIds: string[];
}

interface FolloweeData {
  followees: any[];
  followeesIds: string[];
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { userAuth, setUserAuth } = useContext(AuthContext)!;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowData>({ followers: [], followersIds: [] });
  const [followees, setFollowees] = useState<FolloweeData>({ followees: [], followeesIds: [] });
  const [loading, setLoading] = useState(true);

  const [profileUri, setProfileUri] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [followPopup, setFollowPopup] = useState<{ visible: boolean; type: "followers" | "following" | null }>({
    visible: false,
    type: null,
  });

  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedComments, setSelectedComments] = useState<any[]>([]);

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, postsRes, followersRes, followeesRes] = await Promise.all([
          api.get("/users/infos/users/user-infos"),
          api.get("/posts/me"),
          api.get("/posts/get-followers"),
          api.get("/posts/get-followees"),
        ]);
        setUser(userRes.data);
        setMyPosts(postsRes.data);
        setFollowers(followersRes.data);
        setFollowees(followeesRes.data);
      } catch (err: any) {
        console.error("Error fetching profile:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch profile image as base64 (same pattern as index.tsx)
  useEffect(() => {
    if (!userAuth.userImg) return;
    const fetchImage = async () => {
      try {
        const response = await api.get(`/auth/uploads/${userAuth.userImg}`, {
          responseType: "arraybuffer",
        });
        const base64 = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        const mimeType = response.headers["content-type"] ?? "image/jpeg";
        setProfileUri(`data:${mimeType};base64,${base64}`);
      } catch (err) {
        console.error("Failed to fetch profile image:", err);
      }
    };
    fetchImage();
  }, [userAuth.userImg]);

  const handleLogout = async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("accessToken");
            await SecureStore.deleteItemAsync("refreshToken");
            router.replace("/(auth)/login");
          } catch (error: any) {
            console.log(error.message);
          }
        },
      },
    ]);
  };

  const openComments = (id: string) => {
    const post = myPosts.find((p) => p._id === id);
    if (!post) return;
    setSelectedPostId(id);
    setSelectedComments(post.comments ?? []);
    setCommentsModalVisible(true);
  };

  const closeComments = () => {
    setSelectedPostId("");
    setSelectedComments([]);
    setCommentsModalVisible(false);
  };

  const initials =
    `${userAuth.givenName?.charAt(0) ?? ""}${userAuth.familyName?.charAt(0) ?? ""}`.toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Header bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setEditVisible(true)}>
            <Feather name="edit-2" size={18} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#EC4899" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={myPosts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* ── Profile hero ── */}
            <View style={styles.hero}>
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                {profileUri ? (
                  <Image source={{ uri: profileUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{userAuth.role}</Text>
                </View>
              </View>

              {/* Name & bio */}
              <Text style={styles.displayName}>
                {userAuth.givenName} {userAuth.familyName}
              </Text>
              <Text style={styles.userName}>@{userAuth.userName}</Text>
              {user?.bio ? (
                <Text style={styles.bio}>{user.bio}</Text>
              ) : (
                <Text style={[styles.bio, styles.bioEmpty]}>No bio yet — tap Edit to add one.</Text>
              )}

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{myPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => setFollowPopup({ visible: true, type: "followers" })}
                >
                  <Text style={styles.statNumber}>{followers.followersIds.length}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => setFollowPopup({ visible: true, type: "following" })}
                >
                  <Text style={styles.statNumber}>{followees.followeesIds.length}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* ── Posts section label ── */}
            <View style={styles.sectionHeader}>
              <Feather name="grid" size={14} color="#EC4899" />
              <Text style={styles.sectionTitle}>My Posts</Text>
            </View>

            {myPosts.length === 0 && (
              <View style={styles.emptyPosts}>
                <Feather name="edit-3" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>No posts yet.</Text>
                <Text style={styles.emptySubText}>Share something with the community!</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <PostCard post={item} setPosts={setMyPosts} openComments={openComments} />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        user={user}
        setUser={setUser}
        userAuth={userAuth}
        setUserAuth={setUserAuth}
        setProfileUri={setProfileUri}
      />

      {/* ── Follow Popup ── */}
      {followPopup.visible && followPopup.type && (
        <FollowListModal
          type={followPopup.type}
          followers={followers.followers}
          followees={followees.followees}
          onClose={() => setFollowPopup({ visible: false, type: null })}
        />
      )}

      {/* ── Comments ── */}
      <CommentsSection
        postId={selectedPostId}
        comments={selectedComments}
        modalVisible={commentsModalVisible}
        handleClose={closeComments}
        setPosts={setMyPosts}
      />
    </SafeAreaView>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

const ALGERIAN_STATES = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Algiers",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued",
  "Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane",
];

function EditProfileModal({
  visible, onClose, user, setUser, userAuth, setUserAuth, setProfileUri,
}: {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  setUser: (u: UserProfile) => void;
  userAuth: any;
  setUserAuth: any;
  setProfileUri: (uri: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState<{ uri: string; mimeType: string } | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    setForm({
      userName: user.userName ?? "",
      givenName: user.givenName ?? "",
      familyName: user.familyName ?? "",
      bio: user.bio ?? "",
      gender: user.gender ?? "",
      birthDate: user.dateOfBirth ?? "",
      phoneNumber: user.phoneNumber ?? "",
      addressLine1: user.address?.addressLine1 ?? "",
      city: user.address?.city ?? "",
      country: user.address?.country ?? "",
      placeOfWork: user.placeOfWork ?? "",
      grade: user.grade ?? "",
      levelOfEducation: user.levelOfEducation ?? "",
      institution: user.institution ?? "",
    });
    setImgFile(null);
  }, [user, visible]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImgFile({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (imgFile) {
        const filename = imgFile.uri.split("/").pop() ?? "avatar.jpg";
        formData.append("userImg", { uri: imgFile.uri, type: imgFile.mimeType, name: filename } as any);
      }
      Object.entries(form).forEach(([k, v]) => {
        if (v) formData.append(k, v as string);
      });
      await api.put("/users/edit-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { data: freshUser } = await api.get("/users/infos/users/user-infos");
      setUserAuth((prev: any) => ({
        ...prev,
        userName: freshUser.userName,
        familyName: freshUser.familyName,
        givenName: freshUser.givenName,
        userImg: freshUser.userImg,
      }));
      setUser(freshUser);
      // Refresh the profile image uri
      if (freshUser.userImg) {
        try {
          const response = await api.get(`/auth/uploads/${freshUser.userImg}`, {
            responseType: "arraybuffer",
          });
          const base64 = btoa(
            new Uint8Array(response.data).reduce(
              (data, byte) => data + String.fromCharCode(byte), ""
            )
          );
          const mimeType = response.headers["content-type"] ?? "image/jpeg";
          setProfileUri(`data:${mimeType};base64,${base64}`);
        } catch (_) {}
      }
      onClose();
    } catch (err: any) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarSource = imgFile
    ? { uri: imgFile.uri }
    : userAuth.userImg
    ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${userAuth.userImg}` }
    : null;

  const initials = `${userAuth.givenName?.charAt(0) ?? ""}${userAuth.familyName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={ep.root} edges={["top"]}>
        {/* Header */}
        <View style={ep.header}>
          <TouchableOpacity onPress={onClose} style={ep.headerClose}>
            <Feather name="x" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={ep.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[ep.saveBtn, loading && ep.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={ep.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={ep.scroll} contentContainerStyle={ep.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar picker */}
          <TouchableOpacity style={ep.avatarRow} onPress={pickImage}>
            {avatarSource ? (
              <Image source={avatarSource} style={ep.avatar} />
            ) : (
              <View style={[ep.avatar, ep.avatarPlaceholder]}>
                <Text style={ep.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={ep.avatarOverlay}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
            <Text style={ep.changePhotoLabel}>Change photo</Text>
          </TouchableOpacity>

          {/* Basic info */}
          <SectionLabel label="Basic Info" />
          <View style={ep.row}>
            <Field label="First name" value={form.givenName} onChange={(v) => setForm((p: any) => ({ ...p, givenName: v }))} placeholder="First name" half />
            <Field label="Last name" value={form.familyName} onChange={(v) => setForm((p: any) => ({ ...p, familyName: v }))} placeholder="Last name" half />
          </View>
          <Field label="Username" value={form.userName} onChange={(v) => setForm((p: any) => ({ ...p, userName: v }))} placeholder="@username" />
          <Field label="Bio" value={form.bio} onChange={(v) => setForm((p: any) => ({ ...p, bio: v }))} placeholder="Tell the community about yourself..." multiline />
          <View style={ep.row}>
            <PickerField
              label="Gender"
              value={form.gender}
              options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]}
              onChange={(v) => setForm((p: any) => ({ ...p, gender: v }))}
              half
            />
            <Field label="Birth date" value={form.birthDate} onChange={(v) => setForm((p: any) => ({ ...p, birthDate: v }))} placeholder="YYYY-MM-DD" half />
          </View>
          <Field label="Phone" value={form.phoneNumber} onChange={(v) => setForm((p: any) => ({ ...p, phoneNumber: v }))} placeholder="+213 ..." keyboardType="phone-pad" />

          {/* Address */}
          <SectionLabel label="Address" />
          <Field label="Street" value={form.addressLine1} onChange={(v) => setForm((p: any) => ({ ...p, addressLine1: v }))} placeholder="Street address" />
          <View style={ep.row}>
            <PickerField
              label="Country"
              value={form.country}
              options={[{ label: "Algeria", value: "Algeria" }]}
              onChange={(v) => setForm((p: any) => ({ ...p, country: v }))}
              half
            />
            <PickerField
              label="City"
              value={form.city}
              options={ALGERIAN_STATES.map((s) => ({ label: s, value: s }))}
              onChange={(v) => setForm((p: any) => ({ ...p, city: v }))}
              half
            />
          </View>

          {/* Role-specific */}
          {userAuth.role === "teacher" && (
            <>
              <SectionLabel label="Teaching Info" />
              <Field label="Place of work" value={form.placeOfWork} onChange={(v) => setForm((p: any) => ({ ...p, placeOfWork: v }))} placeholder="School / University" />
              <Field label="Grade" value={form.grade} onChange={(v) => setForm((p: any) => ({ ...p, grade: v }))} placeholder="e.g. Professor, Lecturer" />
            </>
          )}
          {userAuth.role === "student" && (
            <>
              <SectionLabel label="Academic Info" />
              <Field label="Level of education" value={form.levelOfEducation} onChange={(v) => setForm((p: any) => ({ ...p, levelOfEducation: v }))} placeholder="e.g. Bachelor, Master" />
              <Field label="Institution" value={form.institution} onChange={(v) => setForm((p: any) => ({ ...p, institution: v }))} placeholder="Your school or university" />
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={ep.sectionLabelRow}>
      <Text style={ep.sectionLabelText}>{label}</Text>
    </View>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, half, keyboardType,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; half?: boolean; keyboardType?: any;
}) {
  return (
    <View style={[ep.field, half && ep.fieldHalf]}>
      <Text style={ep.fieldLabel}>{label}</Text>
      <TextInput
        style={[ep.input, multiline && ep.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function PickerField({
  label, value, options, onChange, half,
}: {
  label: string; value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void; half?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[ep.field, half && ep.fieldHalf]}>
      <Text style={ep.fieldLabel}>{label}</Text>
      <TouchableOpacity style={ep.pickerBtn} onPress={() => setOpen(true)}>
        <Text style={[ep.pickerBtnText, !selected && ep.pickerBtnPlaceholder]}>
          {selected ? selected.label : "Select"}
        </Text>
        <Feather name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={ep.pickerOverlay} onPress={() => setOpen(false)}>
          <View style={ep.pickerSheet}>
            <Text style={ep.pickerSheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={ep.pickerOption}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text style={[ep.pickerOptionText, opt.value === value && ep.pickerOptionSelected]}>
                    {opt.label}
                  </Text>
                  {opt.value === value && <AntDesign name="check" size={14} color="#EC4899" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Follow List Modal ────────────────────────────────────────────────────────

function FollowListModal({
  type, followers, followees, onClose,
}: {
  type: "followers" | "following";
  followers: any[];
  followees: any[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const list = type === "followers" ? followers : followees;

  const filtered = list.filter(
    (u) =>
      u?.userName?.toLowerCase().includes(search.toLowerCase()) ||
      u?.givenName?.toLowerCase().includes(search.toLowerCase()) ||
      u?.familyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={fw.root} edges={["top"]}>
        <View style={fw.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={fw.title}>{type === "followers" ? "Followers" : "Following"}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={fw.searchRow}>
          <Feather name="search" size={16} color="#94A3B8" style={fw.searchIcon} />
          <TextInput
            style={fw.searchInput}
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id ?? item.userName}
          ListEmptyComponent={<Text style={fw.empty}>No users found</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={fw.item}
              onPress={() => { onClose(); }}
            >
              {item.userImg ? (
                <Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/auth/uploads/${item.userImg}` }}
                  style={fw.avatar}
                />
              ) : (
                <View style={[fw.avatar, fw.avatarPlaceholder]}>
                  <Text style={fw.avatarText}>
                    {item.familyName?.charAt(0).toUpperCase()}{item.givenName?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={fw.itemUsername}>@{item.userName}</Text>
                <Text style={fw.itemName}>{item.givenName} {item.familyName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 12, color: "#64748B", fontFamily: "PlusJakartaSans_400Regular" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topBarTitle: { fontSize: 18, fontFamily: "PlusJakartaSans_600SemiBold", color: "#1E293B" },
  topBarActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  logoutBtn: { borderColor: "#FCE7F3" },

  hero: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#EC4899" },
  avatarPlaceholder: {
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "PlusJakartaSans_600SemiBold" },
  roleBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#EC4899",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  roleBadgeText: { color: "#fff", fontSize: 10, fontFamily: "PlusJakartaSans_600SemiBold" },

  displayName: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#1E293B", marginBottom: 2 },
  userName: { fontSize: 13, color: "#94A3B8", fontFamily: "PlusJakartaSans_400Regular", marginBottom: 10 },
  bio: { fontSize: 14, color: "#475569", fontFamily: "PlusJakartaSans_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  bioEmpty: { fontStyle: "italic", color: "#CBD5E1" },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: "100%",
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#1E293B" },
  statLabel: { fontSize: 11, color: "#94A3B8", fontFamily: "PlusJakartaSans_400Regular", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },

  shortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FCE7F3",
    backgroundColor: "#FDF2F8",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  shortcutText: { fontSize: 13, color: "#EC4899", fontFamily: "PlusJakartaSans_600SemiBold" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionTitle: { fontSize: 13, fontFamily: "PlusJakartaSans_600SemiBold", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },

  emptyPosts: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "PlusJakartaSans_600SemiBold", color: "#CBD5E1" },
  emptySubText: { fontSize: 13, color: "#CBD5E1", fontFamily: "PlusJakartaSans_400Regular" },
});

// Edit Profile styles
const ep = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerClose: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: "PlusJakartaSans_600SemiBold", color: "#1E293B" },
  saveBtn: {
    backgroundColor: "#EC4899",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "PlusJakartaSans_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  avatarRow: { alignItems: "center", paddingVertical: 20, position: "relative" },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#EC4899" },
  avatarPlaceholder: { backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "PlusJakartaSans_600SemiBold" },
  avatarOverlay: {
    position: "absolute",
    bottom: 28,
    right: "35%",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  changePhotoLabel: { marginTop: 6, fontSize: 13, color: "#EC4899", fontFamily: "PlusJakartaSans_600SemiBold" },

  sectionLabelRow: { paddingTop: 20, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", marginBottom: 12 },
  sectionLabelText: { fontSize: 11, fontFamily: "PlusJakartaSans_600SemiBold", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 },

  row: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 14 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, color: "#64748B", fontFamily: "PlusJakartaSans_500Medium", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    fontFamily: "PlusJakartaSans_400Regular",
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },

  pickerBtn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerBtnText: { fontSize: 14, color: "#1E293B", fontFamily: "PlusJakartaSans_400Regular" },
  pickerBtnPlaceholder: { color: "#94A3B8" },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  pickerSheetTitle: { fontSize: 15, fontFamily: "PlusJakartaSans_600SemiBold", color: "#1E293B", marginBottom: 12 },
  pickerOption: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  pickerOptionText: { fontSize: 14, color: "#475569", fontFamily: "PlusJakartaSans_400Regular" },
  pickerOptionSelected: { color: "#EC4899", fontFamily: "PlusJakartaSans_600SemiBold" },
});

// Follow popup styles
const fw = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: { fontSize: 16, fontFamily: "PlusJakartaSans_600SemiBold", color: "#1E293B" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#1E293B", fontFamily: "PlusJakartaSans_400Regular" },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSans_600SemiBold" },
  itemUsername: { fontSize: 14, fontFamily: "PlusJakartaSans_600SemiBold", color: "#1E293B" },
  itemName: { fontSize: 12, color: "#94A3B8", fontFamily: "PlusJakartaSans_400Regular" },
  empty: { textAlign: "center", marginTop: 40, color: "#CBD5E1", fontFamily: "PlusJakartaSans_400Regular" },
});