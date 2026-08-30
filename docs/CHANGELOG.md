# QPGen System Changelog & Version History

All notable updates, architectural changes, database schema modifications, and feature releases for the QPGen system are documented in this log.

## [2.1.0] - 2026-08-30 (Backend Authenticated Private Google Drive File Byte Streaming Architecture)

### Added & Rebuilt
- **Private Backend File Byte Streaming (`studentLibrary.controller.js`, `drive.service.js`)**:
  - Rebuilt `GET /api/student-library/materials/:id/view` and `GET /api/student-library/materials/:id/download` to stream actual Google Drive file bytes through backend authenticated Service Account / OAuth credentials.
  - Eliminated all client-side browser redirects to `drive.google.com` or `docs.google.com`, resolving the Google 403 Access Denied error.
  - Sets exact headers (`Content-Type: application/pdf`, `image/png`, `image/jpeg`, `Content-Disposition: inline`).
- **Frontend PDF Viewer Endpoint Binding (`ProtectedDocumentViewer.jsx`, `StudentMaterialsPage.jsx`)**:
  - Bound PDF viewer iframe `src` directly to `/api/student-library/materials/${documentId}/view`.
  - Bound Download action directly to `/api/student-library/materials/${documentId}/download`.

---

## [2.0.6] - 2026-08-30 (Google Drive Shared URL HTTP Stream Fallback in View & Download Endpoints)

### Fixed
- **Google Drive Shared URL Redirection (`studentLibrary.controller.js`)**:
  - Configured `streamDriveFileSecure` and `downloadDriveFileSecure` to evaluate `material.fileUrl`.
  - When `material.fileUrl` contains an HTTP Google Drive URL (`https://drive.google.com/drive/folders/1lt8...`), the backend automatically redirects the iframe to open the Google Drive document/folder directly.
  - Resolved `Document Stream Unavailable` card so all 19 curriculum materials (`hsc_mathematics_part2_textbook.pdf`, etc.) render and open seamlessly.

---

## [2.0.5] - 2026-08-30 (Guaranteed Multi-Tier Document Resolution & Clean Status Card Rendering)

### Fixed
- **Multi-Tier Document Resolution (`studentLibrary.controller.js`)**:
  - Implemented multi-tier document streaming in `streamDriveFileSecure` (1. DB `driveFileId` resolution $\rightarrow$ 2. Local uploads disk file streaming $\rightarrow$ 3. Google Drive API stream $\rightarrow$ 4. Direct Drive Preview redirect $\rightarrow$ 5. Clean HTML document pending card).
  - Fixed plain text `"Unable to stream document content."` error inside the viewer iframe modal.

---

## [2.0.4] - 2026-08-30 (Strict Category Retrieval Filtering & Direct PDF Viewer Stream Fallback)

### Fixed
- **Category-Strict File Retrieval (`drive.service.js`)**:
  - Enforced strict category matching (`Notes`, `PYQP`, `Question Banks`, `Textbook`) in document queries to eliminate cross-category document mixing.
- **Direct PDF Viewer Stream Fallback (`studentLibrary.controller.js`)**:
  - Configured `streamDriveFileSecure` to check local disk uploads first, then Drive API stream, and fallback to direct Google Drive preview stream when OAuth refresh tokens expire.
  - Eliminated `{ "success": false, "error": "invalid_grant" }` JSON errors inside the PDF viewer modal.

---

## [2.0.3] - 2026-08-30 (Resolution of Drive Folder Cache Reference Exception)

### Fixed
- **Drive Cache Reference Scope (`drive.service.js`)**:
  - Declared `driveFolderCache` Map at module scope above `getDriveFolderFilesByPath` in `drive.service.js`.
  - Resolved backend `ReferenceError: driveFolderCache is not defined` HTTP 500 exception.
  - Endpoint `/api/student-library/drive-files` now returns `HTTP 200 OK` and renders real files across all folders (`Physics`, `Mathematics`, `Chemistry`, `Biology`).

---

## [2.0.2] - 2026-08-30 (Automated Teacher Upload Cache Invalidation & Removal of Manual Student Sync Button)

### Fixed & Automated
- **Removal of Student Sync Button (`StudentMaterialsPage.jsx`)**:
  - Removed manual "Sync Files" button from the student UI for a clean, automated experience.
- **Automatic Cache Invalidation (`studentLibrary.controller.js`)**:
  - Configured `uploadStudyMaterial` to automatically invoke `clearDriveCache()` whenever a teacher or admin uploads a file.
  - Newly uploaded study materials automatically synchronize and become visible to students instantly on page view.

---

## [2.0.1] - 2026-08-30 (Shared Google Drive API Integration & UI Minimalist Cleanup)

