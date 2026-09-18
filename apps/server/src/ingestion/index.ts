import dns from "dns";
import { promisify } from "util";
const pdfParse = require("pdf-parse");
import { URL } from "url";

const lookupAsync = promisify(dns.lookup);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 15000;

export interface IngestedSource {
  url: string;
  title: string | null;
  domain: string | null;
  content: string;
  contentType: string;
  sourceCategory: string;
  reliabilityRationale: string;
  isPrimarySource: boolean;
}

interface PdfPageData {
  pageIndex: number;
  getTextContent(): Promise<{
    items: Array<{
      str: string;
      transform: number[];
    }>;
  }>;
}

// Simple IP classification to prevent SSRF
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
  }
  // Basic IPv6 check
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:') || ip.startsWith('fe80:') || ip === '::1') return true;
  return false;
}

export function classifyDomain(domain: string): { category: string, rationale: string, isPrimary: boolean } {
  if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
    return { category: 'government', rationale: 'Official government domain', isPrimary: true };
  }
  if (domain.endsWith('.edu')) {
    return { category: 'academic', rationale: 'Educational institution domain', isPrimary: false };
  }
  if (domain.endsWith('.org')) {
    return { category: 'established organization', rationale: 'Non-profit or organizational domain', isPrimary: false };
  }
  if (domain.includes('github.com') || domain.includes('docs.')) {
    return { category: 'technical documentation', rationale: 'Technical or documentation hosting platform', isPrimary: true };
  }
  if (domain.includes('medium.com') || domain.includes('blog.')) {
    return { category: 'blog / secondary source', rationale: 'Common blogging platform', isPrimary: false };
  }
  return { category: 'unknown', rationale: 'Domain does not match known deterministic categories', isPrimary: false };
}

export async function fetchUrlSecurely(targetUrl: string, maxRedirects = 5): Promise<IngestedSource> {
  if (maxRedirects < 0) throw new Error("Too many redirects");

  const parsedUrl = new URL(targetUrl);
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Unsupported protocol");
  }

  // Pre-flight SSRF check
  const lookup = await lookupAsync(parsedUrl.hostname);
  if (isPrivateIP(lookup.address)) {
    throw new Error("Cannot fetch private or local IPs");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal as any,
      redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      const location = response.headers.get('location')!;
      const nextUrl = new URL(location, targetUrl).toString();
      clearTimeout(timeoutId);
      return fetchUrlSecurely(nextUrl, maxRedirects - 1);
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const isSupported = contentType.includes("text/") || 
                        contentType.includes("application/pdf") || 
                        contentType.includes("application/json") ||
                        contentType === "";
    if (!isSupported) {
      throw new Error("Unsupported content type");
    }

    let content = "";
    
    // Size check
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_FILE_SIZE) {
      throw new Error("Response exceeds maximum allowed size");
    }

    if (contentType.includes("application/pdf")) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > MAX_FILE_SIZE) throw new Error("File too large");
      
      const pdfData = await pdfParse(buffer);
      content = pdfData.text;
    } else {
      const text = await response.text();
      if (Buffer.byteLength(text, 'utf-8') > MAX_FILE_SIZE) throw new Error("Content too large");
      content = text; 
      content = content.replace(/<[^>]*>?/gm, ' '); // Basic HTML strip
    }

    const finalUrl = response.url;
    const finalParsed = new URL(finalUrl);
    const classification = classifyDomain(finalParsed.hostname);

    return {
      url: finalUrl,
      title: null, 
      domain: finalParsed.hostname,
      content: content.trim(),
      contentType,
      sourceCategory: classification.category,
      reliabilityRationale: classification.rationale,
      isPrimarySource: classification.isPrimary
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parsePdfBuffer(buffer: Buffer, originalName: string): Promise<IngestedSource> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("PDF exceeds maximum allowed size");
  }
  
  const pdfData = await pdfParse(buffer, {
    pagerender: function(pageData: any) {
      return pageData.getTextContent().then(function(textContent: any) {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        return `\n--- Page ${pageData.pageIndex + 1} ---\n${text}`;
      });
    }
  });

  return {
    url: `upload://${originalName}`,
    title: pdfData.info?.Title || originalName,
    domain: 'local_upload',
    content: pdfData.text,
    contentType: 'application/pdf',
    sourceCategory: 'unknown',
    reliabilityRationale: 'User provided PDF document',
    isPrimarySource: false
  };
}
