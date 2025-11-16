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
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native"; // Thêm navigation hook

// Import Hooks & Components
import { useAuth } from "../components/AuthContext";
import { useUserUpdateAPI } from "../hook/useUsers";
import { useRecipes } from "../hook/useRecipes"; // ⭐️ IMPORT useRecipes
import RecipeCard from "../components/RecipeCard"; // ⭐️ IMPORT RecipeCard

// --- Define MODERN BLUE colors ---
const PRIMARY_BLUE = "#AB9574";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";
const ACCENT_RED = "#D9534F";

// --- STANDARD UNITS LIST ---
const STANDARD_UNITS = [
  { label: "Unit", value: "" },
  { label: "grams (g)", value: "g" },
  { label: "milliliters (ml)", value: "ml" },
  { label: "Piece/Unit (unit)", value: "unit" },
];

// Component for Ingredient Item
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

export default function FridgeScreen() {
  const navigation = useNavigation(); // ⭐️ Sử dụng useNavigation hook
  const { updateFridge } = useUserUpdateAPI();
  const { userData, isLoading: isAuthLoading, fetchUserData } = useAuth();
  const userId = userData?._id || userData?.id;

  // ⭐️ HOOK TÌM KIẾM CÔNG THỨC
  const { searchRecipesByIngredients } = useRecipes();

  const [originalFridgeMap, setOriginalFridgeMap] = useState({});
  const [ingredientsMap, setIngredientsMap] = useState({});
  const [ingredientsArray, setIngredientsArray] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingKey, setEditingKey] = useState(null);

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(STANDARD_UNITS[0].value);

  // ⭐️ STATE MỚI CHO TÌM KIẾM
  const [searchedRecipes, setSearchedRecipes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // --- DATA LOADING AND SYNCHRONIZATION ---

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

  // --- MANUAL SAVE FUNCTIONALITY ---

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
      await updateFridge(ingredientsMap);
      await fetchUserData(currentUserId);
      console.log("User data reloaded successfully.");

      Alert.alert("Success", "Fridge data has been updated!");
    } catch (err) {
      console.error("ERROR WHILE SAVING FRIDGE:", err);
      Alert.alert(
        "Error",
        `Could not save fridge data. Details: ${err.message || "Unknown error"}`
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

  // --- RECIPE SEARCH HANDLER ---

  const handleFindRecipes = useCallback(async () => {
    const ingredientNames = ingredientsArray.map((item) => item.id);

    setSearchAttempted(true);

    if (ingredientNames.length === 0) {
      setSearchedRecipes([]);
      return;
    }

    setIsSearching(true);
    setSearchedRecipes([]); // Clear kết quả cũ

    try {
      // Chỉ tìm kiếm tối đa 20 công thức
      const result = await searchRecipesByIngredients(ingredientNames, 1, 20);
      setSearchedRecipes(result.data || []);
    } catch (error) {
      console.error("Error during automatic recipe search:", error);
      setSearchedRecipes([]);
    } finally {
      setIsSearching(false);
    }
  }, [ingredientsArray, searchRecipesByIngredients]);

  // ⭐️ useEffect để TỰ ĐỘNG TÌM KIẾM
  useEffect(() => {
    // Chỉ gọi tìm kiếm nếu nguyên liệu đã sẵn sàng và không đang ở trạng thái loading/saving/refreshing
    if (
      !isAuthLoading &&
      ingredientsArray.length >= 0 && // >= 0 để trigger ngay cả khi rỗng (cho hiển thị thông báo)
      !isSaving &&
      !isRefreshing
    ) {
      console.log(
        "Fridge ingredients changed, initiating automatic recipe search..."
      );
      handleFindRecipes();
    }
  }, [
    ingredientsArray,
    isAuthLoading,
    isSaving,
    isRefreshing,
    handleFindRecipes,
  ]);

  // Hàm điều hướng đến màn hình chi tiết công thức
  const handleRecipePress = (recipeId) => {
    if (recipeId) {
      navigation.navigate("RecipeDetail", { recipeId });
    }
  };

  // --- LOCAL STATE UI AND CRUD HANDLERS ---

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

  // --- RENDERING VARS ---
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
    <SafeAreaView style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* HEADER */}
      <View style={[styles.headerContainer, { paddingBottom: 15 }]}>
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

          {/* ⭐️ HIỂN THỊ KẾT QUẢ TÌM KIẾM TỰ ĐỘNG */}
          {searchAttempted && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.sectionTitle}>
                Suggested Recipes ({searchedRecipes.length})
              </Text>
              <View style={styles.cardResult}>
                {isSearching ? (
                  <View style={{ padding: 30, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                    <Text style={{ marginTop: 10, color: TEXT_DARK }}>
                      Searching for delicious recipes...
                    </Text>
                  </View>
                ) : searchedRecipes.length === 0 ? (
                  <Text
                    style={{ textAlign: "center", padding: 20, color: "#999" }}
                  >
                    No matching recipes found based on current fridge
                    ingredients.
                  </Text>
                ) : (
                  searchedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onPress={() => handleRecipePress(recipe._id)}
                    />
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  // --- INGREDIENT LIST & RECIPE CARD CONTAINER ---
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

  cardResult: {
    backgroundColor: "#fff",
    borderRadius: 12,

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

  // --- SUGGEST RECIPE BUTTON (Đã bị loại bỏ khỏi Render, giữ style để phòng ngừa) ---
  // findRecipeButton: {
  //   backgroundColor: DARK_BLUE,
  //   paddingVertical: 15,
  //   borderRadius: 12,
  //   alignItems: "center",
  //   marginTop: 30,
  //   flexDirection: "row",
  //   justifyContent: "center",
  //   ...
  // },
  // findRecipeText: {
  //   color: "#fff",
  //   fontSize: 15,
  //   fontWeight: "700",
  //   marginLeft: 10,
  // },
});
