import { notFound } from "next/navigation";
import Link from "next/link";
import { lessons } from "@/lib/lessons";
import { requireUser } from "@/lib/server";
import { LessonAction } from "@/components/lesson-action";
export default async function Learn({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(id in lessons)) notFound();
  const { db } = await requireUser();
  const { data, error } = await db
    .from("learning_progress")
    .select("lesson_id")
    .eq("lesson_id", id)
    .maybeSingle();
  if (error) throw new Error("Unable to load learning progress");
  const lesson = lessons[id as keyof typeof lessons];
  return (
    <article className="narrow lesson">
      <Link href="/path" className="back-link">
        ← Your Path
      </Link>
      <span className="eyebrow">MONEY IN 60 SECONDS</span>
      <h1>{lesson.title}</h1>
      {lesson.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <LessonAction id={id} completed={Boolean(data)} />
      <p className="planning-note">
        Educational information only, not investment advice.
      </p>
    </article>
  );
}
