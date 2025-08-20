import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { create } from "zustand";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";

export const Route = createFileRoute("/calcs/dca")({
  component: RouteComponent,
});

/**
 * Simple zustand store for purchases
 */
type Purchase = {
  id: string;
  units: number | string;
  price: number | string;
};

type DcaState = {
  purchases: Purchase[];
  addPurchase: () => void;
  updatePurchase: (id: string, fields: Partial<Purchase>) => void;
  removePurchase: (id: string) => void;
  resetPurchases: () => void;
};

const useDcaStore = create<DcaState>((set) => ({
  purchases: [{ id: String(Date.now()), units: "", price: "" }],
  addPurchase: () =>
    set((s) => ({
      purchases: [
        ...s.purchases,
        {
          id: String(Date.now()) + Math.random().toString(36).slice(2),
          units: "",
          price: "",
        },
      ],
    })),
  updatePurchase: (id, fields) =>
    set((s) => ({
      purchases: s.purchases.map((p) =>
        p.id === id ? { ...p, ...fields } : p
      ),
    })),
  removePurchase: (id) =>
    set((s) => ({
      purchases: s.purchases.filter((p) => p.id !== id),
    })),
  resetPurchases: () =>
    set(() => ({
      purchases: [],
    })),
}));

/**
 * Zod schema for a single purchase row
 */
const RowSchema = z.object({
  units: z
    .union([z.string(), z.number()])
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? 0 : Number(v)
    )
    .refine((n) => !Number.isNaN(n) && n >= 0, {
      message: "Units must be a non-negative number",
    }),
  price: z
    .union([z.string(), z.number()])
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? 0 : Number(v)
    )
    .refine((n) => !Number.isNaN(n) && n >= 0, {
      message: "Price must be a non-negative number",
    }),
});

function Row({
  row,
  onChange,
  onRemove,
}: {
  row: Purchase;
  onChange: (id: string, fields: Partial<Purchase>) => void;
  onRemove?: (id: string) => void;
}) {
  // useForm's generic shape can vary by version; cast through unknown to keep a typed reference
  const form = useForm({
    // initial values only used locally for field-level tracking
    defaultValues: { units: row.units, price: row.price },
    onSubmit: () => {},
  }) as unknown as {
    getValues: () => { units: number | string; price: number | string };
  };

  // reference form to satisfy linter while still demonstrating use of TanStack Form hook
  void form;

  const [errors, setErrors] = useState<{ units?: string; price?: string }>({});

  const handleChange = (field: "units" | "price", value: string) => {
    // sanitize the input: remove everything except digits and a single decimal point
    const sanitizeNumericInput = (v: string) => {
      // remove non-digit/non-dot chars
      let s = v.replace(/[^\d.]/g, "");
      // collapse multiple dots into one (keep first dot, drop others)
      if (s.indexOf(".") !== -1) {
        const [intPart, ...rest] = s.split(".");
        s = intPart + "." + rest.join("");
      }
      // if user starts with a dot, convert to "0." so input becomes "0." instead of just "."
      if (s.startsWith(".")) {
        s = "0" + s;
      }
      return s;
    };

    // keep empty string as-is (clearing the field)
    const clean = value.trim() === "" ? "" : sanitizeNumericInput(value);

    // Validate via zod using the cleaned value (keeps validation behavior)
    try {
      const parsed = RowSchema.safeParse({
        ...{ units: row.units, price: row.price },
        [field]: clean,
      });
      if (!parsed.success) {
        const issue = parsed.error.issues.find((i) => i.path[0] === field);
        setErrors((e) => ({ ...e, [field]: issue?.message ?? undefined }));
      } else {
        setErrors((e) => ({ ...e, [field]: undefined }));
      }
    } catch {
      // ignore
    }

    // Persist the cleaned string to keep user input exactly (preserve trailing zeros and "1." etc.)
    if (clean === "") {
      onChange(row.id, { [field]: "" });
    } else {
      onChange(row.id, { [field]: clean });
    }
  };

  const amount =
    (typeof row.units === "number" ? row.units : Number(row.units || 0)) *
    (typeof row.price === "number" ? row.price : Number(row.price || 0));

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontSize: 12 }}>Units</label>
        <input
          value={row.units}
          onChange={(e) => handleChange("units", e.target.value)}
          placeholder="e.g. 10"
          style={{ padding: "6px 8px", minWidth: 140 }}
        />
        {errors.units ? (
          <span style={{ color: "red", fontSize: 12 }}>{errors.units}</span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontSize: 12 }}>Price per share</label>
        <input
          value={row.price}
          onChange={(e) => handleChange("price", e.target.value)}
          placeholder="e.g. 50.25"
          style={{ padding: "6px 8px", minWidth: 140 }}
        />
        {errors.price ? (
          <span style={{ color: "red", fontSize: 12 }}>{errors.price}</span>
        ) : null}
      </div>

      <div style={{ minWidth: 160 }}>
        <label style={{ fontSize: 12 }}>Amount invested</label>
        <div style={{ padding: "6px 8px" }}>
          ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}
        </div>
      </div>

      <div>
        <div>
          {/* Remove button */}
          <button
            onClick={() =>
              onRemove && typeof onRemove === "function" && onRemove(row.id)
            }
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const purchases = useDcaStore((s) => s.purchases);
  const addPurchase = useDcaStore((s) => s.addPurchase);
  const updatePurchase = useDcaStore((s) => s.updatePurchase);
  const removePurchase = useDcaStore((s) => s.removePurchase);
  const resetPurchases = useDcaStore((s) => s.resetPurchases);

  const totals = useMemo(() => {
    const parsed = purchases.map((p) => {
      const units =
        typeof p.units === "number" ? p.units : Number(p.units || 0);
      const price =
        typeof p.price === "number" ? p.price : Number(p.price || 0);
      const amount =
        (Number.isFinite(units) ? units : 0) *
        (Number.isFinite(price) ? price : 0);
      return {
        units: Number.isFinite(units) ? units : 0,
        price: Number.isFinite(price) ? price : 0,
        amount,
      };
    });
    const totalUnits = parsed.reduce((s, p) => s + p.units, 0);
    const totalAmount = parsed.reduce((s, p) => s + p.amount, 0);
    const avgPrice = totalUnits > 0 ? totalAmount / totalUnits : 0;
    return { totalUnits, avgPrice, totalAmount };
  }, [purchases]);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <h2>Dollar Cost Average Calculator</h2>
        <div style={{ borderRight: "1px solid #ddd", paddingRight: 16 }}>
          {purchases.map((p) => (
            <Row
              key={p.id}
              row={p}
              onChange={updatePurchase}
              onRemove={removePurchase}
            />
          ))}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={addPurchase}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            + Add purchase
          </button>
          <button
            onClick={resetPurchases}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "transparent",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <aside style={{ width: 260, alignSelf: "center" }}>
        <h3>Summary</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>Total Units</div>
          <div>{totals.totalUnits}</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>Average Price</div>
          <div>${totals.avgPrice ? totals.avgPrice.toFixed(4) : "0.0000"}</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "600",
          }}
        >
          <div>Total Amount</div>
          <div>
            ${totals.totalAmount ? totals.totalAmount.toFixed(2) : "0.00"}
          </div>
        </div>
      </aside>
    </div>
  );
}
