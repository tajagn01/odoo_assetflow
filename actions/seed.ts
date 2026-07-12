"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  Role,
  AssetStatus,
  AssetCondition,
  AllocationStatus,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
} from "@prisma/client";
import { ActionResponse } from "./auth";

async function verifyAuthorized() {
  const session = await auth();
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

export async function seedDemoData(): Promise<ActionResponse> {
  try {
    const adminId = await verifyAuthorized();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    // 1. Seed Departments
    const deptsData = [
      { name: "Engineering", status: "ACTIVE" },
      { name: "Product Design", status: "ACTIVE" },
      { name: "Marketing", status: "ACTIVE" },
      { name: "Human Resources", status: "ACTIVE" },
      { name: "Finance", status: "ACTIVE" },
    ];

    const departments = [];
    for (const d of deptsData) {
      let dept = await db.department.findFirst({ where: { name: d.name } });
      if (!dept) {
        dept = await db.department.create({ data: d });
      }
      departments.push(dept);
    }

    // 2. Seed Categories
    const catsData = [
      { name: "Electronics", description: "Laptops, mobile devices, monitors, and servers" },
      { name: "Furniture", description: "Desks, Aeron chairs, whiteboards, and pods" },
      { name: "Vehicles", description: "Company shuttles, electric cars, and delivery vans" },
      { name: "Machinery", description: "3D printers, laser cutters, and lab rigs" },
    ];

    const categories = [];
    for (const c of catsData) {
      let cat = await db.assetCategory.findUnique({ where: { name: c.name } });
      if (!cat) {
        cat = await db.assetCategory.create({ data: c });
      }
      categories.push(cat);
    }

    // 3. Find some employees to link
    const employees = await db.user.findMany({
      where: { role: Role.EMPLOYEE },
      take: 5,
    });

    if (employees.length === 0) {
      return {
        success: false,
        message: "No employee accounts found. Please register at least one employee account first via signup.",
      };
    }

    // Link employees to departments
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const dept = departments[i % departments.length];
      await db.user.update({
        where: { id: emp.id },
        data: { departmentId: dept.id },
      });
    }

    // Set department managers
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      const emp = employees[i % employees.length];
      await db.department.update({
        where: { id: dept.id },
        data: { managerId: emp.id },
      });
    }

    // 4. Seed Assets (clean existing first or create new ones)
    const electronicCat = categories.find((c) => c.name === "Electronics")!;
    const furnitureCat = categories.find((c) => c.name === "Furniture")!;
    const vehicleCat = categories.find((c) => c.name === "Vehicles")!;
    const machineryCat = categories.find((c) => c.name === "Machinery")!;

    const assetsToCreate = [
      {
        name: "MacBook Pro M3 Max 16\"",
        categoryId: electronicCat.id,
        serialNumber: "SN-MBP-30918",
        acquisitionDate: new Date("2025-06-15"),
        acquisitionCost: 3499.00,
        condition: AssetCondition.NEW,
        status: AssetStatus.ALLOCATED,
        location: "Engineering HQ - Row C",
        isSharedResource: false,
        departmentId: departments[0].id,
      },
      {
        name: "Dell UltraSharp 34\" Curved Monitor",
        categoryId: electronicCat.id,
        serialNumber: "SN-DEL-99201",
        acquisitionDate: new Date("2025-07-20"),
        acquisitionCost: 899.00,
        condition: AssetCondition.GOOD,
        status: AssetStatus.ALLOCATED,
        location: "Engineering HQ - Row C",
        isSharedResource: false,
        departmentId: departments[0].id,
      },
      {
        name: "Herman Miller Aeron Chair",
        categoryId: furnitureCat.id,
        serialNumber: "SN-AER-48201",
        acquisitionDate: new Date("2024-01-10"),
        acquisitionCost: 1450.00,
        condition: AssetCondition.GOOD,
        status: AssetStatus.ALLOCATED,
        location: "Design Studio - Level 2",
        isSharedResource: false,
        departmentId: departments[1].id,
      },
      {
        name: "Tesla Model Y Performance",
        categoryId: vehicleCat.id,
        serialNumber: "SN-TSL-MY771",
        acquisitionDate: new Date("2025-02-01"),
        acquisitionCost: 52400.00,
        condition: AssetCondition.NEW,
        status: AssetStatus.AVAILABLE,
        location: "Basement Garage - Stall 12",
        isSharedResource: true,
        departmentId: departments[2].id,
      },
      {
        name: "Formlabs Form 4 3D Printer",
        categoryId: machineryCat.id,
        serialNumber: "SN-FLB-3D400",
        acquisitionDate: new Date("2024-09-12"),
        acquisitionCost: 4999.00,
        condition: AssetCondition.GOOD,
        status: AssetStatus.UNDER_MAINTENANCE,
        location: "R&D Prototype Lab",
        isSharedResource: true,
        departmentId: departments[0].id,
      },
      {
        name: "iPad Pro 13\" M4 Cellular",
        categoryId: electronicCat.id,
        serialNumber: "SN-IPD-M4801",
        acquisitionDate: new Date("2025-08-01"),
        acquisitionCost: 1299.00,
        condition: AssetCondition.NEW,
        status: AssetStatus.AVAILABLE,
        location: "Storage Safe 4A",
        isSharedResource: false,
        departmentId: departments[1].id,
      },
      {
        name: "Electric Stand-up Desk",
        categoryId: furnitureCat.id,
        serialNumber: "SN-STN-88123",
        acquisitionDate: new Date("2024-03-15"),
        acquisitionCost: 650.00,
        condition: AssetCondition.FAIR,
        status: AssetStatus.ALLOCATED,
        location: "Finance Wing",
        isSharedResource: false,
        departmentId: departments[4].id,
      },
      {
        name: "Corporate Boardroom Conference Suite",
        categoryId: furnitureCat.id,
        serialNumber: "SN-CON-RM001",
        acquisitionDate: new Date("2023-05-10"),
        acquisitionCost: 12000.00,
        condition: AssetCondition.GOOD,
        status: AssetStatus.AVAILABLE,
        location: "Executive Level - Room 402",
        isSharedResource: true,
        departmentId: departments[3].id,
      },
    ];

    let tagIndex = 1;
    const createdAssets = [];

    for (const assetData of assetsToCreate) {
      let asset = await db.asset.findUnique({
        where: { serialNumber: assetData.serialNumber },
      });

      if (!asset) {
        const paddedNum = String(tagIndex++).padStart(6, "0");
        const tag = `AF-000${paddedNum.slice(3)}`; // AF-00000X
        
        asset = await db.asset.create({
          data: {
            ...assetData,
            tag,
            currentHolderId: assetData.status === AssetStatus.ALLOCATED ? employees[tagIndex % employees.length].id : null,
          },
        });
      }
      createdAssets.push(asset);
    }

    // 5. Seed Allocations
    const allocatedAssets = createdAssets.filter((a) => a.status === AssetStatus.ALLOCATED);
    for (const asset of allocatedAssets) {
      const activeAlloc = await db.allocation.findFirst({
        where: { assetId: asset.id, status: AllocationStatus.ACTIVE },
      });

      if (!activeAlloc && asset.currentHolderId) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 20);

        await db.allocation.create({
          data: {
            assetId: asset.id,
            userId: asset.currentHolderId,
            allocatedById: adminId,
            expectedReturnDate: futureDate,
            conditionOnAllocation: AssetCondition.GOOD,
            status: AllocationStatus.ACTIVE,
            createdAt: pastDate,
          },
        });
      }
    }

    // 6. Seed Bookings
    const bookingResources = createdAssets.filter((a) => a.isSharedResource);
    for (let i = 0; i < bookingResources.length; i++) {
      const resource = bookingResources[i];
      
      const count = await db.resourceBooking.count({ where: { assetId: resource.id } });
      if (count === 0) {
        const start = new Date();
        start.setDate(start.getDate() + (i * 2) + 1);
        start.setHours(9, 0, 0, 0);

        const end = new Date(start);
        end.setHours(17, 0, 0, 0);

        await db.resourceBooking.create({
          data: {
            assetId: resource.id,
            userId: employees[i % employees.length].id,
            startTime: start,
            endTime: end,
            status: BookingStatus.UPCOMING,
          },
        });
      }
    }

    // 7. Seed Maintenance Requests
    const repairAssets = createdAssets.filter((a) => a.status === AssetStatus.UNDER_MAINTENANCE);
    for (const asset of repairAssets) {
      const activeReq = await db.maintenanceRequest.findFirst({
        where: { assetId: asset.id, status: MaintenanceStatus.PENDING },
      });

      if (!activeReq) {
        await db.maintenanceRequest.create({
          data: {
            assetId: asset.id,
            raisedById: employees[0].id,
            issueDescription: "Fume extractor fans malfunctioning. Prints failing due to thermal warnings.",
            priority: MaintenancePriority.HIGH,
            status: MaintenanceStatus.PENDING,
          },
        });
      }
    }

    // 8. Seed Activity Logs
    const logCount = await db.activityLog.count();
    if (logCount < 5) {
      const actions = ["CREATE_ASSET", "ALLOCATE_ASSET", "CREATE_BOOKING", "RAISE_MAINTENANCE"];
      for (let i = 0; i < 15; i++) {
        const action = actions[i % actions.length];
        const asset = createdAssets[i % createdAssets.length];
        await db.activityLog.create({
          data: {
            userId: adminId,
            action,
            entityType: "Asset",
            entityId: asset.id,
            timestamp: new Date(Date.now() - (i * 24 * 3600000)), // dynamic past dates
          },
        });
      }
    }

    return {
      success: true,
      message: "Realistic demo data seeded successfully. Reload dashboard to view updated statistics.",
    };
  } catch (error: any) {
    console.error("Demo seeding error:", error);
    return { success: false, message: error.message || "Failed to seed demo data." };
  }
}