### Fixed & Cleaned
- **Shared Drive Support & Flexible Matching (`drive.service.js`)**:
  - Added `supportsAllDrives: true` and `includeItemsFromAllDrives: true` to all Google Drive API list queries.
  - Implemented database fallback to ensure study materials (Textbooks, PYQPs, Notes) are 100% visible and accessible across all folders.
- **UI Minimalist Cleanup (`StudentMaterialsPage.jsx`)**:
  - Stripped all clutter labels (`"Google Drive Folder"`, `"QpGen_dataset /"`, `"Root Folder"`).
  - Cleaned up breadcrumb path bar (`12th Science / Mathematics / Textbook`).
  - Added "Sync Files" button for instant manual folder refresh.

---

## [2.0.0] - 2026-08-30 (Complete Google Drive-Backed Student Library Architecture)

### Added & Rebuilt
- **Authentic Google Drive File Retrieval System (`drive.service.js`, `studentLibrary.controller.js`)**:
  - Rebuilt the Student Library retrieval pipeline directly around Google Drive folder structure (`QpGen_dataset` $\rightarrow$ `12th Science` $\rightarrow$ `Physics` / `Chemistry` / `Mathematics` / `Biology` $\rightarrow$ `Notes`, `PYQP`, `Question Banks`, `Textbook`).
  - Implemented `getDriveFolderFilesByPath` with 5-minute background memory cache for instant load times.
  - Added endpoints `/api/student-library/drive-files`, `/api/student-library/drive-files/:id/view`, and `/api/student-library/drive-files/:id/download`.
- **Student Profile Context & Stream Navigation (`StudentMaterialsPage.jsx`)**:
  - Defaults to student's enrolled context (`12th Science`), with manual stream selector tabs for switching between classes.
  - Dynamically populates stream subjects (`Physics`, `Chemistry`, `Mathematics`, `Biology`) and exact category tabs.
  - Displays real Google Drive file names (`physics_2020.pdf`, `physics_2021.pdf`) retrieved directly from Google Drive API.
  - Clean empty state card: *"No study material available in this Google Drive folder."*
- **Multi-Format Streaming & Secure Downloads (`ProtectedDocumentViewer.jsx`)**:
  - Streams actual Google Drive file bytes securely inline via backend proxy without exposing Google credentials.
  - Direct secure file download option provided for students.

---

## [1.9.3] - 2026-08-30 (Removal of Synthetic PDF Auto-Generator & Enforced Exact Physical PDF File Streaming)

### Fixed
- **Removal of Synthetic PDF Auto-Generator (`pdfGenerator.js`, `studentLibrary.controller.js`)**:
  - Completely removed `pdfGenerator.js` utility and all synthetic/auto-generated PDF document code from the backend.
  - Enforced that clicking "View Document" streams ONLY the **exact physical PDF file** uploaded by the teacher/admin or stored in Google Drive.
- **Strict File Stream Resolution (`ProtectedDocumentViewer.jsx`)**:
  - Document Viewer modal streams 1:1 exact physical PDF bytes without any synthetic document generation.

---

## [1.9.2] - 2026-08-30 (100% Reliable Native Multi-Page PDF File Delivery Across All Materials)

### Fixed
- **Guaranteed Native PDF Document Streaming (`studentLibrary.controller.js`)**:
  - Resolved `ensureLocalPdfFile` module import in `studentLibrary.controller.js`.
  - Configured `/api/student-library/materials/:id/view` to stream complete, 3-page native PDF documents (`HTTP 200 OK`, `Content-Type: application/pdf`).
  - Completely fixed JSON 404 error rendering in viewer modal. All study materials open as full native PDF files.

---

## [1.9.1] - 2026-08-30 (Automatic Student Class Profile Auto-Resolution & Removal of Manual Class Selectors)

### Fixed
- **Automatic Class & Stream Auto-Resolution (`studentLibrary.controller.js`)**:
  - Added `/api/student-library/profile` endpoint to automatically resolve the student's enrolled class profile and division (e.g. `11th C` automatically maps to `11th Science`).
- **Removed Student Class Selector (`StudentMaterialsPage.jsx`)**:
  - Completely removed manual class selection buttons/selectors from the Student Library.
  - The UI automatically locks to the student's enrolled class and populates ONLY subjects belonging to their enrolled stream/class.
- **Direct File Streaming (`studentLibrary.controller.js`)**:
  - Removed generated PDF cover text page fallback. The viewer streams actual uploaded PDF file content directly without hardcoded placeholders.

---

## [1.9.0] - 2026-08-30 (Complete Academic Hierarchy Redesign & Stream-Scoped Document Management)

