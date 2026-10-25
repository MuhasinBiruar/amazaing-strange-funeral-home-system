import type { ExportTable } from './exportUtils';

/**
 * The PDF's built-in font (Helvetica) has no glyph for "₱", so amounts are
 * written as "PHP 1,234.00" instead of showing a blank box.
 */
const pdfSafe = (value: string) => value.replaceAll('₱', 'PHP ');

/**
 * Builds a landscape A4 PDF of the table: a title, the export date, and the
 * rows, with the column headers repeated on every page.
 *
 * @remarks
 * `@react-pdf/renderer` is imported here, on demand, so the PDF library only
 * loads when someone actually exports a PDF.
 */
export async function toPdfBlob(title: string, table: ExportTable) {
  const { pdf, Document, Page, Text, View, StyleSheet } =
    await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: {
      paddingTop: 32,
      paddingBottom: 40,
      paddingHorizontal: 32,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#111827',
    },
    title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    subtitle: { fontSize: 9, color: '#6b7280', marginBottom: 14 },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: '#eef2ff',
      borderBottomWidth: 1,
      borderBottomColor: '#c7d2fe',
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
    },
    headerCell: {
      flex: 1,
      padding: 5,
      fontFamily: 'Helvetica-Bold',
      color: '#3730a3',
    },
    cell: { flex: 1, padding: 5 },
    footer: {
      position: 'absolute',
      bottom: 18,
      left: 32,
      right: 32,
      fontSize: 8,
      color: '#9ca3af',
      textAlign: 'right',
    },
  });

  const exportedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const document = (
    <Document title={title}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Exported {exportedAt} · {table.rows.length} records
        </Text>

        <View style={styles.headerRow} fixed>
          {table.headers.map((header, i) => (
            <Text key={i} style={styles.headerCell}>
              {header}
            </Text>
          ))}
        </View>

        {table.rows.map((cells, rowIndex) => (
          <View key={rowIndex} style={styles.row} wrap={false}>
            {cells.map((cell, i) => (
              <Text key={i} style={styles.cell}>
                {pdfSafe(cell)}
              </Text>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );

  return pdf(document).toBlob();
}
