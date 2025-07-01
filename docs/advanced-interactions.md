# Advanced Interactions

The `advanced-interactions` module provides utilities for complex user interactions like file uploads, drag & drop, and keyboard shortcuts.

## Overview

Beyond basic clicks and form filling, modern web applications require complex interactions. This module provides reliable methods for handling file uploads, drag and drop operations, keyboard shortcuts, and other advanced user interactions.

## Key Features

- **File Upload Handling** - Upload single and multiple files
- **Drag & Drop Operations** - Drag elements between containers
- **Keyboard Shortcuts** - Execute complex key combinations
- **Mouse Interactions** - Advanced mouse operations
- **Touch Gestures** - Mobile touch interactions

## Basic Usage

```typescript
import { 
  uploadFile,
  dragAndDrop,
  executeKeyboardShortcut,
  doubleClick,
  rightClick 
} from "playwright-tools/advanced-interactions";

// Upload files
await uploadFile(page.locator('#file-input'), 'path/to/file.pdf');

// Drag and drop
await dragAndDrop(
  page.locator('.draggable-item'),
  page.locator('.drop-zone')
);

// Execute keyboard shortcuts
await executeKeyboardShortcut(page, 'Control+S'); // Save
await executeKeyboardShortcut(page, 'Control+Shift+I'); // DevTools
```

## File Upload Operations

```typescript
// Single file upload
await uploadFile(page.locator('#file-input'), './documents/report.pdf');

// Multiple file upload
await uploadMultipleFiles(page.locator('#multi-file-input'), [
  './images/photo1.jpg',
  './images/photo2.jpg',
  './documents/document.pdf'
]);

// Upload with validation
await uploadFile(page.locator('#avatar-upload'), './avatar.png', {
  validateFileType: true,
  expectedTypes: ['image/png', 'image/jpeg']
});
```

## Drag & Drop

```typescript
// Basic drag and drop
await dragAndDrop(
  page.locator('.source-element'),
  page.locator('.target-container')
);

// Drag with custom options
await dragAndDrop(
  page.locator('.draggable'),
  page.locator('.dropzone'),
  {
    sourcePosition: { x: 10, y: 10 },
    targetPosition: { x: 50, y: 50 },
    steps: 5
  }
);
```

## Keyboard Shortcuts

```typescript
// Common shortcuts
await executeKeyboardShortcut(page, 'Control+C'); // Copy
await executeKeyboardShortcut(page, 'Control+V'); // Paste
await executeKeyboardShortcut(page, 'Control+Z'); // Undo

// Complex key combinations
await executeKeyboardShortcut(page, 'Control+Shift+Alt+T');

// Platform-specific shortcuts
await executeKeyboardShortcut(page, 'Meta+Space', { platform: 'mac' });
```

## Mouse Interactions

```typescript
// Double click
await doubleClick(page.locator('.editable-cell'));

// Right click for context menu
await rightClick(page.locator('.context-menu-trigger'));

// Click and hold
await clickAndHold(page.locator('.draggable'), { duration: 2000 });
```

## Best Practices

- Test file uploads with various file types and sizes
- Validate drag and drop operations complete successfully
- Use platform-specific keyboard shortcuts when necessary
- Test advanced interactions across different browsers
- Handle timing-sensitive operations with appropriate waits

## Related Modules

- [Element Interactions](./interactions.md) - For basic interactions
- [Waiting](./waiting.md) - For timing-sensitive operations
- [Accessibility](./accessibility.md) - For keyboard accessibility testing