import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../components/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

import { useBlogAPI } from "../hook/useBlogs";

// --- Colors (Keep the same) ---
const PRIMARY_BLUE = "#AB9574";
const DARK_BLUE = "#3D2C1C";
const BACKGROUND_LIGHT = "#F9EBD7";
const TEXT_DARK = "#2C3E50";

// Difficulty options list (REMOVED: Keeping only for handleSubmit structure compatibility)
const DIFFICULTY_OPTIONS = [
  { label: "Select Difficulty", value: "" },
  { label: "1.0 - Very Easy", value: "1.0" },
  { label: "2.0 - Easy", value: "2.0" },
  { label: "3.0 - Medium", value: "3.0" },
  { label: "4.0 - Hard", value: "4.0" },
  { label: "5.0 - Very Hard", value: "5.0" },
];

// --- Unit options for Dynamic Ingredients (English) ---
const UNIT_OPTIONS = [
  { label: "Unit", value: "" },
  { label: "gram (g)", value: "gram" },
  { label: "milliliters (ml)", value: "milliliters" },
  { label: "unit", value: "unit" },
];

// Edamam Guide Component (English)
const EdamamGuide = () => {
  const showGuide = () => {
    Alert.alert(
      "Ingredient Entry Guide for Analysis",
      "For optimal recipe analysis (Edamam API), please enter each ingredient on a separate line using the format: [Quantity] [Unit] [Ingredient Name].\n\nExample:\n- 200 gram chicken breast\n- 1 large onion\n- 1 tablespoon honey",
      [{ text: "Got it" }]
    );
  };

  return (
    <TouchableOpacity onPress={showGuide} style={styles.guideButton}>
      <Ionicons
        name="information-circle-outline"
        size={16}
        color={PRIMARY_BLUE}
      />
      <Text style={styles.guideText}>Ingredient Entry Guide (Edamam)</Text>
    </TouchableOpacity>
  );
};

// Blog Info Tab Component (English)
const BlogInfoTab = ({
  title,
  setTitle,
  description,
  setDescription,
  styles,
}) => (
  <>
    <Text style={styles.label}>Blog Post Title</Text>
    <TextInput
      style={styles.input}
      placeholder="Example: The Most Loved Honey Grilled Chicken Recipe"
      value={title}
      onChangeText={setTitle}
    />

    <Text style={styles.label}>Short Description/Caption for Post</Text>
    <TextInput
      style={[styles.input, styles.multiline, { minHeight: 80 }]}
      placeholder="Appealing summary content for the post..."
      value={description}
      onChangeText={setDescription}
      multiline
    />
  </>
);

