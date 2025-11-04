import { Ionicons } from "@expo/vector-icons";
import { SaveFormat, useImageManipulator } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [manipulatedImage, setManipulatedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
    }
  };
  // 当选择图片后，生成一个 manipulator context
  const context = useImageManipulator(selectedImage || "");

  // 📸 每次选中图片后自动转换为 JPG
  useEffect(() => {
    const convertToJpg = async () => {
      if (!selectedImage) return;

      try {
        const image = await context.renderAsync();
        const saved = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 1.0,
        });
        setManipulatedImage(saved.uri);
      } catch (e) {
        console.error("Image conversion failed:", e);
      }
    };

    convertToJpg();
  }, [selectedImage]);

  const uploadToCloudinary = async () => {
    if (!manipulatedImage) return;

    try {
      setLoading(true);

      const data = new FormData();
      data.append("file", {
        uri: manipulatedImage,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);
      data.append("upload_preset", "expo-image-upload");
      data.append("cloud_name", "dyxrfm7fh");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dyxrfm7fh/image/upload",
        { method: "POST", body: data }
      );

      const result = await res.json();
      console.log("✅ Upload success:", result);
      Alert.alert("✅ Upload successful", result.secure_url);
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📸 Image Uploader</Text>

        {manipulatedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: manipulatedImage }} style={styles.image} />
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.button, styles.blue]}
          >
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={uploadToCloudinary}
            disabled={!manipulatedImage || loading}
            style={[
              styles.button,
              manipulatedImage ? styles.green : styles.gray,
            ]}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "cloud-upload-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              {loading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#3B82F6"
            style={styles.loader}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20, alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
  },
  imageContainer: { width: "100%", marginBottom: 20 },
  image: { width: "100%", height: 300, borderRadius: 16, resizeMode: "cover" },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  blue: { backgroundColor: "#3B82F6" },
  green: { backgroundColor: "#10B981" },
  gray: { backgroundColor: "#D1D5DB" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 6 },
  loader: { marginTop: 20 },
});
