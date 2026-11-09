import { notFound, redirect } from "next/navigation";
import { StateView } from "../../components/ui/StateView";

const LOCKED = new Set(["N4", "N3", "N2", "N1"]);

/** N4–N1 are not published yet: show the locked state (S4) instead of content or a 404. */
export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const code = level.toUpperCase();
  if (code === "N5") redirect("/learn/n5");
  if (!LOCKED.has(code)) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <StateView
        kind="locked"
        title={`Nội dung ${code} đang được biên soạn`}
        body="Hiện chỉ cấp độ N5 có bài học và đề thi thử. Các cấp độ khác sẽ ra mắt sau."
        action={{ label: "Về lộ trình N5", href: "/learn/n5" }}
      />
    </div>
  );
}
