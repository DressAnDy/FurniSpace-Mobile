import React from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { closeIconDefinition } from "../../../icons/navigation/definitions";
import { checkIconDefinition } from "../../../icons/status/definitions";
import { AppIcon } from "../../../shared/components/AppIcon";
import { ProjectSummaryItem } from "../models/project.model";
import { styles } from "./ProjectSwitcherModal.styles";

type ProjectSwitcherModalProps = {
  visible: boolean;
  projects: ProjectSummaryItem[];
  activeProjectId: string | null;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  onPrefetch?: (projectId: string) => void;
};

export function ProjectSwitcherModal({
  visible,
  projects,
  activeProjectId,
  onClose,
  onSelect,
  onPrefetch,
}: ProjectSwitcherModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Switch Project</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <AppIcon definition={closeIconDefinition} size={14} color="#7A6F68" strokeWidth={2} />
            </Pressable>
          </View>

          {projects.length === 0 ? (
            <Text style={styles.emptyText}>No projects available.</Text>
          ) : (
            <FlatList
              style={styles.list}
              data={projects}
              keyExtractor={(item) => item.projectId}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isActive = item.projectId === activeProjectId;

                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.item,
                      isActive && styles.itemActive,
                      pressed && styles.itemPressed,
                    ]}
                    onPressIn={() => onPrefetch?.(item.projectId)}
                    onPress={() => {
                      onPrefetch?.(item.projectId);
                      onSelect(item.projectId);
                      onClose();
                    }}
                  >
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.projectName}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.projectCode} · {item.businessType}
                      </Text>
                      <Text style={styles.itemStatus}>{item.statusLabel}</Text>
                    </View>
                    {isActive ? (
                      <View style={styles.checkWrap}>
                        <AppIcon definition={checkIconDefinition} size={12} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
