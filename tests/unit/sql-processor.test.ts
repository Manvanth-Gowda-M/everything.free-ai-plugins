import { describe, it, expect } from "vitest";
import {
  SqlProcessorCapability,
  SqlProcessorOutput,
} from "../../src/capabilities/data/sql-processor.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("SqlProcessorCapability", () => {
  const capability = new SqlProcessorCapability();

  describe("format operation", () => {
    it("should format complex SELECT query with JOINs, WHERE, and GROUP BY", async () => {
      const unformatted =
        "select u.id, u.name, count(o.id) as order_count from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2025-01-01' group by u.id, u.name order by order_count desc limit 10;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: unformatted,
        operation: "format",
        indent: 2,
      });

      expect(res.success).toBe(true);
      expect(res.data?.operation).toBe("format");
      expect(res.data?.result).toBeDefined();
      expect(res.data?.result).toContain("SELECT");
      expect(res.data?.result).toContain("FROM");
      expect(res.data?.result).toContain("LEFT JOIN");
      expect(res.data?.result).toContain("WHERE");
      expect(res.data?.result).toContain("GROUP BY");
      expect(res.data?.result).toContain("ORDER BY");
      expect(res.data?.result).toContain("LIMIT");
      // Check that string literal is preserved
      expect(res.data?.result).toContain("'2025-01-01'");
    });

    it("should format INSERT and UPDATE statements", async () => {
      const insertSql =
        "insert into users (name, email, role) values ('Alice', 'alice@example.com', 'admin');";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: insertSql,
        operation: "format",
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toContain("INSERT INTO");
      expect(res.data?.result).toContain("VALUES");
    });

    it("should format nested subqueries with indentation", async () => {
      const nested =
        "SELECT id, (SELECT MAX(amount) FROM payments WHERE user_id = u.id) AS max_pay FROM users u;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: nested,
        operation: "format",
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toContain("(SELECT");
    });

    it("should preserve comments in formatted output", async () => {
      const commented =
        "-- Fetch active customers\nSELECT * FROM customers WHERE is_active = true;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: commented,
        operation: "format",
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toContain("-- Fetch active customers");
    });
  });

  describe("inspect operation", () => {
    it("should extract statement types, tables, joins, and parameters", async () => {
      const multiSql =
        "SELECT u.id, u.name FROM users u INNER JOIN accounts a ON u.id = a.user_id WHERE u.status = ? AND a.balance > :minBalance;\n" +
        "UPDATE accounts SET balance = balance - 100 WHERE id = $1;\n" +
        "DELETE FROM sessions WHERE expired_at < @cutoff;";

      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: multiSql,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      const stats = res.data?.stats;
      expect(stats).toBeDefined();
      expect(stats?.statementCount).toBe(3);
      expect(stats?.statements[0].type).toBe("SELECT");
      expect(stats?.statements[1].type).toBe("UPDATE");
      expect(stats?.statements[2].type).toBe("DELETE");

      expect(stats?.totalTables).toContain("users");
      expect(stats?.totalTables).toContain("accounts");
      expect(stats?.totalTables).toContain("sessions");

      expect(stats?.totalParameters).toContain("?");
      expect(stats?.totalParameters).toContain(":minBalance");
      expect(stats?.totalParameters).toContain("$1");
      expect(stats?.totalParameters).toContain("@cutoff");

      expect(stats?.statements[0].joins).toHaveLength(1);
      expect(stats?.statements[0].joins[0].type).toBe("INNER JOIN");
      expect(stats?.statements[0].hasWhere).toBe(true);
    });

    it("should accurately track maximum subquery nesting depth", async () => {
      const deepSql =
        "SELECT * FROM t1 WHERE id IN (SELECT t1_id FROM t2 WHERE id IN (SELECT t2_id FROM t3));";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: deepSql,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.stats?.maxNestingDepth).toBe(2);
    });
  });

  describe("validate operation", () => {
    it("should pass valid SQL and report dialect notice", async () => {
      const validSql =
        "SELECT id, name FROM employees WHERE department_id = 42 ORDER BY hire_date DESC;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: validSql,
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(true);
      expect(res.data?.errors).toBeUndefined();
      expect(res.data?.dialectNotice).toBeDefined();
    });

    it("should catch unclosed parentheses", async () => {
      const invalidSql = "SELECT * FROM users WHERE id IN (1, 2, 3;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: invalidSql,
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.errors).toBeDefined();
      expect(res.data?.errors?.[0].message).toContain("Unclosed opening parenthesis");
    });

    it("should catch unterminated single quotes", async () => {
      const unclosedQuoteSql = "SELECT * FROM users WHERE name = 'Alice;";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: unclosedQuoteSql,
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.errors?.[0].message).toContain("Unterminated single-quoted string literal");
    });
  });

  describe("minify operation", () => {
    it("should compact SQL and strip comments while preserving literals", async () => {
      const verboseSql = `
        -- Fetch user profile
        SELECT
          id,
          name,
          'Hello World -- not a comment' AS greeting
        FROM
          users
        WHERE
          active = true /* inline block comment */
          AND age >= 18;
      `;

      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: verboseSql,
        operation: "minify",
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toBeDefined();
      expect(res.data?.result).not.toContain("-- Fetch user profile");
      expect(res.data?.result).not.toContain("/* inline block comment */");
      expect(res.data?.result).toContain("'Hello World -- not a comment'");
      expect(res.data?.result).toBe(
        "SELECT id,name,'Hello World -- not a comment' AS greeting FROM users WHERE active=true AND age>=18;"
      );
    });
  });

  describe("Safety & Invariant Tests", () => {
    it("should safely parse potentially malicious SQL without executing", async () => {
      const maliciousSql = "SELECT * FROM users WHERE id = '1'; DROP TABLE users; --";
      const res = await ExecutionRunner.run<SqlProcessorOutput>(capability, {
        sql: maliciousSql,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.stats?.totalTables).toContain("users");
    });

    it("should reject empty SQL inputs via Zod validation", async () => {
      const res = await ExecutionRunner.run(capability, {
        sql: "",
      });

      expect(res.success).toBe(false);
      expect(res.error?.message).toContain("Input SQL string cannot be empty");
    });
  });
});
