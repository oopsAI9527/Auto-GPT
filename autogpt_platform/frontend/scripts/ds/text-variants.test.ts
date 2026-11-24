import { describe, expect, it } from "vitest";
import { rewriteTextVariants } from "./text-variants";

const IMPORT = `import { Text } from "@/components/atoms/Text/Text";\n`;

function rewrite(jsx: string, imports = IMPORT) {
  const { output, changes, manual } = rewriteTextVariants(
    `${imports}const a = ${jsx};\n`,
    "file.tsx",
  );
  return {
    output: output.slice(imports.length + "const a = ".length, -2),
    changes,
    manual,
  };
}

describe("rewriteTextVariants", () => {
  it("rewrites an old variant to its role and props", () => {
    expect(rewrite(`<Text variant="small-medium-tight">x</Text>`).output).toBe(
      `<Text variant="small" weight="medium" leading="4">x</Text>`,
    );
  });

  it("writes a boolean prop as shorthand and keeps the old element", () => {
    expect(rewrite(`<Text variant="small-mono-tight">x</Text>`).output).toBe(
      `<Text variant="small" as="code" mono leading="4">x</Text>`,
    );
  });

  it("lets a prop already at the call site win over the old variant's", () => {
    expect(
      rewrite(`<Text variant="small-medium" weight="semibold">x</Text>`).output,
    ).toBe(`<Text variant="small" weight="semibold">x</Text>`);
    expect(
      rewrite(`<Text as="span" variant="small-mono-tight">x</Text>`).output,
    ).toBe(`<Text as="span" variant="small" mono leading="4">x</Text>`);
  });

  it("leaves a role, and other components, alone", () => {
    const role = rewrite(`<Text variant="small" weight="medium">x</Text>`);
    expect(role.changes).toEqual([]);
    expect(rewrite(`<Button variant="body-medium">x</Button>`).changes).toEqual(
      [],
    );
    expect(rewrite(`<Text variant="body-medium">x</Text>`, "").changes).toEqual(
      [],
    );
  });

  it("reads a quoted expression and rewrites size", () => {
    expect(rewrite(`<Text variant={"body-medium"}>x</Text>`).output).toBe(
      `<Text variant="body" weight="medium">x</Text>`,
    );
    expect(
      rewrite(`<Text variant="h4" size="body-medium">x</Text>`).output,
    ).toBe(`<Text variant="h4" size="body" weight="medium">x</Text>`);
    expect(
      rewrite(`<Text variant="small-mono-tight" size="h3">x</Text>`).output,
    ).toBe(`<Text variant="small" size="h3" as="code">x</Text>`);
  });

  it("puts the props before a spread that precedes the variant", () => {
    expect(
      rewrite(`<Text {...rest} variant="body-medium">x</Text>`).output,
    ).toBe(`<Text weight="medium" {...rest} variant="body">x</Text>`);
  });

  it("reports dynamic variants and dynamic props it would override", () => {
    const dynamic = rewrite(
      `<Text variant={big ? "body-medium" : "small"}>x</Text>`,
    );
    expect(dynamic.changes).toEqual([]);
    expect(dynamic.manual).toEqual([
      expect.objectContaining({
        line: 2,
        reason: expect.stringMatching(/variant/),
      }),
    ]);
    const prop = rewrite(`<Text variant="small-medium" weight={w}>x</Text>`);
    expect(prop.changes).toEqual([]);
    expect(prop.manual).toHaveLength(1);
  });

  it("reads a relative import of the atom", () => {
    expect(
      rewrite(
        `<Text variant="small-medium">x</Text>`,
        `import { Text } from "../Text/Text";\n`,
      ).output,
    ).toBe(`<Text variant="small" weight="medium">x</Text>`);
  });

  it("never adds an element to OverflowText, which renders a span", () => {
    expect(
      rewrite(
        `<OverflowText variant="small-mono-tight" value="x" />`,
        `import { OverflowText } from "@/components/atoms/OverflowText/OverflowText";\n`,
      ).output,
    ).toBe(`<OverflowText variant="small" mono leading="4" value="x" />`);
  });
});
