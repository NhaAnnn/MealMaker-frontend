import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const RecipeCard = ({ recipe, onPress }) => {
  // Lấy 3 nguyên liệu đầu tiên từ ingredients_list để làm "Main Ingredients"
  const primaryIngredients = recipe.ingredients_list
    ? recipe.ingredients_list.slice(0, 3).join(", ")
    : "No ingredients listed";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        {/* Giả định trường tên công thức trong mockData là 'title', không phải 'name' */}
        <Text style={styles.title}>{recipe.title}</Text>
      </View>
      <View style={styles.metaContainer}>
        <Text style={styles.timeTag}>🕒 {recipe.time_minutes} min</Text>

        <Text style={styles.metaText}>
          ⭐ Difficulty: {recipe.difficulty_score}/5.0
        </Text>
      </View>
      {/* Sửa: Sử dụng primaryIngredients đã xử lý */}
      <Text style={styles.ingredients}>
        Main ingredients: {primaryIngredients}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 15,
    borderRadius: 10,
    // marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: "#3D2C1C",
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
    color: "#3D2C1C",
  },
  timeTag: {
    fontSize: 14,
    color: "#967a00ff",
    fontWeight: "600",
    marginRight: 25,
  },
  metaContainer: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  metaText: { fontSize: 14, color: "#9b7f00ff", fontWeight: "600" },
  ingredients: { fontSize: 14, color: "#333", fontStyle: "italic" },
});

export default RecipeCard;
