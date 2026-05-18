import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#EC4899",
                tabBarInactiveTintColor: "#8A8A8A",
                tabBarStyle: {
                    borderTopColor: "#D9E1E7",
                    backgroundColor: "#fff",
                },
                tabBarLabelStyle: {
                    fontFamily: "Nunito_700Bold",
                    fontSize: 11,
                },
            }}
        >
            <Tabs.Screen name="activity" options={{ title: "Activity",   tabBarIcon: ({ color, size }) => <Feather name="activity"       color={color} size={size} /> }} />
            <Tabs.Screen name="chat"     options={{ title: "Chat",       tabBarIcon: ({ color, size }) => <Feather name="message-circle" color={color} size={size} /> }} />
            <Tabs.Screen name="index"   options={{ title: "Home",       tabBarIcon: ({ color, size }) => <Feather name="home"           color={color} size={size} /> }} />
            <Tabs.Screen name="search"  options={{ title: "Search",     tabBarIcon: ({ color, size }) => <Feather name="search"         color={color} size={size} /> }} />
            <Tabs.Screen name="profile" options={{ title: "Profile",    tabBarIcon: ({ color, size }) => <Feather name="user"           color={color} size={size} /> }} />
        </Tabs>
    );
}