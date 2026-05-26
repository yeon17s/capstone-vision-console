import type { Filters } from "../../pages/History";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import Field from "../ui/Field";
import TextInput from "../ui/TextInput";
import RangeField from "../ui/RangeField";

interface FilterBarProps {
  filters: Filters;
  fetchStatus: "idle" | "loading" | "error";
  onChange: (f: Filters) => void;
  onApply: () => void;
}

export default function FilterBar({ filters, fetchStatus, onChange, onApply }: FilterBarProps) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
      <MissionPanel title="Search & Filter" bodyClassName="p-4">
        {/* Fetch Status Message */}
        {fetchStatus === "loading" && (
          <Typography as="p" variant="overline" tone="subtle" className="mb-3 text-mission-text/50">
            Loading history from Jetson…
          </Typography>
        )}
        {fetchStatus === "error" && (
          <Typography as="p" variant="overline" tone="subtle" className="mb-3 text-mission-warning">
            Could not reach Jetson — showing runtime log only
          </Typography>
        )}

        {/* Search */}
        <TextInput
          placeholder="Search timestamp..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="mb-3"
        />

        {/* Date Range */}
        <Field label="Date Range" className="mb-3">
          <div className="flex items-center gap-1">
            <TextInput
              placeholder="YYYY-MM-DD"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              dense
              className="flex-1"
            />
            <Typography as="span" variant="overline" tone="subtle" className="tracking-[0.08em] text-mission-text/30">to</Typography>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={filters.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              dense
              className="flex-1"
            />
          </div>
        </Field>

        {/* Confidence Filter */}
        <RangeField
          className="mb-4"
          label="Confidence Min"
          value={filters.confMin}
          valueLabel={`${filters.confMin}%`}
          min={0}
          max={100}
          minLabel="0%"
          maxLabel="100%"
          onChange={(e) => set("confMin", Number(e.target.value))}
        />

        {/* Apply */}
        <Button onClick={onApply} variant="infoOutline" size="md" className="w-full py-1.5">
          <Typography as="span" variant="controlStrong" tone="info">Apply Filter</Typography>
        </Button>
      </MissionPanel>

    </aside>
  );
}
