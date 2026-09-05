# GIOP Baseline Report

## Overview
This report documents the baseline behavior of the GIOP platform prior to the modernization implementation phases.

## Execution Environment
- Docker daemon was unavailable in the current execution environment, so tests were run locally using a Python virtual environment.
- SQLite was used as the database for the test suite (via the in-memory fallback defined in `conftest.py`).

## Test Suite Results
- **Command Run**: `pytest -vv --tb=short`
- **Result**: `31 passed, 338 warnings in 115.32s`
- **Known Failures**: None (all tests pass, although there are many deprecation warnings from Starlette/FastAPI/Pydantic/JOSE).

## API Response Times (Baseline)
Recorded using FastAPI `TestClient` and in-memory SQLite:

| Endpoint | Method | Average Response Time |
|----------|--------|-----------------------|
| `/auth/login` (Student) | POST | ~3622 ms (initial auth/bcrypt) |
| `/auth/login` (Staff/Admin)| POST | ~333 ms |
| `/complaints` (Create) | POST | ~30 ms |
| `/public/stats` | GET | ~6 ms |

*Note: Response times are artificially fast because of the synchronous SQLite in-memory database and lack of network latency. The initial student login took longer likely due to bcrypt hashing initialization.*

## AI Pipeline Behavior
During the test complaint creation (Title: "Water leaking", Description: "Massive water leak in Hostel A"):
- **LLM vs. Fallback**: The LLM categorization failed with a network error (`[Errno 8] nodename nor servname provided, or not known`) due to the sandbox's lack of internet access. The system gracefully fell back to the keyword classifier.
- **Classification Result**: 
  - Department: `Hostel`
  - Category: `General`
  - Confidence: `0.0`
- **Duplicate Detection**: No duplicate found (duplicate_of_id was `None`).
- **Problem Grouping**: Automatically assigned to a new problem group.
- **Priority Assigned**: `normal` (no priority reasons were attached).

## Attachments and Staff Flow
- Attachment validation returns `415 Unsupported Media Type` when invalid files are uploaded (as seen in test `test_attachment_validation`).
- The `GET /public/stats` endpoint successfully returns HTTP 200 without authentication.

## Pre-existing Issues Catalogued
1. **Model Warnings**: The test suite produces 338 deprecation warnings (e.g., `asyncio.iscoroutinefunction`, `datetime.utcnow()`, and `on_event` handlers in FastAPI).
2. **LLM Dependency**: The system relies on HuggingFace for classification. If the network is unavailable, it immediately throws an error and uses the keyword fallback (which is correct behavior).
3. **Empty Priority Reasons**: The priority reasons array is empty (`[]`) for a normal complaint, lacking explainability.
4. **Classification Confidence**: Set to `0.0` during fallback.

## Conclusion
The baseline has been established successfully. All existing tests pass, and the application's core functionality (authentication, complaint creation, fallback classification, public stats) operates as expected. The system is ready for Phase 1 (Architecture & Codebase Cleanup).
