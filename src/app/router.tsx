import { StudioFooter } from "@/features/studio/components/studio-footer";
import { StudioHeader } from "@/features/studio/components/studio-header";
import { usePhotoStudio, useServerStatus } from "@/features/studio/hooks";
import { StudioRoute } from "./routes/studio-route";

export function AppRouter() {
  const { connected, error: serverError, checkConnection, clearError: clearServerError } =
    useServerStatus();

  const studio = usePhotoStudio();

  return (
    <div className="studio-root">
      <StudioHeader
        connected={connected}
        hasResult={studio.hasResult}
        sample={studio.sample}
        resultUrl={studio.resultUrl}
        filename={studio.filename}
      />

      <StudioRoute
        connected={connected}
        onCheckConnection={() => checkConnection()}
        serverError={serverError}
        onClearServerError={clearServerError}
        studio={studio}
      />

      <StudioFooter />
    </div>
  );
}
