import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import StatusIndicator from "../ui/StatusIndicator";


/*
[주요 변경 사항 요약]
1. 이미지 표시 방식 변경: 
- 기존: RGB 및 Thermal View 두 개의 스냅샷을 비교 노출.
- 수정: 백엔드에서 생성된 단일 snapshot_url을 사용하여 크게 노출.
2. 복잡한 상태 로직 제거: 
- SnapshotStatus에 따른 상세 에러 라벨(CORS, Canvas 등) 및 SnapshotCell의 복잡한 조건문 삭제.
3. UI 레이아웃 최적화: 
- 이미지 그리드(grid-cols-2)를 제거하고 단일 뷰(h-48)로 변경하여 시인성 확보.
4. 의존성 정리: 사용하지 않는 SnapshotStatus 타입 및 관련 상수를 정리하여 코드 가독성 향상.
*/


interface DetailModalProps {
  entry: DetectionLogEntry | null;
  status: RowStatus;
  onMarkFalsePositive: () => void;
}

interface MetaRowProps {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}

function MetaRow({ label, value, mono = false, accent = false }: MetaRowProps) {
  return (
    <div className="flex items-baseline gap-2">
      <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
        {label}
      </Typography>
      <Typography
        as="span"
        variant={mono ? "mono" : "control"}
        tone={accent ? "info" : "default"}
        className={mono ? "text-mission-text/80" : "font-medium text-mission-text/80"}
      >
        {value}
      </Typography>
    </div>
  );
}

function ConfidenceDonut({ conf }: { conf: number }) {
  const pct = conf;
  const dash = pct.toFixed(1);
  const gap = (100 - pct).toFixed(1);
  const color =
    conf >= 85 ? "#22c55e" : conf >= 70 ? "#eab308" : "#94a3b8";

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.8" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color}
            strokeWidth="3.8"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <Typography as="span" variant="emphasis" className="absolute font-mono font-bold" style={{ color }}>
          {pct.toFixed(1)}%
        </Typography>
      </div>
      <Typography variant="overline" tone="subtle">Confidence</Typography>
    </div>
  );
}

//캡처 URL만 받아서 이미지를 띄워주도록 단순화
function SnapshotCell({ url, alt }: { url?: string; alt: string }) {
  if (url) {
    return <img src={url} alt={alt} className="h-full w-full object-cover" />;
  }
  return (
    <Typography as="p" variant="overline" className="text-center text-mission-text/30 px-2">
      No Image Available
    </Typography>
  );
}

const STATUS_LABEL: Record<RowStatus, { label: string; tone: "success" | "warning" | "muted" }> = {
  Confirmed:     { label: "Confirmed", tone: "success" },
  Pending:       { label: "Pending Review", tone: "warning" },
  FalsePositive: { label: "False Positive", tone: "muted" },
};

export default function DetailModal({ entry, status, onMarkFalsePositive }: DetailModalProps) {
  if (!entry) {
    return (
      <MissionPanel className="h-full" bodyClassName="flex h-full items-center justify-center py-6">
        <Typography variant="control" className="text-mission-text/30">Select a row to view details</Typography>
      </MissionPanel>
    );
  }

  const { label: statusLabel, tone: statusTone } = STATUS_LABEL[status];
  const isFalsePositive = status === "FalsePositive";

  return (
    <MissionPanel
      className="h-full"
      title="Detail View"
      headerRight={
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone}>
            {statusLabel}
          </StatusBadge>
          {!isFalsePositive && (
            <Button variant="dangerOutline" size="sm" className="px-2 py-0.5" onClick={onMarkFalsePositive}>
              <Typography as="span" variant="overline" tone="danger" className="font-bold">False Positive</Typography>
            </Button>
          )}
        </div>
      }
      bodyClassName="grid h-full grid-cols-1 grid-rows-[auto_auto_1fr] items-start gap-5 p-4"
    >
        {/* Confidence donut */}
        <div className="flex items-center justify-center">
          <ConfidenceDonut conf={entry.confidence} />
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2 rounded-[16px] border border-mission-border bg-mission-bg px-4 py-3">
          <MetaRow label="Timestamp"   value={entry.timestamp} mono />
          <MetaRow label="Detection"   value="Detected" accent />
          <div className="flex items-baseline gap-2">
            <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
              FPS
            </Typography>
            <StatusIndicator tone="info" label={entry.fps.toFixed(1)} showDot={false} textVariant="monoStrong" />
          </div>
          <div className="flex items-baseline gap-2">
            <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
              Frame Delay
            </Typography>
            <StatusIndicator
              tone={entry.frameDelayMs <= 200 ? "success" : entry.frameDelayMs <= 500 ? "warning" : "danger"}
              label={`${entry.frameDelayMs} ms`}
              showDot={false}
              textVariant="monoStrong"
            />
          </div>
        </div>

        {/* Image Display */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
            <SnapshotCell
              url={entry.snapshot_url}
              alt="Snapshot at detection moment"
            />
          </div>
          <Typography as="span" variant="overline" className="text-mission-text/30">
            Detection Snapshot
          </Typography>
        </div>
    </MissionPanel>
  );
}