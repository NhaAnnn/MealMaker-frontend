import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

const InputSection = ({
  ingredients,
  onIngredientChange,
  onSearch,
  onRandom,
}) => {
  return (
    <View style={styles.container}>
      {/* Dịch: Bạn có gì? (Tối đa 3 Nguyên liệu) */}
      <Text style={styles.headerText}>
        What do you have? (Max 3 Ingredients)
      </Text>
      <View style={styles.inputList}>
        {ingredients.map((ing, index) => (
          <TextInput
            key={index}
            style={styles.input}
            // Dịch: Nguyên liệu
            placeholder={`Ingredient ${index + 1}`}
            value={ing}
            onChangeText={(value) => onIngredientChange(index, value)}
            placeholderTextColor="#aaa"
          />
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onSearch}>
        {/* Dịch: Tìm công thức */}
        <Text style={styles.primaryButtonText}>Find Recipes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onRandom}>
        {/* Dịch: Hôm nay ăn gì? (Random) */}
        <Text style={styles.secondaryButtonText}>
          What to eat today? (Random)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... Add styles from previous guide or self-defined ...
  container: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  inputList: { marginBottom: 10 },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: "#876a3fff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 5,
  },
  primaryButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  secondaryButton: {
    backgroundColor: "#876a3fff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

export default InputSection;
