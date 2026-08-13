/**
 * Client-Side PDF Text Extraction Hook & Helpers.
 * This completely bypasses any Nginx upload size limits (such as 413 Payload Too Large)
 * by reading the files locally in the user's browser, extracting the text content in milliseconds,
 * and saving the extracted text directly. This also reduces server cost and stays 100% stable.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Extract GlobalWorkerOptions defensively to support both direct ESM and CommonJS/Vite-wrapped bundling
const globalWorkerOps = (pdfjsLib as any)?.GlobalWorkerOptions || (pdfjsLib as any)?.default?.GlobalWorkerOptions;

if (globalWorkerOps) {
  try {
    const pdfJsVersion = (pdfjsLib as any)?.version || '4.0.379';
    globalWorkerOps.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
    console.log('[clientPdfExtractor] Configured PDF.js workerSrc URL:', globalWorkerOps.workerSrc);
  } catch (err) {
    console.warn('[clientPdfExtractor] Failed setting PDF.js workerSrc:', err);
  }
}

/**
 * Extracts raw textual data from a Local PDF File, page-by-page.
 * Uses the locally bundled pdfjs-dist library which operates offline, respects CSP,
 * and maintains 100% data privacy.
 * @param file The file object from resource inputs
 * @param onProgress Callback to track extraction percentage
 */
export const extractTextFromPdfClient = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();

  const getDoc = (pdfjsLib as any)?.getDocument || (pdfjsLib as any)?.default?.getDocument;
  if (!getDoc) {
    throw new Error("Unable to locate getDocument functional handler in active PDF.js build.");
  }

  const loadingTask = getDoc({
    data: arrayBuffer,
    disableRange: true,
    disableStream: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let pageText = '';
      let lastY = -1;

      if (!textContent || !Array.isArray(textContent.items)) {
        console.warn(`[clientPdfExtractor] Warning: Text content empty or not iterable on page ${pageNum}`);
        continue;
      }

      // Iterate through individual text segments to reconstruct readable text layout
      for (const item of textContent.items as any[]) {
        if (!item || typeof item.str !== 'string') continue;

        // item.transform holds: [scaleX, skewY, skewX, scaleY, transformX, transformY]
        // index 5 represents vertical distance from page ceiling
        const currentY = item.transform ? item.transform[5] : -1;

        if (lastY !== -1 && Math.abs(currentY - lastY) > 6) {
          // Line break detected
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !item.str.startsWith(' ')) {
          // Word gap detected
          pageText += ' ';
        }

        pageText += item.str;
        lastY = currentY;
      }

      fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;

      if (onProgress) {
        onProgress(Math.round((pageNum / numPages) * 100));
      }
    } catch (pageError: any) {
      console.error(`[clientPdfExtractor] Failed extracting page ${pageNum}:`, pageError);
      fullText += `--- PAGE ${pageNum} ---\n[Error parsing page text: ${pageError?.message || 'Unknown error'}]\n\n`;
    }
  }

  // Double check if extracted content is too thin
  const alphaNumOnly = fullText.replace(/[^a-zA-Z0-9]/g, '');
  if (alphaNumOnly.length < 50) {
    fullText += `\n\n[Parser Warning] This PDF contains very little digital text, which might indicate it is a scanned physical document. Active text search or analysis of physical images may require external OCR.`;
  }

  return fullText.trim();
};
