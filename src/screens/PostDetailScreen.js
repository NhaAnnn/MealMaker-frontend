import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated, // <-- 1. Import Animated
  Platform, // <-- 2. Import Platform
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// --- Màu sắc ---
const DARK_BLUE = "#003A70";
const BACKGROUND_LIGHT = "#F0F3F6";
const TEXT_DARK = "#2C3E50";
const PRIMARY_BLUE = "#007AFF";

// --- 3. (MỚI) Thêm hằng số cho Animation ---
// Chiều cao của ảnh
const HEADER_MAX_HEIGHT = 280;
// (SỬA LẠI) Giảm chiều cao header khi cuộn
const HEADER_MIN_HEIGHT = 50; // <-- Giảm từ 60 xuống 50
// Vị trí bắt đầu mờ
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
// Lấy chiều cao thanh trạng thái
const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;
// --- Kết thúc hằng số ---

// (Component getDifficultyText giữ nguyên)
const getDifficultyText = (score) => {
  if (!score) return "Chưa rõ";
  if (score <= 1.5) return "Rất Dễ";
  if (score <= 3.0) return "Trung bình";
  return "Khó";
};

// (Component InfoBox giữ nguyên)
const InfoBox = ({ icon, label, value }) => (
  <View style={styles.infoBox}>
    <Ionicons name={icon} size={24} color={PRIMARY_BLUE} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// --- (MỚI) Component hiển thị danh sách chuyên nghiệp ---
// Component cho Nguyên liệu (dùng icon chấm)
const IngredientItem = ({ text }) => (
  <View style={styles.listItem}>
    <Ionicons
      name="ellipse"
      size={8}
      color={PRIMARY_BLUE}
      style={styles.listIcon}
    />
    {/* Xóa dấu "-" hoặc "*" ở đầu nếu có */}
    <Text style={styles.listText}>{text.replace(/^[\s*-]+\s*/, "")}</Text>
  </View>
);

// Component cho Hướng dẫn (dùng số thứ tự)
const InstructionStep = ({ text, step }) => (
  <View style={styles.listItem}>
    <View style={styles.stepNumberContainer}>
      <Text style={styles.stepNumberText}>{step}</Text>
    </View>
    {/* Xóa số "1. " hoặc "2. " ở đầu nếu có */}
    <Text style={styles.listText}>{text.replace(/^[\s*\d\.]+\s*/, "")}</Text>
  </View>
);
// --- Kết thúc Component mới ---

export default function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // (Giả lập) Nút yêu thích
  const [isFavorite, setIsFavorite] = useState(false);

  // --- 4. (MỚI) Setup Animated ---
  // useRef để giữ giá trị cuộn
  const scrollY = useRef(new Animated.Value(0)).current;

  // (SỬA LẠI) Thay đổi logic mờ
  // Điểm bắt đầu mờ (ví dụ: 30% của quãng đường cuộn)
  const FADE_START_POINT = HEADER_SCROLL_DISTANCE * 0.3;
  // Điểm kết thúc mờ (ví dụ: 60% của quãng đường cuộn)
  const FADE_END_POINT = HEADER_SCROLL_DISTANCE * 0.6;

  // Hiệu ứng mờ cho Header (nền xanh) VÀ Nút 2 (màu trắng)
  const headerOpacity = scrollY.interpolate({
    inputRange: [FADE_START_POINT, FADE_END_POINT],
    outputRange: [0, 1], // Mờ từ 0 -> 1 trong khoảng này
    extrapolate: "clamp",
  });

  // Hiệu ứng mờ cho Nút 1 (nền trắng mờ)
  const iconOpacity = scrollY.interpolate({
    // (SỬA LẠI) Logic mờ không chồng chéo
    inputRange: [0, FADE_START_POINT],
    outputRange: [1, 0], // Mờ từ 1 -> 0
    extrapolate: "clamp",
  });

  const { post } = route.params;

  // (MỚI) Tách chuỗi Nguyên liệu và Hướng dẫn
  const ingredientsList = post.ingredients
    ? post.ingredients.split("\n").filter((item) => item.trim().length > 0)
    : [];

  const instructionsList = post.instructions
    ? post.instructions.split("\n").filter((item) => item.trim().length > 0)
    : [];

  if (!post) {
    // Code khi không có 'post'
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
        {/* (SỬA LẠI) Dùng style headerButtons cho hài hòa */}
        <View style={[styles.headerButtons, { top: STATUS_BAR_HEIGHT }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text>Không tìm thấy bài đăng.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // (SỬA LẠI) Dùng View thường thay vì SafeAreaView
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent" // <-- Nền trong suốt
        translucent={true} // <-- Cho phép nội dung chạy sau
      />

      {/* --- 5. (MỚI) Header động --- */}
      {/* Nền xanh mờ dần */}
      <Animated.View
        style={[styles.headerContainer, { opacity: headerOpacity }]}
      />

      {/* Các nút (luôn ở trên) */}
      <View style={styles.headerButtons}>
        {/* (SỬA LẠI) Bọc các nút Back vào 1 View */}
        <View style={styles.buttonContainer}>
          {/* Nút 1: Nền trắng (chưa cuộn) */}
          <Animated.View
            style={[{ opacity: iconOpacity, position: "absolute" }]}
          >
            <TouchableOpacity
              style={[styles.headerButton, styles.iconBack]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={DARK_BLUE} />
            </TouchableOpacity>
          </Animated.View>

          {/* Nút 2: Màu trắng (đã cuộn) */}
          <Animated.View style={[{ opacity: headerOpacity }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* (SỬA LẠI) Bọc các nút Tim vào 1 View */}
        <View style={styles.buttonContainer}>
          {/* Nút 1: Nền trắng (chưa cuộn) */}
          <Animated.View
            style={[{ opacity: iconOpacity, position: "absolute" }]}
          >
            <TouchableOpacity
              style={[styles.headerButton, styles.iconBack]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#E74C3C" : DARK_BLUE}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Nút 2: Màu trắng (đã cuộn) */}
          <Animated.View style={[{ opacity: headerOpacity }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* --- 6. (MỚI) Animated.ScrollView --- */}
      <Animated.ScrollView
        style={styles.container}
        scrollEventThrottle={16} // Bắt sự kiện cuộn
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true } // <-- 7. (SỬA LỖI) Bật Native Driver
        )}
      >
        {/* Ảnh (nằm trên cùng) */}
        <Image
          source={{
            uri: "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
          }}
          style={styles.image}
        />

        {/* Phần nội dung (được đẩy lên trên 1 chút) */}
        <View style={styles.contentContainer}>
          {/* Tiêu đề và Tác giả */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.author}>
              Đăng bởi: {post.author || "Người dùng"}
            </Text>
          </View>

          {/* Thông tin Thời gian và Độ khó */}
          <View style={styles.infoContainer}>
            <InfoBox
              icon="time-outline"
              label="Thời gian"
              value={`${post.time_minutes || "?"} phút`}
            />
            <InfoBox
              icon="podium-outline"
              label="Độ khó"
              value={getDifficultyText(post.difficulty_score)}
            />
          </View>

          {/* (SỬA LẠI) Nội dung chi tiết */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>
              {post.description || "Tác giả chưa cung cấp mô tả."}
            </Text>

            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
            {ingredientsList.length > 0 ? (
              // Dùng map để render danh sách
              ingredientsList.map((item, index) => (
                <IngredientItem key={index} text={item} />
              ))
            ) : (
              <Text style={styles.description}>
                Tác giả chưa cung cấp nguyên liệu.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Hướng dẫn nấu</Text>
            {instructionsList.length > 0 ? (
              // Dùng map để render danh sách
              instructionsList.map((item, index) => (
                <InstructionStep key={index} text={item} step={index + 1} />
              ))
            ) : (
              <Text style={styles.description}>
                Tác giả chưa cung cấp hướng dẫn.
              </Text>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT }, // Nền sáng
  container: {
    flex: 1,
    zIndex: 1, // (SỬA LỖI) Nội dung (1)
  },

  // --- (SỬA LẠI) STYLES CHO HEADER ĐỘNG ---
  headerContainer: {
    // Nền xanh
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_BLUE,
    height: HEADER_MIN_HEIGHT + STATUS_BAR_HEIGHT, // Chiều cao = 50 + thanh trạng thái
    zIndex: 2, // Nền (2)
  },
  headerButtons: {
    // Các nút
    position: "absolute",
    top: STATUS_BAR_HEIGHT, // Bắt đầu bên dưới thanh trạng thái
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Căn giữa
    paddingHorizontal: 15,
    zIndex: 3, // Nút (3)
    height: HEADER_MIN_HEIGHT, // Chiều cao = 50
  },
  // (MỚI) Container để bọc 2 nút (giúp xếp chồng)
  buttonContainer: {
    width: 34, // Đặt kích thước cố định
    height: 34, // (34x34)
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    // Nút bấm
    padding: 5, // Vùng bấm
    alignItems: "center",
    justifyContent: "center",
  },
  iconBack: {
    // Nền trắng mờ cho icon
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 17, // (SỬA LẠI) Bo tròn
    padding: 4,
    // (XÓA) position: 'absolute' từ đây
  },
  // --- KẾT THÚC HEADER ĐỘNG ---

  image: {
    width: "100%",
    height: HEADER_MAX_HEIGHT, // Ảnh nền
    resizeMode: "cover",
  },

  contentContainer: {
    backgroundColor: BACKGROUND_LIGHT, // Nền chính
    marginTop: -20, // Kéo nội dung lên trên ảnh 1 chút
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500, // Đảm bảo luôn có thể cuộn
  },

  titleContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  author: {
    fontSize: 15,
    color: "gray",
    fontStyle: "italic",
  },

  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 10,
    borderBottomColor: BACKGROUND_LIGHT,
    marginTop: 1,
  },
  infoBox: {
    alignItems: "center",
    width: "40%",
  },
  infoLabel: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginTop: 3,
  },

  content: {
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 40, // (MỚI) Thêm padding dưới
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginTop: 15,
    marginBottom: 15, // (MỚI) Tăng margin
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_BLUE,
    paddingBottom: 5,
  },
  description: {
    // Dùng cho "Mô tả"
    fontSize: 16,
    lineHeight: 25,
    color: "#333",
    marginBottom: 10, // (MỚI) Thêm margin
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND_LIGHT, // Thêm nền
  },

  // --- (MỚI) STYLES CHO DANH SÁCH ---
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start", // Căn trên
    marginBottom: 15, // Khoảng cách giữa các mục
  },
  listIcon: {
    marginRight: 12,
    marginTop: 5, // Căn icon với dòng chữ đầu
    color: PRIMARY_BLUE,
  },
  listText: {
    flex: 1, // Quan trọng
    fontSize: 16,
    lineHeight: 25,
    color: "#333",
  },
  stepNumberContainer: {
    width: 26, // Kích thước vòng tròn số
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY_BLUE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  // --- KẾT THÚC STYLES MỚI ---
});
