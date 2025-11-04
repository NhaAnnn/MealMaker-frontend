import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet, // <-- 1. Đảm bảo đã import
  ImageBackground,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { useNavigation } from "@react-navigation/native"; // <-- 2. Thêm import

// --- Màu sắc ---
const TEXT_DARK = "#2C3E50";
const PRIMARY_BLUE = "#007AFF";
const GREEN_VOTE = "#2ECC71";
const YELLOW_VOTE = "#F1C40F";
const RED_VOTE = "#E74C3C";

// (GIẢ LẬP) ĐỊA CHỈ API CỦA BẠN
const API_URL = "https://api.your-app.com/posts";

// Component Nút Khảo Sát
const SurveyButton = ({ icon, text, onPress, color, disabled }) => (
  <TouchableOpacity
    style={[styles.surveyButton, { backgroundColor: color + "20" }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name={icon} size={18} color={color} />
    <Text style={[styles.surveyText, { color: color }]}>{text}</Text>
  </TouchableOpacity>
);

// (MỚI) Component hiển thị độ khó
const getDifficultyText = (score) => {
  if (score <= 1.5) return "Rất Dễ";
  if (score <= 3.0) return "Trung bình";
  return "Khó";
};

export default function PostCard({ post }) {
  const { userToken } = useAuth();
  const navigation = useNavigation(); // <-- 3. Khởi tạo navigation
  const [interactionSent, setInteractionSent] = useState(null);

  // Hàm gọi API khi người dùng bấm khảo sát
  const handleInteraction = async (interactionType) => {
    if (interactionSent) {
      Alert.alert("Thông báo", "Bạn đã đánh giá bài đăng này.");
      return;
    }
    if (!userToken) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để đánh giá.");
      return;
    }

    setInteractionSent(interactionType);

    try {
      const response = await fetch(`${API_URL}/${post.id}/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ interaction: interactionType }),
      });

      if (!response.ok) throw new Error("Lỗi gửi đánh giá");

      Alert.alert("Cảm ơn", "Đánh giá của bạn đã được ghi lại.");
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể gửi đánh giá, vui lòng thử lại.");
      setInteractionSent(null); // Cho phép thử lại nếu lỗi
    }
  };

  return (
    <View style={styles.card}>
      {/* 4. BỌC PHẦN ẢNH BẰNG TOUCHABLEOPACITY */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate("PostDetail", { post: post });
        }}
      >
        <ImageBackground
          source={{
            uri:
              post.image ||
              "https://via.placeholder.com/400x200.png?text=Recipe+Image",
          }}
          style={styles.image}
          imageStyle={{ borderRadius: 12 }}
        >
          {/* (MỚI) THÊM THỜI GIAN VÀ ĐỘ KHÓ */}
          <View style={styles.infoRibbon}>
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.infoText}>
                {post.time_minutes || "N/A"} phút
              </Text>
            </View>
            <View style={styles.infoChip}>
              <Ionicons name="podium-outline" size={14} color="#fff" />
              <Text style={styles.infoText}>
                {getDifficultyText(post.difficulty_score)}
              </Text>
            </View>
          </View>

          <View style={styles.imageOverlay}>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.author}>bởi {post.author}</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.surveyContainer}>
        <Text style={styles.surveyTitle}>Khảo sát công thức:</Text>
        <View style={styles.buttonRow}>
          <SurveyButton
            icon="checkmark-circle-outline"
            text="Công thức đúng"
            color={GREEN_VOTE}
            disabled={!!interactionSent}
            onPress={() => handleInteraction("correct")}
          />
          <SurveyButton
            icon="rocket-outline"
            text="Dễ làm"
            color={PRIMARY_BLUE}
            disabled={!!interactionSent}
            onPress={() => handleInteraction("easy")}
          />
          <SurveyButton
            icon="flag-outline"
            text="Cần xem lại"
            color={RED_VOTE}
            disabled={!!interactionSent}
            onPress={() => handleInteraction("review")}
          />
        </View>
        {interactionSent && (
          <Text style={styles.votedText}>Cảm ơn bạn đã đánh giá!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end", // <-- SỬA TỪ "space-between" THÀNH "flex-end"
  },

  // --- (MỚI) STYLES CHO RIBBON ---
  infoRibbon: {
    flexDirection: "row",
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1, // <-- THÊM zIndex ĐỂ ĐẢM BẢO NÓ NỔI LÊN TRÊN
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    marginRight: 6,
  },
  infoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  // --- KẾT THÚC STYLES MỚI ---

  imageOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 3,
  },
  author: {
    fontSize: 13,
    color: "#eee",
  },
  surveyContainer: {
    padding: 15,
  },
  surveyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  surveyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  surveyText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  votedText: {
    textAlign: "center",
    marginTop: 10,
    color: "gray",
    fontStyle: "italic",
    fontSize: 12,
  },
});