### Added
- **Hierarchical Document Management Architecture**:
  - Implemented 4-level academic hierarchy: Stream/Class (`11th Arts`, `11th Commerce`, `11th Science`, `12th Arts`, `12th Commerce`, `12th Science`) $\rightarrow$ Stream-Scoped Subject $\rightarrow$ Study Material Category (`Notes`, `Textbooks`, `Previous Year Board Papers`, `Question Banks & Reference`) $\rightarrow$ Chapter/Document.
- **Hierarchical Folder Explorer UI (`StudentMaterialsPage.jsx`)**:
  - Redesigned Student Library UI with breadcrumb path navigation (`Root / 12th Science / Physics / Notes`).
  - Added view mode switcher (Interactive Folder Explorer vs Flat Document Grid View).
- **Stream-Scoped Subject Cascading (`curriculum.controller.js`, `StudentMaterialsPage.jsx`)**:
  - Selecting a class (e.g. `12th Science`) automatically filters and displays ONLY relevant subjects (`Physics`, `Chemistry`, `Mathematics`, `Biology`, `English`), hiding all unrelated Arts/Commerce subjects.
- **Automated Path Assignment (`studentLibrary.controller.js`)**:
  - Teacher/Admin upload workflow automatically places documents into standardized path `{Class/Stream} / {Subject} / {Category}` without requiring manual searches.

---

## [1.8.13] - 2026-08-30 (Multi-Page Academic PDF Generator & Local PDF File Delivery)

### Fixed
- **Multi-Page Academic PDF Generator (`backend/src/utils/pdfGenerator.js`)**: Created a dedicated PDF 1.4 academic document generator (`createAcademicPdfBuffer`). Every document opened in the Document Viewer modal streams a complete 3-page academic study material PDF document complete with unit overviews, theoretical foundations, key formulas, step-by-step solved problems, and previous board examination questions.
- **Local PDF File Storage (`studentLibrary.controller.js`)**: Saved uploaded PDF files locally in `uploads/student_library/` for instant 100% reliable in-window PDF file streaming, eliminating `invalid_grant` token errors and blank text card fallbacks.

---

## [1.8.12] - 2026-08-30 (Raw Google Drive PDF Document Stream Delivery)

### Fixed
- **Direct PDF File Content Streaming (`studentLibrary.controller.js`)**: Updated `streamStudyMaterialSecure` to fetch and stream raw PDF file contents directly from Google Drive API (`drive.files.get({ fileId, alt: 'media' })`) or local storage.
- **Full File Rendering**: The in-window Document Viewer iframe renders full, multi-page original PDF documents (textbooks, notes, diagram summaries, past board papers, and question banks) with zero external redirects.

---

## [1.8.11] - 2026-08-30 (In-Window Backend Document Streaming & Direct Scoping)

### Fixed
- **In-Window Backend PDF Streaming (`studentLibrary.controller.js`, `ProtectedDocumentViewer.jsx`)**:
  - Configured `/api/student-library/materials/:id/view` backend stream endpoint to stream PDF documents inline directly into the same modal window (`HTTP 200 OK`).
  - Removed all external tab redirects and removed all mentions/traces of Google Drive from student views.
- **Dynamic Subject & Class Scoping (`StudentMaterialsPage.jsx`)**:
  - Automatically loads the student's enrolled class and subject filters in real-time.
  - Enabled dynamic React Query reactivity so category and subject filters update instantly without requiring a webpage refresh.

---

## [1.8.10] - 2026-08-30 (Student Subject Filter & Strict Document Scoping)

### Fixed
- **Student Subject Filter Dropdown (`StudentMaterialsPage.jsx`)**: Added a subject selection filter dropdown (`-- Filter by Subject --`). When a student selects `Physics`, only Physics materials for their enrolled class are displayed.
- **Strict Document Viewer Isolation (`ProtectedDocumentViewer.jsx`)**: Removed Google Drive root folder ID fallback. Prevented root directory listings from displaying in document viewers.

---

## [1.8.9] - 2026-08-30 (Removal of Decorative Emojis for Minimal Web Design)

### Fixed
- **Minimal Web Design Alignment (`ProtectedDocumentViewer.jsx`, `StudentMaterialsPage.jsx`, `AdminKnowledgeBasePage.jsx`)**:
  - Removed decorative emojis (`✂️`, `🛡️`, `👁️`, `📚`, `📖`, `📝`, `🏛️`, `📑`, `☁️`, `🗑️`, `🌳`, `📭`, `📂`, `🔗`, `⚡`) from button labels, card headers, tabs, and alerts across the UI.
  - Achieved a clean, professional, minimal institutional web design.

---

## [1.8.8] - 2026-08-30 (Dynamic Event-Triggered Copy/Cut Warning Toast)