// --- Dynamic Ingredient Input Component (English) ---
const DynamicIngredientInput = ({
  ingredients,
  setIngredients,
  styles,
  PRIMARY_BLUE,
}) => {
  // Add new ingredient
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), name: "", quantity: "", unit: "" },
    ]);
  };

  // Update ingredient by index
  const updateIngredient = (index, key, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][key] = value;
    setIngredients(newIngredients);
  };

  // Remove ingredient by index
  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  return (
    <View style={styles.dynamicInputContainer}>
      <Text style={styles.label}>Main Ingredients</Text>
      {ingredients.map((item, index) => (
        // Use ingredientCard as background for each item
        <View key={item.id} style={styles.ingredientCard}>
          {/* ROW 1: Ingredient Name */}
          <View style={styles.inputGroupFull}>
            <TextInput
              style={styles.input}
              placeholder="Ingredient Name"
              value={item.name}
              onChangeText={(text) => updateIngredient(index, "name", text)}
            />
          </View>

          {/* ROW 2: Quantity, Unit, Remove Button (Flex Row) */}
          <View style={styles.ingredientSubRow}>
            {/* Quantity: flex: 1.5 */}
            <View style={[styles.inputGroup, { flex: 1.5 }]}>
              <TextInput
                style={styles.input}
                placeholder="Qty"
                value={item.quantity}
                onChangeText={(text) =>
                  updateIngredient(index, "quantity", text)
                }
                keyboardType="numeric"
              />
            </View>

            {/* Unit: flex: 2 */}
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={item.unit}
                  onValueChange={(itemValue) =>
                    updateIngredient(index, "unit", itemValue)
                  }
                  style={styles.picker}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      color={option.value === "" ? "#999" : TEXT_DARK}
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

            {/* Remove button */}
            <TouchableOpacity
              onPress={() => removeIngredient(index)}
              style={styles.removeButtonSubRow}
            >
              <Ionicons name="close-circle" size={28} color="#D9534F" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color={PRIMARY_BLUE} />
        <Text style={styles.addButtonText}>Add Ingredient</Text>
      </TouchableOpacity>
    </View>
  );
};
// --- End Dynamic Ingredient Input Component ---

// Recipe Info Tab Component (English)
const RecipeInfoTab = ({
  recipeTitle,
  setRecipeTitle,
  recipeDescription,
  setRecipeDescription,
  time,
  setTime,
  seasonings,
  setSeasonings,
  recipeIngredients,
  setRecipeIngredients,
  instructions,
  setInstructions,
  imageUri,
  pickImage,
  styles,
  PRIMARY_BLUE,
  EdamamGuide,
  difficulty, // Retain for structure compatibility
  setDifficulty, // Retain for structure compatibility
}) => (
  <>
    <Text style={styles.label}>Recipe Cover Image</Text>

    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      ) : (
        <>
          <Ionicons name="camera-outline" size={30} color={PRIMARY_BLUE} />
          <Text style={styles.imagePickerText}>Tap to select image</Text>
        </>
      )}
    </TouchableOpacity>
    {/* END IMAGE SELECTION */}

    <Text style={styles.label}>Recipe Name (Dish Name)</Text>
    <TextInput
      style={styles.input}
      placeholder="Example: BBQ Honey Glazed Chicken"
      value={recipeTitle}
      onChangeText={setRecipeTitle}
    />

    <Text style={styles.label}>Recipe Description</Text>
    <TextInput
      style={[styles.input, styles.multiline, { minHeight: 80 }]}
      placeholder="Detailed description of the dish (e.g., taste profile, serving suggestion)..."
      value={recipeDescription}
      onChangeText={setRecipeDescription}
      multiline
    />

    {/* Time Input (Full Width - Difficulty REMOVED) */}
    <View style={styles.row}>
      <View style={styles.inputGroupFull}>
        <Text style={styles.label}>Time (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 30"
          value={time}
          onChangeText={setTime}
          keyboardType="numeric"
        />
      </View>
    </View>

    {/* USE NEW DYNAMIC INGREDIENT COMPONENT */}
    <DynamicIngredientInput
      ingredients={recipeIngredients}
      setIngredients={setRecipeIngredients}
      styles={styles}
      PRIMARY_BLUE={PRIMARY_BLUE}
    />

    {/* Changed label for Seasonings field (English) */}
    <Text style={styles.label}>Seasonings/Extra Notes (One per line)</Text>
    {/* EdamamGuide Component called directly */}
    {/* <EdamamGuide /> */}
    <TextInput
      style={[styles.input, styles.multiline, { marginTop: 8 }]}
      placeholder={`Example: \n 1 tablespoon honey\n Salt and black pepper`}
      value={seasonings} // Use seasonings
      onChangeText={setSeasonings} // Use setSeasonings
      multiline
    />

    <Text style={styles.label}>Instructions (Step-by-step guide)</Text>
    <TextInput
      style={[styles.input, styles.multiline, { marginTop: 8 }]}
      placeholder={`Example: \n Mix chicken with honey and spices.\n Bake at 200°C for 20 minutes.`}
      value={instructions}
      onChangeText={setInstructions}
      multiline
    />
  </>
);

export default function UploadRecipeScreen() {
  const navigation = useNavigation();
  const { isLoggedIn, userId } = useAuth();
  const { createBlog, loading, error } = useBlogAPI();

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [seasonings, setSeasonings] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [time, setTime] = useState("");
  // Difficulty State (Initialized but not used in UI/Validation)
  const [difficulty, setDifficulty] = useState(DIFFICULTY_OPTIONS[0].value);

  // --- DYNAMIC INGREDIENT STATE ---
  const [recipeIngredients, setRecipeIngredients] = useState([
    { id: Date.now(), name: "", quantity: "", unit: "" },
  ]);
  // ------------------------------------------

  const [autoTags, setAutoTags] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image picking function
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Sorry",
        "We need camera roll permissions to make this work."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Ensure only images are selected
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // AI Tag Function (English)
  const getAutoTagsFromAI = async (recipeData) => {
    const AI_SERVICE_URL =
      "https://mealmaker-ai-production.up.railway.app/get-auto-tags";

    try {
      const response = await fetch(AI_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // FIX: Removing .recipe as the pure recipe object is passed
          title: recipeData.title,
          ingredients_list: recipeData.ingredients_list,
          instructions: recipeData.instructions,
          time_minutes: recipeData.time_minutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `AI Service returned HTTP error: ${response.status}`
        );
      }

      const tags = await response.json();
      return tags;
    } catch (error) {
      console.error("Error calling AI Service:", error);
      return [];
    }
  };

  // Submit function (English, Difficulty check REMOVED from validation)
  const handleSubmit = async () => {
    if (!isLoggedIn) {
      Alert.alert("Error", "Please log in to post.");
      return;
    }

    // 1. Check required fields
    const hasValidIngredient = recipeIngredients.some(
      (ing) => ing.name.trim() && ing.quantity && ing.unit
    );

    // Difficulty check removed as requested
    if (
      !title ||
      !description ||
      !recipeTitle ||
      !time ||
      !instructions ||
      !hasValidIngredient // Requires at least 1 valid main ingredient
    ) {
      Alert.alert(
        "Error",
        "Please fill in the Blog Title, Description, Recipe Name, Time, Instructions, and at least one valid Main Ingredient."
      );
      return;
    }

    // Set loading immediately after error check
    setIsSubmitting(true);

    // --- STEP 1: Process Ingredients and Instructions into Arrays ---
    // A. Process Main Ingredients (Dynamic) -> FORMAT: "ingredient name quantity unit"
    const finalIngredientsArray = recipeIngredients
      .filter((ing) => ing.name.trim() && ing.quantity && ing.unit)
      .map((ing) => {
        const name = ing.name.trim();
        // Ensure quantity is a valid number
        const quantity = parseFloat(ing.quantity.replace(",", ".")) || "";

        let unit = "";

        // --- NEW STANDARDIZATION LOGIC ---
        if (ing.unit === "gram") {
          unit = "g";
        } else if (ing.unit === "milliliters") {
          unit = "ml";
        } else if (ing.unit === "unit") {
          // Keep unit as "unit" or empty if not needed
          unit = "unit";
        }
        // --- END NEW STANDARDIZATION LOGIC ---

        // Standardize to format: "ingredient name quantity unit"
        // New example: "chicken breast 200g", "milk 200ml", "egg 2unit"
        return `${name} ${quantity}${unit}`;
      });

    // B. Process Seasonings/Extra Notes
    const seasoningsArray = seasonings
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    // C. Process Instructions
    const instructionsArray = instructions
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    // ------------------------------------------------------------------

    // STEP 2: Prepare RAW DATA for AI CALL
    const rawRecipeData = {
      title: title, // Blog Title
      user_id: userId,
      description: description, // Blog Description
      recipe: {
        title: recipeTitle, // Recipe Name
        description: recipeDescription, // Reuse blog description as recipe description (optional)
        ingredients_list: finalIngredientsArray, // MAIN INGREDIENTS ONLY
        instructions: instructionsArray,
        time_minutes: parseInt(time, 10),
        difficulty_score: parseFloat(difficulty), // RETAINING DIFFICULTY SCORE FIELD FOR API
        tags: ["test"],
        // ADD NEW SEASONINGS FIELD
        seasonings: seasoningsArray,
      },
    };

    // START: CALL AI SERVICE TO GET TAGS
    let finalAutoTags = [];
    try {
      console.log("Calling AI to get tags...");
      // FIX: Passing rawRecipeData.recipe, which is the pure recipe info object.
      finalAutoTags = await getAutoTagsFromAI(rawRecipeData.recipe);
      console.log("Tags received from AI:", finalAutoTags);
    } catch (e) {
      console.error("Error with automatic tagging:", e);
      Alert.alert(
        "AI Warning",
        "Could not call AI Service. The recipe will be posted without automatic tags."
      );
    }
    // END: CALL AI SERVICE TO GET TAGS

    // STEP 3: Prepare FINAL DATA (with tags)
    const finalBlogData = {
      ...rawRecipeData,
      recipe: {
        ...rawRecipeData.recipe,
        tags: finalAutoTags,
      },
    };

    // STEP 4: Prepare file
    let file = null;
    let localUri = imageUri;

    if (localUri) {
      let filename = localUri.split("/").pop();
      const finalUri =
        Platform.OS === "ios" ? localUri.replace("file://", "") : localUri;
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image/jpeg`;

      file = { uri: finalUri, name: filename, type };

      console.log("File object created:", file);
    }

    // STEP 5: FINAL CALL TO CREATE BLOG API
    try {
      console.log("Sending data and file to create blog API...");

      // Note: finalBlogData now includes recipe.seasonings
      const response = await createBlog(finalBlogData, file);

      Alert.alert(
        "Success",
        "Your post has been submitted. It will be visible after approval."
      );
      navigation.goBack();
    } catch (e) {
      console.error("Error posting blog:", e);
      Alert.alert("Error", error || "Could not submit post, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />

      {/* Header (UPDATED TO ENGLISH) */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Blog</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* KeyboardAvoidingView wrapping ScrollView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* DISPLAY BOTH CONTENT SECTIONS SEQUENTIALLY */}
          <BlogInfoTab
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            styles={styles}
          />
          <RecipeInfoTab
            recipeTitle={recipeTitle}
            setRecipeTitle={setRecipeTitle}
            recipeDescription={recipeDescription}
            setRecipeDescription={setRecipeDescription}
            time={time}
            setTime={setTime}
            seasonings={seasonings} // Seasonings
            setSeasonings={setSeasonings} // setSeasonings
            recipeIngredients={recipeIngredients}
            setRecipeIngredients={setRecipeIngredients}
            instructions={instructions}
            setInstructions={setInstructions}
            imageUri={imageUri}
            pickImage={pickImage}
            styles={styles}
            PRIMARY_BLUE={PRIMARY_BLUE}
            EdamamGuide={EdamamGuide}
            difficulty={difficulty} // Passed for compatibility
            setDifficulty={setDifficulty} // Passed for compatibility
          />

          <TouchableOpacity
            style={[
              styles.button,
              (isSubmitting || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Post Blog</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 200,
    // Add borderRadius for content
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 8,
    marginTop: 20, // Increased top spacing for label
  },
  input: {
    backgroundColor: "#fff",
    padding: 12, // Adjusted padding
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 13,
    height: 51, // Fixed height
    // Added light shadow for input
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  imagePicker: {
    width: "100%",
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 12, // More rounded corners
    borderWidth: 2,
    borderColor: PRIMARY_BLUE, // Primary color border
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    // Added shadow
    ...Platform.select({
      ios: {
        shadowColor: "#AB9574",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imagePickerText: {
    color: PRIMARY_BLUE,
    marginTop: 5,
    fontWeight: "600",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover", // Changed to cover to utilize space
  },
  button: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 40, // Increased top spacing for button
    // Added strong shadow for button
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
    ...Platform.select({
      // Removed shadow when disabled
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // --- DROPDOWN/ROW STYLES ---
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  // inputGroup used for flexed inputs
  inputGroup: {
    flex: 1,
    paddingHorizontal: 4,
  },
  // inputGroup used for full-width input
  inputGroupFull: {
    width: "100%",
    // paddingHorizontal: 4, // Keep 4px padding for all inputs
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    // height: 48, // Fixed height
    overflow: "hidden",
    // Added shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  picker: {
    // height: 48,
    width: "100%",
    color: TEXT_DARK,
    ...Platform.select({
      ios: {
        fontSize: 10,
      },
      android: {
        fontSize: 10,
      },
    }),
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
  // --- EDAMAM GUIDE STYLES ---
  guideButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  guideText: {
    color: PRIMARY_BLUE,
    fontSize: 13,
    marginLeft: 5,
    fontWeight: "500",
  },

  // --- STYLES FOR DYNAMIC INGREDIENTS ---
  dynamicInputContainer: {
    marginTop: 20,
  },
  ingredientCard: {
    backgroundColor: BACKGROUND_LIGHT,
    // padding: 10,
    borderRadius: 10,
    marginBottom: 15, // Space between ingredient cards
  },
  // Row 2 containing Quantity, Unit, and Remove Button
  ingredientSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  // Remove button aligned with Row 2
  removeButtonSubRow: {
    justifyContent: "center",
    alignItems: "center",
    width: 30,
    height: 48,
    marginLeft: 4, // Space from the previous element
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
    marginTop: 15,
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  addButtonText: {
    color: PRIMARY_BLUE,
    marginLeft: 5,
    fontWeight: "600",
  },
});
