# Parkhang (པར་ཁང་) - Tibetan Text Layout Generator

## Project Overview

**Parkhang** is a specialized web application for generating beautifully formatted Tibetan Buddhist texts in various traditional and modern layouts. The name "པར་ཁང་" (par khang) means "printing house" in Tibetan.

### Purpose
This application allows users to:
- Import Tibetan Buddhist prayers, practices, and texts
- Generate them in traditional pecha format (Tibetan book format)
- Create modern page layouts (A4, A5, screen)
- Produce bilingual split-page layouts with Tibetan and translations
- Print professionally formatted texts for practice and study

### Target Audience
- Buddhist practitioners who want to create practice booklets
- Dharma centers needing formatted prayer books
- Translators working with Tibetan texts
- Anyone needing to layout Tibetan texts with translations

## Technical Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES5/ES6), jQuery 3.2.0
- **UI Framework**: Semantic UI
- **Styling**: CSS3 with custom layouts
- **File Processing**: 
  - XLSX parsing (xlsx.full.min.js)
  - CSV parsing (papaparse.min.js)
  - JSON import
- **Utilities**: 
  - Underscore.js for functional programming
  - Sugar.js for extended JavaScript functionality
  - Moment.js for date handling
  - Howler.js for audio (potential future use)
  - Clipboard.js for copy functionality
- **Fonts**: Custom Tibetan Unicode font (TibetanChogyalUnicode)

### Application Type
- Single-page application (SPA)
- Client-side only (no backend)
- Uses localStorage for persistence
- Fully offline-capable

## Core Features

### 1. Layout Types

#### Pecha Layouts (Traditional Tibetan Book Format)
- **Pecha A3**: Large format traditional layout
- **Pecha A4**: Standard format traditional layout  
- **Pecha Screen**: Digital viewing format
- Vertical text orientation
- Traditional margin decorations
- Tibetan page numbering

#### Page Layouts (Modern Western Format)
- **Page A4**: Standard modern page
- **Page A5**: Smaller modern page
- **Page Screen**: Digital viewing
- Horizontal text orientation
- Simplified layout

#### Classic Page Layout
- Line-by-line format
- Tibetan text with phonetics and translation
- Simple, clean presentation

#### Split Pages Layout
- Dual-page spread
- Tibetan on left page, translation on right page
- Synchronized pagination
- Optional table of contents with page numbers
- Phonetics support

### 2. File Import System

Supports three file formats:

#### JSON Format
- Direct import of pre-structured pecha data
- Full control over all formatting options

#### XLSX (Excel) Format
- Structured spreadsheet import
- Columns: Tibetan, Phonetics, English, French, Options
- Title page metadata support
- Special formatting flags in options column

#### CSV Format
- Similar structure to XLSX
- Lightweight alternative

### 3. Text Structure

Each text consists of:
- **Title**: Full and short versions in Tibetan
- **Translations**: English and French title/subtitle
- **Groups**: Individual text segments with:
  - Tibetan text
  - Phonetics (transliteration)
  - English translation
  - French translation
  - Formatting flags (smallWritings, centered, newPage, etc.)

### 4. Advanced Features

#### Dynamic Layout Engine
- Intelligent text wrapping
- Automatic page breaks
- Word-by-word fitting algorithm
- Letter-spacing adjustment for justified text
- Overflow detection and handling

#### Color Modes
- Default dark mode (dark teal background)
- Light mode
- Lapis Lazuli mode (gold text on blue background - traditional Tibetan style)

#### Navigation
- Keyboard shortcuts (arrow keys, page up/down, home/end)
- Smooth scrolling between sections
- Auto-scroll to current position

#### Print Preparation
- Special print layout for pecha format
- Automatic page rotation for traditional binding
- 4-page-per-sheet layout

#### Interactive Features
- Zoom on click for syllables
- Fading UI buttons
- Hover effects
- Copy to clipboard support

#### Persistence
- LocalStorage for saved texts
- Remember last used settings
- Quick reload of previous text

## File Structure

