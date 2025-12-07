# Changes Summary

## What We Changed (1715 lines modified)

### Messaging Page (`src/components/MessagingPage.tsx`)

1. **Welcome page logic** - Only shows if you have no direct messages or group messages (course messages don't count)

2. **Auto-open conversation** - Automatically opens your most recent DM or group chat when you open messaging

3. **Loading spinner** - Shows a spinner while conversations are loading instead of showing the welcome page

4. **Bottom bar overlay** - Message input area has a white blurred overlay that sits on top of messages (like the header)

5. **Drag and drop** - Added drag-and-drop for files/images into message input, with visual feedback (light red color)

6. **File selection** - Can now select multiple files one by one (they append instead of replacing)

7. **File upload improvements** - Files upload with optimistic UI updates (appear immediately), proper ordering, and signed URLs

8. **Link detection and splitting** - If a message starts with a URL, it sends the URL as a separate message, then any remaining text as another message

9. **Link rendering** - Links display as iMessage-style cards with globe icon, domain name, and "Link" text

10. **YouTube embedding** - YouTube links are detected and displayed as playable iframes in the chat

11. **Block menu** - Replaced block button with 3-dot menu that shows block/unblock options

12. **Message bubble spacing** - Fixed extra space at the bottom of bubbles that don't have edit/undo buttons

13. **Message bubble padding** - Adjusted padding so text is better centered vertically in bubbles

14. **Buttons conditional rendering** - Edit/undo buttons container only renders when buttons are actually needed

15. **Messages scrolling** - Messages scroll behind both the header and bottom bar with proper spacing

16. **Conversation sorting** - Added timestamp field to conversations for proper sorting by most recent message

17. **Loading state management** - Added proper loading state that gets set to false in all error cases

18. **Paperclip button** - Added ref and blur logic so Enter key doesn't re-open file picker after selecting files

19. **Auto-focus message input** - After selecting files, message input automatically gets focus so Enter key sends

20. **Code optimization** - Fixed useEffect dependency array to prevent unnecessary re-runs

21. **Helper functions** - Added utility functions for file name formatting, file type detection, URL detection, domain extraction, and text wrapping

22. **Link rendering logic** - Links render as clickable cards when they're the only content, or as underlined text when embedded in other text

23. **YouTube detection** - YouTube links are detected and converted to embed URLs for iframe playback

24. **File display improvements** - Files show with proper formatting (multi-line names, file type, file size) in iMessage-style layout

25. **Optimistic updates** - Messages with files and links appear immediately without waiting for server response

### Navigation Sidebar (`src/components/NavigationSidebar.tsx`)

26. **Menu order** - Swapped Messaging and Calendar so Messaging appears above Calendar in the sidebar
