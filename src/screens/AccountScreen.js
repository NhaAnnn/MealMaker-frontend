import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../components/AuthContext";

// --- Color Definitions ---
const PRIMARY_BLUE = "#AB9574"; // Primary Color (Warm Brown/Gold)
const DANGER_RED = "#a81100ff"; // Red for Logout
const DARK_BLUE = "#F9EBD7"; // Header/Status Bar Color (Lightest)
const BACKGROUND_LIGHT = "#F9EBD7"; // Very Light Background
const TEXT_DARK = "#2C3E50"; // Dark Text

// Account Option Component
const AccountOption = ({ icon, title, action }) => (
  <TouchableOpacity style={styles.optionItem} onPress={action}>
    <View style={styles.optionLeft}>
      <Ionicons name={icon} size={24} color={PRIMARY_BLUE} />
      <Text style={styles.optionTitle}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

export default function AccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // --- Lấy dữ liệu và hàm từ useAuth ---
  const {
    signOut,
    userData,
    fetchUserData,
    isLoading: isAuthLoading,
  } = useAuth();

  const user = userData || { full_name: "Guest User", email: "N/A" };
  const isFetchingUserData = !userData && isAuthLoading;

  // --- LOGIC MỚI: LẤY TRÌNH ĐỘ NẤU ĂN ---
  const cookingLevel = userData?.ai_profile?.cooking_skill_level || 0;
  const levelDisplay = `Cooking Skill: Level ${cookingLevel}`;

  // --- Hàm xử lý Logout ---
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        onPress: () => {
          signOut();
        },
        style: "destructive",
      },
    ]);
  };

  // --- Hàm xử lý điều hướng & hành động ---
  const handleAction = (actionName) => {
    switch (actionName) {
      case "Liked Blogs":
        navigation.navigate("LikedPosts");
        break;
      case "Skill Quiz":
        navigation.navigate("Quiz");
        break;
      case "Update Profile":
        navigation.navigate("ProfileUpdate");
        break;
      default:
        Alert.alert("Feature", `${actionName} is currently under development.`);
        break;
    }
  };

  const EXTRA_BOTTOM_MARGIN = 10 + 15;
  const finalPaddingBottom = tabBarHeight + EXTRA_BOTTOM_MARGIN;

  if (isFetchingUserData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        <Text style={styles.loadingText}>Loading User Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={DARK_BLUE} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: finalPaddingBottom },
        ]}
      >
        {/* GENERAL INFO (Sử dụng userData) */}
        <View style={styles.userInfoCard}>
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={PRIMARY_BLUE}
          />
          <Text style={styles.userName}>
            {user.full_name || user.user_name || "Guest"}
          </Text>
          <Text style={styles.userEmail}>
            {user.email || user.user_name || "Account info not available"}
          </Text>

          {/* --- HIỂN THỊ TRÌNH ĐỘ NẤU ĂN --- */}
          {cookingLevel > 0 && (
            <View style={styles.levelBadge}>
              <Ionicons name="sparkles-outline" size={16} color="#fff" />
              <Text style={styles.levelText}>{levelDisplay}</Text>
            </View>
          )}
        </View>

        {/* --- MY ACTIVITY --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>My Activity</Text>

          {/* === TÙY CHỌN "SKILL QUIZ" === */}
          {/* <AccountOption
            icon="medal-outline"
            title="Skill Quiz"
            action={() => handleAction("Skill Quiz")}
          /> */}

          <AccountOption
            icon="heart-outline"
            title="Liked Blogs"
            action={() => handleAction("Liked Blogs")}
          />

          <AccountOption
            icon="document-text-outline"
            title="Posted Blogs"
            action={() => handleAction("Posted Blogs")}
          />
          <AccountOption
            icon="time-outline"
            title="Search History"
            action={() => handleAction("Search History")}
          />
        </View>

        {/* --- ACCOUNT SETTINGS --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Account Settings</Text>
          <AccountOption
            icon="settings-outline"
            title="Update Profile"
            action={() => handleAction("Update Profile")}
          />
          <AccountOption
            icon="lock-closed-outline"
            title="Change Password"
            action={() => handleAction("Change Password")}
          />
          <AccountOption
            icon="notifications-outline"
            title="Notification Settings"
            action={() => handleAction("Notification Settings")}
          />
        </View>

        {/* --- ABOUT APP --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>About the App</Text>
          <Text style={styles.aboutContent}>
            The Minimalist Meal Maker was built with the goal of helping you
            solve the problem of **"What to eat today?"** in the most minimalist
            way.
          </Text>
          <Text style={styles.aboutVersion}>
            Version: 1.0 (MVP) | Developed by Minimalist Dev Team
          </Text>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollContainer: { padding: 20, paddingBottom: 0 },

  // --- Loading State ---
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND_LIGHT,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: TEXT_DARK,
  },

  // --- User Info ---
  userInfoCard: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginTop: 10,
  },
  userEmail: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8, // Thêm margin để tách khỏi badge
  },

  // --- Badge Trình độ MỚI ---
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 5,
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },

  // --- Section Card ---
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 10,
    paddingLeft: 5,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_BLUE,
  },

  // --- Options ---
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BACKGROUND_LIGHT,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    color: TEXT_DARK,
    marginLeft: 15,
    fontWeight: "600",
  },

  // --- About Content ---
  aboutContent: {
    fontSize: 15,
    color: TEXT_DARK,
    lineHeight: 22,
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 13,
    color: "#95A5A6",
    fontStyle: "italic",
    paddingTop: 5,
  },

  // --- Footer / Logout Button ---
  logoutButton: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: DANGER_RED,
    shadowColor: DANGER_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
