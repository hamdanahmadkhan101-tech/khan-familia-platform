'use client';

import { Button } from '@khan-familia/ui';

type HealthActionsProps = {
  healthUrl: string;
};

export const HealthActions = ({ healthUrl }: HealthActionsProps) => {
  const handleOpenApi = () => {
    window.open(healthUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLocal = () => {
    window.location.assign('/health');
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={handleOpenApi}>Open API health</Button>
      <Button variant="ghost" onClick={handleOpenLocal}>
        View health page
      </Button>
    </div>
  );
};
