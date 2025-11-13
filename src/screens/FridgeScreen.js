import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView, // ⭐️ Đã thêm import SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

// Import Hooks
import { useAuth } from "../components/AuthContext";
import { useUserUpdateAPI } from "../hook/useUsers";

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#AB9574";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_RED = "#D9534F";
const SUCCESS_COLOR = "#7F98B2";

// --- STANDARD UNITS LIST ---
const STANDARD_UNITS = [
  { label: "Unit", value: "" },
  { label: "grams (g)", value: "g" },
  { label: "milliliters (ml)", value: "ml" },
  { label: "Piece/Unit (unit)", value: "unit" },
];

// Component for Ingredient Item (Giữ nguyên)
const IngredientItem = ({
  name,
  quantity,
  unit,
  onDelete,
  onPress,
  isEditing,
}) => (
  <TouchableOpacity
    style={[styles.ingredientItem, isEditing && styles.editingItem]}
    onPress={onPress}
    disabled={isEditing}
  >
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
      <Text style={styles.itemQuantity}>{`${quantity}${unit}`}</Text>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="close-circle" size={26} color={ACCENT_RED} />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// Function to compare two objects (Giữ nguyên)
const areMapsEqual = (map1, map2) => {
  if (!map1 || !map2) return map1 === map2;
  const keys1 = Object.keys(map1);
  const keys2 = Object.keys(map2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (map1[key] !== map2[key]) {
      return false;
    }
  }

  return true;
};

export default function FridgeScreen({ navigation }) {
  const { updateFridge } = useUserUpdateAPI();
  const { userData, isLoading: isAuthLoading, fetchUserData } = useAuth();

  const [originalFridgeMap, setOriginalFridgeMap] = useState({});
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [ingredientsArray, setIngredientsArray] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingKey, setEditingKey] = useState(null);

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(STANDARD_UNITS[0].value);

  // --- DATA LOADING AND SYNCHRONIZATION (Giữ nguyên) ---

  useEffect(() => {
    if (
      userData &&
      typeof userData.fridge === "object" &&
      userData.fridge !== null
    ) {
      setOriginalFridgeMap(userData.fridge);
      setIngredientsMap(userData.fridge);
    } else if (!isAuthLoading) {
      setOriginalFridgeMap({});
      setIngredientsMap({});
    }
  }, [userData, isAuthLoading]);

  useEffect(() => {
    const tempArray = Object.entries(ingredientsMap).map(
      ([name, quantityUnitString]) => {
        const match = quantityUnitString.match(
          /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/
        );

        let quantity = quantityUnitString;
        let unit = "";
        let nameDisplay = name.charAt(0).toUpperCase() + name.slice(1);

        if (match) {
          quantity = match[1];
          unit = match[2] || "";
        }

        return {
          id: name,
          name: nameDisplay,
          quantity: quantity,
          unit: unit,
        };
      }
    );
    tempArray.sort((a, b) => a.name.localeCompare(b.name));
    setIngredientsArray(tempArray);
  }, [ingredientsMap]);

  // --- MANUAL SAVE FUNCTIONALITY (Giữ nguyên) ---

  const hasChanges = !areMapsEqual(ingredientsMap, originalFridgeMap);

  const handleSaveToServer = useCallback(async () => {
    if (!hasChanges || isSaving || isAuthLoading) return;

    const currentUserId = userData?._id || userData?.id;
    if (!currentUserId) {
      Alert.alert("Error", "User information not found. Please try again.");
      return;
    }

    setIsSaving(true);

    try {
      console.log("--- STARTING FRIDGE UPDATE API CALL ---");
      const apiResponse = await updateFridge(ingredientsMap);
      console.log("API response (updateFridge):", apiResponse);

      await fetchUserData(currentUserId);
      console.log("User data reloaded successfully.");

      Alert.alert("Success", "Fridge data has been updated!");
    } catch (err) {
      console.error("ERROR WHILE SAVING FRIDGE:", err);
      Alert.alert(
        "Error",
        `Could not save fridge data. Please check the console for details: ${
          err.message || "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
      console.log("--- FRIDGE UPDATE ENDED ---");
    }
  }, [
    ingredientsMap,
    originalFridgeMap,
    isSaving,
    isAuthLoading,
    userData,
    updateFridge,
    fetchUserData,
    hasChanges,
  ]);

  // --- LOCAL STATE UI AND CRUD HANDLERS (Giữ nguyên) ---

  const handleRefresh = useCallback(async () => {
    if (!fetchUserData || isAuthLoading || isSaving || hasChanges) return;

    const currentUserId = userData?._id || userData?.id;
    if (!currentUserId) {
      Alert.alert("Error", "User information not found.");
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchUserData(currentUserId);
    } catch (error) {
      Alert.alert("Reload Error", "Could not refresh fridge data.");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserData, userData, isAuthLoading, isSaving, hasChanges]);

  const handleDelete = (nameKey) => {
    if (editingKey === nameKey) {
      handleCancelEdit();
    }
    setIngredientsMap((prevMap) => {
      const newMap = { ...prevMap };
      delete newMap[nameKey];
      return newMap;
    });
  };

  const handleEdit = (item) => {
    setEditingKey(item.id);
    setNewIngredientName(item.id);
    setNewQuantity(item.quantity.toString());
    setSelectedUnit(item.unit);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setNewIngredientName("");
    setNewQuantity("");
    setSelectedUnit(STANDARD_UNITS[0].value);
  };

  const handleSaveOrUpdate = () => {
    const quantityNum = parseFloat(newQuantity.trim().replace(",", "."));
    const ingredientName = newIngredientName.trim().toLowerCase();
    const unitString = selectedUnit;

    if (
      !ingredientName ||
      isNaN(quantityNum) ||
      quantityNum <= 0 ||
      !unitString
    ) {
      Alert.alert(
        "Error",
        "Please enter valid and complete information (Name, Quantity > 0, Unit)."
      );
      return;
    }

    if (editingKey && ingredientName !== editingKey) {
      Alert.alert(
        "Error",
        "Cannot change the ingredient name while editing. Please delete and add again."
      );
      return;
    }

    const quantityUnitString = `${quantityNum}${unitString}`;

    setIngredientsMap((prevMap) => {
      let newMap = { ...prevMap };

      if (editingKey) {
        newMap[editingKey] = quantityUnitString;
      } else {
        newMap[ingredientName] = quantityUnitString;
      }

      return newMap;
    });

    setEditingKey(null);
    setNewIngredientName("");
    setNewQuantity("");
    setSelectedUnit(STANDARD_UNITS[0].value);
  };

  // --- RENDERING VARS (Giữ nguyên) ---
  const pickerContainerStyle = {
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: { elevation: 1 },
    }),
  };

  const ingredientInputStyle = {
    width: "100%",
    ...styles.input,
  };

  const showInitialLoading = isAuthLoading && !userData;
  const isEditing = !!editingKey;
  const isBusy = showInitialLoading || isRefreshing || isSaving;

  return (
    // ⭐️ SỬ DỤNG SafeAreaView VÀ style fullScreen
    <SafeAreaView style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* HEADER */}
      <View
        // ⭐️ XÓA paddingTop, chỉ giữ paddingBottom
        style={[styles.headerContainer, { paddingBottom: 15 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isBusy}
          style={styles.headerIconContainer}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          Your Fridge
        </Text>

        {/* NÚT CẬP NHẬT DỮ LIỆU TỦ LẠNH (MANUAL SAVE) */}
        <View style={styles.headerIconContainer}>
          {hasChanges && (
            <TouchableOpacity
              onPress={handleSaveToServer}
              style={styles.manualSaveButton}
              disabled={isSaving || isAuthLoading}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          )}
          {!hasChanges && <View style={{ width: 30, height: 30 }} />}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>
            {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
          </Text>

          {/* DÒNG 1: TÊN NGUYÊN LIỆU */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.label}>Ingredient Name</Text>
            <TextInput
              style={[ingredientInputStyle, isEditing && styles.disabledInput]}
              placeholder="E.g.: Chicken breast fillet"
              value={newIngredientName}
              onChangeText={setNewIngredientName}
              editable={!isEditing}
            />
            {isEditing && (
              <Text style={styles.hintText}>
                * Cannot edit name while editing. Cancel to add a different
                ingredient.
              </Text>
            )}
          </View>

          {/* DÒNG 2: SỐ LƯỢNG | ĐƠN VỊ | NÚT THÊM/CẬP NHẬT/HỦY */}
          <View style={styles.inputRow}>
            {/* TEXT INPUT cho SỐ LƯỢNG */}
            <View style={{ flex: 1.5, marginRight: 8 }}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g.: 200"
                keyboardType="numeric"
                value={newQuantity}
                onChangeText={setNewQuantity}
              />
            </View>

            {/* PICKER CHO ĐƠN VỊ */}
            <View style={{ flex: 2, marginRight: 8 }}>
              <Text style={styles.label}>Unit</Text>
              <View style={pickerContainerStyle}>
                <Picker
                  selectedValue={selectedUnit}
                  onValueChange={(itemValue) => setSelectedUnit(itemValue)}
                  style={styles.pickerStyle}
                  itemStyle={styles.pickerItemStyle}
                >
                  {STANDARD_UNITS.map((unit) => (
                    <Picker.Item
                      key={unit.value}
                      label={unit.label}
                      value={unit.value}
                      color={unit.value === "" ? "#999" : TEXT_DARK}
                      style={styles.pickerItemText}
                    />
                  ))}
                </Picker>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={TEXT_DARK}
                  style={styles.pickerIcon}
                />
              </View>
            </View>

            {/* NÚT THÊM/CẬP NHẬT/HỦY */}
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={handleSaveOrUpdate}
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: PRIMARY_BLUE,
                      width: 48,
                      height: 48,
                      marginRight: 8,
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={[
                    styles.addButton,
                    { backgroundColor: ACCENT_RED, width: 48, height: 48 },
                  ]}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleSaveOrUpdate}
                style={[
                  styles.addButton,
                  { backgroundColor: PRIMARY_BLUE, width: 48, height: 48 },
                ]}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* TRẠNG THÁI LƯU THỦ CÔNG & CHỈ DẪN */}
          <View style={styles.manualSaveStatusContainer}>
            {hasChanges && !isSaving && (
              <Text style={styles.unsavedChangesText}>
                * Unsaved changes! Please upload to Server!
              </Text>
            )}

            {/* Nút CẬP NHẬT DỮ LIỆU */}
            {hasChanges && (
              <TouchableOpacity
                onPress={handleSaveToServer}
                style={[
                  styles.saveDataButton,
                  isSaving && styles.saveDataButtonDisabled,
                ]}
                disabled={isSaving || isAuthLoading}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#fff"
                  />
                )}
                <Text style={styles.saveDataButtonText}>
                  {isSaving ? "Updating..." : "Update Fridge Data"}
                </Text>
              </TouchableOpacity>
            )}

            {!hasChanges && !isBusy && (
              <View style={styles.statusIndicator}>
                <Ionicons name="cloud-done-outline" size={20} color="#999" />
                <Text style={[styles.statusIndicatorText, { color: "#999" }]}>
                  Data synchronized
                </Text>
              </View>
            )}
          </View>

          {/* Danh sách Nguyên liệu */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
            Saved Ingredients ({ingredientsArray.length})
          </Text>
          <View style={styles.card}>
            {isBusy ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <ActivityIndicator size="large" color={DARK_BLUE} />
                <Text style={{ marginTop: 10, color: TEXT_DARK }}>
                  Loading data...
                </Text>
              </View>
            ) : ingredientsArray.length === 0 ? (
              <Text style={{ textAlign: "center", padding: 20, color: "#999" }}>
                The fridge is empty. Add some ingredients!
              </Text>
            ) : (
              ingredientsArray.map((item) => (
                <IngredientItem
                  key={item.id}
                  name={item.name}
                  quantity={item.quantity}
                  unit={item.unit}
                  onDelete={() => handleDelete(item.id)}
                  onPress={() => handleEdit(item)}
                  isEditing={item.id === editingKey}
                />
              ))
            )}
          </View>

          {/* Nút tìm công thức gợi ý */}
          <TouchableOpacity style={styles.findRecipeButton}>
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={styles.findRecipeText}>
              Find Recipes with Available Ingredients
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ⭐️ Style mới cho SafeAreaView
  fullScreen: { flex: 1, backgroundColor: BACKGROUND_LIGHT },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 4 },
    }),
  },
  headerIconContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginHorizontal: 10,
  },
  manualSaveButton: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 11,
    color: ACCENT_RED,
    marginTop: 5,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 15,
  },

  // --- INPUT ROW ---
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 14,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: { elevation: 1 },
    }),
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
  // Picker Style
  pickerStyle: {
    width: "100%",
    height: 48,
    color: TEXT_DARK,
  },
  pickerItemText: {
    fontSize: 13,
  },
  pickerIcon: {
    position: "absolute",
    right: 15,
    pointerEvents: "none",
    opacity: 0.6,
  },
  addButton: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- MANUAL SAVE BUTTON AND STATUS ---
  manualSaveStatusContainer: {
    marginBottom: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  unsavedChangesText: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT_RED,
    marginBottom: 10,
  },
  saveDataButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
  saveDataButtonDisabled: {
    opacity: 0.6,
  },
  saveDataButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 10,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  statusIndicatorText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
  },

  // --- INGREDIENT LIST ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  editingItem: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_DARK,
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 13,
    color: PRIMARY_BLUE,
    fontWeight: "700",
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 5,
  },

  // --- SUGGEST RECIPE BUTTON ---
  findRecipeButton: {
    backgroundColor: DARK_BLUE,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: DARK_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: { elevation: 6 },
    }),
  },
  findRecipeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 10,
  },
});
