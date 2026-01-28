# Phase 9B: Final Deployment & Smoke Test Plan

This document outlines the final verification steps for SpendAI 2.0 to ensure production readiness.

## 1. Environment Verification
- [ ] **Backend**: Verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_KEY_ENCRYPTION_SECRET`, and `JWT_SECRET` are set.
- [ ] **Frontend**: Verify `VITE_API_BASE_URL` points to the production backend.

## 2. Infrastructure Checks
- [ ] **Health Check**: `GET /health` returns `{status: "ok"}`.
- [ ] **Readiness Check**: `GET /ready` returns `{status: "ready"}`.
- [ ] **Logging**: All logs are correctly timestamped and leveled.

## 3. End-to-End Smoke Tests (The "Happy Path")
- [ ] **Account Lifecycle**:
  - [ ] Signup a new organization admin.
  - [ ] Login and receive JWT.
- [ ] **Governance Setup**:
  - [ ] Create a new project.
  - [ ] Configure organization budget ($10.00).
- [ ] **API Provisioning**:
  - [ ] Generate a Proxy API Key.
  - [ ] Copy and securely store the key.
- [ ] **Core Proxy Flow**:
  - [ ] Send a Chat Completion request through `/v1/chat/completions`.
  - [ ] Verify `200 OK` from OpenAI.
  - [ ] Verify `x-spendai-request-id` header is present.
- [ ] **Analytics & Ledger**:
  - [ ] Confirm a new row appears in `usage_logs`.
  - [ ] Confirm the Dashboard shows the spend MTD.
  - [ ] Confirm the Budget progress bar reflects the new spend.

## 4. Production Guardrail Checks
- [ ] **Rate Limiting**: Confirm 61st request in a minute returns `429`.
- [ ] **Error Handling**: Confirm failed requests do not leak internal stack traces.
- [ ] **Soft Governance**: Confirm traffic is NOT blocked even if 100% budget is reached (simulation).

## 5. Deployment Checklist
- [ ] Build production assets (`npm run build`).
- [ ] Configure production process manager (e.g., PM2 or Cloud Native).
- [ ] Perform final DB migration check.

---
**Current Status**: 🧪 Smoke Testing in Progress
