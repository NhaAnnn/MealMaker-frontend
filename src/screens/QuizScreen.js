// --- File: QuizScreen.js ---
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import QuestionCard from "../components/QuestionCard";
import { useAuth } from "../components/AuthContext";
import { useUserUpdateAPI } from "../hook/useUsers";
import {
  useNavigation,
  useIsFocused,
  useFocusEffect,
} from "@react-navigation/native";

const PYTHON_AI_SERVICE_URL = "http://mealmaker-ai-production.up.railway.app/";

const primaryColor = "#2bc500ff"; // Main orange/red color
const accentColor = "#33A0FF"; // Blue color (used for Next button)
const successColor = "#4CAF50"; // Green (Correct)
const dangerColor = "#F44336"; // Red (Incorrect)
const lightBackground = "#F9EBD7";
const darkGray = "#333";
const lightGray = "#EEE";

const QuizScreen = () => {
  const [quizData, setQuizData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { userData, fetchUserData } = useAuth();
  const totalQuestions = quizData.length;
  const { updateCookingSkill } = useUserUpdateAPI();
  const navigation = useNavigation();

  // --- 1. Fetch Quiz Data ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Log the current skill level to the console
        console.log(
          "Fetching quiz for level:",
          userData.ai_profile.cooking_skill_level
        );

        // Call Python AI API for custom quiz
        const response = await fetch(
          `${PYTHON_AI_SERVICE_URL}/get-quiz-questions?level=${userData.ai_profile.cooking_skill_level}`
        );

        // Handle non-200 responses (e.g., 404, 500)
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server responded with status ${response.status}`
          );
        }

        const data = await response.json();

        setQuizData(data);
        setIsLoading(false);
      } catch (error) {
        Alert.alert(
          "Quiz Load Error",
          `Could not load the question set: ${error.message}.`
        );
        setIsLoading(false);
        console.error("Fetch Quiz Error:", error);
      }
    };
    fetchQuiz();
  }, [userData._id, userData.ai_profile.cooking_skill_level]); // Depend on level for fresh fetch

  // --- 2. Handle Answer Selection Logic ---
  const handleSelectAnswer = (answerId) => {
    if (showFeedback) return;
    setSelectedAnswerId(answerId);
  };

  const handleSubmit = () => {
    if (!selectedAnswerId)
      return Alert.alert(
        "Select an Answer",
        "Please select an answer before submitting."
      );

    const currentQuestion = quizData[currentQuestionIndex];
    const isCorrect = selectedAnswerId === currentQuestion.correct_id;

    // Update score immediately (Real-time Scoring)
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setShowFeedback(true); // Show feedback
  };

  const handleNext = async () => {
    if (!showFeedback) return;

    if (currentQuestionIndex < totalQuestions - 1) {
      // Move to the next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setShowFeedback(false);
    } else {
      // Quiz completion
      const currentLevel = userData.ai_profile.cooking_skill_level;
      const passRate = score / totalQuestions;
      const passed = passRate >= 0.75; // 75% or higher required to pass

      let title, message;

      if (passed) {
        title = "🎉 Quiz Passed!";
        message = `You scored ${score} out of ${totalQuestions} (${(
          passRate * 100
        ).toFixed(
          0
        )}%).\nYour current level is ${currentLevel}.\nThis score suggests a potential skill level UPGRADE!`;

        await updateCookingSkill();
      } else {
        title = "❌ Quiz Not Passed";
        message = `You scored ${score} out of ${totalQuestions} (${(
          passRate * 100
        ).toFixed(
          0
        )}%).\nThis score does not meet the minimum requirement (75%) for a level upgrade. Try again!`;
      }

      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            // CHUYỂN VỀ MÀN HÌNH TRƯỚC ĐÓ SAU KHI USER NHẤN OK
            navigation.goBack();
          },
        },
      ]);

      // Lưu ý: Các dòng reset trạng thái (setCurrentQuestionIndex(0), setScore(0))
      // không cần thiết vì màn hình sẽ bị unmount khi dùng goBack().

      console.log(
        `Quiz finished. Score: ${score}/${totalQuestions}. Current Level: ${currentLevel}. Passed: ${passed}`
      );
    }
  };

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 10, color: darkGray }}>Loading Quiz...</Text>
      </View>
    );
  }
  if (totalQuestions === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: dangerColor, fontWeight: "bold" }}>
          No questions were loaded. (Check Python Server)
        </Text>
      </View>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const progressWidth = `${
    ((currentQuestionIndex + 1) / totalQuestions) * 100
  }%`;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress Bar */}
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} / {totalQuestions} | Score:{" "}
          {score}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.levelText}>
          Current Difficulty: Level {currentQuestion.level}
        </Text>
      </View>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        onSelect={handleSelectAnswer}
        selectedAnswerId={selectedAnswerId}
        showFeedback={showFeedback}
      />

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!showFeedback ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              !selectedAnswerId && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!selectedAnswerId}
          >
            <Text style={styles.actionButtonText}>Submit & View Feedback</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: accentColor }]}
            onPress={handleNext}
          >
            <Text style={styles.actionButtonText}>
              {isLastQuestion ? "Finish Quiz" : "Next Question >>"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightBackground,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightBackground,
  },
  header: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: darkGray,
    marginBottom: 5,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: primaryColor,
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: lightGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: primaryColor,
    borderRadius: 4,
  },
  // --- Style Suggestion for Explanation Text within QuestionCard ---
  explanationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: lightGray, // Light background for contrast
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: successColor,
  },
  explanationText: {
    fontSize: 14,
    color: darkGray,
    // Ensure text wraps naturally
    flexWrap: "wrap",
  },
  // --- End of Style Suggestion ---
  actionContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: primaryColor,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: lightGray,
  },
});

export default QuizScreen;
