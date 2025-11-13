import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useBlogAPI } from "../hook/useBlogs";

// --- Colors ---
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const PRIMARY_BLUE = "#AB9574";
const GREEN = "#2ECC71";
const ORANGE = "#F39C12";
const RED = "#E74C3C";

// --- Animation Constants ---
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 50;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;
const FADE_START_POINT = HEADER_SCROLL_DISTANCE * 0.3;
const FADE_END_POINT = HEADER_SCROLL_DISTANCE * 0.6;
// --- End Constants ---

// Difficulty Component (Translated)
const getScoreColor = (value, type) => {
  if (type === "Difficulty") {
    if (value <= 2) return GREEN;
    if (value <= 4) return ORANGE;
    return RED;
  }
  if (type === "Time") {
    if (value <= 25) return GREEN;
    if (value <= 60) return ORANGE;
    return RED;
  }
  return TEXT_DARK;
};

const InfoBox = ({ icon, label, value, score }) => {
  const color = getScoreColor(score, label);
  return (
    <View style={styles.infoBox}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: color }]}>{value}</Text>
    </View>
  );
};

// Ingredient Component
const IngredientItem = ({ text }) => (
  <View style={styles.listItem}>
    <Ionicons
      name="ellipse"
      size={8}
      color={PRIMARY_BLUE}
      style={styles.listIcon}
    />
    <Text style={styles.listText}>{text.replace(/^[\s*-]+\s*/, "")}</Text>
  </View>
);

// Instruction Component
const InstructionStep = ({ text, step }) => (
  <View style={styles.listItem}>
    <View style={styles.stepNumberContainer}>
      <Text style={styles.stepNumberText}>{step}</Text>
    </View>
    <Text style={styles.listText}>{text.replace(/^[\s*\d\.]+\s*/, "")}</Text>
  </View>
);

// Tag Component (NEW)
const TagItem = ({ text }) => (
  <View style={styles.tagPill}>
    <Text style={styles.tagText}>#{text}</Text>
  </View>
);

