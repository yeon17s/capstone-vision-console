import DetailModal from "../components/history/DetailModal";
import DetectionTable from "../components/history/DetectionTable";
import FilterBar from "../components/history/FilterBar";

function History() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <FilterBar />
      <DetectionTable />
      <DetailModal />
    </main>
  );
}

export default History;
