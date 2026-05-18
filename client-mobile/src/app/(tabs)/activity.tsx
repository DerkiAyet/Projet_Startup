import { View, StyleSheet, Text } from "react-native";


export default function Activity() {
  return (
    <View style={styles.container}>
      <Text>Activity</Text>
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
