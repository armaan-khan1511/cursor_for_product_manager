# Data Flow

User Login
      |
      ↓
Authentication Verification
      |
      ↓
Feedback Submission
      |
      ↓
AI Processing
      |
      ↓
Theme Generation
      |
      ↓
Task Generation
      |
      ↓
Database Storage
      |
      ↓
Export

## Stored Data

### Feedback

- id
- content
- created_at

### Analysis

- theme
- priority
- confidence_score

### Specification

- title
- description
- acceptance_criteria
- implementation_tasks

---

## Export Flow

Generated specification can be exported as:

- Claude Code Prompt
- Cursor Prompt
- GitHub Issue
- Linear Issue

---

## Design Decisions

- AI responses are stored for traceability.
- Structured outputs simplify exports to multiple developer tools.
- Backend validates requests before invoking the AI model.

---

## Repository Structure

```text
SpecForge/
│
├── docs/
│   ├── PRODUCT-OVERVIEW.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── USER_FLOW.md
│   ├── TECH_STACK.md
│   └── DATA_FLOW.md
│
├── src/
├── public/
├── README.md
└── package.json
```
