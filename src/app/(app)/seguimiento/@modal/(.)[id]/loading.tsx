import { Spinner } from "@/components/ui/spinner";
import { WorkspaceModal } from "./workspace-modal";

export default function Loading() {
  return (
    <WorkspaceModal>
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    </WorkspaceModal>
  );
}
