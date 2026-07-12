import { Role, AssetStatus, AssetCondition, AllocationStatus, BookingStatus, MaintenancePriority, MaintenanceStatus } from "@prisma/client";
import { db } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // Delete existing records to allow clean re-seeding without constraint conflicts
  await db.activityLog.deleteMany({});
  await db.maintenanceRequest.deleteMany({});
  await db.resourceBooking.deleteMany({});
  await db.allocation.deleteMany({});
  await db.auditItem.deleteMany({});
  await (db as any).assetDocument.deleteMany({});
  await db.asset.deleteMany({});

  // 1. Seed Users (Admin, Manager, Head, Employees)
  const adminHash = await bcrypt.hash("AdminPassword123!", 10);
  const managerHash = await bcrypt.hash("ManagerPassword123!", 10);
  const headHash = await bcrypt.hash("HeadPassword123!", 10);
  const employeeHash = await bcrypt.hash("EmployeePassword123!", 10);

  // Admin
  let admin = await db.user.findUnique({ where: { email: "newadmin@assetflow.com" } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        name: "Admin Administrator",
        email: "newadmin@assetflow.com",
        passwordHash: adminHash,
        role: Role.ADMIN,
        status: "ACTIVE",
      },
    });
    console.log("✅ Seeded Admin: newadmin@assetflow.com");
  }

  // Other Users
  const employeeData = [
    { name: "Priya Patel", email: "priya@assetflow.com", role: Role.EMPLOYEE, passwordHash: employeeHash },
    { name: "Raj Sharma", email: "raj@assetflow.com", role: Role.EMPLOYEE, passwordHash: employeeHash },
    { name: "Amit Verma", email: "amit@assetflow.com", role: Role.EMPLOYEE, passwordHash: employeeHash },
    { name: "Sneha Reddy", email: "sneha@assetflow.com", role: Role.EMPLOYEE, passwordHash: employeeHash },
    { name: "Asset Manager", email: "manager@assetflow.com", role: Role.ASSET_MANAGER, passwordHash: managerHash },
    { name: "Department Head", email: "head@assetflow.com", role: Role.DEPARTMENT_HEAD, passwordHash: headHash },
  ];

  const employees = [];
  for (const emp of employeeData) {
    let user = await db.user.findUnique({ where: { email: emp.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          passwordHash: emp.passwordHash,
          role: emp.role,
          status: "ACTIVE",
        },
      });
      console.log(`✅ Seeded User: ${emp.email} [${emp.role}]`);
    }
    employees.push(user);
  }

  // 2. Seed Departments
  const deptsData = [
    { name: "Engineering" },
    { name: "Product Design" },
    { name: "Marketing" },
    { name: "Finance" },
  ];

  const departments = [];
  for (const d of deptsData) {
    let dept = await db.department.findFirst({ where: { name: d.name } });
    if (!dept) {
      dept = await db.department.create({
        data: {
          name: d.name,
          status: "ACTIVE",
        },
      });
      console.log(`✅ Seeded Department: ${d.name}`);
    }
    departments.push(dept);
  }

  // Link employees to departments & set managers
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const dept = departments[i % departments.length];
    
    let targetDept = dept;
    if (emp.role === Role.DEPARTMENT_HEAD) {
      const designDept = departments.find(d => d.name === "Product Design");
      if (designDept) targetDept = designDept;
    }
    
    await db.user.update({
      where: { id: emp.id },
      data: { departmentId: targetDept.id },
    });

    if (emp.role === Role.DEPARTMENT_HEAD || emp.role === Role.EMPLOYEE) {
      await db.department.update({
        where: { id: targetDept.id },
        data: { managerId: emp.id },
      });
    }
  }

  // 3. Seed Categories
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
      console.log(`✅ Seeded Category: ${c.name}`);
    }
    categories.push(cat);
  }

  const electronicCat = categories.find((c) => c.name === "Electronics")!;
  const furnitureCat = categories.find((c) => c.name === "Furniture")!;
  const vehicleCat = categories.find((c) => c.name === "Vehicles")!;
  const machineryCat = categories.find((c) => c.name === "Machinery")!;

  // 4. Seed Assets
  const assetsToCreate = [
    {
      name: "MacBook Pro M3 Max 16\"",
      categoryId: electronicCat.id,
      serialNumber: "SN-MBP-30918",
      acquisitionDate: new Date("2025-06-15"),
      acquisitionCost: 250000.00,
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
      acquisitionCost: 75000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.AVAILABLE,
      location: "Engineering HQ - Row C",
      isSharedResource: false,
      departmentId: departments[0].id,
    },
    {
      name: "Herman Miller Aeron Chair",
      categoryId: furnitureCat.id,
      serialNumber: "SN-AER-48201",
      acquisitionDate: new Date("2024-01-10"),
      acquisitionCost: 120000.00,
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
      acquisitionCost: 4500000.00,
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
      acquisitionCost: 400000.00,
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
      acquisitionCost: 110000.00,
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
      acquisitionCost: 55000.00,
      condition: AssetCondition.FAIR,
      status: AssetStatus.ALLOCATED,
      location: "Finance Wing",
      isSharedResource: false,
      departmentId: departments[3].id,
    },
    {
      name: "iPhone 16 Pro Max",
      categoryId: electronicCat.id,
      serialNumber: "SN-IPH-16PM9",
      acquisitionDate: new Date("2025-09-20"),
      acquisitionCost: 145000.00,
      condition: AssetCondition.NEW,
      status: AssetStatus.ALLOCATED,
      location: "Marketing Room 2B",
      isSharedResource: false,
      departmentId: departments[2].id,
    },
    {
      name: "ThinkPad P1 Gen 7 Workstation",
      categoryId: electronicCat.id,
      serialNumber: "SN-THK-P1G7",
      acquisitionDate: new Date("2025-03-10"),
      acquisitionCost: 180000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.AVAILABLE,
      location: "Finance Wing",
      isSharedResource: false,
      departmentId: departments[3].id,
    },
    {
      name: "Steelcase Gesture Office Chair",
      categoryId: furnitureCat.id,
      serialNumber: "SN-STC-GEST",
      acquisitionDate: new Date("2024-05-18"),
      acquisitionCost: 95000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.AVAILABLE,
      location: "Design Studio - Level 2",
      isSharedResource: false,
      departmentId: departments[1].id,
    },
    {
      name: "Sony Alpha 7 IV Camera Kit",
      categoryId: electronicCat.id,
      serialNumber: "SN-SON-A7IV",
      acquisitionDate: new Date("2024-11-05"),
      acquisitionCost: 220000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.ALLOCATED,
      location: "Marketing Room 2B",
      isSharedResource: false,
      departmentId: departments[2].id,
    },
    {
      name: "Industrial Laser Engraver",
      categoryId: machineryCat.id,
      serialNumber: "SN-LSR-ENG",
      acquisitionDate: new Date("2024-07-22"),
      acquisitionCost: 350000.00,
      condition: AssetCondition.FAIR,
      status: AssetStatus.UNDER_MAINTENANCE,
      location: "R&D Prototype Lab",
      isSharedResource: true,
      departmentId: departments[1].id,
    },
    {
      name: "Company Shuttle Van (Electric)",
      categoryId: vehicleCat.id,
      serialNumber: "SN-VAN-EV200",
      acquisitionDate: new Date("2025-01-15"),
      acquisitionCost: 2400000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.AVAILABLE,
      location: "Basement Garage - Stall 14",
      isSharedResource: true,
      departmentId: departments[0].id,
    },
    {
      name: "Lounge Sofa Sectional",
      categoryId: furnitureCat.id,
      serialNumber: "SN-LOUNG-SOF",
      acquisitionDate: new Date("2024-08-10"),
      acquisitionCost: 150000.00,
      condition: AssetCondition.GOOD,
      status: AssetStatus.AVAILABLE,
      location: "Marketing Hub Lounge",
      isSharedResource: false,
      departmentId: departments[2].id,
    },
    {
      name: "High-Capacity Forklift",
      categoryId: machineryCat.id,
      serialNumber: "SN-FRK-LFT",
      acquisitionDate: new Date("2023-05-12"),
      acquisitionCost: 850000.00,
      condition: AssetCondition.POOR,
      status: AssetStatus.LOST,
      location: "Loading Dock B",
      isSharedResource: false,
      departmentId: departments[0].id,
    }
  ];

  let tagIndex = 1;
  const seededAssets = [];
  for (const assetData of assetsToCreate) {
    let asset = await db.asset.findUnique({ where: { serialNumber: assetData.serialNumber } });
    if (!asset) {
      let tag = "";
      let exists = true;
      while (exists) {
        const paddedNum = String(tagIndex++).padStart(6, "0");
        tag = `AF-${paddedNum}`;
        const existingAsset = await db.asset.findUnique({ where: { tag } });
        if (!existingAsset) {
          exists = false;
        }
      }
      
      asset = await db.asset.create({
        data: {
          ...assetData,
          tag,
          currentHolderId: assetData.status === AssetStatus.ALLOCATED ? employees[tagIndex % employees.length].id : null,
        },
      });
      console.log(`✅ Seeded Asset: [${tag}] ${assetData.name}`);
    }
    seededAssets.push(asset);
  }

  // 5. Seed Allocations
  const allocated = seededAssets.filter((a) => a.status === AssetStatus.ALLOCATED);
  for (const asset of allocated) {
    if (asset.currentHolderId) {
      const activeAlloc = await db.allocation.findFirst({
        where: { assetId: asset.id, status: AllocationStatus.ACTIVE },
      });

      if (!activeAlloc) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 20);

        await db.allocation.create({
          data: {
            assetId: asset.id,
            userId: asset.currentHolderId,
            allocatedById: admin.id,
            expectedReturnDate: futureDate,
            conditionOnAllocation: AssetCondition.GOOD,
            status: AllocationStatus.ACTIVE,
            createdAt: pastDate,
          },
        });
        console.log(`✅ Seeded Active Allocation for: ${asset.name}`);
      }
    }
  }

  // 6. Seed Bookings
  const bookingResources = seededAssets.filter((a) => a.isSharedResource);
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
      console.log(`✅ Seeded Booking for shared resource: ${resource.name}`);
    }
  }

  // 7. Seed Maintenance Requests
  const repairAssets = seededAssets.filter((a) => a.status === AssetStatus.UNDER_MAINTENANCE);
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
      console.log(`✅ Seeded Maintenance request for: ${asset.name}`);
    }
  }

  // 8. Seed Activity Logs
  const logCount = await db.activityLog.count();
  if (logCount < 5) {
    const actions = ["CREATE_ASSET", "ALLOCATE_ASSET", "CREATE_BOOKING", "RAISE_MAINTENANCE"];
    for (let i = 0; i < 15; i++) {
      const action = actions[i % actions.length];
      const asset = seededAssets[i % seededAssets.length];
      await db.activityLog.create({
        data: {
          userId: admin.id,
          action,
          entityType: "Asset",
          entityId: asset.id,
          timestamp: new Date(Date.now() - (i * 24 * 3600000)),
        },
      });
    }
    console.log("✅ Seeded Activity Logs Timeline.");
  }

  console.log("🌱 Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
