import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl, // Đã thêm RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import Checkbox from "expo-checkbox"; // ĐÃ LOẠI BỎ CHECKBOX
import { useAuth } from "../components/AuthContext";

// --- Colors ---
const PRIMARY_ACCENT = "#AB9574";
const BACKGROUND_LIGHT = "#F5F5F5";
const PRIMARY_LIGHT = "#AB957420";
const TEXT_DARK = "#3D2C1C";
const ACTION_GREEN = "#27AE60";
const CLOSE_RED = "#E74C3C";
const IN_STOCK_COLOR = "#388E3C";
const NEEDED_COLOR = "#D35400";

// --- Helper Functions (Minimal Normalization) ---

const normalizeMapData = (
  dataMap,
  category,
  isInStock = false,
  day,
  prefix = "Map"
) => {
  if (!dataMap || typeof dataMap !== "object") return [];

  return Object.entries(dataMap).map(([name, quantity], index) => {
    const cleanName = name.trim();
    const cleanNameForId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return {
      name: cleanName,
      quantity: quantity || "",
      category: category,
      isInStock: isInStock,
      // checked: false, // LOẠI BỎ CHECKED
      id: `${category.replace(
        " ",
        ""
      )}_${day}_${prefix}_I${index}_${cleanNameForId}`,
    };
  });
};

/**
 * Hàm chuẩn hóa/khởi tạo ingredients (dùng cho công thức).
 */
const normalizeIngredients = (
  list,
  category,
  isInStock = false,
  day,
  mealIndex = "ref"
) => {
  if (!Array.isArray(list)) return [];

  return list.map((item, index) => {
    let name = "Unknown Item";
    let quantity = "";

    if (typeof item === "string") {
      name = item.trim();
      quantity = "";
    } else if (typeof item === "object" && item !== null) {
      name = item.name || item.title || "Unknown Item";
      quantity = item.quantity || "";
    }

    const cleanNameForId = (name + quantity)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    return {
      name: name,
      quantity: quantity,
      category: category,
      isInStock: isInStock,
      // checked: false, // LOẠI BỎ CHECKED
      id: `${category.replace(
        " ",
        ""
      )}_${day}_M${mealIndex}_I${index}_${cleanNameForId}`,
    };
  });
};

/**
 * Chỉ chuẩn hóa danh sách gia vị (từ weekly_shopping_list.seasoning).
 */
const normalizeSeasoningList = (list, day) => {
  if (!Array.isArray(list)) return [];

  return list.map((name, index) => {
    const cleanName = name.trim();
    const cleanNameForId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return {
      name: cleanName,
      quantity: "", // Không có quantity cho gia vị
      category: "Seasoning",
      isInStock: false, // Mặc định là cần mua (To Buy)
      // checked: false, // LOẠI BỎ CHECKED
      id: `Seasoning_shoppinglist_${day}_I${index}_${cleanNameForId}`,
    };
  });
};

