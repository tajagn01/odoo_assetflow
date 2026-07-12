/**
 * Zero-dependency client-side CSV Exporter
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  // Extract keys as headers
  const headers = Object.keys(data[0]);

  // Map rows
  const csvRows = [
    headers.join(","), // Header line
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          const stringVal = value !== null && value !== undefined ? String(value) : "";
          // Escape double quotes by doubling them, and wrap string in quotes to support commas
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  // Convert to CSV string and create download link
  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Zero-dependency client-side CSV Parser (respects quotes)
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']\|["']$/g, ""));
  const result: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let currentVal = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(currentVal.trim().replace(/^["']\|["']$/g, ""));
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']\|["']$/g, ""));

    if (values.length === headers.length) {
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index];
      });
      result.push(rowObj);
    }
  }

  return result;
}
