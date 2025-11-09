import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface Link { url: string; title: string }

interface Props {
  zoomReferenceBox: boolean;
  setZoomReferenceBox: (v: boolean) => void;
  youtubeLink: Link[];
}

export default function ReferencesPanel({ zoomReferenceBox, setZoomReferenceBox, youtubeLink }: Props) {
  return (
    <div>
      <div className="zoom-btn fixed top-3 right-4 flex flex-col gap-3 z-50">
        <Button
          onClick={() => setZoomReferenceBox(!zoomReferenceBox)}
          variant="outline"
          className="rounded-full !p-0 bg-black/50 backdrop-blur-md border-white/30 hover:bg-black/60 text-white hover:text-white size-9 drop-shadow-lg"
        >
          <Icon icon="tabler:minimize" className="!size-[1.4rem] drop-shadow-lg" />
        </Button>
      </div>
      <div className={`${zoomReferenceBox ? 'h-[20px]' : 'h-[120px]'} overflow-y-auto transition-all duration-300 ease-in-out`}>
        <h3 className="text-2xl font-bold text-primary mb-2">References</h3>
        <ul className="flex flex-col gap-4 w-full">
          {youtubeLink.map((link, idx) => (
            <li key={idx}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-2xl font-semibold text-blue-700 dark:text-blue-300 hover:underline hover:text-blue-500 transition-colors">
                <Icon icon="logos:youtube-icon" className="text-2xl" />
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
