import { ProcesoNoEncontrado } from "../../[id]/proceso-no-encontrado";
import { WorkspaceModal } from "./workspace-modal";

export default function NotFound() {
  return (
    <WorkspaceModal>
      <ProcesoNoEncontrado />
    </WorkspaceModal>
  );
}
