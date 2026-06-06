import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  body: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: '1',
    title: '1 — Getting Started',
    subtitle: 'First-time setup guide.',
    body: `This app is used to carry out quality inspections. You fill in measurements, mark pass/fail results, attach photos and videos, and generate a PDF report to share.

First-time setup:
1. Go to Settings and tap Import Product Data (.xlsx) to load your product reference data, attribute columns, inspection points, and any Global Inspection Points defined in the file.
2. Configure which columns are visible, their type, severity, and grouping.
3. You are ready to start your first inspection.

The app works fully offline. All data is stored on your device.`,
  },
  {
    id: '2',
    title: '2 — Inspections List',
    subtitle: 'The home screen.',
    body: `All your inspections are listed here, newest first. Each card shows the status (In Progress or Completed), the date, the inspection title (supplier · batch no · product IDs), and the product/unit counts.

• Tap a card — opens the inspection form if in progress, or the report if completed.
• Long-press a card — shows a delete prompt. Deleting removes all results, photos, and videos permanently and cannot be undone.
• Tap + New — starts a new inspection.`,
  },
  {
    id: '3',
    title: '3 — Starting a New Inspection',
    subtitle: 'Selecting products and entering setup details.',
    body: `1. Search and select products — type in the search bar to filter. Tap a product to select it (checkmark appears). You can select multiple products.
2. Optional header fields — Supplier, Location, Batch NO, and Inspector Name. These appear in the report header.
3. Report type — only shown when 2 or more products are selected:
   • Normal — one separate PDF per product.
   • Nested — one combined PDF covering all products.
4. Per-product quantities — for each selected product, enter the number of Units to inspect and the total Batch size. These are required. You can also optionally enter production % and packing %.
5. Tap Start Inspection when ready. The button is disabled until all required fields are filled.`,
  },
  {
    id: '4',
    title: '4 — Filling In the Inspection',
    subtitle: 'The main inspection form.',
    body: `The form is organised into sections — one per product. Each section contains the inspection items grouped by category. All groups and products start collapsed; tap a header to expand it.

The progress counter in the top header (e.g. "12/45 filled") shows how many items have at least one value entered.

Product info columns (imported from your spreadsheet):
• Pass / Fail buttons — tap once to select, tap again to deselect (returns to N/A).
• Numeric input — type a measured value. The app shows whether it passes the configured tolerance and highlights the reference value for comparison.
• Sample size — pre-filled from the units you entered at setup. You can edit it per row.
• Note — free-text field for findings or comments.
• 📷 / 🎥 buttons — capture a photo or record a video directly from the row.
• ? button (blue) — shown if instructions were configured for the column. Tap to read the measurement guide.
• Severity badge — High / Medium / Low, shown in red / orange / yellow.

Inspection points (product-specific checklist items):
• Pass / Fail toggle, sample size, note, and photo/video — same controls as above.
• No severity badge; no reference value.

Global Inspection Points appear in each product section (in their assigned group, or under a dedicated "Global Inspection Points" sub-header if ungrouped). They work the same as product info columns.

Auto-save: All changes save automatically as you type. There is no save button.

Navigating away: Tap ← Back, ⌂ Home, or Review → — pending saves are flushed before leaving. Do not force-close the app mid-entry.`,
  },
  {
    id: '5',
    title: '5 — Review & Complete',
    subtitle: 'Summary before finalising.',
    body: `The review screen shows:
• Passed / Failed / Total counts at the top.
• A list of all failed items, sorted by severity (High first), then inspection points.
• Each failure shows the product, item name, severity, and any note you wrote.

• Tap ← Edit to return to the form and make corrections.
• Tap Complete Inspection to finalise. This locks the inspection and moves you to the report screen.

If everything passed, you will see "All filled items passed."`,
  },
  {
    id: '6',
    title: '6 — Reports & Sharing',
    subtitle: 'Generating and sharing the PDF.',
    body: `On the report screen:
• Generate & Share — builds the PDF from your inspection data and opens the system share sheet. If you recorded videos, they are bundled with the PDF into a .zip file automatically.
• ↺ Regenerate — rebuilds the PDF after you go back and edit.
• ✏ Edit — returns to the inspection form regardless of completion status.

What the PDF contains: date, inspector name, supplier, location, batch number, production and packing percentages, a pass/fail summary with counts by criticality (High / Medium / Low), a full results table with measured values and reference values, all notes, embedded photos (4 per page), and photo links within the table.

Normal vs Nested reports: With a normal report, you see one tab per product on the report screen. With a nested report, there is a single tab that covers all products in one document.

Videos are never embedded in the PDF — they are always provided as separate files in the zip.`,
  },
  {
    id: '7',
    title: '7 — Settings: Columns & Groups',
    subtitle: 'Configuring product info columns, groups, and import.',
    body: `Product Data
• Import Product Data (.xlsx) — loads products, attribute columns, inspection points, and Global Inspection Points from the spreadsheet. Re-importing updates existing products and preserves your column settings. If the file contains a "Global Inspection Points" sheet, it replaces all existing global inspection points.

Product Info Columns (visible after import)
Each column from your spreadsheet can be configured:
• Toggle — show or hide the column during inspection.
• Type — Numeric (inspector enters a number; tolerance applies) or Text / Pass-Fail (inspector taps Pass or Fail).
• Tolerance (numeric only) — defines the acceptable range:
  · Absolute — value must be within ± N of the reference.
  · Percent — value must be within ± N% of the reference.
  · Min — value must be at least N (or the reference value if left blank).
  · Max — value must be at most N (or the reference value if left blank).
• Severity — High, Medium, or Low; used for failure grouping in the report.
• Group — assign to a named group so related columns appear together under a collapsible sub-header.
• Instructions — optional guidance text shown via the ? button in the form.

Groups
Create named groups (e.g. "Dimensions", "Colour") to organise columns. Use the arrows to reorder groups; tap the trash icon to delete. Deleting a group does not delete its columns — they become ungrouped.`,
  },
  {
    id: '8',
    title: '8 — Settings: Global Points & Saved Settings',
    subtitle: 'Global inspection points and settings file backup.',
    body: `Global Inspection Points
Checklist items that appear for every product in every inspection. They are loaded from the Product Data spreadsheet (the "Global Inspection Points" sheet). Re-importing product data replaces all global inspection points with those in the file.

You can still add, edit, and reorder them here between imports — but the next product data import will overwrite them. They support the same type / tolerance / severity / group / instructions options as product info columns.

Settings File
• Export Settings — saves your column configuration and groups to an .xlsx file. Use this to back up your setup or move it to another device.
• Import Settings — restores a previously exported configuration. Existing column settings are updated; groups are rebuilt.`,
  },
  {
    id: '9',
    title: '9 — Media Library',
    subtitle: 'Browsing and saving photos and videos.',
    body: `The Media tab shows a folder for every inspection that has attached photos or videos. Each folder displays the first photo as a thumbnail, the inspection title, the date, and a count of photos and videos.

Tap a folder to open it. You will see a 3-column grid of all photos and videos from that inspection.

• Tap a tile — toggles selection (a blue checkmark appears).
• Select All / Deselect All — selects or clears all items at once.
• Download (N) — saves the selected items to your phone's photo library. The app will ask for permission the first time.

Media is automatically removed from this library when its inspection is deleted.`,
  },
];

