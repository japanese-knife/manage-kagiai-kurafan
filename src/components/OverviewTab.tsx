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

  // デバッグ用
  console.log('OverviewTab - readOnly:', readOnly, 'sharedView:', sharedView);
  
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-10">
      <ScheduleSection projectId={projectId} readOnly={readOnly} />
      <DocumentsSection projectId={projectId} readOnly={readOnly} />
      <MeetingsSection projectId={projectId} readOnly={readOnly} />
      <ReturnsSection projectId={projectId} readOnly={readOnly} />
      <ImageAssetsSection projectId={projectId} readOnly={false} />
      <TextContentRequirementsSection projectId={projectId} readOnly={readOnly} />
      <DesignRequirementsSection projectId={projectId} readOnly={readOnly} />
      <VideoRequirementsSection projectId={projectId} readOnly={readOnly} />
    </div>
  );
}
