import { describe, it, expect } from "vitest";
import { UnitTimeConverterCapability } from "../../src/capabilities/utility/unit-time-converter.js";

describe("UnitTimeConverterCapability", () => {
  const capability = new UnitTimeConverterCapability();

  it("should convert length units (miles to kilometers and meters to feet)", async () => {
    const res1 = await capability.execute({
      mode: "unit",
      value: 10,
      fromUnit: "mi",
      toUnit: "km",
    });

    expect(res1.success).toBe(true);
    expect(res1.data?.unitResult?.toValue).toBeCloseTo(16.09344, 4);

    const res2 = await capability.execute({
      mode: "unit",
      value: 1,
      fromUnit: "m",
      toUnit: "ft",
    });

    expect(res2.success).toBe(true);
    expect(res2.data?.unitResult?.toValue).toBeCloseTo(3.28084, 4);
  });

  it("should convert temperature units (Celsius to Fahrenheit and Kelvin)", async () => {
    const resF = await capability.execute({
      mode: "unit",
      value: 100,
      fromUnit: "C",
      toUnit: "F",
    });

    expect(resF.success).toBe(true);
    expect(resF.data?.unitResult?.toValue).toBe(212);

    const resK = await capability.execute({
      mode: "unit",
      value: 0,
      fromUnit: "C",
      toUnit: "K",
    });

    expect(resK.success).toBe(true);
    expect(resK.data?.unitResult?.toValue).toBe(273.15);
  });

  it("should convert mass and volume units", async () => {
    const resMass = await capability.execute({
      mode: "unit",
      value: 1,
      fromUnit: "kg",
      toUnit: "lb",
    });
    expect(resMass.success).toBe(true);
    expect(resMass.data?.unitResult?.toValue).toBeCloseTo(2.20462, 4);

    const resVol = await capability.execute({
      mode: "unit",
      value: 1,
      fromUnit: "gal",
      toUnit: "l",
    });
    expect(resVol.success).toBe(true);
    expect(resVol.data?.unitResult?.toValue).toBeCloseTo(3.78541, 4);
  });

  it("should convert speed units", async () => {
    const res = await capability.execute({
      mode: "unit",
      value: 60,
      fromUnit: "mph",
      toUnit: "km/h",
    });
    expect(res.success).toBe(true);
    expect(res.data?.unitResult?.toValue).toBeCloseTo(96.5606, 2);
  });

  it("should convert unix timestamps and format timezones", async () => {
    const res = await capability.execute({
      mode: "time",
      timeInput: 1700000000,
      targetTimezone: "UTC",
    });

    expect(res.success).toBe(true);
    expect(res.data?.timeResult?.iso).toBe("2023-11-14T22:13:20.000Z");
    expect(res.data?.timeResult?.timestampSeconds).toBe(1700000000);
    expect(res.data?.timeResult?.formattedInTimezone).toBeDefined();
  });

  it("should return error for incompatible units", async () => {
    const res = await capability.execute({
      mode: "unit",
      value: 10,
      fromUnit: "kg",
      toUnit: "km",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("UNSUPPORTED_OR_INCOMPATIBLE_UNIT");
  });
});