```
parkhang/
├── index.html                          # Main entry point
├── TODO.md                             # Development notes and ideas
├── CLAUDE.md                           # This file
│
├── javascripts/
│   ├── globals.js                      # Global variables and utilities
│   ├── input-form.js                   # UI for text/layout selection
│   ├── import-file.js                  # File import handlers (JSON/XLSX)
│   ├── generate.js                     # Main generation orchestrator
│   ├── generate-pecha.js               # Pecha layout generator (complex)
│   ├── generate-classic-pages.js       # Classic layout generator
│   ├── generate-split-pages.js         # Split-page layout generator
│   ├── navigation.js                   # Keyboard navigation
│   ├── color-mode.js                   # Color theme switching
│   ├── printing.js                     # Print preparation
│   ├── fading-buttons.js               # UI button animations
│   └── zoom-on-click.js                # Interactive zoom feature
│
├── stylesheets/
│   ├── application.css                 # Base styles
│   ├── input-form.css                  # Form styling
│   ├── scrollbar.css                   # Custom scrollbar
│   ├── effects.css                     # Animations and transitions
│   ├── print.css                       # Print-specific styles
│   ├── color-modes/                    # Theme stylesheets
│   └── layouts/                        # Layout-specific styles
│       ├── pecha/                      # Pecha layouts (A3, A4, screen)
│       ├── page/                       # Page layouts
│       ├── classic-page/               # Classic layout
│       └── split-pages/                # Split-page layouts
│
├── pechas/                             # Text data files (gitignored)
│   ├── *.csv                           # CSV text files
│   ├── *.xlsx                          # Excel text files
│   └── extra-texts-starter-pack.js     # Pre-loaded extra texts
│
├── vendor/                             # Third-party libraries
│   ├── javascripts/                    # JS libraries
│   ├── stylesheets/                    # Semantic UI CSS
│   └── fonts/                          # Tibetan and Latin fonts
│
├── images/                             # UI images and icons
│   └── layouts/                        # Layout preview images
│
└── docs/                               # Documentation and examples
    └── Pechas pictures for inspiration/
```

## Key Algorithms

### 1. Pecha Generation Algorithm (`generate-pecha.js`)

The most complex part of the application. It:

1. **Initializes** page structure with margins and decorations
2. **Adds groups** one at a time to the current line
3. **Measures width** after each addition
4. **Splits words** if a group doesn't fit on the line
5. **Creates new lines/pages** when current is full
6. **Adds translations** after all Tibetan text is placed
7. **Adjusts letter-spacing** to justify lines
8. **Validates** that translations fit in their cells

Key challenges:
- Tibetan text flows right-to-left within lines
- Must handle word breaking at syllable boundaries (་)
- Translations must align with Tibetan text
- Different page types have different line counts

### 2. Split Pages Algorithm (`generate-split-pages.js`)

Creates synchronized dual-page layouts:

1. **Adds title page** with both languages
2. **Optionally adds index** with page numbers
3. **Generates pairs** of Tibetan and translation pages
4. **Handles overflow** by splitting groups across pages
5. **Keeps pages even** - removes excess from one side
6. **Updates index** with final page numbers

### 3. Text Fitting Algorithm

Used throughout for responsive layout:

```javascript
// Pseudo-code
while (hasMoreWords) {
  addWord()
  if (overflows) {
    removeLastWord()
    if (canSplitMore) {
      continueOnNewLine(remainingWords)
    } else {
      tightenSpacing()
    }
  }
}
```

## Data Format

### Pecha Object Structure

```javascript
{
  id: "practice-name",              // Unique identifier
  shortName: "Display Name",        // For UI
  title: {
    tibetan: {
      full: "རྒྱལ་བ་རིན་པོ་ཆེ།",    // Full Tibetan title
      short: "རྒྱལ་བ།"              // Short version
    },
    english: {
      title: "The Precious Victor",
      subtitle: "A Daily Practice"
    },
    french: {
      title: "Le Précieux Vainqueur",
      subtitle: "Une pratique quotidienne"
    }
  },
  groups: [                         // Array of text segments
    {
      tibetan: "ན་མོ་གུ་རུ་བྷྱཿ",
      phonetics: "NAMO GURU BHYA",
      english: "Homage to the Guru",
      french: "Hommage au Guru",
      
      // Optional formatting flags:
      smallWritings: true,          // Smaller font size
      centered: true,               // Center alignment
      newPage: true,                // Force new page
      preferNewPage: true,          // New page if past golden ratio
      emptyLineAfter: true,         // Add space after
      mergeNext: true,              // Merge with next group
      linkInIndex: true,            // Include in table of contents
      indexLevel1: true,            // Top-level index entry
      practiceTitle: true,          // Style as practice title
      header: true                  // Style as header
    }
    // ... more groups
  ]
}
```

