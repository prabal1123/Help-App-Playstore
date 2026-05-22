import React from "react";
import { Modal, View, Text, Pressable } from "react-native";

interface Props {
  alertModal: { title: string; body: string } | null;
  onDismiss: () => void;
}

export function AlertModal({ alertModal, onDismiss }: Props) {
  return (
    <Modal visible={!!alertModal} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            elevation: 10,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            {alertModal?.title}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#555",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            {alertModal?.body}
          </Text>
          <Pressable
            onPress={onDismiss}
            style={{
              backgroundColor: "#ff4444",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}