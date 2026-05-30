import { notFound } from "next/navigation";
import { getPublicSchoolData } from "./actions";
import { EscolaView } from "./_components/escola-view";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EscolaPage({ params }: Props) {
  const { slug } = await params;

  const data = await getPublicSchoolData(slug);

  if (!data) return <div className="p-8 text-center text-gray-600">Escola não encontrada: {slug}</div>;

  return <EscolaView data={data} />;
}
