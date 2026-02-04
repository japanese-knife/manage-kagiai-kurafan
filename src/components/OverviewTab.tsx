import ScheduleSection from './overview/ScheduleSection';
import DocumentsSection from './overview/DocumentsSection';
import MeetingsSection from './overview/MeetingsSection';
import ReturnsSection from './overview/ReturnsSection';
import ImageAssetsSection from './overview/ImageAssetsSection';
import TextContentRequirementsSection from './overview/TextContentRequirementsSection';
import DesignRequirementsSection from './overview/DesignRequirementsSection';
import VideoRequirementsSection from './overview/VideoRequirementsSection';

interface OverviewTabProps {
  projectId: string;
  readOnly?: boolean;
  sharedView?: boolean;
}

export default function OverviewTab({ projectId, readOnly = false, sharedView = false }: OverviewTabProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-10">
      <ScheduleSection projectId={projectId} readOnly={false} />
      <DocumentsSection projectId={projectId} readOnly={false} />
      <MeetingsSection projectId={projectId} readOnly={false} />
      <ReturnsSection projectId={projectId} readOnly={false} />
      <ImageAssetsSection projectId={projectId} readOnly={false} />
      <TextContentRequirementsSection projectId={projectId} readOnly={false} />
      <DesignRequirementsSection projectId={projectId} readOnly={false} />
      <VideoRequirementsSection projectId={projectId} readOnly={false} />
    </div>
  );
}
