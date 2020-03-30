---
title: "Migrating to Entity Framework Core Seed Data"
description: "How to migrate an existing database to use Entity Framework Core 2.1 Seed Data to insert static data into your tables while using migrations."
author: "Muhammad Rehan Saeed"
permalink: "/migrating-to-entity-framework-core-seed-data/"
cover_image: "/images/hero/NET-1366x768.png"
date: "2018-07-01"
published: true
categories:
  - "Entity Framework Core"
tags:
  - "Entity Framework Core"
  - "Migrations"
  - "Seed Data"
---

I was already using Entity Framework Core 2.0 and had written some custom code to enter some static seed data to certain tables. Entity Framework 2.1 added support for [data seeding](https://docs.microsoft.com/en-us/ef/core/modeling/data-seeding) which manages your seed data for you and adds them to your Entity Framework Core migrations.

The problem is that if you've already got data in your tables, when you add a migration containing seed data, you will get exceptions thrown as Entity Framework tries to insert data that is already there. Entity Framework is naive, it assumes that it is the only thing editing the database.

Migrating to using data seeding requires a few extra steps that aren't documented anywhere and weren't obvious to me. Lets walk through an example. Assuming we have the following model and database context:

```cs
public class Car
{
    public int CarId { get; set; }

    public string Make { get; set; }

    public string Model { get; set; }
}

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions options)
        : base(options)
    {
    }

    public DbSet<Car> Cars { get; set; }
}
```

We can add some seed data by overriding the OnModelCreating method on our database context class. You need to make sure your seed data matches the existing data in your database.

```cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Car>().HasData(
        new Car() { CarId = 1, Make = "Ferrari", Model = "F40" },
        new Car() { CarId = 2, Make = "Ferrari", Model = "F50" },
        new Car() { CarId = 3, Make = "Lambourghini", Model = "Countach" });
}
```

If we run a command to add a database migration, the generated code looks like this:

```powershell
dotnet ef migrations add AddSeedData
```

```cs
public partial class AddSeedData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.InsertData(
            table: "Cars",
            columns: new[] { "CarId", "Make", "Model" },
            values: new object[] { 1, "Ferrari", "F40" });

        migrationBuilder.InsertData(
            table: "Cars",
            columns: new[] { "CarId", "Make", "Model" },
            values: new object[] { 2, "Ferrari", "F50" });

        migrationBuilder.InsertData(
            table: "Cars",
            columns: new[] { "CarId", "Make", "Model" },
            values: new object[] { 3, "Lambourghini", "Countach" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(
            table: "Cars",
            keyColumn: "CarId",
            keyValue: 1);

        migrationBuilder.DeleteData(
            table: "Cars",
            keyColumn: "CarId",
            keyValue: 2);

        migrationBuilder.DeleteData(
            table: "Cars",
            keyColumn: "CarId",
            keyValue: 3);
    }
}
```

This is what you need to do:

1. Comment out all of the InsertData lines in the generated migration.
2. Run the migration on your database containing the existing seed data. This is effectively doing a null operation but records the fact that the AddSeedData migration has been run.
3. Uncomment the InsertData lines in the generated migration so that if you run the migrations on a fresh database, seed data still gets added. For your existing databases, since the migration has already been run on them, they will not add the seed data twice.

That's it, hope that helps someone.
