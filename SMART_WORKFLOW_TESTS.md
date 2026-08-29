# Smart Workflow Smoke Test

Use a student token and the API running at `http://localhost:8000`.

## 1. Browse problems
```bash
curl -s "http://localhost:8000/problems?department=Hostel&priority=high&q=water" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## 2. Similarity suggestions
```bash
curl -sG http://localhost:8000/problems/similar \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "title=Hostel bathroom fan is not working" \
  --data-urlencode "description=The exhaust fan in Hostel A bathroom has stopped working." \
  | python3 -m json.tool
```

## 3. Join an existing problem
```bash
curl -s -X POST http://localhost:8000/problems/$PROBLEM_ID/report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool
```

Expected: a `complaint_id` is returned and the complaint's `problem_id` is the same existing problem. No new ProblemGroup is created.

## 4. Force a genuinely new problem
```bash
curl -s -X POST http://localhost:8000/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(python3 -c 'import uuid; print(uuid.uuid4())')" \
  -d '{
    "title": "Hostel bathroom mirror is cracked",
    "description": "The mirror in Hostel A bathroom is cracked and needs replacement.",
    "force_new": true
  }' | python3 -m json.tool
```

Then repeat step 1 without the search term. The new problem should appear in the Existing Problems feed.