// Component Render Card cho mỗi nhóm
const RenderShoppingCardFinal = ({
  title,
  items,
  color,
  icon,
  showStatus,
  // toggleCheckbox, // LOẠI BỎ PROPS KHÔNG CẦN THIẾT
}) => {
  if (
    items.length === 0 &&
    title.indexOf("In Stock") === -1 &&
    title.indexOf("To Buy") === -1
  ) {
    return null;
  }

  const itemRenderer = (item) => {
    const statusColor = item.isInStock ? IN_STOCK_COLOR : NEEDED_COLOR;
    const statusText = item.isInStock ? "In Stock" : "To Buy";

    return (
      <View key={item.id} style={styles.ingredientItem}>
        {/* ĐÃ LOẠI BỎ CHECKBOX */}

        <Text
          style={[
            styles.itemText,
            // styles.itemChecked, // LOẠI BỎ STYLE LIÊN QUAN ĐẾN CHECKED
            // Giữ logic làm mờ/xám nếu In Stock
            item.isInStock && { color: "#8A8A8A" },
          ]}
        >
          {/* Hiển thị quantity và khoảng trắng chỉ khi quantity có dữ liệu */}
          {item.quantity ? (
            <Text style={styles.quantityText}>{item.quantity} </Text>
          ) : null}
          <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
        </Text>

        {showStatus && (
          <View
            style={[styles.statusTag, { backgroundColor: statusColor + "20" }]}
          >
            <Text style={[styles.statusTagText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.shoppingCard, { borderColor: color }]}>
      <View style={[styles.cardHeader, { backgroundColor: color + "15" }]}>
        <Ionicons
          name={icon}
          size={20}
          color={color}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
        <Text style={styles.cardCount}>({items.length} items)</Text>
      </View>
      <View style={styles.cardBody}>
        {items.length > 0 ? (
          items.map(itemRenderer)
        ) : (
          <Text style={styles.noDataText}>
            Không có nguyên liệu nào trong nhóm này.
          </Text>
        )}
      </View>
    </View>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function ShoppingListDetailScreen({ route, navigation }) {
  const { day, meals } = route.params;
  // Sử dụng setUserData để cập nhật dữ liệu sau khi fetch
  const { userData, setUserData, fetchUserData } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  // Giữ nguyên ingredients và shoppingListItems nhưng bỏ thuộc tính checked khỏi logic UI
  const [ingredients, setIngredients] = useState([]);
  const [shoppingListItems, setShoppingListItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false); // State cho Pull-to-Refresh

  // State để buộc useEffect chạy lại sau khi refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Logic xử lý Loading và Khởi tạo trạng thái ingredients
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Bắt đầu load

    // 1. Nếu userData chưa có (hoặc cần làm mới), fetch nó
    if (!userData) {
      fetchUserData(userData?._id);
    }

    // 2. Nếu userData đã có, tiến hành xử lý dữ liệu
    if (userData && day && isMounted) {
      console.log(`Dữ liệu Shopping List cho ${day} đã được tải.`);

      const weeklyMenuDay = userData.weekly_menu?.[day] || [];
      let mainIngredientsFromRecipe = [];

      // CHỈ LẤY MAIN INGREDIENT TỪ CÔNG THỨC (Card 1)
      weeklyMenuDay.forEach((meal, mealIndex) => {
        if (meal.ingredients_list) {
          mainIngredientsFromRecipe.push(
            ...normalizeIngredients(
              meal.ingredients_list,
              "Main Ingredient",
              false,
              day,
              mealIndex
            )
          );
        }
      });

      // Khởi tạo trạng thái ingredients (BỎ checked: false)
      const initialIngredients = mainIngredientsFromRecipe.map(
        (item, index) => ({
          ...item,
          id: item.id || `${item.name}-${day}-${index}`,
          // checked: false, // LOẠI BỎ
        })
      );

      // TẠO LIST CẦN MUA CHUNG CHO CARD 2 VÀ CARD 4
      const seasoningNeededList =
        userData.weekly_shopping_list?.[day]?.seasoning || [];
      const seasoningItems = normalizeSeasoningList(seasoningNeededList, day);

      const neededListDayMap =
        userData.weekly_shopping_list?.[day]?.ingredients;
      const mainNeededItems = normalizeMapData(
        neededListDayMap,
        "Main Ingredient",
        false,
        day,
        "Needed"
      );

      // Khởi tạo shoppingListItems (BỎ checked: false)
      const initialShoppingListItems = [
        ...seasoningItems,
        ...mainNeededItems,
      ].map((item) => ({ ...item /*, checked: false*/ }));

      setIngredients(initialIngredients);
      setShoppingListItems(initialShoppingListItems);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [userData, day, fetchUserData, refreshKey]);

  // --- useMemo: Logic so sánh In Stock (Dùng logic cũ, so sánh với Fridge) ---

  // useMemo: Phân loại thành 4 danh sách dựa trên dữ liệu hiện tại
  const fourGroupedLists = useMemo(() => {
    if (isLoading || !userData || !day) {
      return {
        mainInRecipe: [],
        seasoningInRecipe: [],
        mainInStock: [],
        mainNeeded: [],
      };
    }

    // 1. Dữ liệu Tủ lạnh (Card 3)
    const rawFridgeItems = userData.fridge;
    // Dùng normalizeMapData để tạo danh sách fridge items có thể so sánh
    const mainInStock = normalizeMapData(
      rawFridgeItems,
      "Main Ingredient",
      true,
      day,
      "Fridge"
    );
    // Tạo danh sách TÊN đã chuẩn hóa từ tủ lạnh
    const normalizedFridgeNames = mainInStock.map((i) =>
      i.name.toLowerCase().trim()
    );

    // 2. Xử lý Card 1 (Main Ingredient từ công thức)
    const mainInRecipe = ingredients.map((item) => {
      const itemBaseName = item.name.toLowerCase().trim();

      // ⭐️ LOGIC SO SÁNH TÊN LINH HOẠT VỚI FRIDGE
      const isStocked = normalizedFridgeNames.some(
        (fridgeName) =>
          // Kiểm tra xem tên công thức có chứa tên tủ lạnh HOẶC tên tủ lạnh có chứa tên công thức
          itemBaseName.includes(fridgeName) || fridgeName.includes(itemBaseName)
      );

      return { ...item, isInStock: isStocked };
    });

    // Sắp xếp: In Stock (true) xuống cuối, Cần Mua (false) lên đầu
    mainInRecipe.sort((a, b) =>
      a.isInStock === b.isInStock ? 0 : a.isInStock ? 1 : -1
    );

    // 3. Phân chia ShoppingListItems đã được tạo ở useEffect (Card 2 & 4)
    const seasoningInRecipe = shoppingListItems.filter(
      (item) => item.category === "Seasoning"
    );
    const mainNeeded = shoppingListItems.filter(
      (item) => item.category === "Main Ingredient"
    );

    return {
      mainInRecipe: mainInRecipe,
      seasoningInRecipe: seasoningInRecipe,
      mainInStock: mainInStock,
      mainNeeded: mainNeeded,
    };
  }, [isLoading, userData, day, ingredients, shoppingListItems]);

  // Function để xử lý đánh dấu đã mua/chưa mua (CHỈ LÀ PLACEHOLDER, KHÔNG CẬP NHẬT UI)
  const toggleCheckbox = (id) => {
    // Do Checkbox đã bị loại bỏ, hàm này chỉ còn là placeholder
    console.log(`Lưu ý: Tính năng Checkbox đã bị loại bỏ. Item ID: ${id}`);
  };

  // Hàm xử lý Refresh (kéo xuống)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchUserData(userData?._id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserData, userData?._id]);

  // Tính toán số lượng cần mua (BỎ boughtCount)
  const neededCount =
    fourGroupedLists.mainInRecipe.filter((i) => !i.isInStock).length +
    fourGroupedLists.seasoningInRecipe.length +
    fourGroupedLists.mainNeeded.length;

  // boughtCount = 0 do không còn checkbox
  const boughtCount = 0;

  const displayDay = day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>
              <Ionicons name="cart-outline" size={20} color={TEXT_DARK} />{" "}
              Shopping List ({displayDay})
            </Text>
            <Text style={styles.headerSubtitle}>
              <Text style={{ fontWeight: "bold" }}>
                ({/* Hiển thị 0/Needed do đã loại bỏ Checkbox */}
                {boughtCount}/{neededCount} items)
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons name="close-circle" size={30} color={CLOSE_RED} />
          </TouchableOpacity>
        </View>

        <View style={styles.mealInfoSection}>
          <Text style={styles.mealInfoText}>For meals: {meals}</Text>
        </View>

        {/* --- Loading Indicator --- */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY_ACCENT}
            style={{ marginTop: 50 }}
          />
        ) : (
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            // Tích hợp RefreshControl vào ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={PRIMARY_ACCENT}
              />
            }
          >
            {/* ------------------------------------- */}
            {/* 4 CARDS (4 Thẻ) */}
            {/* ------------------------------------- */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={TEXT_DARK}
                />
                **Lưu ý:** Mục "In Stock" (màu xám) được lấy từ dữ liệu **Tủ
                lạnh** và được **so khớp tên chính xác**.
              </Text>
            </View>
            {/* Card 1: Nguyên liệu chính trong công thức  */}
            <RenderShoppingCardFinal
              title="Main Ingredients - In Recipe"
              items={fourGroupedLists.mainInRecipe}
              color={PRIMARY_ACCENT}
              icon="restaurant-outline"
              showStatus={true}
              toggleCheckbox={toggleCheckbox}
            />

            {/* ⭐ Card 2: Seasoning - LẤY TRỰC TIẾP TỪ SHOPPING LIST (Cần mua) ⭐ */}
            <RenderShoppingCardFinal
              title="Seasoning - In Recipe"
              items={fourGroupedLists.seasoningInRecipe}
              color={PRIMARY_ACCENT}
              icon="flask-outline"
              showStatus={false}
              toggleCheckbox={toggleCheckbox}
            />

            {/* Card 3: Main Ingredient - In Stock  */}
            <RenderShoppingCardFinal
              title="Main Ingredient - In Stock"
              items={fourGroupedLists.mainInStock}
              color={IN_STOCK_COLOR}
              icon="cube-outline"
              showStatus={false}
              toggleCheckbox={() => {}}
            />

            {/* Card 4: Main Ingredient - To Buy */}
            <RenderShoppingCardFinal
              title="Main Ingredient - To Buy"
              items={fourGroupedLists.mainNeeded}
              color={NEEDED_COLOR}
              icon="basket-outline"
              showStatus={false}
              toggleCheckbox={toggleCheckbox}
            />

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButtonFooter}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share List</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: BACKGROUND_LIGHT,
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // --- Header Styles ---
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  headerTitleGroup: {
    flex: 1,
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ACTION_GREEN,
    fontWeight: "600",
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },

  // --- Meal Info ---
  mealInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  mealInfoText: {
    fontSize: 13,
    color: TEXT_DARK,
  },

  // --- Shopping Card Styles ---
  shoppingCard: {
    marginTop: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  cardCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A8A8A",
    marginLeft: "auto",
  },
  cardBody: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },

  // --- Item Styles ---
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  // ĐÃ BỎ CHECKBOX STYLE
  itemText: {
    fontSize: 15,
    color: TEXT_DARK,
    flex: 1,
  },
  quantityText: {
    fontWeight: "bold",
    marginRight: 5,
  },
  // ĐÃ BỎ itemChecked
  // --- Status Tag Styles ---
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  noDataText: {
    textAlign: "center",
    padding: 15,
    color: "#8A8A8A",
    fontStyle: "italic",
  },

  // Footer Button
  actionButtonFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACTION_GREEN,
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
  noteContainer: {
    backgroundColor: PRIMARY_LIGHT,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_ACCENT,
  },
  noteText: {
    fontSize: 12,
    color: TEXT_DARK,
  },
});
