import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY_BLUE = "#3D2C1C";
const GREEN_VOTE = "#27AE60";
const RED_VOTE = "#E74C3C";
const TEXT_DARK = "#2C3E50";
const GRAY_OUT = "#BDC3C7"; // Thêm lại màu xám

// --- Sub-Component: Difficulty Rating (STAR RATING) ---
const DifficultyRating = ({ value, onChange }) => {
  const maxScore = 5;

  // Hàm trả về biểu tượng ngôi sao
  const renderStar = (index) => {
    const starScore = index + 1;
    const isFilled = starScore <= value;
    const iconName = isFilled ? "barbell" : "barbell-outline";

    // Dùng màu vàng cho ngôi sao đã chọn
    const starColor = isFilled ? "#fdc200ff" : GRAY_OUT;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => onChange(starScore)}
        activeOpacity={0.7}
        style={modalStyles.starTouchArea}
      >
        <Ionicons name={iconName} size={30} color={starColor} />
      </TouchableOpacity>
    );
  };

  // Hàm trả về nhãn mô tả độ khó
  const getLabel = (score) => {
    if (score === 1) return "Very Easy";
    if (score <= 2) return "Easy";
    if (score === 3) return "Medium";
    if (score <= 4) return "Hard";
    if (score === 5) return "Very Hard";
    return "";
  };

  return (
    <View style={modalStyles.ratingContainer}>
      <Text style={modalStyles.ratingLabel}>
        Select Difficulty (1-5 Stars):
      </Text>
      <View style={modalStyles.ratingStarRow}>
        {[...Array(maxScore)].map((_, index) => renderStar(index))}
      </View>
      {/* Hiển thị điểm số hiện tại và mô tả */}
      <Text style={modalStyles.currentScoreText}>
        Score: **{value}** ({getLabel(value)})
      </Text>
    </View>
  );
};

// --- Main Modal Component ---
const RatingModal = ({ isVisible, interactionType, onClose, onSubmit }) => {
  const [difficultyScore, setDifficultyScore] = useState(3); // Default for 'correct'
  const [rejectionReason, setRejectionReason] = useState(""); // Default for 'review'
  const [isFormValid, setIsFormValid] = useState(true);

  // Reset state when modal opens/changes type
  useEffect(() => {
    if (isVisible) {
      setDifficultyScore(3);
      setRejectionReason("");
      setIsFormValid(true);
    }
  }, [isVisible, interactionType]);

  const handleFormSubmit = () => {
    if (interactionType === "correct") {
      // Validation for correct
      onSubmit("correct", difficultyScore);
    } else if (interactionType === "review") {
      // Validation for rejection reason
      if (rejectionReason.trim().length < 10) {
        setIsFormValid(false);
        alert("Please provide a reason with at least 10 characters.");
        return;
      }
      onSubmit("review", rejectionReason.trim());
    }
  };

  // Determine content based on interactionType
  let title = "";
  let color = PRIMARY_BLUE;
  let submitText = "";

  if (interactionType === "correct") {
    title = "Rate Difficulty (Recipe is Correct)";
    color = GREEN_VOTE;
    submitText = "Confirm";
  } else if (interactionType === "review") {
    title = "Reason for Review (Needs Review)";
    color = RED_VOTE;
    submitText = "Submit Reason";
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={modalStyles.centeredView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={modalStyles.modalView}>
          <Text style={[modalStyles.modalTitle, { color: color }]}>
            {title}
          </Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {interactionType === "correct" ? (
              // SỬ DỤNG COMPONENT STAR RATING MỚI
              <DifficultyRating
                value={difficultyScore}
                onChange={setDifficultyScore}
              />
            ) : (
              <View style={modalStyles.rejectionContainer}>
                <Text style={modalStyles.rejectionLabel}>
                  What needs to be reviewed?
                </Text>
                <TextInput
                  style={[
                    modalStyles.rejectionInput,
                    !isFormValid && { borderColor: RED_VOTE },
                  ]}
                  placeholder="e.g., Wrong ingredients, incorrect temperature, missing steps..."
                  multiline
                  numberOfLines={4}
                  value={rejectionReason}
                  onChangeText={(text) => {
                    setRejectionReason(text);
                    setIsFormValid(true);
                  }}
                />
                {!isFormValid && (
                  <Text style={modalStyles.errorText}>
                    Reason must be at least 10 characters long.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.buttonGroup}>
            <TouchableOpacity
              style={[modalStyles.actionButton, modalStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.actionButton, { backgroundColor: color }]}
              onPress={handleFormSubmit}
            >
              <Text style={modalStyles.submitText}>{submitText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  // --- New Star Rating Styles ---
  ratingContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 15,
    color: TEXT_DARK,
  },
  ratingStarRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  starTouchArea: {
    paddingHorizontal: 5, // Tăng diện tích chạm xung quanh ngôi sao
  },
  currentScoreText: {
    fontSize: 14,
    color: TEXT_DARK,
    marginTop: 5,
    fontWeight: "500",
  },
  // --- End New Star Rating Styles ---

  // --- Rejection Styles (Không đổi) ---
  rejectionContainer: {
    marginBottom: 10,
  },
  rejectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: TEXT_DARK,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: GRAY_OUT,
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 14,
  },
  errorText: {
    color: RED_VOTE,
    marginTop: 5,
    fontSize: 12,
  },

  // --- Action Buttons (Không đổi) ---
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: GRAY_OUT,
    marginRight: 10,
    marginLeft: 0,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelText: {
    color: TEXT_DARK,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default RatingModal;
