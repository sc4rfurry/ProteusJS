Accessibility Features
======================

ProteusJS is built with accessibility as a core principle, not an afterthought. Every feature is designed to meet or exceed WCAG 2.1 guidelines while providing an excellent user experience for all users.

Overview
--------

ProteusJS provides comprehensive accessibility features that work automatically:

- **WCAG 2.1 Compliance**: Automatic AA and AAA level compliance
- **Screen Reader Support**: Enhanced announcements and navigation
- **Keyboard Navigation**: Full keyboard accessibility
- **Cognitive Accessibility**: Features for users with cognitive disabilities
- **Motion Preferences**: Respects user motion preferences
- **Color Compliance**: Automatic contrast checking and adjustment

Core Accessibility Features
---------------------------

Automatic WCAG Compliance
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { ProteusJS } from '@sc4rfurryx/proteusjs';

   const proteus = new ProteusJS();

   // Basic accessibility enhancement
   proteus.enableAccessibility(document.body, {
     wcagLevel: 'AA',           // 'A', 'AA', or 'AAA'
     screenReader: true,        // Screen reader support
     keyboardNavigation: true   // Keyboard navigation
   });

This single call enables:

- Automatic ARIA labeling
- Focus management
- Color contrast checking
- Keyboard navigation enhancement
- Screen reader announcements

Advanced Configuration
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility(document.main, {
     wcagLevel: 'AAA',
     screenReader: true,
     keyboardNavigation: true,
     motionPreferences: true,
     colorCompliance: true,
     cognitiveAccessibility: true,
     announcements: true,
     focusManagement: true,
     skipLinks: true,
     landmarks: true,
     autoLabeling: true,
     enhanceErrorMessages: true,
     showReadingTime: true,
     simplifyContent: true,
     readingLevel: 'middle'     // 'elementary', 'middle', 'high', 'college'
   });

Screen Reader Support
---------------------

ProteusJS provides comprehensive screen reader support with intelligent announcements:

Live Regions
~~~~~~~~~~~~

.. code-block:: typescript

   // Automatic live region creation
   proteus.enableAccessibility('.dynamic-content', {
     announcements: true,
     screenReader: true
   });

   // Manual announcements
   proteus.accessibility.announce('Content updated', {
     priority: 'polite',    // 'polite' or 'assertive'
     interrupt: false       // Whether to interrupt current announcements
   });

Smart Labeling
~~~~~~~~~~~~~~

ProteusJS automatically generates appropriate ARIA labels:

.. code-block:: html

   <!-- Before ProteusJS -->
   <button class="close-btn">×</button>
   <input type="search" placeholder="Search...">
   <div class="progress-bar" style="width: 75%"></div>

   <!-- After ProteusJS processing -->
   <button class="close-btn" aria-label="Close dialog">×</button>
   <input type="search" placeholder="Search..." aria-label="Search products">
   <div class="progress-bar" style="width: 75%" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" aria-label="Loading progress: 75%"></div>

Keyboard Navigation
-------------------

Enhanced keyboard navigation with intelligent focus management:

Focus Management
~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility('.modal', {
     focusManagement: true,
     keyboardNavigation: true
   });

This provides:

- **Focus trapping**: Focus stays within modals and dialogs
- **Focus restoration**: Returns focus to trigger element when closing
- **Skip links**: Automatic skip navigation links
- **Logical tab order**: Ensures proper tab sequence

Custom Focus Handling
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Manual focus management
   proteus.accessibility.trapFocus('.modal-content');
   proteus.accessibility.restoreFocus();

   // Skip link creation
   proteus.accessibility.createSkipLink('Skip to main content', '#main-content');

Color and Contrast
------------------

Automatic color contrast checking and enhancement:

Contrast Checking
~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility(document.body, {
     colorCompliance: true,
     wcagLevel: 'AAA'  // Requires 7:1 contrast ratio
   });

   // Manual contrast checking
   const contrastRatio = proteus.accessibility.checkContrast('#ffffff', '#000000');
   console.log('Contrast ratio:', contrastRatio); // 21:1

   // Get compliance level
   const compliance = proteus.accessibility.getComplianceLevel(contrastRatio);
   console.log('WCAG compliance:', compliance); // 'AAA'

Automatic Adjustments
~~~~~~~~~~~~~~~~~~~~~

ProteusJS can automatically adjust colors to meet WCAG requirements:

.. code-block:: typescript

   proteus.enableAccessibility('.content', {
     colorCompliance: true,
     autoAdjustColors: true,  // Automatically adjust non-compliant colors
     wcagLevel: 'AA'
   });

Motion and Animation
--------------------

Respects user motion preferences and provides alternatives:

Motion Preferences
~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility(document.body, {
     motionPreferences: true  // Respects prefers-reduced-motion
   });

This automatically:

- Disables animations for users who prefer reduced motion
- Provides alternative feedback methods
- Reduces parallax and auto-playing content

Custom Motion Handling
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Check user motion preference
   const prefersReducedMotion = proteus.accessibility.prefersReducedMotion();

   if (prefersReducedMotion) {
     // Provide alternative feedback
     proteus.accessibility.announce('Action completed');
   } else {
     // Show animation
     element.classList.add('animate');
   }

Cognitive Accessibility
-----------------------

Features designed to help users with cognitive disabilities:

Content Simplification
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility('.article', {
     cognitiveAccessibility: true,
     simplifyContent: true,
     showReadingTime: true,
     readingLevel: 'middle'
   });

This provides:

- **Reading time estimation**: Shows estimated reading time
- **Content simplification**: Simplifies complex language
- **Reading level adjustment**: Adjusts content to target reading level
- **Enhanced error messages**: Clearer, more helpful error messages

