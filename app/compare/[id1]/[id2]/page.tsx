import { getProperty } from "@/lib/api";
import { CompareClient } from "./CompareClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id1: string; id2: string };
}

export default async function ComparePage({ params }: PageProps) {
  const [a, b] = await Promise.all([
    getProperty(params.id1).catch(() => null),
    getProperty(params.id2).catch(() => null),
  ]);

  if (!a || !b) {
    notFound();
  }

  return <CompareClient propertyA={a} propertyB={b} />;
}

export const dynamic = "force-dynamic";