### XLSX Import Format

| Tibetan | Phonetics | English | French | Options |
|---------|-----------|---------|--------|---------|
| Short name | | | | |
| Tibetan title | | | | |
| Short title | | | | |
| | | Title | Titre | |
| | | Subtitle | Sous-titre | |
| | | | | |
| ན་མོ་གུ་རུ་བྷྱཿ | NAMO GURU BHYA | Homage to the Guru | Hommage au Guru | smallWritings centered |

Options column accepts space-separated flags.

## LocalStorage Schema

```javascript
// Keys used:
'parkhang.texts'                    // Object: {id: name, ...}
'parkhang.texts.{id}'              // String: JSON of pecha object
'parkhang.extra-texts'             // Array: [{id, name}, ...]
'parkhang.extra-texts.{id}'        // String: JSON of extra text
'parkhang.textId'                  // String: last selected text ID
'parkhang.layout'                  // String: last selected layout
'parkhang.language'                // String: 'english' or 'french'
'parkhang.selected-extra-texts'    // String: JSON array of IDs
```

## Known Issues & TODs

From `TODO.md`:

### Bugs
- Small writings spanning more than 2 pages not handled properly
- Need to test `break-word` CSS property

### Missing Features
- Proper sizing for all pecha formats
- Font sizes matching Padmakara booklets for A4/A5
- Styling for split page headers
- Index with working links
- Phonetics option for pechas
- Unbreakable groups (e.g., Om Ah Hung mantras)
- Bar removal at page start with yigo

### Design Questions
- Best way to handle spaces between groups?
- Should there always be two bars between groups?
- Why sometimes only one bar at end and none at beginning?

### Ideas
- Custom modal messages before practice
- Markers and comments on groups/syllables
- Automatic "&" instead of "and" when space is tight
- Better handling of small writings placement

## Development Context

### History
- Created during offline retreat
- Untouched for 2 years
- Then another 2 years gap
- Now being revived (4+ years since creation)

### Development Environment
- No build system
- No package manager
- Pure HTML/CSS/JS
- All dependencies vendored
- Designed to run offline

### Testing Approach
- Manual testing only
- Load in browser and test layouts
- Print tests for pecha format
- Visual inspection of generated PDFs

## Getting Started

### Running the Application

1. Open `index.html` in a modern web browser
2. Select a layout type
3. Choose a language (English or French)
4. Either:
   - Select a previously imported text, OR
   - Upload a new XLSX/JSON file
5. Click "Render!"
6. Use keyboard navigation or scroll
7. Click print button when ready

### Creating a New Text

1. Create an XLSX file with columns: Tibetan, Phonetics, English, French, Options
2. First row: short name in second column
3. Optional title page rows (2-5)
4. Then one row per text group
5. Use options column for formatting flags
6. Import via the file input

### Keyboard Shortcuts

- **Arrow Up/Down**: Navigate by line/page
- **Arrow Left/Right**: Navigate by 2 pages
- **Page Up/Down**: Jump to start/end
- **Home/End**: Jump to start/end

## Code Patterns & Conventions

### Naming
- camelCase for variables and functions
- PascalCase for object constructors (ClassicPage, SplitPages)
- Descriptive names (e.g., `addNextPechaPage`, `continueOnNewLineStartingWith`)

### jQuery Usage
- Heavy use of jQuery for DOM manipulation
- Event delegation with `$(document).on()`
- Chaining for concise operations

### Functional Programming
- Underscore.js for iteration and collection operations
- `_.chain()` for complex transformations
- `_.each()`, `_.map()`, `_.filter()` throughout

