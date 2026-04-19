import { getProperty } from "@/lib/api";
import { PropertyPageClient } from "./PropertyPageClient";

interface PageProps {
  params: { id: string };
}

export default async function PropertyPage({ params }: PageProps) {
  const property = await getProperty(params.id);
  return <PropertyPageClient property={property} />;
}

export const dynamic = "force-dynamic";
