import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const RecipeCard = ({ recipe, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.timeTag}>🕒 {recipe.time_minutes} phút</Text>
      </View>
      <View style={styles.metaContainer}>
        <Text style={styles.metaText}>
          ⭐ Độ khó: {recipe.difficulty_score}/5.0
        </Text>
      </View>
      <Text style={styles.ingredients}>
        Nguyên liệu chính: {recipe.primary_ingredients.join(", ")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: "#007BFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007BFF",
  },
  timeTag: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
  },
  metaContainer: { marginBottom: 8 },
  metaText: { fontSize: 13, color: "#6c757d" },
  ingredients: { fontSize: 14, color: "#333", fontStyle: "italic" },
});

export default RecipeCard;
