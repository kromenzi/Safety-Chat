import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 0.8 + opacity.value * 0.2 }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons
          name="shield-check"
          size={16}
          color={Colors.dark.tint}
        />
      </View>
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.dark.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: Colors.dark.aiBubble,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
  },
});
