// --- File: QuestionCard.js ---
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const primaryColor = "#FF5733"; // Main orange/red color
const accentColor = "#33A0FF"; // Blue color (used for Next button)
const successColor = "#4CAF50"; // Green (Correct)
const dangerColor = "#F44336"; // Red (Incorrect)
const lightBackground = "#F5F5F5";
const darkGray = "#333";
const lightGray = "#EEE";

const QuestionCard = ({
  question,
  onSelect,
  selectedAnswerId,
  showFeedback,
}) => {
  // Function to determine the color/style of the option based on its state
  const getOptionStyle = (option) => {
    const isSelected = selectedAnswerId === option.id;
    const isCorrectAnswer = option.id === question.correct_id;

    if (showFeedback) {
      // Show results after submission
      if (isCorrectAnswer) {
        return cardStyles.optionCorrect;
      }
      if (isSelected && !isCorrectAnswer) {
        return cardStyles.optionIncorrect;
      }
    }
    // Show selection state before submission
    return isSelected ? cardStyles.optionSelected : cardStyles.optionDefault;
  };

  // Function to determine the color for the main feedback text (CORRECT/INCORRECT)
  const getFeedbackColor = () => {
    return selectedAnswerId === question.correct_id
      ? successColor
      : dangerColor;
  };

  return (
    <ScrollView style={cardStyles.card}>
      {/* Question Text */}
      <Text style={cardStyles.questionText}>{question.question}</Text>

      {/* Answer Options */}
      <View style={cardStyles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[cardStyles.optionButton, getOptionStyle(option)]}
            onPress={() => onSelect(option.id)}
            disabled={showFeedback} // Disable selection once submitted
          >
            <Text style={cardStyles.optionLabel}>
              {option.id.toUpperCase()}
            </Text>
            <Text style={cardStyles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback and Explanation */}
      {showFeedback && (
        <View style={cardStyles.feedbackContainer}>
          <Text
            style={[cardStyles.feedbackTextBold, { color: getFeedbackColor() }]}
          >
            {selectedAnswerId === question.correct_id
              ? "✅ CORRECT!"
              : "❌ INCORRECT!"}
          </Text>
          <Text style={cardStyles.explanationText}>
            <Text style={{ fontWeight: "bold", color: darkGray }}>
              Explanation:
            </Text>
            {question.explanation}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "bold",
    color: darkGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    // flexGrow: 1,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    backgroundColor: lightBackground,
    borderColor: lightGray,
  },
  optionDefault: {
    borderColor: lightGray,
  },
  optionSelected: {
    borderColor: accentColor,
    backgroundColor: "#EAF6FF",
  },
  optionCorrect: {
    borderColor: successColor,
    backgroundColor: "#E6F7E6",
  },
  optionIncorrect: {
    borderColor: dangerColor,
    backgroundColor: "#FFE6E6",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: darkGray,
    marginRight: 15,
    width: 20,
    textAlign: "center",
  },
  optionText: {
    fontSize: 16,
    color: darkGray,
    flex: 1, // Allows text to wrap without overflow and take remaining space
  },
  feedbackContainer: {
    paddingTop: 15,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: lightGray,
  },
  feedbackTextBold: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    // Color is set by logic
  },
  explanationText: {
    fontSize: 16,
    color: darkGray,
    // Explanation text naturally wraps due to default Text component behavior
  },
});
export default QuestionCard;
