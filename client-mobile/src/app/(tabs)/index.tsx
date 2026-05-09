import { Text, View, StyleSheet, TextInput, Button } from "react-native";
// import { Button } from "@expo/ui/jetpack-compose"
import { Link, useRouter } from "expo-router";

export default function Index() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
      <TextInput placeholder="email" />
      <Link href={"/about"}>go to about page</Link>
      {/* <Button onClick={() => router.push("/about")}>
        <Text>Navigate</Text>
      </Button> */}
      <Button title="Navigate" onPress={() => router.push("/about")} />
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
