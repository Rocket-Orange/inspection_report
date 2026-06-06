import { useFocusEffect, router } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useMediaFolders, type MediaFolder } from '@/hooks/use-inspections';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format-date';

export default function MediaScreen() {
  const { folders, loading, reload } = useMediaFolders();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, []),
  );

  function handleFolderPress(folder: MediaFolder) {
    router.push({ pathname: '/media/[inspectionId]', params: { inspectionId: folder.inspectionId } });
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Media</ThemedText>
      </View>
      <FlatList
        data={folders}
        keyExtractor={(item) => item.inspectionId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleFolderPress(item)}
            style={({ pressed }) => [
              styles.folderCard,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            {item.thumbnailUri ? (
              <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={styles.videoPlaceholderIcon}>▶</ThemedText>
              </View>
            )}
            <View style={styles.folderInfo}>
              <ThemedText type="small" style={styles.folderTitle} numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(item.date)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[
                  item.photoCount > 0 ? `${item.photoCount} photo${item.photoCount !== 1 ? 's' : ''}` : '',
                  item.videoCount > 0 ? `${item.videoCount} video${item.videoCount !== 1 ? 's' : ''}` : '',
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: BottomTabInset + Spacing.three },
        ]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No media yet.{'\n'}Photos and videos captured during{'\n'}inspections will appear here.
              </ThemedText>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  list: { padding: Spacing.three, gap: Spacing.two },
  folderCard: {
    borderRadius: 12,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderIcon: { fontSize: 22, opacity: 0.5 },
  folderInfo: { flex: 1, gap: Spacing.half },
  folderTitle: { fontWeight: '600', fontSize: 13 },
  chevron: { fontSize: 22, opacity: 0.35 },
  empty: { alignItems: 'center', paddingTop: Spacing.six },
  emptyText: { textAlign: 'center', lineHeight: 24 },
});