export default function InstructionsScreen() {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleChapter(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
          <ThemedText style={styles.backText}>‹</ThemedText>
        </Pressable>
        <ThemedText type="small" style={styles.headerTitle}>
          Instructions
        </ThemedText>
        <Pressable
          onPress={() => router.replace('/(tabs)/' as any)}
          style={styles.navBtn}
          hitSlop={8}>
          <ThemedText style={styles.homeText}>⌂</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CHAPTERS.map((chapter) => {
          const isCollapsed = collapsed.has(chapter.id);
          return (
            <View key={chapter.id} style={[styles.chapter, { borderBottomColor: theme.backgroundElement }]}>
              <Pressable
                onPress={() => toggleChapter(chapter.id)}
                style={styles.chapterHeader}>
                <View style={styles.chapterHeaderText}>
                  <ThemedText style={styles.chapterTitle}>{chapter.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.chapterSubtitle}>
                    {chapter.subtitle}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.chevron, isCollapsed && styles.chevronCollapsed]}>
                  ▼
                </ThemedText>
              </Pressable>
              {!isCollapsed && (
                <ThemedText type="small" style={styles.chapterBody}>
                  {chapter.body}
                </ThemedText>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 15, textAlign: 'center' },
  content: { paddingBottom: Spacing.six },
  chapter: { borderBottomWidth: StyleSheet.hairlineWidth },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  chapterHeaderText: { flex: 1, gap: 2 },
  chapterTitle: { fontWeight: '700', fontSize: 14 },
  chapterSubtitle: { fontSize: 12 },
  chevron: { fontSize: 12, opacity: 0.5 },
  chevronCollapsed: { transform: [{ rotate: '-90deg' }] },
  chapterBody: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    lineHeight: 22,
    fontSize: 13,
  },
});
