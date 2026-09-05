# Testing Strategy

GIOP uses a comprehensive suite of automated tests (`pytest`) covering unit logic, integration pathways, API boundaries, and security constraints.

## 1. Test Architecture

- **Framework:** `pytest`
- **Database:** SQLite in-memory (`sqlite:///:memory:`) for blazing-fast execution during testing. PostgreSQL-specific features (like `pgvector`) are mocked or conditionally bypassed in the test suite to ensure speed and portability.
- **Cache/Rate Limiter:** Tests automatically flush the local Redis instance (`redis.flushdb()`) between runs to prevent rate limits from bleeding across test cases.
- **Fixture Injection:** `conftest.py` provides dependency overrides:
  - `get_db` is overridden to yield the in-memory SQLite session.
  - `RateLimiter` is bypassed or mocked.
  - `llm` and `embedding` services use deterministic mocks to avoid external API calls during tests.

## 2. Test File Inventory

There are currently **16 test files** executing over **50+ tests** with a 100% pass rate.

| File | Focus Area | What it tests |
|------|------------|---------------|
| `test_classifier.py` | Unit | Heuristic tokenizer, keyword matching, fallback logic |
| `test_priority_engine.py` | Unit | All 5 priority signals (safety, urgency, etc.), scoring bounds |
| `test_duplicate_detector.py`| Unit | Jaccard lexical overlap, 0.70 exact duplicate threshold |
| `test_problem_grouping.py` | Integration| Problem group assignment, `affected_users` tracking, `force_new` bypass |
| `test_embedding_service.py` | Unit | MiniLM-L6-v2 384-dim embedding generation, cosine similarity math |
| `test_error_handling.py` | API | Standardized `{success, error: {code, message}}` envelope format |
| `test_security.py` | Security | RBAC enforcement, magic byte file validation, rate limiting |
| `test_lifecycle.py` | E2E | Full lifecycle: submit → group → resolve → student validation |
| `test_regressions.py` | Regressions| Specific edge cases identified during development |
| `test_department_admin.py` | API | Department data scoping, admin nudges |
| `test_emerging_clusters.py` | Logic | Detection of high-velocity complaint bursts |
| `test_public_stats.py` | API | Unauthenticated `/transparency` endpoint |
| `test_student_problem_discovery.py`| Logic | Searching existing active problems by similarity |
| `test_suggestions.py` | Logic | Suggestion AI logic |

## 3. How to Run Tests

### Running Locally (Fast)
To run the full suite using the local `.venv`:

```bash
cd api/api
source .venv/bin/activate
pytest -vv
```

### Running Specific Tests
```bash
pytest tests/test_priority_engine.py -vv
```

### Running with Warnings Hidden
The test suite occasionally emits standard library deprecation warnings (e.g., from `jose` or `passlib`). To run silently:
```bash
pytest -q --disable-warnings
```

## 4. Continuous Integration (CI)

Tests run automatically on GitHub Actions (`.github/workflows/ci.yml`) on every push to `main` and all pull requests.

The CI pipeline includes:
1. `ruff` (Linting)
2. `mypy` (Static Type Checking)
3. `pytest` (Execution)
4. Docker Compose build verification
