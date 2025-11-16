import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { useNavigation } from "@react-navigation/native";
import RatingModal from "./RatingModal";
import { useBlogAPI } from "../hook/useBlogs";

// --- Colors ---
const TEXT_DARK = "#2C3E50";
const PRIMARY_BLUE = "#3D2C1C"; // Main dark brown color
const GREEN_VOTE = "#27AE60"; // Dark green for Correct
const RED_VOTE = "#E74C3C"; // Dark red for Review
const GRAY_OUT = "#BDC3C7"; // Gray for unselected button

// Survey Button Component (Giữ nguyên)
const SurveyButton = ({
  icon,
  text,
  onPress,
  color,
  isSelected,
  disabled,
  style,
}) => {
  const contentColor = isSelected ? "#fff" : color;
  const backgroundColor = isSelected ? color : color + "20";

  // Define Border Style
  const borderStyle = isSelected
    ? { borderWidth: 2, borderColor: "#fff" }
    : { borderWidth: 1, borderColor: color + "40" };

  return (
    <TouchableOpacity
      style={[
        styles.surveyButton,
        { backgroundColor: backgroundColor },
        borderStyle,
        style,
        disabled && styles.disabledButtonOpacity,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={18} color={contentColor} />
      <Text style={[styles.surveyText, { color: contentColor }]}>{text}</Text>
    </TouchableOpacity>
  );
};

// Component to determine difficulty text (Translated) (Giữ nguyên)
const getDifficultyText = (score) => {
  if (score <= 1.5) return "Very Easy";
  if (score <= 3.0) return "Medium";
  return "Hard";
};

// --- LOGIC CHUYỂN ĐỔI TRẠNG THÁI (ĐÃ SỬA VÀ ĐỔI TÊN) ---
// Chuyển đổi giá trị boolean/null từ API thành state boolean/null của UI
const apiBoolToUIState = (isGoodRating) => {
  // Nếu API trả về TRUE (Correct)
  if (isGoodRating === true) return true;
  // Nếu API trả về FALSE (Needs Review)
  if (isGoodRating === false) return false;
  // Nếu API trả về NULL/undefined (Chưa đánh giá)
  return null;
};
// -----------------------------------

export default function PostCard({ post, onPostUpdated }) {
  const { isLoggedIn } = useAuth();
  const navigation = useNavigation();

  // SỬA LỖI: Lấy giá trị isGoodRating an toàn
  const initialIsGoodRating = post.user_vote
    ? post.user_vote.isGoodRating
    : null;

  // KHỞI TẠO STATE VỚI BOOLEAN/NULL (SỬ DỤNG HÀM MỚI ĐÃ SỬA)
  const [userInteraction, setUserInteraction] = useState(
    apiBoolToUIState(initialIsGoodRating)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy API hooks
  const { createBlogRating, undoBlogRating } = useBlogAPI();

  // STATE CHO MODAL
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Vẫn dùng chuỗi ('correct'/'review') để định danh loại tương tác cho Modal
  const [currentInteractionType, setCurrentInteractionType] = useState(null);

  // FUNC 1: Mở Modal hoặc Hủy đánh giá
  const handleInteraction = (interactionType) => {
    if (isSubmitting) return;

    if (!isLoggedIn) {
      Alert.alert("Error", "You need to log in to rate this recipe.");
      return;
    }

    // Chuyển interactionType (chuỗi) thành boolean để so sánh với userInteraction (boolean)
    const interactionBool = interactionType === "correct" ? true : false;

    // Kịch bản 1: Hủy đánh giá hiện tại (Bấm lại chính nút đã chọn)
    if (userInteraction === interactionBool) {
      handleSubmission(null, null); // newInteractionType = null -> Kích hoạt hủy
      return;
    }

    // Kịch bản 2: Đánh giá mới (Chỉ mở Modal nếu chưa đánh giá)
    if (userInteraction === null) {
      setCurrentInteractionType(interactionType);
      setIsModalVisible(true);
    }
  };

  // FUNC 2: Xử lý submission sau khi người dùng nhập dữ liệu từ Modal
  const handleSubmission = async (newInteractionType, extraData) => {
    setIsModalVisible(false); // Đóng modal ngay lập tức
    setIsSubmitting(true);

    try {
      // Kịch bản 1: Hủy đánh giá (DELETE API: undoBlogLike)
      if (newInteractionType === null) {
        if (userInteraction !== null) {
          // Đảm bảo có đánh giá để hủy
          await undoBlogRating({ blogId: post.id });
          setUserInteraction(null); // Đặt lại trạng thái UI thành null
          Alert.alert("Notice", "Rating has been cancelled.");

          // GỌI CALLBACK SAU KHI ĐÁNH GIÁ MỚI THÀNH CÔNG
          if (onPostUpdated) onPostUpdated();
        } else {
          // Xử lý lỗi nếu cố gắng hủy khi chưa có đánh giá
          throw new Error("No existing rating to cancel.");
        }
        return;
      }

      // Kịch bản 2: Đánh giá mới (CREATE API: createBlogLike)

      // Xử lý isGoodRating (boolean)
      const isGoodRating = newInteractionType === "correct";

      const interactionText = isGoodRating
        ? "Recipe is Correct"
        : "Needs Review";

      await createBlogRating({
        blogId: post.id,
        isGoodRating: isGoodRating, // TRUE cho 'correct', FALSE cho 'review'
        score: isGoodRating ? extraData : null,
        rejectionReason: !isGoodRating ? extraData : null,
      });

      // Cập nhật UI sau khi API thành công
      // Cập nhật state thành giá trị boolean tương ứng
      setUserInteraction(isGoodRating);

      Alert.alert(
        "Thank You",
        `Your rating (${interactionText}) has been recorded. ${
          isGoodRating ? `Difficulty score: ${extraData}` : ""
        }`
      );

      // GỌI CALLBACK SAU KHI ĐÁNH GIÁ MỚI THÀNH CÔNG
      if (onPostUpdated) onPostUpdated();
    } catch (e) {
      console.error("API Error:", e);
      Alert.alert("Error", "Could not update rating, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApiProcessing = isSubmitting;

  // --- LOGIC VÔ HIỆU HÓA NÚT ---
  // Khóa nút nếu đang xử lý API HOẶC nút đó không phải nút đã chọn (khi đã có đánh giá)
  const isCorrectDisabled =
    isApiProcessing || (userInteraction !== null && userInteraction !== true);
  const isReviewDisabled =
    isApiProcessing || (userInteraction !== null && userInteraction !== false);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {/* TouchableOpacity for the entire card to view details */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            navigation.navigate("PostDetail", { post: post });
          }}
        >
          <ImageBackground
            source={{
              uri:
                post.image_url ||
                "https://via.placeholder.com/400x200.png?text=Recipe+Image",
            }}
            style={styles.image}
            imageStyle={{ borderRadius: 12 }}
          >
            {/* Info Ribbon (Time/Difficulty) */}
            <View style={styles.infoRibbon}>
              <View style={styles.infoChip}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.infoText}>
                  {post.recipe?.time_minutes || "N/A"} mins
                </Text>
              </View>
            </View>

            {/* Title and Author Overlay */}
            <View style={styles.imageOverlay}>
              <Text style={styles.title}>{post.title}</Text>

              <View style={styles.authorRow}>
                <Text style={styles.author}>Posted by {post.author}</Text>
                <Text style={styles.timestamp}> | {post.timestamp}</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Survey/Poll */}
        <View style={styles.surveyContainer}>
          <Text>{post.description_fixed}</Text>
          <Text style={styles.surveyTitle}>Recipe Survey:</Text>
          <View style={styles.buttonRow}>
            {/* Nút Correct: isSelected là TRUE */}
            <SurveyButton
              icon="checkmark-circle-outline"
              text="Recipe is Correct"
              color={GREEN_VOTE}
              isSelected={userInteraction === true} // So sánh boolean
              disabled={isCorrectDisabled} // Disabled khi đang xử lý API HOẶC khi nút Review đang được chọn
              onPress={() => handleInteraction("correct")}
              style={{ marginRight: 15 }}
            />
            {/* Nút Needs Review: isSelected là FALSE */}
            <SurveyButton
              icon="flag-outline"
              text="Needs Review"
              color={RED_VOTE}
              isSelected={userInteraction === false} // So sánh boolean
              disabled={isReviewDisabled} // Disabled khi đang xử lý API HOẶC khi nút Correct đang được chọn
              onPress={() => handleInteraction("review")}
            />
          </View>

          {/* Rating Status Message */}
          {userInteraction !== null && !isApiProcessing && (
            <Text style={styles.votedText}>
              Your rating:
              <Text
                style={{
                  fontWeight: "bold",
                  color: userInteraction === true ? GREEN_VOTE : RED_VOTE,
                }}
              >
                {userInteraction === true ? " CORRECT" : " NEEDS REVIEW"}
              </Text>
              . Press the **selected button** again to cancel the rating.
            </Text>
          )}
        </View>
      </View>

      {/* Loading Overlay to block clicks during submission */}
      {isApiProcessing && (
        <View style={styles.submittingOverlay}>
          <View style={styles.submittingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submittingTextOverlay}>Updating rating...</Text>
          </View>
        </View>
      )}

      {/* RATING/REJECTION MODAL */}
      <RatingModal
        isVisible={isModalVisible}
        interactionType={currentInteractionType} // Vẫn truyền chuỗi 'correct'/'review' cho Modal
        onClose={() => {
          setIsModalVisible(false);
          setCurrentInteractionType(null);
        }}
        onSubmit={handleSubmission} // Truyền hàm submission
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
    position: "relative",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
  },
  infoRibbon: {
    flexDirection: "row",
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
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
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  author: {
    fontSize: 13,
    color: "#eee",
  },
  timestamp: {
    fontSize: 12,
    color: "#ccc",
    marginLeft: 5,
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
    justifyContent: "space-around",
  },
  surveyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  disabledButtonOpacity: {
    opacity: 0.5,
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
    fontSize: 13,
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  submittingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 10,
  },
  submittingTextOverlay: {
    marginLeft: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
