import { supabaseAdmin } from "../db/supabase";
import { marked } from "marked";
// @ts-ignore
import htmlToDocx from "html-to-docx";
import htmlToPdfmake from "html-to-pdfmake";
import PdfPrinter from "pdfmake";
import { JSDOM } from "jsdom";

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

/**
 * Builds a canonical Markdown string combining the finalized report content,
 * citations, and metadata.
 */
export async function buildCanonicalMarkdown(sessionId: string, userId: string): Promise<string> {
  // Fetch session & report
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("research_sessions")
    .select("*, research_reports(*), research_evaluations(*)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error("Research session not found");
  }

  if (session.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  const report = session.research_reports?.[0];
  if (!report || !report.is_approved) {
    throw new Error("Report is not finalized or approved yet.");
  }

  const evalData = session.research_evaluations?.[0];

  // Fetch citations with their sources
  const { data: citations } = await supabaseAdmin
    .from("citations")
    .select("*, source:research_sources(*)")
    .eq("report_id", report.id)
    .order("citation_number", { ascending: true });

  let md = `# ${report.title || "Research Report"}\n\n`;

  // Include evaluation metadata if available
  if (evalData?.quality_metrics?.evidenceCoverage) {
    md += `*Evidence Coverage: ${Math.round(evalData.quality_metrics.evidenceCoverage * 100)}% | Citation Completeness: ${Math.round((evalData.quality_metrics.citationCompleteness || 0) * 100)}%*\n\n`;
  }

  md += `${report.content}\n\n`;

  if (citations && citations.length > 0) {
    md += `## References\n\n`;
    citations.forEach(cit => {
      const src = cit.source;
      if (src) {
        md += `[${cit.citation_number}] [${src.title || src.url}](${src.url})\n`;
      }
    });
  }

  return md;
}

/**
 * Export as raw Canonical Markdown.
 */
export async function exportAsMarkdown(sessionId: string, userId: string): Promise<string> {
  return buildCanonicalMarkdown(sessionId, userId);
}

/**
 * Generate a PDF buffer from the Canonical Markdown.
 */
export async function exportAsPDF(sessionId: string, userId: string): Promise<Buffer> {
  const md = await buildCanonicalMarkdown(sessionId, userId);
  
  // Render Markdown to HTML
  const html = await marked.parse(md);

  // Convert HTML to PDFMake format
  const { window } = new JSDOM("");
  const pdfMakeContent = htmlToPdfmake(html, { window });

  const docDefinition = {
    content: pdfMakeContent,
    defaultStyle: {
      font: "Roboto"
    },
    styles: {
      // Basic styling mappings if needed
    }
  };

  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
      const chunks: Buffer[] = [];
      
      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      pdfDoc.on('error', (err: any) => {
        reject(err);
      });
      
      pdfDoc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generate a DOCX buffer from the Canonical Markdown.
 */
export async function exportAsDOCX(sessionId: string, userId: string): Promise<Buffer> {
  const md = await buildCanonicalMarkdown(sessionId, userId);
  const html = await marked.parse(md);
  
  const buffer = await htmlToDocx(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true
  });
  
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}
