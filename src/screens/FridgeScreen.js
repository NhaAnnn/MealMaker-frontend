import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --- Định nghĩa màu sắc MODERN BLUE ---
const PRIMARY_BLUE = "#007AFF"; // Xanh Dương Sáng (Màu chủ đạo)
const DARK_BLUE = "#003A70"; // Xanh Đậm cho Header
const BACKGROUND_LIGHT = "#F0F3F6"; // Nền Xám Rất Nhạt
const TEXT_DARK = "#2C3E50"; // Xám Đậm
const ACCENT_RED = "#E74C3C"; // Màu nhấn cho Fridge (đồng bộ với HomeScreen)

// Component cho Nguyên liệu
const IngredientItem = ({ name, quantity, unit, onDelete }) => (
  <View style={styles.ingredientItem}>
    <View style={styles.itemInfo}>
      <Ionicons
        name="nutrition-outline"
        size={20}
        color={TEXT_DARK}
        style={{ marginRight: 10 }}
      />
      <Text style={styles.itemName}>{name}</Text>
    </View>
    <View style={styles.itemControls}>
      <Text style={styles.itemQuantity}>{`${quantity} ${unit}`}</Text>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="close-circle-outline" size={24} color={ACCENT_RED} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function FridgeScreen({ navigation }) {
  const [ingredients, setIngredients] = useState([
    { id: 1, name: "Thịt gà", quantity: 500, unit: "gram" },
    { id: 2, name: "Trứng", quantity: 10, unit: "quả" },
    { id: 3, name: "Cà rốt", quantity: 2, unit: "củ" },
    { id: 4, name: "Gạo", quantity: 1, unit: "kg" },
  ]);
  const [newIngredient, setNewIngredient] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const handleDelete = (id) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    if (newIngredient.trim() && newQuantity) {
      setIngredients([
        ...ingredients,
        {
          id: Date.now(),
          name: newIngredient.trim(),
          quantity: parseFloat(newQuantity) || 1,
          unit: "đơn vị",
        },
      ]);
      setNewIngredient("");
      setNewQuantity("");
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header đồng bộ với HomeScreen */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tủ Lạnh Của Bạn</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Form Thêm Nguyên liệu */}
          <Text style={styles.sectionTitle}>Thêm Nguyên Liệu Mới</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Tên nguyên liệu (e.g. Bắp cải)"
              value={newIngredient}
              onChangeText={setNewIngredient}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
              placeholder="Số lượng"
              keyboardType="numeric"
              value={newQuantity}
              onChangeText={setNewQuantity}
            />
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addButton, { backgroundColor: PRIMARY_BLUE }]}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Danh sách Nguyên liệu */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
            Kho Nguyên Liệu Đã Lưu ({ingredients.length})
          </Text>
          <View style={styles.card}>
            {ingredients.map((item) => (
              <IngredientItem
                key={item.id}
                name={item.name}
                quantity={item.quantity}
                unit={item.unit}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </View>

          {/* Nút tìm công thức gợi ý */}
          <TouchableOpacity
            style={[styles.findRecipesButton, { backgroundColor: ACCENT_RED }]}
            onPress={() => navigation.navigate("Khám Phá")}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.findRecipesText}>
              Tìm Công Thức Với Nguyên Liệu Này
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  scrollContent: { paddingBottom: 40 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // --- Header ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerRightPlaceholder: { width: 24 }, // Giữ cân bằng layout

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
    paddingLeft: 10,
  },
  // --- Input Form ---
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- Ingredient List Card ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_DARK,
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 16,
    color: "#7F8C8D",
    marginRight: 10,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 5,
  },
  // --- Footer Button ---
  findRecipesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  findRecipesText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
  },
});
