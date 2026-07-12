"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Plus, Trash2, Edit2, ShieldAlert, Award, UserMinus, ToggleLeft, UserCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCategories,
  createCategory,
  deleteCategory,
  getEmployees,
  updateEmployee,
} from "@/actions/org";
import Link from "next/link";

type DepartmentType = {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  status: string;
  parent?: { id: string; name: string } | null;
  manager?: { id: string; name: string; email: string } | null;
};

type CategoryType = {
  id: string;
  name: string;
  description: string | null;
  _count?: { assets: number };
};

type EmployeeType = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
};

export default function OrgSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");

  // Data States
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Form States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department Form
  const [deptName, setDeptName] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  const [deptManagerId, setDeptManagerId] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Block non-admins
  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Load all configurations
  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsData, catsData, empsData] = await Promise.all([
        getDepartments(),
        getCategories(),
        getEmployees(),
      ]);
      setDepartments(deptsData || []);
      setCategories(catsData || []);
      setEmployees(empsData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load organization settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ----------------------------------------------------
  // HANDLERS: DEPARTMENTS
  // ----------------------------------------------------
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      let res;
      if (editingDeptId) {
        res = await updateDepartment(editingDeptId, {
          name: deptName,
          parentId: deptParentId || null,
          managerId: deptManagerId || null,
          status: "ACTIVE",
        });
      } else {
        res = await createDepartment({
          name: deptName,
          parentId: deptParentId || null,
          managerId: deptManagerId || null,
        });
      }

      if (res.success) {
        setSuccess(res.message || "Saved successfully.");
        setDeptName("");
        setDeptParentId("");
        setDeptManagerId("");
        setEditingDeptId(null);
        await loadData();
      } else {
        setError(res.message || "Failed to save department.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDept = (dept: DepartmentType) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptParentId(dept.parentId || "");
    setDeptManagerId(dept.managerId || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this department?")) return;
    clearMessages();
    try {
      const res = await deleteDepartment(id);
      if (res.success) {
        setSuccess(res.message || "Deactivated department.");
        await loadData();
      } else {
        setError(res.message || "Failed to deactivate.");
      }
    } catch (err) {
      setError("Failed to delete.");
    }
  };

  // ----------------------------------------------------
  // HANDLERS: CATEGORIES
  // ----------------------------------------------------
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await createCategory({
        name: catName,
        description: catDesc,
      });

      if (res.success) {
        setSuccess(res.message || "Category saved.");
        setCatName("");
        setCatDesc("");
        await loadData();
      } else {
        setError(res.message || "Failed to save category.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    clearMessages();
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        setSuccess(res.message || "Category deleted.");
        await loadData();
      } else {
        setError(res.message || "Failed to delete.");
      }
    } catch (err) {
      setError("Failed to delete.");
    }
  };

  // ----------------------------------------------------
  // HANDLERS: EMPLOYEES
  // ----------------------------------------------------
  const handleRoleChange = async (empId: string, role: Role) => {
    clearMessages();
    try {
      const targetEmp = employees.find((e) => e.id === empId);
      const res = await updateEmployee(empId, {
        role,
        status: targetEmp?.status || "ACTIVE",
        departmentId: targetEmp?.departmentId,
      });

      if (res.success) {
        setSuccess(res.message || "Role updated.");
        await loadData();
      } else {
        setError(res.message || "Failed to update role.");
      }
    } catch (err) {
      setError("Failed to update role.");
    }
  };

  const handleStatusToggle = async (emp: EmployeeType) => {
    clearMessages();
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Are you sure you want to set ${emp.name} to ${newStatus}?`)) return;

    try {
      const res = await updateEmployee(emp.id, {
        role: emp.role,
        status: newStatus,
        departmentId: emp.departmentId,
      });

      if (res.success) {
        setSuccess(res.message || "Status updated.");
        await loadData();
      } else {
        setError(res.message || "Failed to update status.");
      }
    } catch (err) {
      setError("Failed to toggle status.");
    }
  };

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Organization Setup</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure departments hierarchy, asset categories, and control the employee directory permissions.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => { setActiveTab("departments"); clearMessages(); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "departments"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => { setActiveTab("categories"); clearMessages(); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "categories"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Asset Categories
        </button>
        <button
          onClick={() => { setActiveTab("employees"); clearMessages(); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "employees"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* System alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: DEPARTMENTS */}
          {activeTab === "departments" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dept Form */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 h-fit">
                <h2 className="text-base font-bold text-zinc-900 mb-4">
                  {editingDeptId ? "Edit Department" : "Add Department"}
                </h2>
                <form onSubmit={handleSaveDept} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="e.g. Quality Assurance"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="parent">Parent Department (Optional)</Label>
                    <select
                      id="parent"
                      value={deptParentId}
                      onChange={(e) => setDeptParentId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    >
                      <option value="">No Parent</option>
                      {departments
                        .filter((d) => d.id !== editingDeptId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="manager">Department Head (Optional)</Label>
                    <select
                      id="manager"
                      value={deptManagerId}
                      onChange={(e) => setDeptManagerId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    >
                      <option value="">No Department Head Assigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                      disabled={isSubmitting}
                    >
                      {editingDeptId ? "Update" : "Create"}
                    </Button>
                    {editingDeptId && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingDeptId(null);
                          setDeptName("");
                          setDeptParentId("");
                          setDeptManagerId("");
                        }}
                        className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Depts Table */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Parent</th>
                      <th className="px-6 py-3">Department Head</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                          No departments seeded or created yet.
                        </td>
                      </tr>
                    ) : (
                      departments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-4 font-bold text-zinc-950">
                            <Link href={`/dashboard/departments/${dept.id}`} className="hover:underline">
                              {dept.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-zinc-500">{dept.parent?.name || "-"}</td>
                          <td className="px-6 py-4 text-zinc-700">
                            {dept.manager ? (
                              <div>
                                <div className="font-semibold">{dept.manager.name}</div>
                                <div className="text-[10px] text-zinc-400">{dept.manager.email}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditDept(dept)}
                              className="text-zinc-600 hover:text-zinc-950 p-1 cursor-pointer"
                              title="Edit department"
                            >
                              <Edit2 className="h-4 w-4 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Deactivate department"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ASSET CATEGORIES */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category Form */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 h-fit">
                <h2 className="text-base font-bold text-zinc-900 mb-4">Add Asset Category</h2>
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="catName">Category Name</Label>
                    <Input
                      id="catName"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. IT Equipment"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="catDesc">Description</Label>
                    <textarea
                      id="catDesc"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="e.g. Organization-wide electronic equipment..."
                      rows={3}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                    disabled={isSubmitting}
                  >
                    Save Category
                  </Button>
                </form>
              </div>

              {/* Categories Table */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Category Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Linked Assets</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                          No categories defined yet.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-4 font-bold text-zinc-950">{cat.name}</td>
                          <td className="px-6 py-4 text-zinc-500 text-xs">{cat.description || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 border border-zinc-200">
                              {cat._count?.assets || 0} Assets
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Delete category"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYEE DIRECTORY */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              {/* Directory Filter controls */}
              <div className="flex flex-col sm:flex-row gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search employees by name or email..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 h-10"
                  />
                </div>
                <select
                  value={employeeDeptFilter}
                  onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 h-10"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Employee Name</th>
                      <th className="px-6 py-3">Email Address</th>
                      <th className="px-6 py-3">Assigned Department</th>
                      <th className="px-6 py-3">Current RBAC Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {employees
                      .filter((emp) => {
                        const matchesSearch =
                          emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                          emp.email.toLowerCase().includes(employeeSearch.toLowerCase());
                        const matchesDept =
                          !employeeDeptFilter || emp.departmentId === employeeDeptFilter;
                        return matchesSearch && matchesDept;
                      })
                      .map((emp) => {
                        const isSelf = emp.id === session?.user?.id;
                        return (
                          <tr key={emp.id} className="hover:bg-zinc-50/50">
                            <td className="px-6 py-4 font-bold text-zinc-950">
                              <Link href={`/dashboard/employees/${emp.id}`} className="hover:underline">
                                {emp.name}
                              </Link>
                              {isSelf && <span className="text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 ml-1">You</span>}
                            </td>
                            <td className="px-6 py-4 text-zinc-500">{emp.email}</td>
                            <td className="px-6 py-4 text-zinc-700">{emp.department?.name || <span className="text-xs text-zinc-400 italic">Unassigned</span>}</td>
                            <td className="px-6 py-4">
                              <select
                                value={emp.role}
                                onChange={(e) => handleRoleChange(emp.id, e.target.value as Role)}
                                disabled={isSelf}
                                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:opacity-50"
                              >
                                <option value={Role.EMPLOYEE}>Employee</option>
                                <option value={Role.DEPARTMENT_HEAD}>Department Head</option>
                                <option value={Role.ASSET_MANAGER}>Asset Manager</option>
                                <option value={Role.ADMIN}>Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                  emp.status === "ACTIVE"
                                    ? "bg-zinc-50 text-zinc-950 border-zinc-200"
                                    : "bg-red-50 text-red-700 border-red-100"
                                }`}
                              >
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleStatusToggle(emp)}
                                disabled={isSelf}
                                className={`p-1 cursor-pointer disabled:opacity-40 ${
                                  emp.status === "ACTIVE" ? "text-red-500 hover:text-red-700" : "text-zinc-600 hover:text-zinc-950"
                                }`}
                                title={emp.status === "ACTIVE" ? "Deactivate employee" : "Activate employee"}
                              >
                                {emp.status === "ACTIVE" ? (
                                  <UserMinus className="h-4 w-4 inline" />
                                ) : (
                                  <UserCheck className="h-4 w-4 inline" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
