# Review / Ratings Module - Test Cases

This file documents the system test cases for the Review / Ratings module in Member 4.

## Test Environment
- Backend: Node.js + Express + MongoDB
- Authentication: JWT protected routes
- Test runner: Jest + Supertest

## Functional Test Cases

| Test Case ID | Scenario | Expected Result | Status |
|---|---|---|---|
| RV-01 | Add a review with valid packageId, rating, and comment | Review is created successfully | Pass |
| RV-02 | View all reviews for a package | All reviews and summary are returned | Pass |
| RV-03 | Add a second review from another user | Both reviews are stored and summary updates | Pass |
| RV-04 | Delete own review | Review is removed successfully | Pass |
| RV-05 | Try deleting another user review | Request is rejected with 403 | Pass |
| RV-06 | Open review screen with no reviews | Empty state is shown | Pass |

## Validation Test Cases

| Test Case ID | Scenario | Expected Result | Status |
|---|---|---|---|
| RV-V01 | Submit rating greater than 5 | Request is rejected with 400 | Pass |
| RV-V02 | Submit review without packageId | Request is rejected with 400 | Pass |
| RV-V03 | Submit review with empty comment | Request is rejected with 400 | Pass |
| RV-V04 | Submit review without authentication | Request is rejected with 401 | Pass |
| RV-V05 | Submit duplicate review for same package and user | Request is rejected with 409 | Pass |

## Integration Test File

The automated integration coverage is stored in:

- [src/__tests__/integration/review.flow.test.js](2.%20UserAuthentication%20-%20BackEnd/src/__tests__/integration/review.flow.test.js)

## Executed Test Command

```bash
npx jest "src/__tests__/integration/review.flow.test.js" --runInBand --forceExit --config jest.config.js
```

## Result

All review module test cases passed successfully.