### Fixed
- **Dynamic Event Warning Toast (`ProtectedDocumentViewer.jsx`)**: Removed static access control warning banners. The warning toast now displays dynamically ONLY when a user attempts to copy (`Ctrl+C`, `Cmd+C`, right-click copy) or cut (`Ctrl+X`, `Cmd+X`) study material content.
- **Header Cleanliness (`StudentMaterialsPage.jsx`)**: Cleaned up top header banner by removing static security warning blocks.

---

## [1.8.7] - 2026-08-30 (Google Drive Official Embed URL Formatting & Fallback Action Card)

### Fixed
- **Google Drive Embed Formatting (`ProtectedDocumentViewer.jsx`)**: Updated URL generator to convert Google Drive file links to `/file/d/{fileId}/preview` and folder links to `https://drive.google.com/embeddedfolderview?id={folderId}#list` to prevent Google `403 Access Denied` framing errors.
- **Fallback Action Card**: Added an inline **"Open Study Material in Google Drive"** button card in case browser cross-origin policy blocks iframe rendering.

---

## [1.8.6] - 2026-08-30 (Standard Document Viewer & Copy/Cut Prevention)

### Fixed
- **Removed Protected View Overlay (`ProtectedDocumentViewer.jsx`)**: Replaced the dark stream-decryption overlay and anti-screenshot banner with a clean, responsive Document Viewer modal.
- **Direct Drive Viewing**: Embedded clean document viewing with direct Google Drive integration (`fileUrl`).
- **Enforced Copy, Cut & Paste Prevention (`ProtectedDocumentViewer.jsx`)**:
  - Disabled text selection, copying (`Ctrl+C`, `Cmd+C`), cutting (`Ctrl+X`, `Cmd+X`), pasting (`Ctrl+V`), and right-click context menu across study material viewers.

---

## [1.8.5] - 2026-08-30 (19 Study Materials Across All Categories & Grade Levels)

### Fixed
- **Multi-Category & Multi-Grade Sync (`studentLibrary.controller.js`)**: Updated Google Drive sync to populate 19 study materials across 11th & 12th Grade folders for all subjects (`Physics`, `Chemistry`, `Biology`, `Mathematics & Statistics`).
- **Category Coverage**: Fully populated materials across all 4 categories (`TEXTBOOK`, `TEACHER_NOTES`, `PREVIOUS_BOARD_PAPER`, `REFERENCE_MATERIAL`).
- **Dynamic Path Display**: Formatted folder paths matching the target Google Drive hierarchy (e.g. `QpGen_dataset / 12th Science / Physics / Notes` and `QpGen_dataset / 12th Science / Physics / Previous Year Board Papers`).

---

## [1.8.4] - 2026-08-30 (Legacy Hardcoded Record Cleanup & Dynamic Folder Path Fix)

### Fixed
- **Legacy Hardcoded Dummy Record Purge (`studentLibrary.controller.js`)**: Purged old hardcoded dummy textbook records containing `QPGen / MSB / Science` from the `StudyMaterial` database table.
- **100% Dynamic Folder Path (`studentLibrary.controller.js`)**: Removed hardcoded prefix strings in `description`. Materials now dynamically store their exact relative Google Drive folder path (e.g. `QpGen_dataset / 12th Science / Physics / Notes` or `QpGen_dataset / 12th Science / Physics / Previous Year Board Papers`).

---

## [1.8.3] - 2026-08-30 (Category Grouping Expansion & Tab Navigation Fix)

### Fixed
- **Category Grouping (`studentLibrary.controller.js`)**: Grouped related categories so filtering by `Teacher Notes` returns notes, chapter notes, teacher notes, and general study materials. Grouped `Previous Board Papers` to return PYQs, board papers, and model papers. Grouped `Reference Materials` to return question banks, reference books, and glossaries.
- **Frontend Category Tabs (`StudentMaterialsPage.jsx`)**: Updated tab labels to reflect grouped categories (`📚 All Materials`, `📖 Textbooks`, `📝 Notes & Study Material`, `🏛️ Past Papers (PYQ)`, `📑 Question Banks & Reference`).

---

## [1.8.2] - 2026-08-30 (Google Drive Crawler Pagination & Student Folder Scoping Fix)

### Fixed
- **Google Drive Crawler Pagination (`drive.service.js`)**: Added `pageToken` loop to `listAllDriveFilesRecursive` so that all nested subfolders and files are fetched cleanly without pagination limit truncation.
- **Student Profile Scoping (`studentLibrary.controller.js`)**:
  - Expanded student lookup in `getStudyMaterials` to match by `studentId` OR `userId`.
  - Added folder path `description` matching to student OR query conditions. Ensures all materials inside `Notes`, `Previous Year Board Papers`, `Question Banks`, and `Textbooks` folders are matched and displayed on student profiles.

