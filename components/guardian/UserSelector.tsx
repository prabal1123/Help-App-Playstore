import React from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
} from "react-native";

type LinkedUser = { user_id: string; name: string };

interface Props {
  linkedUsers: LinkedUser[];
  selectedUser: LinkedUser | null;
  dropdownVisible: boolean;
  onOpenDropdown: () => void;
  onCloseDropdown: () => void;
  onSelectUser: (user: LinkedUser) => void;
}

export function UserSelector({
  linkedUsers,
  selectedUser,
  dropdownVisible,
  onOpenDropdown,
  onCloseDropdown,
  onSelectUser,
}: Props) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#666",
          marginBottom: 4,
        }}
      >
        MONITORING
      </Text>
      <Pressable
        onPress={onOpenDropdown}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f0fdf4",
          borderColor: "#16a34a",
          borderWidth: 1.5,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 16, color: "#15803d" }}>
          {selectedUser ? `👤 ${selectedUser.name}` : "Select a user..."}
        </Text>
        <Text style={{ color: "#16a34a", fontSize: 18 }}>▾</Text>
      </Pressable>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 32,
          }}
          onPress={onCloseDropdown}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                padding: 16,
                fontWeight: "700",
                fontSize: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              Select User to Monitor
            </Text>
            <FlatList
              data={linkedUsers}
              keyExtractor={(item) => item.user_id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelectUser(item)}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f9f9f9",
                    backgroundColor:
                      selectedUser?.user_id === item.user_id
                        ? "#f0fdf4"
                        : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight:
                        selectedUser?.user_id === item.user_id ? "700" : "400",
                      color: "#333",
                    }}
                  >
                    👤 {item.name}
                    {selectedUser?.user_id === item.user_id ? "  ✓" : ""}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}