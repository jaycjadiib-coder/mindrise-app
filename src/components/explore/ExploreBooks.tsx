import React from 'react';
import { InternetArchiveExplore } from '../archive/InternetArchiveExplore';

interface ExploreBooksProps {
  onSelectCategory?: (category: string) => void;
  onBack?: () => void;
}

export const ExploreBooks: React.FC<ExploreBooksProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 pb-16 font-sans">
      <InternetArchiveExplore onBack={onBack} />
    </div>
  );
};