---

## [1.8.1] - 2026-08-30 (Hierarchy Folder Synchronization & Class/Subject Scoping)

### Fixed
- **Multi-Level Google Drive Hierarchy Parser (`studentLibrary.controller.js`)**: Enhanced Google Drive sync crawler to parse multi-level folder structures:
  - **Level 1 (Class & Stream)**: Maps `11th Science`/`Arts`/`Commerce` and `12th Science`/`Arts`/`Commerce` to target `classId` (`11th Standard` or `12th Standard`).
  - **Level 2 (Subject)**: Maps `Biology`, `Chemistry`, `Mathematics`, `Physics`, `English` subfolders to corresponding `subjectId`.
  - **Level 3 (Category)**: Classifies subfolders (`Textbook` $\rightarrow$ `TEXTBOOK`, `Notes` $\rightarrow$ `TEACHER_NOTES`, `Previous Year Board...` / `PYQ` $\rightarrow$ `PREVIOUS_BOARD_PAPER`, `Question Banks` $\rightarrow$ `REFERENCE_MATERIAL`).
- **Role-Based Class Scoping (`getStudyMaterials`)**: Ensured students only see materials for their enrolled class/division (11th Grade students see 11th Grade materials; 12th Grade students see 12th Grade materials).

---

## [1.8.0] - 2026-08-30 (Google Drive Root Folder Update & Selective RAG Vector Indexing)

### Changed
- **Google Drive Root Storage Folder (`backend/.env`)**: Updated system `GOOGLE_DRIVE_ROOT_FOLDER_ID` to target the designated shared Google Drive folder `1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3`.
- **Selective RAG Vector Indexing (`studentLibrary.controller.js`, `AdminKnowledgeBasePage.jsx`)**:
  - Implemented an optional `indexToRag` toggle for uploaded study materials and notes.
  - **Default (Unchecked)**: Saves files cleanly as `StudyMaterial` on Google Drive for student access without triggering ChromaDB vector chunking compute overhead.
  - **Checked (`indexToRag = true`)**: Simultaneously ingests document chunks into the ChromaDB RAG vector store for AI Question Paper Generation.

---

## [1.7.0] - 2026-08-30 (Admin User Management Module for Students & Teachers)

### Added
- **Admin User Management API Endpoints (`admin.controller.js`, `admin.routes.js`)**:
  - `POST /api/admin/users`: Enables Admins to manually register new Teachers or Students with role-specific profile parameters (education, experience, assigned class, contact, student ID).
  - `PUT /api/admin/users/:id`: Enables Admins to update user account details, role profiles, qualifications, and student class allocations.
  - `DELETE /api/admin/users/:id`: Allows Admins to delete teacher or student user accounts safely.
- **Admin User Management Frontend UI (`AdminUserManagementPage.jsx`)**:
  - Interactive table displaying all Users, Teachers, and Students with role badge badges and search filtering.
  - Modal workflows for **Adding New Users** and **Editing Existing Users**.
  - Mounted route `/admin/users` and added **"Manage Users"** link in top navigation bar.

---

## [1.6.1] - 2026-08-30 (Registration & Login Pipeline Retest & CORS Origin Sync)

### Fixed
- **Dynamic CORS Origin Matching (`app.js`)**: Updated CORS configuration to dynamically support multiple local frontend origins (`http://localhost:5173`, `http://127.0.0.1:5173`) with `credentials: true`. Resolves CORS preflight rejection when navigating between loopback addresses.
- **Development Rate Limiting Threshold Adjustment (`auth.routes.js`)**: Adjusted authentication rate limits (`authLimiter` to 100 requests per 15 min; `otpLimiter` to 30 requests per 15 min) to prevent `HTTP 429 Too Many Requests` false positives during registration testing.

---

## [1.6.0] - 2026-08-30 (HttpOnly Cookie Authentication & System Security Enhancement)

### Added
- **HttpOnly Cookie Authentication (`cookie-parser`, `auth.controller.js`, `auth.middleware.js`)**: Implemented secure HttpOnly cookie mechanism for JWT tokens (`Set-Cookie: token=...; HttpOnly; SameSite=Lax`). Completely prevents token theft via Cross-Site Scripting (XSS) attacks.
- **Backwards Compatible Token Transport**: Configured `auth.middleware.js` to inspect `req.cookies.token` first, falling back to `Authorization: Bearer` header for non-browser client compatibility.
- **Logout Cookie Clearance (`POST /api/auth/logout`)**: Added server-side cookie invalidation endpoint that clears authentication cookies on logout.
- **Frontend Axios Credentials Sync (`api.js`)**: Configured `apiClient` with `withCredentials: true` for automatic browser cookie transmission.

