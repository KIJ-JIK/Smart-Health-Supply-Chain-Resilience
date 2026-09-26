import React from 'react';
import {
  Building2,
  Bed,
  Wind,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  Activity,
  Info,
} from 'lucide-react';

interface CopilotMessageRendererProps {
  content: string;
}

/**
 * Pre-processes crammed LLM text to ensure headers, bullets, and numbered items
 * have proper newlines even if returned as a collapsed block.
 */
function normalizeMarkdown(text: string): string {
  if (!text) return '';

  let formatted = text;

  // 1. Separate crammed headers: e.g. "district of West Bengal. ### Operational Status"
  formatted = formatted.replace(/([^\n])\s*(#{1,4}\s+)/g, '$1\n\n$2');

  // 2. Separate crammed bullets: e.g. "active** * **Total Bed Capacity:"
  formatted = formatted.replace(/([^\n])\s+([*•-]\s+)/g, '$1\n$2');

  // 3. Separate crammed numbered steps: e.g. "Recommendations** 1. **Oxygen Supply..."
  formatted = formatted.replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n\n$2');

  // 4. Ensure headers have newlines after them if immediately followed by bullet or text
  formatted = formatted.replace(/(#{1,4}[^\n]+?)\s+([*•-]\s+|\d+\.\s+)/g, '$1\n$2');

  return formatted;
}

/**
 * Renders inline formatting: **bold**, *italic*, `code`, and literal highlights.
 */
function renderInline(text: string): React.ReactNode {
  // Regex to match **bold**, `code`, and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700, color: '#0F172A' }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            fontFamily: 'monospace',
            fontSize: '0.9em',
            background: '#F1F5F9',
            padding: '1px 5px',
            borderRadius: 4,
            color: '#0F172A',
            border: '1px solid #E2E8F0',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic', color: '#475569' }}>
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Gets an icon matching common clinical/governance section titles.
 */
function getSectionIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('status') || t.includes('overview') || t.includes('facility')) {
    return <Building2 size={16} style={{ color: '#2563EB', flexShrink: 0 }} />;
  }
  if (t.includes('bed') || t.includes('capacity') || t.includes('occupancy')) {
    return <Bed size={16} style={{ color: '#0E9F6E', flexShrink: 0 }} />;
  }
  if (t.includes('oxygen') || t.includes('vulnerabilit') || t.includes('supply chain')) {
    return <Wind size={16} style={{ color: '#0284C7', flexShrink: 0 }} />;
  }
  if (t.includes('alert') || t.includes('warning') || t.includes('critical')) {
    return <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0 }} />;
  }
  if (t.includes('recommend') || t.includes('action') || t.includes('directive')) {
    return <ClipboardList size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />;
  }
  if (t.includes('patient') || t.includes('footfall') || t.includes('trend')) {
    return <TrendingUp size={16} style={{ color: '#E11D48', flexShrink: 0 }} />;
  }
  return <Activity size={16} style={{ color: '#475569', flexShrink: 0 }} />;
}

export const CopilotMessageRenderer: React.FC<CopilotMessageRendererProps> = ({ content }) => {
  if (!content) return null;

  const normalized = normalizeMarkdown(content);
  const rawParagraphs = normalized.split(/\n{2,}/);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontSize: 13.5,
        lineHeight: 1.6,
        color: '#1E293B',
      }}
    >
      {rawParagraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // 1. Horizontal Rule (---)
        if (/^---+$/.test(trimmed)) {
          return (
            <hr
              key={pIdx}
              style={{
                border: 'none',
                borderTop: '1px solid #E2E8F0',
                margin: '8px 0',
              }}
            />
          );
        }

        // 2. Headings (### Title, ## Title, # Title)
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
          const rawTitle = headingMatch[2].replace(/^\*\*|\*\*$/g, '').trim();
          const icon = getSectionIcon(rawTitle);

          return (
            <div
              key={pIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: pIdx === 0 ? 2 : 12,
                marginBottom: 2,
                paddingBottom: 6,
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              {icon}
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {rawTitle}
              </h4>
            </div>
          );
        }

        // 3. Blockquotes / Alerts (> ⚠️ ... or ⚠️ ...)
        const isQuote = trimmed.startsWith('>');
        const isWarning =
          trimmed.includes('⚠️') ||
          trimmed.includes('🔴') ||
          trimmed.toLowerCase().includes('clinical warning') ||
          trimmed.toLowerCase().includes('supply chain warning');

        if (isQuote || (isWarning && !trimmed.includes('\n*'))) {
          const cleanQuote = trimmed
            .replace(/^>\s*/, '')
            .replace(/^⚠️\s*/, '')
            .trim();

          return (
            <div
              key={pIdx}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                background: isWarning ? '#FFFBEB' : '#F8FAFC',
                border: isWarning ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                borderLeft: isWarning ? '4px solid #F59E0B' : '4px solid #94A3B8',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: isWarning ? '#92400E' : '#334155',
                margin: '4px 0',
              }}
            >
              {isWarning ? (
                <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
              ) : (
                <Info size={16} style={{ color: '#64748B', flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ flex: 1 }}>{renderInline(cleanQuote)}</div>
            </div>
          );
        }

        // 4. Bullet & Numbered List Blocks
        const lines = trimmed.split('\n');
        const isListBlock = lines.some((l) => /^\s*([*•-]\s+|\d+\.\s+)/.test(l));

        if (isListBlock) {
          return (
            <div
              key={pIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: '#F8FAFC',
                border: '1px solid #EEF2F6',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              {lines.map((line, lIdx) => {
                const lineTrimmed = line.trim();
                if (!lineTrimmed) return null;

                // Numbered Item: e.g. "1. **Title:** text"
                const numMatch = lineTrimmed.match(/^(\d+)\.\s+(.+)$/);
                if (numMatch) {
                  const num = numMatch[1];
                  const itemContent = numMatch[2];
                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 13,
                        lineHeight: 1.5,
                        padding: '4px 0',
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        {num}
                      </span>
                      <div style={{ flex: 1, color: '#1E293B' }}>{renderInline(itemContent)}</div>
                    </div>
                  );
                }

                // Bullet Item: e.g. "* **Total Bed Capacity:** 44 beds..."
                const bulletMatch = lineTrimmed.match(/^[*•-]\s+(.+)$/);
                const bulletText = bulletMatch ? bulletMatch[1] : lineTrimmed;

                const isLineWarning =
                  bulletText.includes('⚠️') ||
                  bulletText.includes('🔴') ||
                  bulletText.includes('STOCKOUT');

                return (
                  <div
                    key={lIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                      padding: '3px 0',
                      color: isLineWarning ? '#B45309' : '#1E293B',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isLineWarning ? '#F59E0B' : '#3B82F6',
                        flexShrink: 0,
                        marginTop: 7,
                      }}
                    />
                    <div style={{ flex: 1 }}>{renderInline(bulletText)}</div>
                  </div>
                );
              })}
            </div>
          );
        }

        // 5. Standard Narrative Paragraph
        return (
          <p
            key={pIdx}
            style={{
              margin: 0,
              fontSize: 13.5,
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
