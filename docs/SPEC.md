# Research Copilot MVP Specification

## Overview

**Project Name:** Research Copilot

**Goal:** Help users understand any research paper in under 10 minutes
through AI-generated explanations, interactive learning, and contextual
Q&A.

**Target User:** Individual learner (AI, Computer Science, Robotics,
Systems, ML, etc.)

------------------------------------------------------------------------

# Product Vision

The application is **not** a paper summarizer.

It is a **learning-first research companion** that removes the need to
constantly search Google for unfamiliar concepts while reading papers.

Primary success metric:

> "I finally understand the paper."

------------------------------------------------------------------------

# Core User Flow

``` text
Home
 ↓
Paste arXiv / PDF URL
 ↓
Process Paper
 ↓
30-second Summary
 ↓
5-minute Explanation
 ↓
Section-by-section Explanation
 ↓
Explore Concepts
 ↓
Chat with Paper
 ↓
Generate Mind Map (On Demand)
```

------------------------------------------------------------------------

# MVP Scope

## Included

-   Paste arXiv URL
-   Paste direct PDF URL
-   Automatic paper extraction
-   30-second summary
-   5-minute explanation
-   Section explanations
-   Clickable concepts
-   AI chat
-   Mermaid mind map generation
-   Responsive desktop-first UI

## Excluded

-   Authentication
-   Database
-   Saved papers
-   Collections
-   Notes
-   Search
-   Multi-paper comparison
-   Recommendations

------------------------------------------------------------------------

# Functional Requirements

## 1. Home Page

### Components

-   Product title
-   URL input
-   Analyze button
-   Example paper links

------------------------------------------------------------------------

## 2. Paper Processing

Supported Input

-   arXiv URL
-   Direct PDF URL

Pipeline

1.  Download PDF
2.  Extract text
3.  Detect sections
4.  Clean formatting
5.  Send to AI pipeline

------------------------------------------------------------------------

## 3. 30-Second Summary

Generate:

-   Problem
-   Solution
-   Key innovation
-   Results
-   Why it matters
-   Should I read this?

Target length:

150--250 words

------------------------------------------------------------------------

## 4. Five-Minute Explanation

Explain:

-   Background
-   Problem
-   Proposed method
-   Main findings
-   Practical importance

Audience:

Computer Science undergraduate.

Avoid unnecessary jargon.

------------------------------------------------------------------------

## 5. Section Explanations

Each detected section should contain

-   Original title
-   Plain-English explanation
-   Key takeaway
-   Why this section matters

------------------------------------------------------------------------

## 6. Concept Explorer

Automatically detect technical concepts.

Each concept opens a side panel containing

-   Definition
-   Simple explanation
-   Analogy
-   Why used in this paper
-   Prerequisites
-   Related concepts

------------------------------------------------------------------------

## 7. Chat

User can ask free-form questions.

Examples

-   Explain Figure 2
-   Explain Equation 4
-   Compare with GPT
-   Give implementation idea

Conversation is scoped to the current paper only.

------------------------------------------------------------------------

## 8. Mind Map

Generated only when requested.

Output Mermaid syntax rendered in UI.

------------------------------------------------------------------------

# UI Layout

``` text
---------------------------------------------------------
Sidebar

Paper Outline

Concepts

---------------------------------------------------------

Main Area

Title

Authors

30 Second Summary

5 Minute Explanation

Sections

Chat

Generate Mind Map Button

---------------------------------------------------------
```

Theme

-   Cursor-inspired
-   Dark mode
-   Desktop-first
-   Mobile responsive

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   React Markdown
-   Mermaid.js

## Backend

-   Next.js Route Handlers

## AI

Provider

-   OpenRouter

Suggested Models

-   Fast model for summaries
-   Strong reasoning model for explanations/chat

------------------------------------------------------------------------

# AI Pipeline

``` text
User URL
 ↓
Download PDF
 ↓
Extract Text
 ↓
Detect Sections
 ↓
Generate 30-second Summary
 ↓
Generate 5-minute Explanation
 ↓
Generate Section Explanations
 ↓
Extract Concepts
 ↓
Enable Chat
 ↓
Generate Mind Map on Request
```

------------------------------------------------------------------------

# Prompt Modules

Use separate prompts for:

-   Summary
-   Explanation
-   Section explanations
-   Concept extraction
-   Chat
-   Mind map

Avoid a single monolithic prompt.

------------------------------------------------------------------------

# API Integrations

Required

-   OpenRouter API

Recommended

-   arXiv
-   Crossref
-   OpenAlex
-   Semantic Scholar

------------------------------------------------------------------------

# Error Handling

-   Invalid URL
-   Unsupported paper
-   PDF extraction failure
-   AI timeout
-   Token limit exceeded

Display clear recovery actions.

------------------------------------------------------------------------

# Non-Functional Requirements

-   Initial processing under 30 seconds
-   Chat responses under 10 seconds
-   Modular architecture
-   Clean separation between UI and AI orchestration

------------------------------------------------------------------------

# Folder Structure

``` text
/app
/components
/lib
/services
/prompts
/types
/utils
/public
```

------------------------------------------------------------------------

# Future Roadmap

## V2

-   Related papers
-   GitHub implementations
-   Research timeline
-   Export notes

## V3

-   Personal library
-   Multi-paper chat
-   Learning paths
-   Daily paper recommendations
-   Audio explanations
-   Spaced repetition

------------------------------------------------------------------------

# Definition of Done

A user can:

1.  Paste a research paper URL.
2.  Receive a 30-second summary.
3.  Read a detailed explanation.
4.  Understand every section.
5.  Learn unfamiliar concepts.
6.  Ask unlimited questions.
7.  Generate a visual mind map.

No account creation or persistence is required.