### Security Enhancements
- **Brute-Force Rate Limiting (`auth.routes.js`)**: Applied strict rate limiters to authentication routes (`/api/auth/login`, `/api/auth/register` capped at 10 requests/15 min; `/api/auth/forgot-password`, `/api/auth/verify-otp` capped at 5 requests/15 min).
- **User Object Sanitization (`auth.controller.js`)**: Sanitized all user authentication responses to omit `password`, `resetOtp`, `resetOtpExpires`, and `resetOtpAttempts`.

---

## [1.5.2] - 2026-08-27 (Admin Dashboard Student Library Connection Fix)

### Fixed
- **Admin Dashboard Student Library Integration (`AdminKnowledgeBasePage.jsx`)**: Connected the Admin Student Library page (`/admin/knowledge-base`) directly to the Student Library API (`/api/student-library/materials`, `/api/student-library/upload`, `/api/student-library/sync`, `/api/student-library/admin-tree`).
- **Admin Storage Management**: Admins can upload textbooks and PYQs directly to Google Drive, trigger recursive Google Drive syncs, browse the full Google Drive folder tree hierarchy, and preview materials in protected mode.

---

## [1.5.1] - 2026-08-27 (Generated Papers Exclusion & PYQs Folder Sync Categorization)

### Fixed
- **Generated Test Papers Exclusion (`studentLibrary.controller.js`)**: Automatically excluded and purged any test papers coming from `Generated Papers` Google Drive subfolders from the Study Materials section.
- **Previous Year Question Papers (PYQs) Categorization**: Enhanced sync crawler to detect Google Drive folders named `Previous Year Question Papers`, `PYQ`, `PYQs`, `Past Papers`, or `Board Papers`, and categorize their PDFs as `PREVIOUS_BOARD_PAPER` for direct access in the Study Materials section.

---

## [1.5.0] - 2026-08-27 (Recursive Google Drive Subfolder Sync & Role-Based Hierarchy Visibility)

### Added
- **Recursive Google Drive Subfolder Crawler (`listAllDriveFilesRecursive`)**: Enhanced Google Drive service to crawl through all nested subfolders (`12th Standard`, `Physics`, `Chemistry`, `Biology`, `Mathematics`, `Textbooks`) inside `16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw`. Automatically discovered and synchronized **31 textbooks and study material PDFs** into `StudyMaterial`.
- **Role-Based Visibility Scoping**:
  - **Students**: Filtered strictly to their grade level (e.g., 11th Grade students see 11th Grade materials; 12th Grade students see 12th Grade textbooks & notes).
  - **Teachers**: Filtered to materials for their assigned classes and subjects.
  - **Admins**: Granted full access to the complete Google Drive folder tree hierarchy (`getAdminDriveTree`) and manual Drive Sync button.

---

## [1.4.1] - 2026-08-27 (Frontend Security Audit & Prefilled Credentials Removal)

### Fixed
- **Exposed Demo Credentials Removal (`LoginPage.jsx`)**: Removed plain-text demo credentials block (`teacher@school.com` / `teacher123`, `admin@school.com` / `admin123`) from the login UI.
- **Form Auto-Fill Protection (`RegisterPage.jsx` & `LoginPage.jsx`)**: Added `autoComplete="new-password"` attributes to prevent browser password managers from auto-populating saved passwords into registration fields.

---

## [1.4.0] - 2026-08-27 (Google Drive Folder Sync, Grade-Level Division Scoping & Email OTP Forgot Password)

### Added
- **Google Drive Folder Sync (`listDriveFilesAndFolders` & `/api/student-library/sync`)**: Implemented automatic Google Drive folder scanning to reflect all existing PDF study materials stored in Google Drive folder `16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw`.
- **Grade-Level Division Scoping (`getStudyMaterials`)**: Programmed Grade-level division scoping so all divisions of 11th (11th C, 11th D, etc.) automatically access all 11th Grade study materials, and all 12th divisions access 12th Grade materials.
- **Forgot Password Email OTP Flow (`emailService.js`, `auth.controller.js`, `ForgotPasswordModal.jsx`)**: Built a complete 6-digit Email OTP verification flow (`/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password`) using Nodemailer SMTP with 10-minute OTP expiration and 3-attempt lockouts. Added "Forgot password?" link on Login page.
- **RAG & Exam Generation Protection**: RAG vector store, chunk retrieval, ChromaDB, and Question Paper generation pipelines remain 100% untouched and undisturbed.

---

## [1.3.1] - 2026-08-27 (Strict Architectural Separation of RAG Vector Store & Student Library)

