# Phase 3 Testing Guide - Project Management

## ✅ Phase 3 Complete: Project Management

This guide will help you test the project management functionality.

---

## 🚀 Prerequisites

Make sure both servers are running:
- **Backend**: `http://localhost:3001` (should already be running)
- **Frontend**: `http://localhost:3000` (should already be running)

If not, start them:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🧪 Test Flow

### Test 1: Navigate to Projects Page

1. Open browser to `http://localhost:3000`
2. Login with your existing account (from Phase 2)
3. On Dashboard, click the **"Project Management"** card
   - Or manually go to `http://localhost:3000/projects`

**Expected Result:**
- ✅ Redirected to `/projects`
- ✅ See "Projects (0)" header
- ✅ See empty state: "No projects yet"
- ✅ See "Create Your First Project" button (if you're admin)

---

### Test 2: Create a Project (Admin Only)

1. On Projects page, click **"Create Your First Project"** or **"+ Create Project"**

**Expected Result:**
- ✅ Modal opens with title "Create New Project"
- ✅ Form has Project Name (required) and Description (optional) fields

2. Fill in the form:
   - **Project Name**: "ChatBot API"
   - **Description**: "Customer support chatbot using GPT-4"

3. Click **"Create Project"**

**Expected Result:**
- ✅ Modal closes
- ✅ Project appears in the grid
- ✅ Header shows "Projects (1)"
- ✅ Project card shows:
  - Name: "ChatBot API"
  - Description: "Customer support chatbot using GPT-4"
  - Created date
  - Created by: your email

---

### Test 3: Create Multiple Projects

Create 2 more projects:

**Project 2:**
- Name: "Content Generator"
- Description: "Blog post generation tool"

**Project 3:**
- Name: "Code Assistant"
- Description: "" (leave empty to test optional description)

**Expected Result:**
- ✅ Header shows "Projects (3)"
- ✅ All 3 projects displayed in grid
- ✅ Project 3 shows "No description"
- ✅ Cards arranged in grid layout

---

### Test 4: Form Validation

1. Click **"+ Create Project"**
2. Leave Project Name empty
3. Click **"Create Project"**

**Expected Result:**
- ✅ Error message appears
- ✅ Modal stays open

4. Enter name: "X" (too short)

**Expected Result:**
- ✅ Error: "Project name must be at least 2 characters long"

5. Try extremely long name (260+ characters)

**Expected Result:**
- ✅ Error: "Project name must be less than 255 characters"

---

### Test 5: Delete a Project (Admin Only)

1. Find the "Code Assistant" project card
2. Click the **🗑️ (trash)** icon on the card

**Expected Result:**
- ✅ Delete confirmation modal opens
- ✅ Shows project name in red box
- ✅ Warning message displayed

3. Click **"Delete Project"**

**Expected Result:**
- ✅ Modal closes
- ✅ Project removed from grid
- ✅ Header shows "Projects (2)"

---

### Test 6: Cancel Operations

**Cancel Create:**
1. Click **"+ Create Project"**
2. Enter some data
3. Click **"Cancel"**

**Expected Result:**
- ✅ Modal closes
- ✅ No project created
- ✅ Form data cleared

**Cancel Delete:**
1. Click delete (🗑️) on any project
2. Click **"Cancel"** in confirmation modal

**Expected Result:**
- ✅ Modal closes
- ✅ Project NOT deleted
- ✅ Project still visible

---

### Test 7: Navigation

**From Projects to Dashboard:**
1. On Projects page, click **"Dashboard"** button (top right)

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ Dashboard loads successfully

**From Dashboard to Projects:**
1. On Dashboard, click the **"Project Management"** card

**Expected Result:**
- ✅ Redirected to `/projects`
- ✅ Projects page loads with your projects

---

### Test 8: Role-Based Access (If you have Developer account)

If you created a developer account in Phase 2:

1. Login as **developer** (not admin)
2. Navigate to `/projects`

**Expected Result:**
- ✅ Can see all projects in organization
- ✅ **No** "Create Project" button visible
- ✅ **No** delete (🗑️) icons on project cards
- ✅ Read-only access

---

## 🔧 API Testing (Using cURL)

### Test Create Project API

```bash
# Replace YOUR_TOKEN with your actual JWT token from login
curl-X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Email Assistant\",\"description\":\"Automated email responses\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "project": {
    "id": "uuid-here",
    "name": "Email Assistant",
    "description": "Automated email responses",
    "organization_id": "org-uuid",
    "created_by": "user-uuid",
    "created_at": "2026-01-27...",
    "updated_at": "2026-01-27..."
  }
}
```

### Test Get All Projects

```bash
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid-1",
      "name": "ChatBot API",
      "description": "Customer support chatbot using GPT-4",
      "created_at": "...",
      "creator": {
        "id": "user-uuid",
        "email": "admin@test.com",
        "role": "admin"
      }
    },
    ...
  ]
}
```

### Test Get Project Count

```bash
curl -X GET http://localhost:3001/api/projects/count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3
}
```

### Test Delete Project (Admin Only)

```bash
# Replace PROJECT_ID with actual project UUID
curl -X DELETE http://localhost:3001/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Test Developer Cannot Create (403 Error)

If you have a developer token:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DEVELOPER_TOKEN" \
  -d "{\"name\":\"Test\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

---

## 🔍 Verify in Supabase

1. Go to: https://supabase.com/dashboard/project/jexipkocsmrqdzomqddy
2. Click **Table Editor** → **projects**

**You should see:**
- All created projects
- `organization_id` matches your org
- `created_by` is your user ID
- `name` and `description` match what you entered
- Timestamps are correct

---

## ✨ UI/UX Features to Test

### Hover Effects
- ✅ Project cards lift up on hover
- ✅ Border color changes to primary
- ✅ Delete icon changes color on hover

### Animations
- ✅ Modal slides in smoothly
- ✅ Grid items fade in
- ✅ Buttons have smooth transitions

### Responsive Design
1. Resize browser window to mobile size

**Expected Result:**
- ✅ Grid switches to single column
- ✅ Header stacks vertically
- ✅ Modal adapts to mobile width

---

## 🎯 Success Criteria

Phase 3 is successful if:

- ✅ Admin can create projects
- ✅ Admin can delete projects
- ✅ Developer can view projects (read-only)
- ✅ Projects displayed in grid layout
- ✅ Form validation works
- ✅ Navigation works between Dashboard and Projects
- ✅ Empty state shown when no projects
- ✅ Project count displayed correctly
- ✅ Modals open/close properly
- ✅ Data persists in Supabase
- ✅ Responsive design works

---

## 🐛 Troubleshooting

### "Admin access required" error
- Make sure you're logged in as admin
- Check user role in Dashboard
- First user is always admin

### Projects not loading
- Check browser console for errors
- Verify JWT token is valid
- Check backend logs for errors

### Modal not opening
- Check browser console for errors
- Verify React is rendering correctly

### Delete not working
- Make sure you're admin
- Check project UUID is valid
- Verify backend API is accessible

---

## 📊 What's Working Now

**Backend:**
- ✅ GET /api/projects (list all)
- ✅ GET /api/projects/:id (get one)
- ✅ GET /api/projects/count
- ✅ POST /api/projects (admin only)
- ✅ PUT /api/projects/:id (admin only)
- ✅ DELETE /api/projects/:id (admin only)

**Frontend:**
- ✅ Projects page with grid layout
- ✅ Create project modal
- ✅ Delete confirmation modal
- ✅ Role-based UI (admin vs developer)
- ✅ Navigation to/from dashboard
- ✅ Loading and empty states
- ✅ Form validation
- ✅ Error handling

**Database:**
- ✅ Projects stored in `projects` table
- ✅ Linked to organizations
- ✅ Row Level Security enforced
- ✅ Created by user tracked

---

## 🚫 What's NOT Built Yet

As requested, these are **excluded** from Phase 3:

❌ Proxy keys generation  
❌ OpenAI integration  
❌ Request proxying  
❌ Usage logging  
❌ Cost tracking  
❌ Dashboard analytics  
❌ Charts or graphs  

**These will be built in future phases.**

---

## ✅ Phase 3 Complete

If all tests pass, Phase 3 is complete! 🎉

**Confirm with me when ready for Phase 4!**
