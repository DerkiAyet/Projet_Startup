import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";

export default function About() {
  return (
    <View style={styles.container}>
      <Image source={{uri: "https://picsum.photos/seed/postpage/600/600"}} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: 200,
    width: 200
  }
});