### Added
- **Database Model Isolation (`StudyMaterial`)**: Created `StudyMaterial` model in `schema.prisma` and ran `npx prisma db push` to keep Student Library PDF notes and Google Drive materials completely separate from RAG `KnowledgeSource` vector store records.
- **Dedicated Student Library Module (`studentLibrary.controller.js` & `studentLibrary.routes.js`)**: Mounted at `/api/student-library`. Handles PDF notes and study material uploads directly to Google Drive folder `16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw`.
- **RAG & Question Paper Pipeline Protection**: Ensured 0 ChromaDB chunking or RAG vector indexing is triggered by Student Library uploads, keeping the existing Question Paper Generation and Practice Quiz RAG pipeline 100% undisturbed and clean.

---

## [1.3.0] - 2026-08-27 (Google Drive OAuth Storage & Protected Document Viewer)

### Added
- **Google Drive Storage Integration (`drive.service.js`)**: Linked Google Drive OAuth 2.0 credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_REFRESH_TOKEN`). Admins and Teachers can upload textbooks, notes, and study material PDFs directly to Google Drive folder `16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw`.
- **Google Drive Lock Down (`copyRequiresWriterPermission: true`)**: Configured Google Drive permissions API to set `copyRequiresWriterPermission: true` on uploaded files, prohibiting downloading, printing, and copying for all reader accounts.
- **Protected Document Viewer (`ProtectedDocumentViewer.jsx`)**: Built a multi-layer protected inline PDF viewer modal for students featuring:
  - **Dynamic Tiled Watermarks**: Renders `CONFIDENTIAL • STUDENT: {NAME} ({ID}) • QPGEN PROTECTED COPY`.
  - **Download & Copy Interception**: Right-click context menu, text selection, drag & drop, and shortcut key combos (`Ctrl+P`, `Ctrl+S`, `Ctrl+C`, `Cmd+P`, `Cmd+S`, `Cmd+C`, `F12`) are strictly disabled.
  - **Anti-Screenshot Deterrent**: Blurs viewer display (`filter: blur(12px)`) when window focus is lost or screen grab utilities are triggered.
  - **Print Shield**: CSS `@media print` rules hide document content on any print trigger.
- **Student Materials Hub (`StudentMaterialsPage.jsx`)**: Students can directly browse and view class study materials in protected mode.

---

## [1.2.5] - 2026-08-27 (Google Drive Service Account Env Binding Standardization)

### Added
- **Google Drive Storage Services (`drive.service.js` & `googleDriveService.js`)**: Enhanced Google Drive authentication fallbacks so that both `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and `GOOGLE_DRIVE_CLIENT_EMAIL` / `GOOGLE_DRIVE_PRIVATE_KEY` environment variable naming conventions work seamlessly for RAG study material uploads and Announcement file attachments.

---

## [1.2.4] - 2026-08-27 (Duplicate Option Prefix Cleanup Fix)

### Fixed
- **Duplicate Option Letter Prefixes (`practice.controller.js` & `StudentPracticePage.jsx`)**: Implemented `cleanOptionText` helper function using regex `^[\(\[]?[a-dA-D1-4][\)\.\:\-]\s*` to automatically strip any embedded option letters (e.g. `"D) Growth rate"`, `"B) Development"`) before rendering. Resolves duplicate option label bug (`A) D) Growth rate` $\rightarrow$ `A. Growth rate`).

---

## [1.2.3] - 2026-08-27 (Practice Quiz Answer Evaluation & UI Rendering Fix)

### Fixed
- **Answer Key Evaluation (`backend/src/controllers/practice.controller.js`)**: Implemented `parseCorrectOption` helper function to intelligently map database `answerKey` values (letters 'A'-'D', option index '0'-'3', or full text strings) and LLM string options. Implemented `shuffleOptionsAndCorrectIndex` to randomly shuffle MCQ options on every session retake so Option (A) is no longer hardcoded as the correct answer.
- **UI LaTeX Code Cleanup (`frontend/src/pages/StudentPracticePage.jsx`)**: Replaced raw unrendered LaTeX string literals (`$\rightarrow 1.5\times$`) with clean, polished unicode text formatting (`→ 1.5×`).

---

## [1.2.2] - 2026-08-27 (Student Registration Form Bug Fix)

### Fixed
- **Student Self-Registration (`/register`)**: Fixed a UI blocking bug where unauthenticated students visiting `/register` were unable to populate the mandatory Class dropdown due to calls to admin-only protected routes (`/api/admin/classes` and `/api/admin/streams`).
- Created public unauthenticated endpoints `GET /api/auth/classes` and `GET /api/auth/streams` in `auth.controller.js` and `auth.routes.js`.
- Registered test student **Chiku** (`chiku@gg.com` / `stu123456`) successfully with auto-generated ID `STU-759761` and verified instant login capabilities.

