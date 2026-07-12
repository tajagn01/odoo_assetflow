# Implementation Plan - Asset Allocations, Returns & Handovers

This plan details the implementation of the missing **Asset Allocation, Return, and Handovers/Transfers** interactive flows in the frontend, fully aligning the application with the specifications in `AGENTS.md`.

## Proposed Changes

### Backend Component

#### [MODIFY] [actions/allocations.ts](file:///c:/Users/TAJAGN/Desktop/odoo_assetflow/actions/allocations.ts)
* Add `getTransferTargets()` to return active employee profiles (name, email, department) for dropdown selection.
* Enhance `requestAssetTransfer()` to create a structured notification with actionable metadata (e.g. including transfer source, target, and asset details).
* Add `approveAssetTransfer(notificationId: string)` to allow Department Heads and Asset Managers to process and close requested handovers.

---

### Frontend Component

#### [MODIFY] [app/dashboard/assets/page.tsx](file:///c:/Users/TAJAGN/Desktop/odoo_assetflow/app/dashboard/assets/page.tsx)
* Enhance the right-side **Asset Details Panel** with dynamic action forms:
  * **When status is `AVAILABLE` (for Admin/Asset Manager):** Display the **Allocate Asset** form allowing them to pick an active employee, specify an expected return date, and execute the allocation.
  * **When status is `ALLOCATED` (for Admin/Asset Manager):** Display the **Process Return** form (selecting return condition and inputting notes) and a **Direct Transfer** form.
  * **When status is `ALLOCATED` (for Employees/Dept Heads):** Display a **Request Transfer** form allowing them to select a target recipient from the directory to start a handover request.

#### [MODIFY] [components/dashboard/roles/EmployeeDashboard.tsx](file:///c:/Users/TAJAGN/Desktop/odoo_assetflow/components/dashboard/roles/EmployeeDashboard.tsx)
* Enable return requests and handover transfers directly from the **My Active Custody Files** card list. Clicking these will open the assets panel pre-focused on the respective asset actions.

#### [MODIFY] [components/dashboard/roles/DeptHeadDashboard.tsx](file:///c:/Users/TAJAGN/Desktop/odoo_assetflow/components/dashboard/roles/DeptHeadDashboard.tsx)
* Add a **Pending Transfers Approvals Hub** table for department heads to review, approve, or decline direct handovers requested by employees under their jurisdiction.

---

## Verification Plan

### Automated Tests
* Run `tsc --noEmit` to verify type-safety.

### Manual Verification
1. Log in as **Employee** (`amit@assetflow.com`), select an active custody asset, and click **Request Handover/Transfer** to another employee.
2. Log in as **Department Head** (`head@assetflow.com`), go to the dashboard, locate the pending transfer request in the approvals list, and click **Approve Transfer**.
3. Verify that the asset status remains `ALLOCATED`, its current holder updates to the new recipient, the previous allocation record closes, a new active allocation opens, and a log entry is created.
4. Log in as **Asset Manager** (`manager@assetflow.com`), select an `AVAILABLE` asset in the directory, and allocate it to a user.
5. Process a return for the allocated asset, checking that its condition is updated and its status returns to `AVAILABLE`.
