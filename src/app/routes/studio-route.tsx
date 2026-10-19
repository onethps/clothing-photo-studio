import { ErrorToast } from "@/components/feedback/error-toast";
import {
  CanvasBar,
  Dropzone,
  FeaturesRibbon,
  HeroBanner,
  SetupBanner,
  StageActions,
  ViewerStage,
} from "@/features/studio/components";
import { usePhotoStudio } from "@/features/studio/hooks";

interface StudioRouteProps {
  connected: boolean | null;
  onCheckConnection: () => Promise<void>;
  serverError: string;
  onClearServerError: () => void;
  studio: ReturnType<typeof usePhotoStudio>;
}

export function StudioRoute({
  connected,
  onCheckConnection,
  serverError,
  onClearServerError,
  studio,
}: StudioRouteProps) {
  const activeError = studio.error || serverError;

  function onDismissError() {
    if (studio.error) studio.clearError();
    if (serverError) onClearServerError();
  }

  return (
    <main className="studio-main">
      <HeroBanner />

      <ErrorToast message={activeError} onDismiss={onDismissError} />

      <div className="stage-card">
        {/* Hidden File Input */}
        <input
          ref={studio.inputRef}
          id="photo-upload-input"
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={studio.busy}
          onChange={(event) => {
            void studio.chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {!studio.hasImage ? (
          <Dropzone
            busy={studio.busy}
            inputRef={studio.inputRef}
            onFileSelect={(file) => void studio.chooseFile(file)}
            onSampleSelect={() => studio.setSampleMode(true)}
          />
        ) : (
          <div className="canvas-wrapper">
            <CanvasBar
              sample={studio.sample}
              file={studio.file}
              hasResult={studio.hasResult}
              viewMode={studio.viewMode}
              busy={studio.busy}
              onViewModeChange={studio.setViewMode}
              onResetPhoto={studio.resetPhoto}
            />

            <ViewerStage
              hasResult={studio.hasResult}
              viewMode={studio.viewMode}
              activeBefore={studio.activeBefore}
              activeAfter={studio.activeAfter}
              busy={studio.busy}
            />

            <StageActions
              hasResult={studio.hasResult}
              busy={studio.busy}
              connected={connected}
              file={studio.file}
              sample={studio.sample}
              resultUrl={studio.resultUrl}
              filename={studio.filename}
              onConvertPhoto={() => void studio.convertPhoto(connected)}
              onResetPhoto={studio.resetPhoto}
              onTriggerFileSelect={studio.triggerFileSelect}
            />
          </div>
        )}
      </div>

      <FeaturesRibbon />

      <SetupBanner
        connected={connected}
        onRetry={() => void onCheckConnection()}
      />
    </main>
  );
}
