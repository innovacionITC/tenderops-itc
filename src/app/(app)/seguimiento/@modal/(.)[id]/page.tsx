import { loadSeguimientoWorkspaceData } from "../../[id]/data";
import { WorkspaceView } from "../../[id]/workspace-view";
import { WorkspaceModal } from "./workspace-modal";

export default async function SeguimientoWorkspaceModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadSeguimientoWorkspaceData(id);

  return (
    <WorkspaceModal>
      <WorkspaceView {...data} />
    </WorkspaceModal>
  );
}
