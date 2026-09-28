import { describe, it, expect } from "vitest";
import { CsvProcessorCapability } from "../../src/capabilities/data/csv-processor.js";

describe("CsvProcessorCapability", () => {
  const capability = new CsvProcessorCapability();
  const sampleCsv = `name,age,city,active
Alice,30,"New York, NY",true
Bob,25,London,false
Charlie,35,Tokyo,true`;

  it("should parse CSV into structured rows and headers handling quoted commas", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "parse",
    });

    expect(res.success).toBe(true);
    expect(res.data?.headers).toEqual(["name", "age", "city", "active"]);
    expect(res.data?.rowCount).toBe(3);
    expect(res.data?.rows?.[0]).toEqual(["Alice", "30", "New York, NY", "true"]);
  });

  it("should inspect CSV structure and infer column types", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "inspect",
    });

    expect(res.success).toBe(true);
    expect(res.data?.stats?.rowCount).toBe(3);
    expect(res.data?.stats?.columnCount).toBe(4);
    expect(res.data?.stats?.columnTypes.age).toBe("number");
    expect(res.data?.stats?.columnTypes.active).toBe("boolean");
    expect(res.data?.stats?.columnTypes.city).toBe("string");
  });

  it("should filter rows based on safe numeric condition", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "filter",
      filterColumn: "age",
      filterOperator: "greater_than",
      filterValue: "28",
    });

    expect(res.success).toBe(true);
    expect(res.data?.rowCount).toBe(2); // Alice (30) and Charlie (35)
    expect(res.data?.rows?.map((r) => r[0])).toEqual(["Alice", "Charlie"]);
  });

  it("should sort CSV data by column", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "sort",
      sortColumn: "age",
      sortDirection: "asc",
    });

    expect(res.success).toBe(true);
    expect(res.data?.rows?.map((r) => r[0])).toEqual(["Bob", "Alice", "Charlie"]);
  });

  it("should select specific columns", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "select_columns",
      selectedColumns: ["name", "city"],
    });

    expect(res.success).toBe(true);
    expect(res.data?.headers).toEqual(["name", "city"]);
    expect(res.data?.rows?.[0]).toEqual(["Alice", "New York, NY"]);
  });

  it("should convert CSV to array of JSON records", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "to_json",
    });

    expect(res.success).toBe(true);
    expect(res.data?.jsonData?.length).toBe(3);
    expect(res.data?.jsonData?.[0]).toEqual({
      name: "Alice",
      age: 30,
      city: "New York, NY",
      active: true,
    });
  });

  it("should return clean error when filtering on non-existent column", async () => {
    const res = await capability.execute({
      csvText: sampleCsv,
      operation: "filter",
      filterColumn: "salary",
      filterOperator: "equals",
      filterValue: "50000",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("COLUMN_NOT_FOUND");
    expect(res.error?.message).toContain("Available columns");
  });
});
