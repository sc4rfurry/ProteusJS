/**
 * @sc4rfurryx/proteusjs/a11y-audit
 * Lightweight accessibility audits for development
 * 
 * @version 2.0.0
 * @author sc4rfurry
 * @license MIT
 */

export interface AuditOptions {
  rules?: string[];
  format?: 'console' | 'json';
}

export interface AuditViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  nodes: number;
  help: string;
}

export interface AuditReport {
  violations: AuditViolation[];
  passes: number;
  timestamp: number;
  url: string;
}

export async function audit(
  target: Document | Element = document,
  options: AuditOptions = {}
): Promise<AuditReport> {
  if (typeof window === 'undefined' || process.env['NODE_ENV'] === 'production') {
    return { violations: [], passes: 0, timestamp: Date.now(), url: '' };
  }

  const { rules = ['images', 'headings', 'forms'], format = 'console' } = options;
  const violations: AuditViolation[] = [];
  let passes = 0;

  if (rules.includes('images')) {
    const imgs = target.querySelectorAll('img:not([alt])');
    if (imgs.length > 0) {
      violations.push({
        id: 'image-alt', impact: 'critical', nodes: imgs.length, help: 'Images need alt text'
      });
    }
    passes += target.querySelectorAll('img[alt]').length;
  }

  if (rules.includes('headings')) {
    const h1s = target.querySelectorAll('h1');
    if (h1s.length !== 1) {
      violations.push({
        id: 'heading-structure', impact: 'moderate', nodes: h1s.length, help: 'Page should have exactly one h1'
      });
    } else passes++;
  }

  if (rules.includes('forms')) {
    const unlabeled = target.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (unlabeled.length > 0) {
      violations.push({
        id: 'form-labels', impact: 'critical', nodes: unlabeled.length, help: 'Form inputs need labels'
      });
    }
    passes += target.querySelectorAll('input[aria-label], input[aria-labelledby]').length;
  }

  const report: AuditReport = {
    violations, passes, timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  if (format === 'console' && violations.length > 0) {
    console.group('?? A11y Audit Results');
    violations.forEach(v => console.warn(`${v.impact}: ${v.help}`));
    console.groupEnd();
  }

  return report;
}

export default { audit };
