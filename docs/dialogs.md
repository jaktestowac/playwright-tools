# Dialogs

The `dialogs` module provides utilities for handling browser dialogs, modals, and popup windows in Playwright tests.

## Overview

Modern web applications use various types of dialogs and modals for user interaction. This module provides reliable methods for handling browser alerts, confirms, prompts, custom modals, and popup windows.

## Key Features

- **Browser Dialog Handling** - Handle alert, confirm, and prompt dialogs
- **Modal Management** - Interact with custom modal dialogs
- **Popup Window Control** - Manage popup windows and tabs
- **Dialog State Validation** - Check dialog visibility and content
- **Automatic Dialog Handling** - Set up automatic responses

## Basic Usage

```typescript
import { 
  handleAlert,
  handleConfirm,
  handlePrompt,
  waitForModal,
  closeModal 
} from "playwright-tools/dialogs";

// Handle browser dialogs
await handleAlert(page, { action: 'accept' });
await handleConfirm(page, { action: 'accept' });
await handlePrompt(page, { action: 'accept', text: 'User input' });

// Handle custom modals
await waitForModal(page, '.modal-dialog');
await closeModal(page, '.modal-dialog');
```

## Browser Dialog Handling

```typescript
// Set up automatic dialog handling
page.on('dialog', async (dialog) => {
  console.log(`Dialog type: ${dialog.type()}`);
  console.log(`Dialog message: ${dialog.message()}`);
  await dialog.accept();
});

// Handle specific dialog types
await handleAlert(page, {
  expectedMessage: 'Are you sure?',
  action: 'accept'
});

await handlePrompt(page, {
  expectedMessage: 'Enter your name:',
  action: 'accept',
  text: 'John Doe'
});
```

## Modal Dialog Management

```typescript
// Wait for modal to appear and interact
await waitForModal(page, '.confirmation-modal', {
  timeout: 5000
});

await page.locator('.modal .confirm-button').click();

// Close modal by clicking overlay or button
await closeModal(page, '.modal', {
  method: 'overlay' // or 'button', 'escape'
});
```

## Popup Window Handling

```typescript
// Handle popup windows
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.click('#open-popup')
]);

await popup.waitForLoadState();
console.log(`Popup URL: ${popup.url()}`);
await popup.close();
```

## Advanced Dialog Scenarios

```typescript
// Handle multiple dialogs in sequence
const dialogSequence = [
  { type: 'alert', action: 'accept' },
  { type: 'confirm', action: 'accept' },
  { type: 'prompt', action: 'accept', text: 'response' }
];

await handleDialogSequence(page, dialogSequence);

// Validate dialog content before handling
await validateAndHandleDialog(page, {
  expectedType: 'confirm',
  expectedMessage: /delete.*permanently/i,
  action: 'accept'
});
```

## Modal State Validation

```typescript
// Check if modal is open
const isModalOpen = await isModalVisible(page, '.modal');
console.log(`Modal is open: ${isModalOpen}`);

// Get modal content
const modalText = await getModalContent(page, '.modal');
expect(modalText).toContain('Important information');
```

## Best Practices

- Set up dialog event listeners early in your tests
- Validate dialog messages before accepting/dismissing
- Use specific selectors for custom modals
- Test both accepting and dismissing dialogs
- Handle unexpected dialogs gracefully
- Test modal accessibility (keyboard navigation, focus management)

## Related Modules

- [Element Interactions](./interactions.md) - For modal button interactions
- [Waiting](./waiting.md) - For waiting for dialogs to appear
- [Accessibility](./accessibility.md) - For modal accessibility testing