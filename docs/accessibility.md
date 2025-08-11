# Accessibility Guide

ProteusJS provides tools to help build accessible web applications, but **accessibility requires intentional design and testing** - no library can automatically make your app fully accessible.

## Accessibility Modules

### 🔍 A11y Audit (Development)

Development-time accessibility checking to catch common issues early.

```javascript
import { audit } from '@sc4rfurryx/proteusjs/a11y-audit';

// Run basic accessibility checks
const report = await audit(document, {
  rules: ['images', 'headings', 'forms'],
  format: 'console'
});

console.log(`Found ${report.violations.length} accessibility issues`);
```

**What it checks:**
- ✅ Images without alt text
- ✅ Heading structure (single h1)
- ✅ Form inputs without labels
- ❌ **Does NOT check**: Color contrast, keyboard navigation, screen reader compatibility

### 🎛️ A11y Primitives

Headless accessibility patterns that provide ARIA attributes and focus management.

```javascript
import { dialog, tooltip, focusTrap, menu } from '@sc4rfurryx/proteusjs/a11y-primitives';
```

## ⚠️ Important Disclaimers

### What ProteusJS Does NOT Provide

1. **Automatic Compliance**: No tool can automatically make your app WCAG compliant
2. **Complete Testing**: Manual testing with assistive technologies is still required
3. **Color Contrast**: You must ensure sufficient color contrast ratios
4. **Content Quality**: Meaningful alt text, headings, and labels are your responsibility
5. **Keyboard Navigation**: Custom components need manual keyboard support implementation

### What You Still Need To Do

1. **Manual Testing**: Test with screen readers (NVDA, JAWS, VoiceOver)
2. **Keyboard Testing**: Ensure all functionality works with keyboard only
3. **Color Contrast**: Use tools like WebAIM's contrast checker
4. **Content Review**: Write meaningful alt text, headings, and labels
5. **User Testing**: Test with actual users who rely on assistive technologies

## Accessibility Patterns

### Modal Dialogs

```javascript
import { dialog, focusTrap } from '@sc4rfurryx/proteusjs/a11y-primitives';

const modal = document.getElementById('modal');
const trigger = document.getElementById('open-modal');

// Set up dialog with focus management
const dialogController = dialog(modal, {
  modal: true,
  restoreFocus: true
});

// Set up focus trap
const trap = focusTrap(modal);

// Proper ARIA attributes (you must add these)
modal.setAttribute('aria-labelledby', 'modal-title');
modal.setAttribute('aria-describedby', 'modal-description');
trigger.setAttribute('aria-haspopup', 'dialog');

// Open modal
function openModal() {
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  trigger.setAttribute('aria-expanded', 'true');
  trap.activate();
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trap.deactivate();
}

// Keyboard support (you must implement)
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
```

### Tooltips

```javascript
import { tooltip } from '@sc4rfurryx/proteusjs/a11y-primitives';

const trigger = document.getElementById('help-button');
const content = document.getElementById('help-tooltip');

// Set up tooltip with ARIA
const tooltipController = tooltip(trigger, content, {
  delay: 300
});

// You must ensure proper content
content.textContent = 'Meaningful help text here'; // Not just "Help"
```

### Navigation Menus

```javascript
import { menu } from '@sc4rfurryx/proteusjs/a11y-primitives';

const menuContainer = document.getElementById('nav-menu');

// Set up keyboard navigation
const menuController = menu(menuContainer);

// You must add proper ARIA roles
menuContainer.querySelectorAll('a').forEach(link => {
  link.setAttribute('role', 'menuitem');
});

// You must handle menu state
const menuButton = document.getElementById('menu-button');
menuButton.setAttribute('aria-expanded', 'false');
menuButton.setAttribute('aria-haspopup', 'true');
```

## Testing Checklist

### Automated Testing (ProteusJS helps with some)

- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Heading structure is logical
- [ ] ARIA attributes are present

### Manual Testing (You must do)

- [ ] **Keyboard Navigation**: Tab through entire interface
- [ ] **Screen Reader**: Test with NVDA/JAWS/VoiceOver
- [ ] **Color Contrast**: Check all text meets WCAG AA (4.5:1)
- [ ] **Focus Indicators**: Visible focus indicators on all interactive elements
- [ ] **Error Messages**: Clear, helpful error messages
- [ ] **Loading States**: Announce loading/busy states
- [ ] **Dynamic Content**: Announce content changes

### Tools for Manual Testing

1. **Screen Readers**:
   - NVDA (Windows, free)
   - JAWS (Windows, paid)
   - VoiceOver (macOS, built-in)
   - Orca (Linux, free)

2. **Browser Extensions**:
   - axe DevTools
   - WAVE
   - Lighthouse accessibility audit

3. **Color Contrast**:
   - WebAIM Contrast Checker
   - Colour Contrast Analyser

## Common Accessibility Mistakes

### ❌ What NOT to do

```javascript
// Don't rely on color alone
<div style="color: red;">Error: Invalid input</div>

// Don't use generic text
<img alt="image" />
<button>Click here</button>

// Don't skip heading levels
<h1>Title</h1>
<h3>Subtitle</h3> <!-- Skipped h2 -->

// Don't remove focus indicators
button:focus { outline: none; } /* Bad */
```

### ✅ What TO do

```javascript
// Use multiple indicators
<div class="error" aria-live="polite">
  <span class="error-icon" aria-hidden="true">⚠️</span>
  Error: Please enter a valid email address
</div>

// Use descriptive text
<img alt="Chart showing 25% increase in sales from Q1 to Q2" />
<button>Save document</button>

// Use proper heading hierarchy
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// Provide visible focus indicators
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## WCAG 2.1 Guidelines

### Level A (Minimum)

- **1.1.1**: Non-text content has text alternatives
- **1.3.1**: Information and relationships are programmatically determinable
- **2.1.1**: All functionality is keyboard accessible
- **2.4.1**: Blocks of content can be bypassed

### Level AA (Standard)

- **1.4.3**: Color contrast ratio is at least 4.5:1
- **1.4.4**: Text can be resized up to 200% without loss of functionality
- **2.4.6**: Headings and labels describe topic or purpose
- **3.2.2**: User interface components behave consistently

### Level AAA (Enhanced)

- **1.4.6**: Color contrast ratio is at least 7:1
- **2.2.3**: No timing is essential
- **2.4.9**: Link purpose is clear from link text alone

## Resources

### Learning

- [WebAIM](https://webaim.org/) - Web accessibility tutorials
- [A11y Project](https://www.a11yproject.com/) - Community-driven accessibility resources
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Technical documentation

### Testing

- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [axe](https://www.deque.com/axe/) - Accessibility testing engine
- [Pa11y](https://pa11y.org/) - Command line accessibility tester

### Guidelines

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - ARIA design patterns
- [Section 508](https://www.section508.gov/) - US federal accessibility requirements

## Remember

**Accessibility is a journey, not a destination.** ProteusJS provides helpful tools, but building truly accessible applications requires:

1. **Understanding your users** and their needs
2. **Testing with real assistive technologies**
3. **Continuous learning** about accessibility best practices
4. **Regular auditing** and user feedback
5. **Inclusive design** from the start, not as an afterthought

No library can replace thoughtful, inclusive design and thorough testing.
