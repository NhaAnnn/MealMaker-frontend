import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { featureFlags } from "react-native-screens";

// --- Định nghĩa màu sắc MODERN BLUE ---
const PRIMARY_BLUE = "#007AFF"; // Xanh Dương Sáng (Màu chủ đạo)
const DARK_BLUE = "#003A70"; // Xanh Đậm cho Header
const BACKGROUND_LIGHT = "#F0F3F6"; // Nền Xám Rất Nhạt
const TEXT_DARK = "#2C3E50"; // Xám Đậm
const ACCENT_GREEN = "#2ECC71"; // Màu nhấn cho Tag
const ACCENT_RED = "#E74C3C"; // Màu nhấn cho thời gian/độ khó

export default function RecipeDetailScreen({ route }) {
  const navigation = useNavigation();
  const { recipe } = route.params;
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>Không có dữ liệu công thức.</Text>
      </View>
    );
  }
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi Tiết Công Thức
        </Text>

        <TouchableOpacity
          onPress={() => alert("Lưu vào Yêu thích!")}
          style={styles.headerIcon}
        >
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>{recipe.name}</Text>
          <Text style={styles.descriptionText}>
            "Công thức tối giản, nhanh chóng, đảm bảo bữa ăn ngon miệng và đầy
            đủ dinh dưỡng."
          </Text>

          <Image
            source={{
              uri: recipe.image,
            }}
            style={styles.image}
          />

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>
              <Ionicons name="time-outline" size={16} color={ACCENT_RED} />
              {recipe.time_minutes} phút
            </Text>
            <Text style={styles.metaText}>
              <Ionicons name="star-outline" size={16} color={ACCENT_RED} />
              Độ khó: {recipe.difficulty_score}/5.0
            </Text>
          </View>

          <Text style={styles.tags}>
            {recipe.tags.map((tag) => `#${tag}`).join(" ")}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nguyên liệu chính</Text>
            <Text style={styles.content}>
              {recipe.primary_ingredients.join(" | ")}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hướng dẫn Chi tiết</Text>
            {recipe.instructions
              .split(". ")
              .filter((s) => s.trim() !== "")
              .map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepText}>
                    {step.trim()}
                    {step.endsWith(".") ? "" : "."}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollView: { marginHorizontal: 0 },
  container: { padding: 20 }, // --- HEADER (Đồng bộ) ---

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerIcon: {
    padding: 5,
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: PRIMARY_BLUE, // Thay thế màu cũ bằng PRIMARY_BLUE
    marginBottom: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_RED, // Dùng màu đỏ cho tiêu đề nổi bật
  },
  descriptionText: {
    fontSize: 15,
    color: "#7F8C8D",
    marginBottom: 15,
    fontStyle: "italic",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metaText: { fontSize: 16, color: TEXT_DARK, fontWeight: "600" },
  tags: {
    fontSize: 14,
    color: ACCENT_GREEN,
    fontWeight: "600",
    marginBottom: 25,
    paddingHorizontal: 5,
  }, // --- SECTION (Đồng bộ) ---
  section: {
    marginTop: 15,
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE, // Đồng bộ section title border color
    paddingLeft: 10,
  },
  content: {
    fontSize: 16,
    color: TEXT_DARK,
    lineHeight: 24,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
    paddingLeft: 5,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: ACCENT_RED, // Dùng màu đỏ cho số bước
    marginRight: 10,
    lineHeight: 28,
  },
  stepText: {
    fontSize: 16,
    flex: 1,
    color: TEXT_DARK,
    lineHeight: 28,
  },
});
