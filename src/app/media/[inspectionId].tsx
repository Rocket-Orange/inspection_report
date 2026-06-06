import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useInspectionQueries } from '@/hooks/use-inspections';
import { useTheme } from '@/hooks/use-theme';
import { buildInspectionTitle } from '@/utils/inspection-title';

const COLUMNS = 3;
const GAP = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_SIZE = Math.floor((SCREEN_WIDTH - Spacing.three * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

interface MediaItem {
  uri: string;
  type: 'photo' | 'video';
  key: string;
}

export default function InspectionMediaScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId: string }>();
  const { getInspection, getResults } = useInspectionQueries();
  const theme = useTheme();

  const [title, setTitle] = useState('Media');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    load();
  }, [inspectionId]);

  async function load() {
    const [inspection, results] = await Promise.all([
      getInspection(inspectionId),
      getResults(inspectionId),
    ]);
    if (inspection) setTitle(buildInspectionTitle(inspection));

    const mediaItems: MediaItem[] = [];
    for (const r of results) {
      for (let i = 0; i < r.photoUris.length; i++) {
        mediaItems.push({ uri: r.photoUris[i], type: 'photo', key: `photo-${r.id}-${i}` });
      }
      for (let i = 0; i < r.videoUris.length; i++) {
        mediaItems.push({ uri: r.videoUris[i], type: 'video', key: `video-${r.id}-${i}` });
      }
    }
    setItems(mediaItems);
    setLoaded(true);
  }

  function toggleSelect(uri: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.uri)));
    }
  }

  async function handleDownload() {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library in Settings to save media.',
      );
      return;
    }

    let saved = 0;
    for (const uri of selected) {
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
        saved++;
      } catch {
        // skip files that can't be saved
      }
    }

    Alert.alert('Saved', `${saved} item${saved !== 1 ? 's' : ''} saved to your photo library.`);
    setSelected(new Set());
  }

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
          <ThemedText style={styles.backText}>‹</ThemedText>
        </Pressable>
        <ThemedText type="small" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <Pressable
          onPress={() => router.replace('/(tabs)/' as any)}
          style={styles.navBtn}
          hitSlop={8}>
          <ThemedText style={styles.homeText}>⌂</ThemedText>
        </Pressable>
      </View>

      <View style={[styles.toolbar, { backgroundColor: theme.backgroundElement }]}>
        <Pressable onPress={toggleSelectAll} style={styles.selectAllBtn}>
          <ThemedText type="small" style={styles.selectAllText}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleDownload}
          disabled={selected.size === 0}
          style={[styles.downloadBtn, { opacity: selected.size === 0 ? 0.4 : 1 }]}>
          <ThemedText type="small" style={styles.downloadBtnText}>
            {selected.size > 0 ? `Download (${selected.size})` : 'Download'}
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={items}
        numColumns={COLUMNS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.uri);
          return (
            <Pressable onPress={() => toggleSelect(item.uri)} style={styles.tile}>
              {item.type === 'photo' ? (
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.tileImage, isSelected && styles.tileSelected]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.tileImage,
                    styles.videoTile,
                    { backgroundColor: theme.backgroundSelected },
                    isSelected && styles.tileSelected,
                  ]}>
                  <ThemedText style={styles.playIcon}>▶</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.videoLabel}>
                    Video
                  </ThemedText>
                </View>
              )}
              {isSelected && (
                <View style={styles.checkOverlay}>
                  <ThemedText style={styles.checkMark}>✓</ThemedText>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary">No media in this inspection.</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  navBtn: { padding: Spacing.one },
  backText: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  homeText: { fontSize: 20 },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 13 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  selectAllBtn: { paddingVertical: Spacing.one },
  selectAllText: { color: '#3c87f7', fontWeight: '600' },
  downloadBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 20,
    backgroundColor: '#3c87f7',
  },
  downloadBtnText: { color: '#fff', fontWeight: '700' },
  grid: { padding: Spacing.three, gap: GAP },
  row: { gap: GAP },
  tile: { width: TILE_SIZE, height: TILE_SIZE, position: 'relative' },
  tileImage: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 4 },
  tileSelected: { opacity: 0.65 },
  videoTile: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  playIcon: { fontSize: 28 },
  videoLabel: { fontSize: 10 },
  checkOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: Spacing.six },
});