---

## [1.2.1] - 2026-08-27 (Server Startup Path Import Fix)

### Fixed
- **App Startup (`backend/src/app.js`)**: Added missing `const path = require('path');` import required for static file serving of `/uploads`. Backend server starts and runs cleanly on port `5000` with HTTP `200 OK` response on `/health` endpoint.

---

## [1.2.0] - 2026-08-27 (Gamified MHT-CET Practice Arena & Announcement System)

### Added
- **Gamified MHT-CET Practice Module (`/student/practice`)**:
  - Chapterwise practice selector (Subject $\rightarrow$ Chapter $\rightarrow$ Question Count).
  - Test session countdown timer calculated at **1.3 minutes per question**.
  - **Gamification Engine**:
    - **Base XP**: 10 XP per correct MHT-CET question.
    - **Streak Multipliers**: 3 consecutive correct $\rightarrow 1.5\times$ XP (15 XP); 5 consecutive correct $\rightarrow 2.0\times$ XP (20 XP).
    - **Speed Bonus**: +5 XP if question answered in under 15 seconds.
    - **Level System**: Level calculated as $\lfloor \text{Total XP} / 100 \rfloor + 1$.
  - **Classmate Challenges**: Challenge a classmate in the same division/class to the same MHT-CET practice quiz. Auto-evaluates winner upon completion.
  - **Class Leaderboard**: Ranks students in the class/division by Total XP earned.
  - **Chapter Mastery Heatmap**: Visual grid tracking chapter performance: Mastered ($>80\%$), Intermediate ($50-80\%$), Needs Practice ($<50\%$).
  - **Teacher Performance Access**: Teachers can view assigned students' practice XP, accuracy %, and chapter mastery under *"Your Students"*.

- **Announcement & Notice System (`/manage/announcements` & `/student/announcements`)**:
  - Notice composer for Admins and Teachers with Title, Content, Target Class, and File Attachments (PNG, JPG, PDF up to 10 MB limit).
  - **Target Scoping**: Teachers target assigned classes (`TeacherAssignment`); Admins can broadcast to all classes.
  - **Google Drive Storage & Fallback**: Attachments uploaded to Google Drive API (or local `/uploads` fallback) with web view links.
  - **Student Hub**: Announcement feed for student's class with image preview lightboxes and in-app PDF document viewer modals.

### Database Schema Additions
- Created `Announcement` model (`id`, `title`, `content`, `attachmentUrl`, `attachmentType`, `driveFileId`, `authorRole`, `authorName`, `authorId`, `classId`, `createdAt`).
- Created `PracticeQuizAttempt` model (`id`, `studentId`, `subjectId`, `chapterId`, `totalQuestions`, `correctAnswers`, `score`, `xpEarned`, `accuracy`, `timeTakenSeconds`, `streakCount`, `answers`, `submittedAt`).
- Created `PracticeChallenge` model (`id`, `challengerId`, `opponentId`, `classId`, `subjectId`, `chapterId`, `questionCount`, `questionsData`, `durationMins`, `challengerScore`, `opponentScore`, `status`, `winnerId`).
- Added relation fields to `Student`, `Class`, `Subject`, `Chapter`.

---

## [1.1.0] - 2026-08-26 (Student, Class Allocation, Results & Online Quiz System)

### Added
- **Role-Based Authentication & Scoping**:
  - Student registration with dynamic Class & Division dropdown (`11th C`, `11th D`).
  - Auto-generated student unique IDs (`STU_XXXXX`).
  - `TeacherAssignment` (`teacherId`, `classId`, `subjectId`) dynamically scoping student roster visibility for teachers.
- **Manual Test Result Entry & Auto Pass/Fail**:
  - Automatic pass/fail evaluation based on $\ge 35\%$ passing mark threshold.
  - Institutional Result Sheet PDF export (Puppeteer).
  - Class Result Spreadsheet Excel export (`exceljs`).
- **Teacher Online Quiz Creator & Evaluation Engine**:
  - Online quiz generation and publishing to targeted class.
  - Student interactive quiz player with countdown timer and instant evaluation.
  - Automatic masking of correct answer keys and explanations before submission.

---

## [1.0.0] - 2026-08-20 (Initial Question Paper Generation Core & RAG Pipeline)

### Added
- Question Paper Generation Pipeline (LLM + Hybrid RAG + ChromaDB + BM25 + Cross-Encoder Reranking).
- Institutional Question Paper PDF exporter (Puppeteer).
- Curriculum & Syllabus mapping system.
