import { getShowcasedSchools } from "./actions";
import { DirectoryView } from "./_components/directory-view";

export default async function EscolasPage() {
  const showcased = await getShowcasedSchools();

  return <DirectoryView showcased={showcased} />;
}
