import { Text, View, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";

export default function Index() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text>Profile page.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
});
