import { loadSeguimientoWorkspaceData } from "./data";
import { WorkspaceView } from "./workspace-view";

export default async function SeguimientoWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadSeguimientoWorkspaceData(id);

  return <WorkspaceView {...data} />;
}