Reading Time and Level
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Manual reading time calculation
   const readingTime = proteus.accessibility.calculateReadingTime('.article');
   console.log(`Estimated reading time: ${readingTime} minutes`);

   // Reading level analysis
   const readingLevel = proteus.accessibility.analyzeReadingLevel('.article');
   console.log(`Reading level: ${readingLevel.grade} grade`);

Error Handling and Messages
---------------------------

Enhanced error messages and form validation:

Form Enhancement
~~~~~~~~~~~~~~~~

.. code-block:: typescript

   proteus.enableAccessibility('form', {
     enhanceErrorMessages: true,
     autoLabeling: true,
     focusManagement: true
   });

This automatically:

- Adds descriptive error messages
- Associates labels with form controls
- Manages focus on validation errors
- Provides clear success feedback

Custom Error Messages
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Enhanced error message
   proteus.accessibility.enhanceErrorMessage('.error-field', {
     message: 'Please enter a valid email address',
     suggestions: ['Check for typos', 'Include @ symbol', 'Add domain extension'],
     severity: 'error'
   });

Accessibility Auditing
----------------------

Built-in accessibility auditing and reporting:

Automatic Auditing
~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Enable automatic auditing
   proteus.enableAccessibility(document.body, {
     wcagLevel: 'AA',
     auditOnChange: true  // Audit when content changes
   });

   // Manual audit
   const auditResults = proteus.accessibility.audit();
   console.log('Accessibility violations:', auditResults.violations);
   console.log('Compliance score:', auditResults.score);

Compliance Reporting
~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Generate comprehensive compliance report
   const report = proteus.accessibility.generateComplianceReport();

   console.log('WCAG 2.1 Compliance Report:');
   console.log('- Level A:', report.levelA.passed, 'passed,', report.levelA.failed, 'failed');
   console.log('- Level AA:', report.levelAA.passed, 'passed,', report.levelAA.failed, 'failed');
   console.log('- Level AAA:', report.levelAAA.passed, 'passed,', report.levelAAA.failed, 'failed');

Real-World Examples
-------------------

E-commerce Product Page
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Comprehensive accessibility for product page
   proteus.enableAccessibility('.product-page', {
     wcagLevel: 'AA',
     screenReader: true,
     keyboardNavigation: true,
     colorCompliance: true,
     announcements: true
   });

   // Enhanced product image gallery
   proteus.accessibility.enhanceImageGallery('.product-gallery', {
     altTextGeneration: true,
     keyboardNavigation: true,
     announceChanges: true
   });

   // Accessible form validation
   proteus.accessibility.enhanceForm('.checkout-form', {
     realTimeValidation: true,
     enhancedErrorMessages: true,
     progressIndicator: true
   });

Blog Article
~~~~~~~~~~~~

.. code-block:: typescript

   // Cognitive accessibility for blog content
   proteus.enableAccessibility('.blog-article', {
     wcagLevel: 'AAA',
     cognitiveAccessibility: true,
     showReadingTime: true,
     readingLevel: 'high',
     simplifyContent: false  // Keep original complexity for blog
   });

   // Table of contents generation
   proteus.accessibility.generateTableOfContents('.article-content', {
     skipLinkTarget: true,
     keyboardNavigation: true
   });

Dashboard Interface
~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Complex dashboard accessibility
   proteus.enableAccessibility('.dashboard', {
     wcagLevel: 'AA',
     screenReader: true,
     keyboardNavigation: true,
     focusManagement: true,
     landmarks: true,
     skipLinks: true
   });

   // Data table enhancement
   proteus.accessibility.enhanceDataTable('.data-table', {
     sortingAnnouncements: true,
     filteringAnnouncements: true,
     paginationSupport: true,
     keyboardNavigation: true
   });

Testing and Validation
----------------------

ProteusJS includes comprehensive accessibility testing tools:

Automated Testing
~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Run accessibility tests
   const testResults = await proteus.accessibility.runTests({
     wcagLevel: 'AA',
     includeWarnings: true,
     generateReport: true
   });

   // Integration with testing frameworks
   describe('Accessibility', () => {
     it('should meet WCAG AA standards', async () => {
       const results = await proteus.accessibility.runTests();
       expect(results.violations).toHaveLength(0);
     });
   });

Manual Testing Support
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Enable testing mode
   proteus.accessibility.enableTestingMode({
     highlightFocusable: true,
     showAriaLabels: true,
     announceChanges: true,
     keyboardOnlyMode: true
   });

Performance Impact
------------------

ProteusJS accessibility features are designed for minimal performance impact:

- **Lazy loading**: Features are loaded only when needed
- **Efficient DOM scanning**: Optimized element detection
- **Debounced updates**: Prevents excessive recalculation
- **Memory management**: Automatic cleanup of event listeners

Best Practices
--------------

1. **Enable early**: Add accessibility features during development, not as an afterthought
2. **Test with real users**: Include users with disabilities in your testing process
3. **Use semantic HTML**: ProteusJS enhances but doesn't replace good HTML structure
4. **Regular auditing**: Run accessibility audits regularly during development
5. **Progressive enhancement**: Ensure basic functionality works without JavaScript

API Reference
-------------

For complete accessibility API documentation, see :doc:`../api/accessibility-api`.

Resources
---------

- `WCAG 2.1 Guidelines <https://www.w3.org/WAI/WCAG21/quickref/>`_
- `WebAIM Screen Reader Testing <https://webaim.org/articles/screenreader_testing/>`_
- `Accessibility Testing Tools <https://www.w3.org/WAI/test-evaluate/tools/>`_

Next Steps
----------

- :doc:`../examples/accessible-forms` - Learn about accessible form design
- :doc:`../guides/accessibility-testing` - Set up accessibility testing
- :doc:`performance` - Understand performance implications