const ReviewStats = ({ author, ratingCount, badRatingCount, timestamp }) => {
  const totalRatings = ratingCount + badRatingCount;
  const correctPercentage =
    totalRatings > 0 ? (ratingCount / totalRatings) * 100 : 0;

  return (
    <View style={styles.reviewStatsContainer}>
      {/* Hàng 1: Tác giả và Dấu thời gian */}
      <Text style={styles.author}>
        <Text style={{ fontWeight: "600", color: TEXT_DARK }}>
          Posted by: {author || "User"}
        </Text>
        {timestamp && <Text style={styles.timestampText}> | {timestamp}</Text>}
      </Text>

      {/* --- Thanh Tỷ Lệ (Rating Ratio Bar) --- */}
      <View style={styles.ratioBarWrapper}>
        <View style={styles.ratioBarBackground}>
          <View
            style={[styles.ratioBarFill, { width: `${correctPercentage}%` }]}
          />
        </View>

        {/* Hàng 2: Tổng quan và Số lượng */}
        <View style={styles.reviewCountsRow}>
          <Text style={styles.totalRatingsText}>
            Total Reviews:{" "}
            <Text style={{ fontWeight: "bold", color: DARK_BLUE }}>
              {totalRatings}
            </Text>
          </Text>

          {/* Đánh giá Tích cực (Correct) */}
          <View style={styles.reviewStatBox}>
            <Ionicons name="checkmark-circle" size={16} color={GREEN} />
            <Text style={[styles.reviewStatValue, { color: GREEN }]}>
              {ratingCount || 0}
            </Text>
          </View>

          {/* Dấu phân cách */}
          <Text style={styles.separator}>/</Text>

          {/* Đánh giá Tiêu cực (Needs Review) */}
          <View style={styles.reviewStatBox}>
            <Ionicons name="alert-circle" size={16} color={RED} />
            <Text style={[styles.reviewStatValue, { color: RED }]}>
              {badRatingCount || 0}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [isFavorite, setIsFavorite] = useState(
    route.params?.post?.user_vote?.is_liked || false
  );

  const { blogLike } = useBlogAPI();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [FADE_START_POINT, FADE_END_POINT],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const iconOpacity = scrollY.interpolate({
    inputRange: [0, FADE_START_POINT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const { post } = route.params;

  const ingredientsList = post?.recipe.ingredients_list
    ? post.recipe.ingredients_list_fixed
        .join("\n") // <-- SỬ DỤNG .join("\n") ĐỂ CHUYỂN MẢNG THÀNH CHUỖI
        .split("\n")
        .filter((item) => item.trim().length > 0)
    : [];

  const instructionsList = post?.recipe.instructions
    ? post.recipe.instructions
        .join("\n") // <-- SỬ DỤNG .join("\n") ĐỂ CHUYỂN MẢNG THÀNH CHUỖI
        .split("\n")
        .filter((item) => item.trim().length > 0)
    : [];

  // Lấy danh sách tags (Giả định post.tags là array)
  const tagsList = post?.recipe.tags || [];

  const onLikePress = async (isCurrentlyLiked) => {
    // Ngăn chặn hành động nếu không có ID bài đăng
    if (!post || !post.id) {
      console.error("Post ID is missing.");
      return;
    }

    console.log(
      `Calling API to ${!isCurrentlyLiked ? "UNLIKE" : "LIKE"} post ID: ${
        post.id
      }`
    );

    setIsFavorite(isCurrentlyLiked); // Cập nhật trạng thái local

    try {
      await blogLike({
        blogId: post.id,
        is_liked: isCurrentlyLiked,
      });

      console.log(
        `Successfully ${!isCurrentlyLiked ? "unliked" : "liked"} post.`
      );
    } catch (error) {
      console.error("Error toggling like status:", error.message);
      // Hiển thị thông báo lỗi cho người dùng (Ví dụ: Alert.alert("Lỗi", "Không thể cập nhật trạng thái like. Vui lòng thử lại."));
    }
  };

  if (!post) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
        <View style={[styles.headerButtons, { top: STATUS_BAR_HEIGHT }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text>Post not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <Animated.View
        style={[styles.headerContainer, { opacity: headerOpacity }]}
      />

      <View style={styles.headerButtons}>
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[{ opacity: iconOpacity }, styles.iconAbsolute]}
          >
            <TouchableOpacity
              style={[styles.headerButton, styles.iconBack]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={DARK_BLUE} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[{ opacity: headerOpacity }, styles.iconAbsolute]}
          >
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* === NÚT HEART (SỬA LỖI JUMP) === */}
        <View style={styles.buttonContainer}>
          {/* Trạng thái 1: Nền trắng (trước khi cuộn) */}
          <Animated.View
            style={[{ opacity: iconOpacity }, styles.iconAbsolute]}
          >
            <TouchableOpacity
              style={[styles.headerButton, styles.iconBack]}
              onPress={() => onLikePress(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#E74C3C" : DARK_BLUE}
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[{ opacity: headerOpacity }, styles.iconAbsolute]}
          >
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => onLikePress(!isFavorite)}
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

      <Animated.ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Image
          source={{
            uri:
              post.image_url ||
              "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
          }}
          style={styles.image}
        />

        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{post.title}</Text>

            {/* --- HIỂN THỊ TAGS (MỚI) --- */}
            {tagsList.length > 0 && (
              <View style={styles.tagsContainer}>
                {tagsList.map((tag, index) => (
                  <TagItem key={index} text={tag} />
                ))}
              </View>
            )}

            <ReviewStats
              author={post.author}
              ratingCount={post.rating}
              badRatingCount={post.bad_rating}
              timestamp={post.timestamp} // Giả định trường timestamp tồn tại
            />
            <Text style={styles.description}>
              {post.description || "Author has not provided a description."}
            </Text>
          </View>

          {/* Time and Difficulty Info */}
          <View style={styles.infoContainer}>
            <InfoBox
              icon="time-outline"
              label="Time"
              value={`${post.recipe.time_minutes || "?"} mins`}
              score={post.recipe.time_minutes}
            />
            <InfoBox
              icon="podium-outline"
              label="Difficulty"
              value={post.difficulty_score}
              score={post.difficulty_score}
            />
          </View>

          {/* Detailed Content */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {post.recipe.description ||
                "Author has not provided a description."}
            </Text>

            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredientsList.length > 0 ? (
              ingredientsList.map((item, index) => (
                <IngredientItem key={index} text={item} />
              ))
            ) : (
              <Text style={styles.description}>
                Author has not provided ingredients.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Cooking Instructions</Text>
            {instructionsList.length > 0 ? (
              instructionsList.map((item, index) => (
                <InstructionStep key={index} text={item} step={index + 1} />
              ))
            ) : (
              <Text style={styles.description}>
                Author has not provided instructions.
              </Text>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  container: {
    flex: 1,
    zIndex: 1,
  },

  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_BLUE,
    height: HEADER_MIN_HEIGHT + STATUS_BAR_HEIGHT,
    zIndex: 2,
  },
  headerButtons: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    zIndex: 3,
    height: HEADER_MIN_HEIGHT,
  },
  buttonContainer: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  // FIX: Đảm bảo hai nút chồng lên nhau hoàn hảo
  iconAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBack: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 17,
    padding: 4,
  },
  // --- END DYNAMIC HEADER STYLES ---

  image: {
    width: "100%",
    height: HEADER_MAX_HEIGHT,
    resizeMode: "cover",
  },

  contentContainer: {
    backgroundColor: BACKGROUND_LIGHT,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
  },

  titleContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#F9EBD7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  // --- NEW STYLES FOR TAGS ---
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 5,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: "#ffc06252", // Nền nhạt
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PRIMARY_BLUE + "50",
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: " #d8bb90ff",
  },
  // --- END TAG STYLES ---

  author: {
    fontSize: 15,
    color: "gray",
    fontStyle: "italic",
  },

  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#F9EBD7",
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
    marginTop: 3,
  },

  content: {
    padding: 20,
    backgroundColor: "#F9EBD7",
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginTop: 15,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_BLUE,
    paddingBottom: 5,
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    color: "#333",
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND_LIGHT,
  },

  // --- LIST STYLES ---
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  listIcon: {
    marginRight: 12,
    marginTop: 5,
    color: PRIMARY_BLUE,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 25,
    color: "#333",
  },
  stepNumberContainer: {
    width: 26,
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
  // --- NEW/UPDATED STYLES FOR Review Stats ---
  reviewStatsContainer: {
    marginTop: 5,
    paddingVertical: 5,
    borderTopWidth: 1, // Tách biệt khỏi tiêu đề
    borderTopColor: BACKGROUND_LIGHT,
    paddingTop: 15,
  },
  author: {
    fontSize: 14, // Giảm cỡ chữ tác giả
    color: "gray",
    fontStyle: "italic",
    marginBottom: 10,
  },
  timestampText: {
    fontSize: 14,
    color: "gray",
    fontStyle: "italic",
  },
  ratioBarWrapper: {
    marginTop: 5,
    marginBottom: 10,
  },
  ratioBarBackground: {
    height: 6,
    backgroundColor: RED + "40", // Nền màu đỏ nhạt (tỷ lệ đánh giá xấu)
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  ratioBarFill: {
    height: "100%",
    backgroundColor: GREEN, // Thanh màu xanh lá (tỷ lệ đánh giá tốt)
    borderRadius: 3,
  },
  reviewCountsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Phân bổ đều các phần tử
  },
  totalRatingsText: {
    fontSize: 14,
    color: "gray",
    fontWeight: "500",
    flex: 1, // Chiếm không gian còn lại
  },
  reviewStatBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  separator: {
    fontSize: 16,
    color: "gray",
    marginHorizontal: 5,
    fontWeight: "300",
  },
});