### Async Patterns
- `setTimeout()` for animation timing and layout recalculation
- Delay variable controls animation speed (set to 1ms for production)
- Recursive functions with setTimeout for iterative layout

### CSS Organization
- Separate files for each layout type
- Media queries for print vs screen
- CSS variables would be beneficial (not currently used)

## Potential Improvements

### Technical Debt
1. **Modernization**
   - Convert to ES6+ modules
   - Add a build system (Vite, Webpack)
   - Use modern CSS (Grid, Flexbox, CSS variables)
   - Replace jQuery with vanilla JS or modern framework

2. **Code Quality**
   - Add TypeScript for type safety
   - Implement unit tests
   - Add linting (ESLint)
   - Refactor large functions (especially in generate-pecha.js)

3. **Architecture**
   - Separate concerns better (MVC or similar)
   - Create reusable components
   - Better state management
   - Event bus for component communication

### Features
1. **Export Options**
   - PDF generation (client-side)
   - EPUB for e-readers
   - Image export (PNG/JPG)

2. **Editor**
   - In-app text editor
   - Live preview while editing
   - Validation and error checking
   - Undo/redo

3. **Customization**
   - Custom fonts
   - Adjustable margins and spacing
   - Color scheme editor
   - Template system

4. **Collaboration**
   - Cloud storage integration
   - Sharing texts between users
   - Version control for texts
   - Comments and annotations

### Performance
- Lazy loading for large texts
- Virtual scrolling
- Web Workers for layout calculation
- Optimize DOM manipulation (batch updates)

### Accessibility
- Screen reader support
- Keyboard navigation improvements
- High contrast modes
- Font size controls

## Dependencies

### JavaScript Libraries
- **jQuery 3.2.0**: DOM manipulation and utilities
- **Semantic UI**: UI components and styling
- **Underscore.js**: Functional programming utilities
- **Sugar.js**: Extended JavaScript functionality
- **XLSX.js**: Excel file parsing
- **PapaParse**: CSV parsing
- **Moment.js**: Date handling
- **Howler.js**: Audio library (not actively used)
- **Clipboard.js**: Copy to clipboard
- **jQuery.scrollTo**: Smooth scrolling

### Fonts
- **TibetanChogyalUnicode**: Custom Tibetan Unicode font
- **Lato**: Latin text font

## Browser Compatibility

### Tested Browsers
- Modern Chrome/Chromium
- Firefox
- Safari

### Requirements
- ES6 support (arrow functions, template literals)
- CSS3 (flexbox, transforms, transitions)
- LocalStorage API
- FileReader API
- Print media queries

### Known Issues
- Print layout may vary between browsers
- Font rendering differences
- PDF export quality depends on browser

## Tibetan Typography Notes

### Character Handling
- Syllable separator: ་ (tsheg)
- Text flows left-to-right (modern style)
- Traditional pecha flows top-to-bottom, right-to-left
- Special characters: ༄༅། (decorative markers)

### Font Considerations
- Unicode Tibetan block (U+0F00 to U+0FFF)
- Requires proper font with all glyphs
- Stacking characters need proper rendering
- Line height must accommodate stacked glyphs

### Numbering
- Tibetan numerals: ༠༡༢༣༤༥༦༧༨༩
- Conversion function in globals.js

## Related Projects & Resources

### Tibetan Text Processing
- BDRC (Buddhist Digital Resource Center)
- Lotsawa House
- 84000 Translating the Words of the Buddha

### Tibetan Fonts
- Tibetan Machine Uni
- Jomolhari
- Noto Sans Tibetan

### Buddhist Text Collections
- Kangyur and Tengyur
- Rinchen Terdzö
- Padmakara Translation Group publications

## License & Attribution

No explicit license file present. Consider adding one before public release.

Appears to be personal/organizational use for Padmakara Translation Group materials.

## Contact & Contribution

No contribution guidelines or contact information present. Consider adding:
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- Issue templates
- Pull request templates

---

**Last Updated**: Created during project revival after 4+ year hiatus
**Status**: Functional but needs modernization
**Maintenance**: Currently being revived and improved
